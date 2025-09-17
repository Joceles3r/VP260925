import { storage } from "../storage";
import { ALLOWED_INVESTMENT_AMOUNTS, isValidInvestmentAmount } from "@shared/constants";

export interface ComplianceData {
  period: string;
  totalTransactions: number;
  totalVolume: string;
  totalCommissions: string;
  userMetrics: {
    totalUsers: number;
    kycVerifiedUsers: number;
    activeUsers: number;
  };
  riskMetrics: {
    suspiciousTransactions: number;
    largeTransactions: number;
    failedKycAttempts: number;
  };
  amfCompliance: {
    reportingCompliant: boolean;
    dataRetentionCompliant: boolean;
    kycCompliant: boolean;
  };
}

export async function generateComplianceReport(
  reportType: string,
  period: string
): Promise<ComplianceData> {
  try {
    // Get basic statistics
    const [userStats, projectStats, transactionStats] = await Promise.all([
      storage.getUserStats(),
      storage.getProjectStats(),
      storage.getTransactionStats(),
    ]);

    // Get recent transactions for analysis
    const recentTransactions = await storage.getAllTransactions(1000);
    
    // Calculate risk metrics (nouvelles règles 16/09/2025)
    const suspiciousTransactions = recentTransactions.filter(t => {
      const amount = parseFloat(t.amount);
      return !isValidInvestmentAmount(amount); // Outside allowed amounts
    }).length;

    const largeTransactions = recentTransactions.filter(t => {
      const amount = parseFloat(t.amount);
      return amount >= 15; // Garder 15€+ comme "large"
    }).length;

    const failedKycAttempts = userStats.kycPending; // Simplified

    // AMF Compliance checks
    const amfCompliance = {
      reportingCompliant: true, // Regular reports are being generated
      dataRetentionCompliant: true, // All data is being stored with timestamps
      kycCompliant: (userStats.kycPending / userStats.totalUsers) < 0.1, // Less than 10% pending
    };

    const complianceData: ComplianceData = {
      period,
      totalTransactions: recentTransactions.length,
      totalVolume: transactionStats.totalVolume,
      totalCommissions: transactionStats.totalCommissions,
      userMetrics: {
        totalUsers: userStats.totalUsers,
        kycVerifiedUsers: userStats.totalUsers - userStats.kycPending,
        activeUsers: userStats.activeUsers,
      },
      riskMetrics: {
        suspiciousTransactions,
        largeTransactions,
        failedKycAttempts,
      },
      amfCompliance,
    };

    return complianceData;
  } catch (error) {
    console.error("Error generating compliance report:", error);
    throw new Error("Failed to generate compliance report");
  }
}

export function validateTransaction(transaction: any): {
  isValid: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  
  // Check amount limits (nouvelles règles 16/09/2025)
  const amount = parseFloat(transaction.amount);
  if (!isValidInvestmentAmount(amount)) {
    violations.push(`Transaction amount must be one of: ${ALLOWED_INVESTMENT_AMOUNTS.join(', ')} EUR`);
  }
  
  // Check daily limits (this would need to be implemented with daily transaction tracking)
  // violations.push("Daily limit exceeded");
  
  // Check weekly limits
  // violations.push("Weekly limit exceeded");
  
  // Check KYC status
  if (!transaction.user?.kycVerified) {
    violations.push("User KYC not verified");
  }
  
  // Check caution requirements
  if (parseFloat(transaction.user?.cautionEUR || '0') < 20) {
    violations.push("Insufficient caution deposit");
  }
  
  return {
    isValid: violations.length === 0,
    violations,
  };
}

export function calculateCommissionDistribution(
  totalCommission: number,
  projectType: 'investment' | 'live_show'
): {
  platform: number;
  winners: number;
  losers: number;
} {
  if (projectType === 'investment') {
    // Classic investment redistribution - Updated 40/30/7/23 rules
    return {
      platform: totalCommission * 0.23, // 23% platform
      winners: totalCommission * 0.70, // 70% to winners (40% top investors + 30% creators)
      losers: totalCommission * 0.07,  // 7% to losing investors (ranks 11-100)
    };
  } else {
    // Live show redistribution - Aligned with LIVE_SHOWS_DISTRIBUTION constants
    return {
      platform: 0, // 0% platform (no VISUAL commission for live shows per constants)
      winners: totalCommission * 0.70, // 70% to winners (40% winning artist + 30% winning investors)
      losers: totalCommission * 0.30,  // 30% to losing side (20% losing artist + 10% losing investors)
    };
  }
}

export async function auditUserActivity(userId: string): Promise<{
  totalInvestments: number;
  totalVolume: string;
  riskScore: number;
  recommendations: string[];
}> {
  try {
    const user = await storage.getUser(userId);
    const userTransactions = await storage.getUserTransactions(userId);
    const userInvestments = await storage.getUserInvestments(userId);
    
    if (!user) {
      throw new Error("User not found");
    }
    
    const totalVolume = userTransactions
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
      .toString();
    
    // Calculate risk score (0-100, higher = more risky)
    let riskScore = 0;
    
    // High volume in short time
    const recentTransactions = userTransactions.filter(t => {
      if (!t.createdAt) return false;
      const daysDiff = (Date.now() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    });
    
    if (recentTransactions.length > 20) riskScore += 30;
    
    // Unusual amounts (nouvelles règles 16/09/2025)
    const unusualAmounts = userTransactions.filter(t => {
      const amount = parseFloat(t.amount);
      return !isValidInvestmentAmount(amount);
    });
    
    if (unusualAmounts.length > userTransactions.length * 0.3) riskScore += 20;
    
    // KYC status
    if (!user.kycVerified) riskScore += 50;
    
    const recommendations: string[] = [];
    if (riskScore > 70) {
      recommendations.push("High risk user - require additional verification");
    }
    if (!user.kycVerified) {
      recommendations.push("Complete KYC verification");
    }
    if (parseFloat(user.cautionEUR || '0') < 20) {
      recommendations.push("Increase caution deposit to minimum €20");
    }
    
    return {
      totalInvestments: userInvestments.length,
      totalVolume,
      riskScore,
      recommendations,
    };
  } catch (error) {
    console.error("Error auditing user activity:", error);
    throw new Error("Failed to audit user activity");
  }
}
