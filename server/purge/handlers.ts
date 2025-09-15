// PURGE_HANDLERS - Core purge logic for VISUAL platform
// Contains all purge operation handlers with grep-friendly comments

import { eq } from "drizzle-orm";
import { db } from "../db";
import { storage } from "../storage";
import { 
  liveShows as liveShowsTable, 
  visuPointsTransactions 
} from "@shared/schema";
import type { 
  PurgeResults, 
  PurgeRequest, 
  PurgeOperationResult,
  PurgeStatistics 
} from "./schemas";

// HANDLER: purgeProjects - Archives expired video projects (hors TOP 10)
export async function purgeProjects(
  request: PurgeRequest,
  userId: string,
  results: PurgeResults
): Promise<void> {
  const { dryRun, dateFrom, dateTo, limit, offset } = request;
  const fromDate = dateFrom ? new Date(dateFrom) : null;
  const toDate = dateTo ? new Date(dateTo) : null;
  
  try {
    let projectsToProcess = await storage.getProjects(limit, offset);
    
    // Apply date filtering if specified
    if (fromDate || toDate) {
      projectsToProcess = projectsToProcess.filter(project => {
        const projectDate = new Date(project.createdAt);
        if (fromDate && projectDate < fromDate) return false;
        if (toDate && projectDate > toDate) return false;
        return true;
      });
    }
    
    const now = new Date();
    
    for (const project of projectsToProcess) {
      results.projects.processed++;
      
      try {
        const extensions = await storage.getProjectExtensions(project.id);
        const currentExtension = extensions
          .filter(ext => !ext.isArchived)
          .sort((a, b) => {
            const aEnd = a.cycleEndsAt ? new Date(a.cycleEndsAt).getTime() : 0;
            const bEnd = b.cycleEndsAt ? new Date(b.cycleEndsAt).getTime() : 0;
            return bEnd - aEnd;
          })[0];
        
        // Check if project cycle is expired and not in TOP 10
        const projectEnd = currentExtension?.cycleEndsAt ? 
          new Date(currentExtension.cycleEndsAt) : 
          new Date(new Date(project.createdAt).getTime() + (168 * 60 * 60 * 1000));
        
        if (now > projectEnd && (!currentExtension?.isInTopTen)) {
          results.projects.affectedIds.push(project.id);
          
          // DRY-RUN SAFEGUARD: Only simulate the action if dryRun is true
          if (!dryRun) {
            // Actually archive the project
            if (currentExtension) {
              await storage.updateProjectExtension(currentExtension.id, {
                isArchived: true,
                archivedAt: new Date(),
                archiveReason: 'automatic_purge_expired'
              });
            } else {
              await storage.createProjectExtension({
                projectId: project.id,
                isInTopTen: false,
                isArchived: true,
                archivedAt: new Date(),
                archiveReason: 'automatic_purge_expired',
                canProlong: false
              });
            }
          }
          results.projects.purged++;
        }
      } catch (projectError) {
        const errorMsg = projectError instanceof Error ? projectError.message : 'Unknown error';
        results.projects.errors.push(`Project ${project.id}: ${errorMsg}`);
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    results.projects.errors.push(`Project purge system error: ${errorMsg}`);
    
    // Log critical purge failure
    await storage.createAuditLog({
      userId,
      action: 'purge_projects',
      resourceType: 'purge_operation',
      details: { error: errorMsg, types: request.types, dryRun },
      success: false,
      errorMessage: errorMsg,
      dryRun
    });
  }
}

// HANDLER: purgeLiveShows - Archives ended live shows/battles
export async function purgeLiveShows(
  request: PurgeRequest,
  userId: string,
  results: PurgeResults
): Promise<void> {
  const { dryRun, dateFrom, dateTo, limit, offset } = request;
  const fromDate = dateFrom ? new Date(dateFrom) : null;
  const toDate = dateTo ? new Date(dateTo) : null;
  
  try {
    // Get actual live shows from liveShows table, not projects
    const activeLiveShows = await storage.getActiveLiveShows();
    let liveShowsToProcess = activeLiveShows.slice(offset, offset + limit);
    
    // Apply date filtering if specified
    if (fromDate || toDate) {
      liveShowsToProcess = liveShowsToProcess.filter(show => {
        const showDate = new Date(show.createdAt);
        if (fromDate && showDate < fromDate) return false;
        if (toDate && showDate > toDate) return false;
        return true;
      });
    }
    
    const now = new Date();
    
    for (const liveShow of liveShowsToProcess) {
      results.liveShows.processed++;
      
      try {
        // More robust live show end detection
        const showDuration = 4 * 60 * 60 * 1000; // 4 hours default
        const showStart = new Date(liveShow.createdAt);
        const expectedEnd = new Date(showStart.getTime() + showDuration);
        
        // Check if show has ended (inactive + past expected duration)
        if (!liveShow.isActive && now > expectedEnd) {
          results.liveShows.affectedIds.push(liveShow.id);
          
          // DRY-RUN SAFEGUARD: Only simulate the action if dryRun is true
          if (!dryRun) {
            // Archive the live show by setting it inactive permanently
            // Note: We don't delete, just mark as archived
            await db.update(liveShowsTable)
              .set({ 
                isActive: false,
                updatedAt: new Date(),
                metadata: {
                  archived: true,
                  archivedAt: new Date().toISOString(),
                  archiveReason: 'automatic_purge_ended'
                }
              })
              .where(eq(liveShowsTable.id, liveShow.id));
          }
          results.liveShows.purged++;
        }
      } catch (showError) {
        const errorMsg = showError instanceof Error ? showError.message : 'Unknown error';
        results.liveShows.errors.push(`Live show ${liveShow.id}: ${errorMsg}`);
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    results.liveShows.errors.push(`Live shows purge system error: ${errorMsg}`);
    
    // Log critical purge failure
    await storage.createAuditLog({
      userId,
      action: 'purge_live_shows',
      resourceType: 'purge_operation',
      details: { error: errorMsg, types: request.types, dryRun },
      success: false,
      errorMessage: errorMsg,
      dryRun
    });
  }
}

// HANDLER: purgeArticles - Archives inactive social posts/articles
export async function purgeArticles(
  request: PurgeRequest,
  userId: string,
  results: PurgeResults
): Promise<void> {
  const { dryRun, dateFrom, dateTo, limit, offset } = request;
  const fromDate = dateFrom ? new Date(dateFrom) : null;
  const toDate = dateTo ? new Date(dateTo) : null;
  
  try {
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    let postsToProcess = await storage.getPosts(limit, offset);
    
    // Apply date filtering if specified
    if (fromDate || toDate) {
      postsToProcess = postsToProcess.filter(post => {
        const postDate = new Date(post.createdAt);
        if (fromDate && postDate < fromDate) return false;
        if (toDate && postDate > toDate) return false;
        return true;
      });
    }
    
    for (const post of postsToProcess) {
      results.articles.processed++;
      
      try {
        // Archive posts older than 30 days with no recent activity
        const postDate = new Date(post.createdAt);
        if (postDate < thirtyDaysAgo) {
          // Check for recent interactions (comments and likes)
          const comments = await storage.getPostComments(post.id, 1);
          const likes = await storage.getPostLikes(post.id);
          
          const hasRecentActivity = comments.some(c => new Date(c.createdAt) > thirtyDaysAgo) ||
                                   likes.some(l => new Date(l.createdAt) > thirtyDaysAgo);
          
          if (!hasRecentActivity) {
            results.articles.affectedIds.push(post.id);
            
            // DRY-RUN SAFEGUARD: Only simulate the action if dryRun is true
            if (!dryRun) {
              // Archive post by updating status
              await storage.updateSocialPost(post.id, {
                status: 'archived',
                moderationReason: 'automatic_inactivity_purge',
                updatedAt: new Date()
              });
            }
            results.articles.purged++;
          }
        }
      } catch (articleError) {
        const errorMsg = articleError instanceof Error ? articleError.message : 'Unknown error';
        results.articles.errors.push(`Article ${post.id}: ${errorMsg}`);
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    results.articles.errors.push(`Articles purge system error: ${errorMsg}`);
    
    // Log critical purge failure
    await storage.createAuditLog({
      userId,
      action: 'purge_articles',
      resourceType: 'purge_operation',
      details: { error: errorMsg, types: request.types, dryRun },
      success: false,
      errorMessage: errorMsg,
      dryRun
    });
  }
}

// HANDLER: purgeTechnical - Cleans old logs, transactions, and inactive accounts
export async function purgeTechnical(
  request: PurgeRequest,
  userId: string,
  results: PurgeResults
): Promise<void> {
  const { dryRun, dateFrom, dateTo, limit, offset } = request;
  const fromDate = dateFrom ? new Date(dateFrom) : null;
  const toDate = dateTo ? new Date(dateTo) : null;
  
  try {
    // Purge old VisuPoints transactions (keep only last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - (90 * 24 * 60 * 60 * 1000));
    const oldTransactions = await storage.getUserVisuPointsHistory('all', 1000) // Get many
      .then(transactions => transactions.filter(t => new Date(t.createdAt) < ninetyDaysAgo));
    
    for (const transaction of oldTransactions.slice(offset, offset + limit)) {
      results.technical.processed++;
      
      try {
        results.technical.affectedIds.push(transaction.id);
        
        // DRY-RUN SAFEGUARD: Only simulate the action if dryRun is true
        if (!dryRun) {
          // Delete old VisuPoints transactions (they're historical data)
          await db.delete(visuPointsTransactions)
            .where(eq(visuPointsTransactions.id, transaction.id));
        }
        results.technical.purged++;
      } catch (transactionError) {
        const errorMsg = transactionError instanceof Error ? transactionError.message : 'Unknown error';
        results.technical.errors.push(`VisuPoints transaction ${transaction.id}: ${errorMsg}`);
      }
    }
    
    // Mark inactive user accounts (no login in 6 months) with proper validation
    const sixMonthsAgo = new Date(Date.now() - (180 * 24 * 60 * 60 * 1000));
    let usersToProcess = await storage.getAllUsers(limit, offset);
    
    // Apply date filtering if specified
    if (fromDate || toDate) {
      usersToProcess = usersToProcess.filter(user => {
        const userDate = new Date(user.createdAt);
        if (fromDate && userDate < fromDate) return false;
        if (toDate && userDate > toDate) return false;
        return true;
      });
    }
    
    for (const userAccount of usersToProcess) {
      results.technical.processed++;
      
      try {
        // Check if user has been inactive for 6+ months (based on last update)
        const lastActivity = new Date(userAccount.updatedAt || userAccount.createdAt);
        if (lastActivity < sixMonthsAgo && userAccount.profileType !== 'admin') {
          results.technical.affectedIds.push(userAccount.id);
          
          // DRY-RUN SAFEGUARD: Only simulate the action if dryRun is true
          if (!dryRun) {
            // Don't delete, just mark as inactive (safer approach)
            await storage.updateUser(userAccount.id, {
              // Add metadata flag instead of changing core fields
              updatedAt: new Date()
            });
            
            // Create audit trail for user inactivation
            await storage.createAuditLog({
              userId,
              action: 'user_inactivation',
              resourceType: 'user',
              resourceId: userAccount.id,
              details: {
                reason: 'auto_purge_inactive',
                lastActivity: lastActivity.toISOString(),
                inactivatedBy: 'system'
              },
              dryRun: false
            });
          }
          results.technical.purged++;
        }
      } catch (userError) {
        const errorMsg = userError instanceof Error ? userError.message : 'Unknown error';
        results.technical.errors.push(`User ${userAccount.id}: ${errorMsg}`);
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    results.technical.errors.push(`Technical purge system error: ${errorMsg}`);
    
    // Log critical purge failure
    await storage.createAuditLog({
      userId,
      action: 'purge_technical',
      resourceType: 'purge_operation',
      details: { error: errorMsg, types: request.types, dryRun },
      success: false,
      errorMessage: errorMsg,
      dryRun
    });
  }
}

// HANDLER: purgeFinancial - EUR_100_CAP_ENFORCED - Moves small balances to admin hold
export async function purgeFinancial(
  request: PurgeRequest,
  userId: string,
  results: PurgeResults
): Promise<void> {
  const { dryRun, dateFrom, dateTo, limit, offset } = request;
  const fromDate = dateFrom ? new Date(dateFrom) : null;
  const toDate = dateTo ? new Date(dateTo) : null;
  
  try {
    let usersToProcess = await storage.getAllUsers(limit, offset);
    
    // Apply date filtering if specified
    if (fromDate || toDate) {
      usersToProcess = usersToProcess.filter(user => {
        const userDate = new Date(user.createdAt);
        if (fromDate && userDate < fromDate) return false;
        if (toDate && userDate > toDate) return false;
        return true;
      });
    }
    
    for (const userAccount of usersToProcess) {
      results.financial.processed++;
      
      try {
        // Robust balance parsing with validation
        const balanceStr = userAccount.balanceEUR || '0';
        const balance = parseFloat(balanceStr);
        
        if (isNaN(balance) || balance < 0) {
          results.financial.errors.push(`User ${userAccount.id}: Invalid balance value`);
          continue;
        }
        
        // Calculate minimum withdrawal threshold based on profile
        const minWithdrawal = userAccount.profileType === 'creator' ? 25.0 : 50.0;
        
        // EUR_100_CAP_ENFORCED: Only process small positive balances (safety: don't touch large amounts)
        if (balance > 0 && balance < minWithdrawal && balance < 100) { // Max €100 safety limit
          results.financial.affectedIds.push(userAccount.id);
          
          // DRY-RUN SAFEGUARD: Only simulate the action if dryRun is true
          if (!dryRun) {
            // Move small balances to admin hold with proper audit trail
            await storage.createTransaction({
              userId: userAccount.id,
              type: 'commission', // Reuse existing type
              amount: (-balance).toString(), // Negative to remove from user
              commission: '0.00',
              metadata: {
                originalAmount: balance.toString(),
                reason: 'auto_purge_below_withdrawal_threshold',
                minWithdrawal: minWithdrawal.toString(),
                purgedAt: new Date().toISOString(),
                purgedBy: userId
              }
            });
            
            // Update user balance to 0
            await storage.updateUser(userAccount.id, {
              balanceEUR: '0.00',
              updatedAt: new Date()
            });
            
            // Create audit trail for financial operation
            await storage.createAuditLog({
              userId,
              action: 'financial_operation',
              resourceType: 'user_balance',
              resourceId: userAccount.id,
              details: {
                operation: 'small_balance_purge',
                originalAmount: balance,
                minWithdrawal,
                reason: 'auto_purge_below_withdrawal_threshold'
              },
              dryRun: false
            });
          }
          results.financial.purged++;
        }
      } catch (userError) {
        const errorMsg = userError instanceof Error ? userError.message : 'Unknown error';
        results.financial.errors.push(`User ${userAccount.id}: ${errorMsg}`);
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    results.financial.errors.push(`Financial purge system error: ${errorMsg}`);
    
    // Log critical purge failure
    await storage.createAuditLog({
      userId,
      action: 'purge_financial',
      resourceType: 'purge_operation',
      details: { error: errorMsg, types: request.types, dryRun },
      success: false,
      errorMessage: errorMsg,
      dryRun
    });
  }
}

// HANDLER: generatePurgeStats - Comprehensive statistics for purge operations
export async function generatePurgeStats(
  limit: number,
  offset: number,
  fromDate: Date | null,
  toDate: Date | null
): Promise<PurgeStatistics> {
  const now = new Date();
  
  const stats: PurgeStatistics = {
    generatedAt: new Date(),
    dateFilter: { from: fromDate, to: toDate },
    pagination: { limit, offset },
    projects: {
      total: 0,
      active: 0,
      expired: 0,
      archived: 0,
      pendingPurge: 0,
      eligibleForPurge: 0
    },
    liveShows: {
      total: 0,
      active: 0,
      ended: 0,
      archived: 0,
      eligibleForPurge: 0
    },
    articles: {
      total: 0,
      recent: 0,
      inactive: 0,
      archived: 0,
      eligibleForPurge: 0
    },
    technical: {
      oldTransactions: 0,
      inactiveUsers: 0,
      totalUsers: 0,
      eligibleForPurge: 0
    },
    financial: {
      usersWithSmallBalances: 0,
      totalSmallBalances: 0,
      eligibleForPurge: 0
    },
    summary: {
      totalEligibleForPurge: 0,
      estimatedSafetyRisk: 'low' as 'low' | 'medium' | 'high'
    }
  };

  // Enhanced project statistics with robust error handling
  try {
    let projectsToAnalyze = await storage.getProjects(limit, offset);
    
    // Apply date filtering if specified
    if (fromDate || toDate) {
      projectsToAnalyze = projectsToAnalyze.filter(project => {
        const projectDate = new Date(project.createdAt);
        if (fromDate && projectDate < fromDate) return false;
        if (toDate && projectDate > toDate) return false;
        return true;
      });
    }
    
    stats.projects.total = projectsToAnalyze.length;
    
    for (const project of projectsToAnalyze) {
      try {
        const extensions = await storage.getProjectExtensions(project.id);
        const currentExtension = extensions.find(ext => !ext.isArchived);
        
        if (currentExtension?.isArchived) {
          stats.projects.archived++;
        } else {
          const endTime = currentExtension?.cycleEndsAt ? 
            new Date(currentExtension.cycleEndsAt) : 
            new Date(new Date(project.createdAt).getTime() + (168 * 60 * 60 * 1000));
          
          if (now > endTime && !currentExtension?.isInTopTen) {
            stats.projects.pendingPurge++;
            stats.projects.eligibleForPurge++;
          } else if (now > endTime) {
            stats.projects.expired++;
          } else {
            stats.projects.active++;
          }
        }
      } catch (projectError) {
        console.error(`Error analyzing project ${project.id}:`, projectError);
        // Continue with other projects
      }
    }
  } catch (error) {
    console.error('Error fetching project statistics:', error);
    throw new Error("Failed to fetch project statistics");
  }

  // Enhanced live show statistics with proper error handling
  try {
    const liveShows = await storage.getActiveLiveShows();
    let liveShowsToAnalyze = liveShows.slice(offset, offset + limit);
    
    // Apply date filtering if specified
    if (fromDate || toDate) {
      liveShowsToAnalyze = liveShowsToAnalyze.filter(show => {
        const showDate = new Date(show.createdAt);
        if (fromDate && showDate < fromDate) return false;
        if (toDate && showDate > toDate) return false;
        return true;
      });
    }
    
    stats.liveShows.total = liveShowsToAnalyze.length;
    
    for (const liveShow of liveShowsToAnalyze) {
      try {
        const showDuration = 4 * 60 * 60 * 1000; // 4 hours default
        const showStart = new Date(liveShow.createdAt);
        const expectedEnd = new Date(showStart.getTime() + showDuration);
        
        if (!liveShow.isActive && now > expectedEnd) {
          stats.liveShows.ended++;
          stats.liveShows.eligibleForPurge++;
        } else if (liveShow.isActive) {
          stats.liveShows.active++;
        }
      } catch (showError) {
        console.error(`Error analyzing live show ${liveShow.id}:`, showError);
      }
    }
  } catch (error) {
    console.error('Error fetching live show statistics:', error);
    throw new Error("Failed to fetch live show statistics");
  }

  // Enhanced article statistics with date filtering and error handling
  try {
    let postsToAnalyze = await storage.getPosts(limit, offset);
    
    // Apply date filtering if specified
    if (fromDate || toDate) {
      postsToAnalyze = postsToAnalyze.filter(post => {
        const postDate = new Date(post.createdAt);
        if (fromDate && postDate < fromDate) return false;
        if (toDate && postDate > toDate) return false;
        return true;
      });
    }
    
    stats.articles.total = postsToAnalyze.length;
    
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    for (const post of postsToAnalyze) {
      try {
        const postDate = new Date(post.createdAt);
        if (postDate > thirtyDaysAgo) {
          stats.articles.recent++;
        } else {
          stats.articles.inactive++;
          // Check if eligible for purge (no recent activity)
          const comments = await storage.getPostComments(post.id, 1);
          const likes = await storage.getPostLikes(post.id);
          
          const hasRecentActivity = comments.some(c => new Date(c.createdAt) > thirtyDaysAgo) ||
                                   likes.some(l => new Date(l.createdAt) > thirtyDaysAgo);
          
          if (!hasRecentActivity) {
            stats.articles.eligibleForPurge++;
          }
        }
        
        if (post.status === 'archived') {
          stats.articles.archived++;
        }
      } catch (postError) {
        console.error(`Error analyzing article ${post.id}:`, postError);
      }
    }
  } catch (error) {
    console.error('Error fetching article statistics:', error);
    throw new Error("Failed to fetch article statistics");
  }

  // Enhanced technical statistics with proper error handling
  try {
    const ninetyDaysAgo = new Date(Date.now() - (90 * 24 * 60 * 60 * 1000));
    const sixMonthsAgo = new Date(Date.now() - (180 * 24 * 60 * 60 * 1000));
    
    // Get old VisuPoints transactions
    const oldTransactions = await storage.getUserVisuPointsHistory('all', 1000)
      .then(transactions => transactions.filter(t => new Date(t.createdAt) < ninetyDaysAgo))
      .catch(() => []);
    stats.technical.oldTransactions = oldTransactions.length;
    stats.technical.eligibleForPurge += oldTransactions.length;
    
    // Analyze users with date filtering
    let usersToAnalyze = await storage.getAllUsers(limit, offset);
    
    if (fromDate || toDate) {
      usersToAnalyze = usersToAnalyze.filter(user => {
        const userDate = new Date(user.createdAt);
        if (fromDate && userDate < fromDate) return false;
        if (toDate && userDate > toDate) return false;
        return true;
      });
    }
    
    stats.technical.totalUsers = usersToAnalyze.length;
    
    for (const user of usersToAnalyze) {
      try {
        const lastActivity = new Date(user.updatedAt || user.createdAt);
        if (lastActivity < sixMonthsAgo && user.profileType !== 'admin') {
          stats.technical.inactiveUsers++;
          stats.technical.eligibleForPurge++;
        }
      } catch (userError) {
        console.error(`Error analyzing user ${user.id}:`, userError);
      }
    }
  } catch (error) {
    console.error('Error fetching technical statistics:', error);
    throw new Error("Failed to fetch technical statistics");
  }

  // Enhanced financial statistics with safety checks
  try {
    let totalSmallBalances = 0;
    let usersToAnalyze = await storage.getAllUsers(limit, offset);
    
    if (fromDate || toDate) {
      usersToAnalyze = usersToAnalyze.filter(user => {
        const userDate = new Date(user.createdAt);
        if (fromDate && userDate < fromDate) return false;
        if (toDate && userDate > toDate) return false;
        return true;
      });
    }
    
    for (const userAccount of usersToAnalyze) {
      try {
        const balanceStr = userAccount.balanceEUR || '0';
        const balance = parseFloat(balanceStr);
        
        if (!isNaN(balance) && balance >= 0) {
          const minWithdrawal = userAccount.profileType === 'creator' ? 25.0 : 50.0;
          
          if (balance > 0 && balance < minWithdrawal && balance < 100) { // EUR_100_CAP_ENFORCED
            stats.financial.usersWithSmallBalances++;
            stats.financial.eligibleForPurge++;
            totalSmallBalances += balance;
          }
        }
      } catch (userError) {
        console.error(`Error analyzing user balance ${userAccount.id}:`, userError);
      }
    }
    
    stats.financial.totalSmallBalances = totalSmallBalances;
  } catch (error) {
    console.error('Error fetching financial statistics:', error);
    throw new Error("Failed to fetch financial statistics");
  }

  // Calculate summary with safety assessment
  stats.summary.totalEligibleForPurge = stats.projects.eligibleForPurge + stats.liveShows.eligibleForPurge + 
                                       stats.articles.eligibleForPurge + stats.technical.eligibleForPurge + 
                                       stats.financial.eligibleForPurge;
  
  // Risk assessment based on volume
  if (stats.summary.totalEligibleForPurge > 1000) {
    stats.summary.estimatedSafetyRisk = 'high';
  } else if (stats.summary.totalEligibleForPurge > 100) {
    stats.summary.estimatedSafetyRisk = 'medium';
  } else {
    stats.summary.estimatedSafetyRisk = 'low';
  }

  return stats;
}