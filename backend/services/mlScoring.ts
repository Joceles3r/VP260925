import { getCategoryScore } from '@shared/utils';
import { ML_SCORING_CONFIG } from '@shared/constants';
import type { Project } from '@shared/schema';

export interface ScoringFactors {
  category: string;
  targetAmount: number;
  description: string;
  hasVideo: boolean;
  hasThumbnail: boolean;
  creatorExperience?: number; // Future enhancement
}

export interface ScoringResult {
  score: number;
  breakdown: {
    categoryScore: number;
    amountScore: number;
    qualityScore: number;
    bonusPoints: number;
  };
  confidence: number;
}

/**
 * Calculate ML-based project score
 */
export function calculateProjectScore(factors: ScoringFactors): ScoringResult {
  const { 
    CATEGORY_WEIGHT, 
    AMOUNT_WEIGHT, 
    QUALITY_WEIGHT, 
    MAX_SCORE, 
    MIN_SCORE,
    DEFAULT_SCORE 
  } = ML_SCORING_CONFIG;

  // 1. Category Score (0-10 based on category type)
  const categoryScore = getCategoryScore(factors.category) * MAX_SCORE;

  // 2. Target Amount Score (normalized)
  const amountScore = calculateAmountScore(factors.targetAmount);

  // 3. Quality Score (based on description and media)
  const qualityScore = calculateQualityScore(factors);

  // 4. Bonus Points
  const bonusPoints = calculateBonusPoints(factors);

  // Weighted final score
  const rawScore = (
    categoryScore * CATEGORY_WEIGHT +
    amountScore * AMOUNT_WEIGHT +
    qualityScore * QUALITY_WEIGHT +
    bonusPoints
  );

  // Normalize to 0-10 range
  const finalScore = Math.max(MIN_SCORE, Math.min(MAX_SCORE, rawScore));

  // Calculate confidence based on available data
  const confidence = calculateConfidence(factors);

  return {
    score: parseFloat(finalScore.toFixed(1)),
    breakdown: {
      categoryScore: parseFloat(categoryScore.toFixed(1)),
      amountScore: parseFloat(amountScore.toFixed(1)),
      qualityScore: parseFloat(qualityScore.toFixed(1)),
      bonusPoints: parseFloat(bonusPoints.toFixed(1))
    },
    confidence: parseFloat(confidence.toFixed(2))
  };
}

/**
 * Calculate score based on target amount
 */
function calculateAmountScore(targetAmount: number): number {
  // Optimal range: €1,000 - €10,000
  const optimalMin = 1000;
  const optimalMax = 10000;
  
  if (targetAmount >= optimalMin && targetAmount <= optimalMax) {
    return ML_SCORING_CONFIG.MAX_SCORE * 0.8; // High score for optimal range
  } else if (targetAmount < optimalMin) {
    // Score increases as amount approaches optimal minimum
    return (targetAmount / optimalMin) * ML_SCORING_CONFIG.MAX_SCORE * 0.6;
  } else {
    // Score decreases for amounts above optimal maximum
    const excessFactor = Math.max(0.3, 1 - ((targetAmount - optimalMax) / optimalMax));
    return ML_SCORING_CONFIG.MAX_SCORE * 0.8 * excessFactor;
  }
}

/**
 * Calculate quality score based on content analysis
 */
function calculateQualityScore(factors: ScoringFactors): number {
  let qualityScore = 0;

  // Description quality analysis
  const descLength = factors.description.length;
  const hasKeywords = /\b(innovation|unique|original|professional|experience)\b/i.test(factors.description);
  const hasClearGoals = /\b(goal|objective|aim|purpose)\b/i.test(factors.description);
  
  // Base score from description length (optimal: 200-800 chars)
  if (descLength >= 200 && descLength <= 800) {
    qualityScore += 3;
  } else if (descLength >= 100) {
    qualityScore += 2;
  } else if (descLength >= 50) {
    qualityScore += 1;
  }

  // Keyword bonus
  if (hasKeywords) qualityScore += 1;
  if (hasClearGoals) qualityScore += 1;

  // Media presence bonus
  if (factors.hasVideo) qualityScore += 2;
  if (factors.hasThumbnail) qualityScore += 1;

  // Professional indicators
  const isProfessional = /\b(studio|company|team|production|director)\b/i.test(factors.description);
  if (isProfessional) qualityScore += 1;

  return Math.min(ML_SCORING_CONFIG.MAX_SCORE, qualityScore);
}

/**
 * Calculate bonus points for special factors
 */
function calculateBonusPoints(factors: ScoringFactors): number {
  let bonusPoints = 0;

  // Early bird bonus (for projects in certain categories)
  const earlyBirdCategories = ['documentaire', 'court-métrage'];
  if (earlyBirdCategories.includes(factors.category.toLowerCase())) {
    bonusPoints += 0.5;
  }

  // Complete profile bonus
  if (factors.hasVideo && factors.hasThumbnail && factors.description.length > 300) {
    bonusPoints += 0.5;
  }

  // Creator experience bonus (future enhancement)
  if (factors.creatorExperience && factors.creatorExperience > 0) {
    bonusPoints += Math.min(1, factors.creatorExperience * 0.1);
  }

  return bonusPoints;
}

