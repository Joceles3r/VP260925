import { db } from '../db';
import { complianceReports, transactions, users, projects, investments } from '@shared/schema';
import { eq, gte, lte, and, sum, count, desc } from 'drizzle-orm';
import type { ComplianceReport } from '@shared/schema';

export interface ComplianceMetrics {
  totalUsers: number;
  verifiedUsers: number;
  totalTransactionVolume: number;
  totalCommissions: number;
  suspiciousActivities: number;
  pendingKYC: number;
  averageInvestmentAmount: number;
  topInvestors: Array<{
    userId: string;
    totalInvested: number;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
}

export interface AMFReport {
  reportId: string;
  period: string;
  generatedAt: Date;
  data: {
    platformMetrics: ComplianceMetrics;
    riskAssessment: RiskAssessment;
    regulatoryCompliance: RegulatoryCompliance;
    recommendations: string[];
  };
}

export interface RiskAssessment {
  overallRiskLevel: 'low' | 'medium' | 'high';
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    mitigation: string;
  }>;
  fraudAlerts: Array<{
    userId: string;
    alertType: string;
    description: string;
    timestamp: Date;
  }>;
}

export interface RegulatoryCompliance {
  kycCompliance: {
    totalUsers: number;
    verifiedUsers: number;
    complianceRate: number;
    pendingVerifications: number;
  };
  transactionMonitoring: {
    totalTransactions: number;
    flaggedTransactions: number;
    averageAmount: number;
    largeTransactions: number; // Above €10,000
  };
  reportingRequirements: {
    monthlyReportsGenerated: boolean;
    quarterlyReportsGenerated: boolean;
    annualReportsGenerated: boolean;
    lastReportDate: Date | null;
  };
}

export class ComplianceService {
  /**
   * Generate comprehensive AMF compliance report
   */
  static async generateAMFReport(
    period: string = 'monthly',
    startDate?: Date,
    endDate?: Date
  ): Promise<AMFReport> {
    try {
      const reportId = `AMF_${period}_${Date.now()}`;
      const now = new Date();
      
      // Set default date range if not provided
      if (!startDate || !endDate) {
        const dates = this.getDefaultDateRange(period);
        startDate = dates.startDate;
        endDate = dates.endDate;
      }

      // Gather platform metrics
      const platformMetrics = await this.collectPlatformMetrics(startDate, endDate);
      
      // Perform risk assessment
      const riskAssessment = await this.performRiskAssessment(startDate, endDate);
      
      // Check regulatory compliance
      const regulatoryCompliance = await this.checkRegulatoryCompliance(startDate, endDate);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(
        platformMetrics, 
        riskAssessment, 
        regulatoryCompliance
      );

      const reportData = {
        platformMetrics,
        riskAssessment,
        regulatoryCompliance,
        recommendations
      };

      // Save report to database
      await db.insert(complianceReports).values({
        reportType: `AMF_${period}`,
        period: `${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}`,
        data: reportData,
        generatedBy: 'system' // Could be actual admin user ID
      });

      return {
        reportId,
        period,
        generatedAt: now,
        data: reportData
      };

    } catch (error) {
      console.error('Failed to generate AMF report:', error);
      throw new Error('Compliance report generation failed');
    }
  }

  /**
   * Collect platform metrics for compliance
   */
  private static async collectPlatformMetrics(
    startDate: Date, 
    endDate: Date
  ): Promise<ComplianceMetrics> {
    try {
      // Total users and verified users
      const totalUsersResult = await db.select({ count: count() }).from(users);
      const totalUsers = totalUsersResult[0]?.count || 0;

      const verifiedUsersResult = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.kycVerified, true));
      const verifiedUsers = verifiedUsersResult[0]?.count || 0;

      // Transaction volume and commissions in period
      const transactionStats = await db
        .select({
          totalVolume: sum(transactions.amount),
          totalCommissions: sum(transactions.commission),
          transactionCount: count()
        })
        .from(transactions)
        .where(and(
          gte(transactions.createdAt, startDate),
          lte(transactions.createdAt, endDate)
        ));

      const totalTransactionVolume = parseFloat(transactionStats[0]?.totalVolume || '0');
      const totalCommissions = parseFloat(transactionStats[0]?.totalCommissions || '0');
      const transactionCount = transactionStats[0]?.transactionCount || 0;

      // Calculate average investment amount
      const averageInvestmentAmount = transactionCount > 0 
        ? totalTransactionVolume / transactionCount 
        : 0;

      // Identify suspicious activities (placeholder logic)
      const suspiciousActivities = await this.detectSuspiciousActivities(startDate, endDate);

