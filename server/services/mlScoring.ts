import type { InsertProject } from "@shared/schema";

interface MLScoreFactors {
  categoryScore: number;
  titleLength: number;
  descriptionQuality: number;
  targetAmountRealistic: number;
  creatorExperience: number;
}

export async function mlScoreProject(project: InsertProject): Promise<number> {
  try {
    // This is a simplified ML scoring algorithm
    // In production, this would use actual ML models
    
    const factors: MLScoreFactors = {
      categoryScore: getCategoryScore(project.category),
      titleLength: getTitleScore(project.title),
      descriptionQuality: getDescriptionScore(project.description),
      targetAmountRealistic: getTargetAmountScore(parseFloat(project.targetAmount)),
      creatorExperience: 0.5, // Would be based on creator's past projects
    };
    
    // Weighted scoring
    const weights = {
      categoryScore: 0.2,
      titleLength: 0.15,
      descriptionQuality: 0.25,
      targetAmountRealistic: 0.25,
      creatorExperience: 0.15,
    };
    
    let totalScore = 0;
    totalScore += factors.categoryScore * weights.categoryScore;
    totalScore += factors.titleLength * weights.titleLength;
    totalScore += factors.descriptionQuality * weights.descriptionQuality;
    totalScore += factors.targetAmountRealistic * weights.targetAmountRealistic;
    totalScore += factors.creatorExperience * weights.creatorExperience;
    
    // Apply some randomness to simulate real ML variability
    const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    totalScore *= randomFactor;
    
    // Ensure score is between 1.0 and 10.0
    return Math.max(1.0, Math.min(10.0, totalScore * 10));
    
  } catch (error) {
    console.error("Error calculating ML score:", error);
    return 5.0; // Default score if calculation fails
  }
}

function getCategoryScore(category: string): number {
  const categoryScores: Record<string, number> = {
    'documentaire': 0.8,
    'court-métrage': 0.7,
    'clip': 0.6,
    'animation': 0.75,
    'live': 0.5,
  };
  
  return categoryScores[category.toLowerCase()] || 0.5;
}

function getTitleScore(title: string): number {
  const length = title.length;
  if (length < 10) return 0.3;
  if (length < 30) return 0.7;
  if (length < 60) return 1.0;
  return 0.8; // Too long titles get penalized
}

function getDescriptionScore(description: string): number {
  const length = description.length;
  const wordCount = description.split(/\s+/).length;
  
  // Check for meaningful content
  if (length < 50) return 0.2;
  if (wordCount < 10) return 0.3;
  
  // Look for key indicators of quality
  const qualityIndicators = [
    /budget/i,
    /équipe/i,
    /expérience/i,
    /objectif/i,
    /public/i,
    /distribution/i,
  ];
  
  let qualityScore = 0.5;
  qualityIndicators.forEach(indicator => {
    if (indicator.test(description)) {
      qualityScore += 0.1;
    }
  });
  
  return Math.min(1.0, qualityScore);
}

function getTargetAmountScore(targetAmount: number): number {
  // Realistic target amounts get higher scores
  if (targetAmount < 1000) return 0.3; // Too low, might not be serious
  if (targetAmount < 5000) return 0.8;
  if (targetAmount < 15000) return 1.0;
  if (targetAmount < 50000) return 0.7;
  return 0.4; // Very high amounts are harder to achieve
}

export interface ProjectPerformancePrediction {
  expectedROI: number;
  riskLevel: 'low' | 'medium' | 'high';
  successProbability: number;
  recommendedInvestment: number;
}

export async function predictProjectPerformance(
  project: any,
  mlScore: number
): Promise<ProjectPerformancePrediction> {
  // Simplified prediction model
  const baseROI = mlScore * 2; // Higher ML score = higher expected ROI
  const randomFactor = 0.7 + Math.random() * 0.6; // Add some variance
  
  const expectedROI = baseROI * randomFactor;
  
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';
  if (mlScore >= 8) riskLevel = 'low';
  else if (mlScore <= 5) riskLevel = 'high';
  
  const successProbability = Math.min(0.95, mlScore / 10 * 0.8 + 0.1);
  
  const recommendedInvestment = Math.min(20, Math.max(1, mlScore * 2));
  
  return {
    expectedROI,
    riskLevel,
    successProbability,
    recommendedInvestment,
  };
}