/**
 * Calculate confidence level of the scoring
 */
function calculateConfidence(factors: ScoringFactors): number {
  let confidence = 0.5; // Base confidence

  // Increase confidence based on available data
  if (factors.description.length > 200) confidence += 0.1;
  if (factors.hasVideo) confidence += 0.2;
  if (factors.hasThumbnail) confidence += 0.1;
  if (factors.targetAmount > 0) confidence += 0.1;
  if (factors.creatorExperience !== undefined) confidence += 0.1;

  return Math.min(1.0, confidence);
}

/**
 * Get scoring recommendation for project
 */
export function getProjectRecommendation(score: number): {
  recommendation: 'approve' | 'review' | 'reject';
  reason: string;
  suggestedActions?: string[];
} {
  if (score >= 7.5) {
    return {
      recommendation: 'approve',
      reason: 'Excellent project score indicates high potential for success',
      suggestedActions: ['Feature on homepage', 'Priority review']
    };
  } else if (score >= 6.0) {
    return {
      recommendation: 'approve',
      reason: 'Good project score with solid fundamentals'
    };
  } else if (score >= 4.0) {
    return {
      recommendation: 'review',
      reason: 'Average score requires manual review',
      suggestedActions: [
        'Request more detailed description',
        'Ask for video preview',
        'Verify creator credentials'
      ]
    };
  } else {
    return {
      recommendation: 'reject',
      reason: 'Low score indicates significant concerns',
      suggestedActions: [
        'Provide feedback to creator',
        'Suggest improvements',
        'Allow resubmission after changes'
      ]
    };
  }
}

/**
 * Analyze project performance for ML learning
 */
export function analyzeProjectPerformance(project: Project & { actualROI?: number }): {
  scoringAccuracy: number;
  factors: string[];
  learnings: string[];
} {
  const predictions = {
    scoringAccuracy: 0,
    factors: [] as string[],
    learnings: [] as string[]
  };

  if (!project.actualROI || !project.mlScore) {
    return predictions;
  }

  // Calculate scoring accuracy
  const expectedPerformance = parseFloat(project.mlScore.toString()) / 10; // Normalize to 0-1
  const actualPerformance = Math.max(0, Math.min(1, (project.actualROI + 1) / 2)); // Normalize ROI to 0-1
  
  predictions.scoringAccuracy = 1 - Math.abs(expectedPerformance - actualPerformance);

  // Identify key factors
  if (project.category) {
    predictions.factors.push(`Category: ${project.category}`);
  }
  
  if (project.currentAmount && project.targetAmount) {
    const fundingRatio = parseFloat(project.currentAmount.toString()) / parseFloat(project.targetAmount.toString());
    predictions.factors.push(`Funding ratio: ${(fundingRatio * 100).toFixed(1)}%`);
  }

  // Generate learnings
  if (predictions.scoringAccuracy > 0.8) {
    predictions.learnings.push('Scoring model performed well for this project type');
  } else if (predictions.scoringAccuracy < 0.5) {
    predictions.learnings.push('Consider adjusting weights for this project category');
  }

  if (project.actualROI > 0.5 && project.mlScore && parseFloat(project.mlScore.toString()) < 6) {
    predictions.learnings.push('High-performing project was underscored - review quality metrics');
  }

  return predictions;
}

/**
 * Batch score multiple projects
 */
export function batchScoreProjects(projectsData: ScoringFactors[]): ScoringResult[] {
  return projectsData.map(project => calculateProjectScore(project));
}

/**
 * Get category-specific scoring insights
 */
export function getCategoryInsights(category: string): {
  averageScore: number;
  successFactors: string[];
  commonPitfalls: string[];
} {
  const categoryData = {
    documentaire: {
      averageScore: 7.2,
      successFactors: [
        'Strong narrative focus',
        'Real-world relevance',
        'Clear educational value'
      ],
      commonPitfalls: [
        'Overly academic approach',
        'Limited visual appeal',
        'Unclear target audience'
      ]
    },
    'court-métrage': {
      averageScore: 6.8,
      successFactors: [
        'Original storytelling',
        'Strong visual direction',
        'Professional production quality'
      ],
      commonPitfalls: [
        'Overambitious scope',
        'Weak character development',
        'Technical limitations'
      ]
    },
    clip: {
      averageScore: 6.5,
      successFactors: [
        'Catchy concept',
        'Strong musical content',
        'Visual creativity'
      ],
      commonPitfalls: [
        'Relying only on music quality',
        'Limited visual innovation',
        'Poor synchronization'
      ]
    }
  };

  return categoryData[category.toLowerCase() as keyof typeof categoryData] || {
    averageScore: ML_SCORING_CONFIG.DEFAULT_SCORE,
    successFactors: ['Clear vision', 'Professional presentation', 'Realistic goals'],
    commonPitfalls: ['Vague descriptions', 'Unrealistic budgets', 'Missing media']
  };
}