      // Count pending KYC verifications
      const pendingKYCResult = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.kycVerified, false));
      const pendingKYC = pendingKYCResult[0]?.count || 0;

      // Get top investors with risk assessment
      const topInvestors = await this.getTopInvestorsWithRisk(10);

      return {
        totalUsers,
        verifiedUsers,
        totalTransactionVolume,
        totalCommissions,
        suspiciousActivities,
        pendingKYC,
        averageInvestmentAmount,
        topInvestors
      };

    } catch (error) {
      console.error('Failed to collect platform metrics:', error);
      throw error;
    }
  }

  /**
   * Perform risk assessment
   */
  private static async performRiskAssessment(
    startDate: Date, 
    endDate: Date
  ): Promise<RiskAssessment> {
    const riskFactors: RiskAssessment['riskFactors'] = [];
    const fraudAlerts: RiskAssessment['fraudAlerts'] = [];

    // Check for high-volume users (potential risk)
    const highVolumeUsers = await db
      .select({
        userId: transactions.userId,
        totalAmount: sum(transactions.amount)
      })
      .from(transactions)
      .where(and(
        gte(transactions.createdAt, startDate),
        lte(transactions.createdAt, endDate)
      ))
      .groupBy(transactions.userId)
      .having(gte(sum(transactions.amount), 10000)); // €10,000+ threshold

    if (highVolumeUsers.length > 0) {
      riskFactors.push({
        factor: 'High Volume Trading',
        severity: 'medium',
        description: `${highVolumeUsers.length} users with transaction volume > €10,000`,
        mitigation: 'Enhanced KYC verification and transaction monitoring'
      });
    }

    // Check for unusual investment patterns
    const unusualPatterns = await this.detectUnusualInvestmentPatterns(startDate, endDate);
    if (unusualPatterns.length > 0) {
      riskFactors.push({
        factor: 'Unusual Investment Patterns',
        severity: 'medium',
        description: 'Detected irregular investment timing or amounts',
        mitigation: 'Manual review of flagged transactions'
      });
    }

    // Check unverified users with high activity
    const unverifiedHighActivity = await db
      .select({
        userId: users.id,
        totalInvested: users.totalInvested
      })
      .from(users)
      .where(and(
        eq(users.kycVerified, false),
        gte(users.totalInvested, '1000.00')
      ));

    if (unverifiedHighActivity.length > 0) {
      riskFactors.push({
        factor: 'Unverified High Activity Users',
        severity: 'high',
        description: `${unverifiedHighActivity.length} unverified users with >€1,000 investments`,
        mitigation: 'Mandatory KYC completion for high-value users'
      });
    }

    // Calculate overall risk level
    const highRiskFactors = riskFactors.filter(f => f.severity === 'high').length;
    const mediumRiskFactors = riskFactors.filter(f => f.severity === 'medium').length;
    
    let overallRiskLevel: 'low' | 'medium' | 'high' = 'low';
    if (highRiskFactors > 0) {
      overallRiskLevel = 'high';
    } else if (mediumRiskFactors > 2) {
      overallRiskLevel = 'medium';
    }

    return {
      overallRiskLevel,
      riskFactors,
      fraudAlerts
    };
  }

  /**
   * Check regulatory compliance status
   */
  private static async checkRegulatoryCompliance(
    startDate: Date, 
    endDate: Date
  ): Promise<RegulatoryCompliance> {
    // KYC compliance metrics
    const totalUsersResult = await db.select({ count: count() }).from(users);
    const totalUsers = totalUsersResult[0]?.count || 0;

    const verifiedUsersResult = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.kycVerified, true));
    const verifiedUsers = verifiedUsersResult[0]?.count || 0;

    const pendingVerifications = totalUsers - verifiedUsers;
    const complianceRate = totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0;

    // Transaction monitoring
    const transactionStats = await db
      .select({
        totalTransactions: count(),
        totalAmount: sum(transactions.amount)
      })
      .from(transactions)
      .where(and(
        gte(transactions.createdAt, startDate),
        lte(transactions.createdAt, endDate)
      ));

    const totalTransactions = transactionStats[0]?.totalTransactions || 0;
    const totalAmount = parseFloat(transactionStats[0]?.totalAmount || '0');
    const averageAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

    // Large transactions (>€10,000)
    const largeTransactionsResult = await db
      .select({ count: count() })
      .from(transactions)
      .where(and(
        gte(transactions.amount, '10000.00'),
        gte(transactions.createdAt, startDate),
        lte(transactions.createdAt, endDate)
      ));
    const largeTransactions = largeTransactionsResult[0]?.count || 0;

    // Check reporting requirements
    const lastReportResult = await db
      .select()
      .from(complianceReports)
      .orderBy(desc(complianceReports.createdAt))
      .limit(1);

    const lastReportDate = lastReportResult[0]?.createdAt || null;

    return {
      kycCompliance: {
        totalUsers,
        verifiedUsers,
        complianceRate: Math.round(complianceRate * 100) / 100,
        pendingVerifications
      },
      transactionMonitoring: {
        totalTransactions,
        flaggedTransactions: 0, // Placeholder
        averageAmount: Math.round(averageAmount * 100) / 100,
        largeTransactions
      },
      reportingRequirements: {
        monthlyReportsGenerated: true, // Placeholder
        quarterlyReportsGenerated: true,
        annualReportsGenerated: true,
        lastReportDate
      }
    };
  }

  /**
   * Generate compliance recommendations
   */
  private static generateRecommendations(
    metrics: ComplianceMetrics,
    riskAssessment: RiskAssessment,
    compliance: RegulatoryCompliance
  ): string[] {
    const recommendations: string[] = [];

    // KYC compliance recommendations
    if (compliance.kycCompliance.complianceRate < 80) {
      recommendations.push('Améliorer le taux de vérification KYC - actuellement sous les 80% requis');
    }

    if (metrics.pendingKYC > 50) {
      recommendations.push('Accélérer le processus de vérification KYC pour réduire les demandes en attente');
    }

    // Risk-based recommendations
    if (riskAssessment.overallRiskLevel === 'high') {
      recommendations.push('Mettre en place des contrôles renforcés en raison du niveau de risque élevé');
    }

    if (riskAssessment.riskFactors.some(f => f.factor === 'High Volume Trading')) {
      recommendations.push('Surveillance renforcée des utilisateurs à fort volume de transactions');
    }

    // Transaction monitoring recommendations
    if (compliance.transactionMonitoring.largeTransactions > 10) {
      recommendations.push('Révision manuelle requise pour les transactions importantes (>€10,000)');
    }

    if (metrics.averageInvestmentAmount > 15) {
      recommendations.push('Surveiller l\'augmentation du montant moyen d\'investissement');
    }

    // General compliance recommendations
    if (!compliance.reportingRequirements.monthlyReportsGenerated) {
      recommendations.push('Générer les rapports mensuels requis par la réglementation AMF');
    }

    // Default recommendation if none identified
    if (recommendations.length === 0) {
      recommendations.push('Maintenir les niveaux actuels de conformité et surveillance');
    }

    return recommendations;
  }

  /**
   * Detect suspicious activities
   */
  private static async detectSuspiciousActivities(
    startDate: Date, 
    endDate: Date
  ): Promise<number> {
    try {
      // Placeholder logic for detecting suspicious activities
      // In a real implementation, this would include:
      // - Rapid fire transactions
      // - Circular investments
      // - Unusual geographic patterns
      // - etc.
      
      return 0; // No suspicious activities detected yet
    } catch (error) {
      console.error('Failed to detect suspicious activities:', error);
      return 0;
    }
  }

  /**
   * Get top investors with risk levels
   */
  private static async getTopInvestorsWithRisk(limit: number = 10) {
    try {
      const topInvestors = await db
        .select({
          userId: users.id,
          totalInvested: users.totalInvested,
          kycVerified: users.kycVerified
        })
        .from(users)
        .orderBy(desc(users.totalInvested))
        .limit(limit);

      return topInvestors.map(investor => {
        const amount = parseFloat(investor.totalInvested || '0');
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        
        if (amount > 10000) {
          riskLevel = 'high';
        } else if (amount > 5000) {
          riskLevel = 'medium';
        }
        
        if (!investor.kycVerified && amount > 1000) {
          riskLevel = 'high'; // Unverified with significant investment
        }

        return {
          userId: investor.userId,
          totalInvested: amount,
          riskLevel
        };
      });
    } catch (error) {
      console.error('Failed to get top investors:', error);
      return [];
    }
  }

  /**
   * Detect unusual investment patterns
   */
  private static async detectUnusualInvestmentPatterns(
    startDate: Date, 
    endDate: Date
  ) {
    // Placeholder for pattern detection logic
    return [];
  }

  /**
   * Get default date range for period
   */
  private static getDefaultDateRange(period: string) {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now);

    switch (period) {
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate };
  }

  /**
   * Get latest compliance reports
   */
  static async getLatestReports(limit: number = 10): Promise<ComplianceReport[]> {
    try {
      return await db
        .select()
        .from(complianceReports)
        .orderBy(desc(complianceReports.createdAt))
        .limit(limit);
    } catch (error) {
      console.error('Failed to get latest reports:', error);
      return [];
    }
  }

  /**
   * Generate quick compliance summary
   */
  static async getComplianceSummary(): Promise<{
    kycComplianceRate: number;
    totalTransactionVolume: number;
    riskLevel: 'low' | 'medium' | 'high';
    pendingReviews: number;
  }> {
    try {
      const totalUsers = await db.select({ count: count() }).from(users);
      const verifiedUsers = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.kycVerified, true));

      const kycComplianceRate = totalUsers[0]?.count 
        ? (verifiedUsers[0]?.count || 0) / totalUsers[0].count * 100 
        : 0;

      // Get last 30 days transaction volume
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const transactionVolume = await db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(gte(transactions.createdAt, thirtyDaysAgo));

      const totalTransactionVolume = parseFloat(transactionVolume[0]?.total || '0');

      // Simple risk assessment
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (kycComplianceRate < 70) riskLevel = 'high';
      else if (kycComplianceRate < 85) riskLevel = 'medium';

      const pendingReviews = totalUsers[0]?.count - verifiedUsers[0]?.count || 0;

      return {
        kycComplianceRate: Math.round(kycComplianceRate * 100) / 100,
        totalTransactionVolume,
        riskLevel,
        pendingReviews
      };

    } catch (error) {
      console.error('Failed to get compliance summary:', error);
      return {
        kycComplianceRate: 0,
        totalTransactionVolume: 0,
        riskLevel: 'high',
        pendingReviews: 0
      };
    }
  }
}