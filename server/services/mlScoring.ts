import type { InsertProject } from "@shared/schema";
import { getCategoryScore } from "@shared/utils";

interface MLScoreFactors {
  categoryScore: number;
  titleLength: number;
  descriptionQuality: number;
  targetAmountRealistic: number;
  creatorExperience: number;
}

export class MLScoringError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = "MLScoringError";
  }
}

export class SimulationValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value?: any
  ) {
    super(message);
    this.name = "SimulationValidationError";
  }
}

function validateProjectForScoring(project: InsertProject): void {
  if (!project) {
    throw new SimulationValidationError("Projet manquant", "project");
  }

  if (!project.title || typeof project.title !== "string") {
    throw new SimulationValidationError(
      "Titre du projet invalide ou manquant",
      "title",
      project.title
    );
  }

  if (project.title.length < 3) {
    throw new SimulationValidationError(
      "Le titre doit contenir au moins 3 caractères",
      "title",
      project.title
    );
  }

  if (!project.description || typeof project.description !== "string") {
    throw new SimulationValidationError(
      "Description du projet invalide ou manquante",
      "description",
      project.description
    );
  }

  if (project.description.length < 10) {
    throw new SimulationValidationError(
      "La description doit contenir au moins 10 caractères",
      "description",
      project.description
    );
  }

  if (!project.category || typeof project.category !== "string") {
    throw new SimulationValidationError(
      "Catégorie du projet invalide ou manquante",
      "category",
      project.category
    );
  }

  if (!project.targetAmount) {
    throw new SimulationValidationError(
      "Montant cible manquant",
      "targetAmount",
      project.targetAmount
    );
  }

  const targetAmount = parseFloat(project.targetAmount);
  if (isNaN(targetAmount) || targetAmount <= 0) {
    throw new SimulationValidationError(
      "Montant cible invalide - doit être un nombre positif",
      "targetAmount",
      project.targetAmount
    );
  }

  if (targetAmount > 1000000) {
    throw new SimulationValidationError(
      "Montant cible trop élevé - maximum 1,000,000 €",
      "targetAmount",
      targetAmount
    );
  }
}

export async function mlScoreProject(project: InsertProject): Promise<number> {
  try {
    // Validate input
    validateProjectForScoring(project);
    
    const targetAmount = parseFloat(project.targetAmount);
    
    const factors: MLScoreFactors = {
      categoryScore: getCategoryScore(project.category),
      titleLength: getTitleScore(project.title),
      descriptionQuality: getDescriptionScore(project.description),
      targetAmountRealistic: getTargetAmountScore(targetAmount),
      creatorExperience: 0.5, // Would be based on creator's past projects
    };
    
    // Validate all factors
    Object.entries(factors).forEach(([key, value]) => {
      if (typeof value !== "number" || isNaN(value) || value < 0 || value > 1) {
        throw new MLScoringError(
          `Facteur de score invalide: ${key}`,
          "INVALID_FACTOR",
          { factor: key, value }
        );
      }
    });
    
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
    
    if (isNaN(totalScore) || totalScore < 0) {
      throw new MLScoringError(
        "Calcul de score invalide",
        "INVALID_CALCULATION",
        { totalScore, factors }
      );
    }
    
    // Apply some randomness to simulate real ML variability
    const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    totalScore *= randomFactor;
    
    // Ensure score is between 1.0 and 10.0
    const finalScore = Math.max(1.0, Math.min(10.0, totalScore * 10));
    
    console.log(`[ML Scoring] Project "${project.title}" scored: ${finalScore.toFixed(2)}`);
    
    return finalScore;
    
  } catch (error) {
    if (error instanceof SimulationValidationError || error instanceof MLScoringError) {
      console.error(`[ML Scoring Error] ${error.name}: ${error.message}`, error);
      throw error;
    }
    
    console.error("[ML Scoring] Unexpected error:", error);
    throw new MLScoringError(
      "Erreur inattendue lors du calcul du score ML",
      "UNEXPECTED_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

// Function getCategoryScore is now imported from @shared/utils

function getTitleScore(title: string): number {
  try {
    if (!title || typeof title !== "string") {
      console.warn("[getTitleScore] Invalid title, using minimum score");
      return 0.1;
    }

    const length = title.trim().length;
    
    if (length === 0) {
      return 0.1;
    }
    
    if (length < 10) return 0.3;
    if (length < 30) return 0.7;
    if (length < 60) return 1.0;
    
    // Too long titles get penalized
    return 0.8;
  } catch (error) {
    console.error("[getTitleScore] Error:", error);
    return 0.1;
  }
}

function getDescriptionScore(description: string): number {
  try {
    if (!description || typeof description !== "string") {
      console.warn("[getDescriptionScore] Invalid description, using minimum score");
      return 0.1;
    }

    const trimmed = description.trim();
    const length = trimmed.length;
    const wordCount = trimmed.split(/\s+/).filter(w => w.length > 0).length;
    
    // Check for meaningful content
    if (length === 0) return 0.1;
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
      if (indicator.test(trimmed)) {
        qualityScore += 0.1;
      }
    });
    
    return Math.min(1.0, qualityScore);
  } catch (error) {
    console.error("[getDescriptionScore] Error:", error);
    return 0.1;
  }
}

function getTargetAmountScore(targetAmount: number): number {
  try {
    if (typeof targetAmount !== "number" || isNaN(targetAmount)) {
      console.warn("[getTargetAmountScore] Invalid amount, using minimum score");
      return 0.1;
    }

    if (targetAmount <= 0) {
      console.warn("[getTargetAmountScore] Non-positive amount, using minimum score");
      return 0.1;
    }

    // Realistic target amounts get higher scores
    if (targetAmount < 1000) return 0.3; // Too low, might not be serious
    if (targetAmount < 5000) return 0.8;
    if (targetAmount < 15000) return 1.0;
    if (targetAmount < 50000) return 0.7;
    
    // Very high amounts are harder to achieve
    return 0.4;
  } catch (error) {
    console.error("[getTargetAmountScore] Error:", error);
    return 0.1;
  }
}

export interface ProjectPerformancePrediction {
  expectedROI: number;
  riskLevel: 'low' | 'medium' | 'high';
  successProbability: number;
  recommendedInvestment: number;
}

function validatePredictionInputs(project: any, mlScore: number): void {
  if (!project) {
    throw new SimulationValidationError(
      "Projet manquant pour la prédiction de performance",
      "project"
    );
  }

  if (typeof mlScore !== "number" || isNaN(mlScore)) {
    throw new SimulationValidationError(
      "Score ML invalide pour la prédiction",
      "mlScore",
      mlScore
    );
  }

  if (mlScore < 1.0 || mlScore > 10.0) {
    throw new SimulationValidationError(
      "Score ML hors limites (doit être entre 1.0 et 10.0)",
      "mlScore",
      mlScore
    );
  }
}

export async function predictProjectPerformance(
  project: any,
  mlScore: number
): Promise<ProjectPerformancePrediction> {
  try {
    // Validate inputs
    validatePredictionInputs(project, mlScore);
    
    // Simplified prediction model
    const baseROI = mlScore * 2; // Higher ML score = higher expected ROI
    const randomFactor = 0.7 + Math.random() * 0.6; // Add some variance (0.7 to 1.3)
    
    const expectedROI = baseROI * randomFactor;
    
    // Validate calculated ROI
    if (isNaN(expectedROI) || expectedROI < 0) {
      throw new MLScoringError(
        "ROI calculé invalide",
        "INVALID_ROI",
        { baseROI, randomFactor, expectedROI }
      );
    }
    
    // Determine risk level based on ML score
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    if (mlScore >= 8) {
      riskLevel = 'low';
    } else if (mlScore <= 5) {
      riskLevel = 'high';
    }
    
    // Calculate success probability (between 0.1 and 0.95)
    const successProbability = Math.min(0.95, Math.max(0.1, mlScore / 10 * 0.8 + 0.1));
    
    if (isNaN(successProbability) || successProbability < 0 || successProbability > 1) {
      throw new MLScoringError(
        "Probabilité de succès invalide",
        "INVALID_PROBABILITY",
        { mlScore, successProbability }
      );
    }
    
    // Calculate recommended investment (between 1 and 20 EUR)
    const recommendedInvestment = Math.min(20, Math.max(1, mlScore * 2));
    
    if (isNaN(recommendedInvestment) || recommendedInvestment < 1 || recommendedInvestment > 20) {
      throw new MLScoringError(
        "Montant d'investissement recommandé invalide",
        "INVALID_RECOMMENDATION",
        { mlScore, recommendedInvestment }
      );
    }
    
    const prediction: ProjectPerformancePrediction = {
      expectedROI,
      riskLevel,
      successProbability,
      recommendedInvestment,
    };
    
    console.log(
      `[Performance Prediction] Project: ROI=${expectedROI.toFixed(1)}%, Risk=${riskLevel}, Success=${(successProbability * 100).toFixed(1)}%`
    );
    
    return prediction;
    
  } catch (error) {
    if (error instanceof SimulationValidationError || error instanceof MLScoringError) {
      console.error(`[Performance Prediction Error] ${error.name}: ${error.message}`, error);
      throw error;
    }
    
    console.error("[Performance Prediction] Unexpected error:", error);
    throw new MLScoringError(
      "Erreur inattendue lors de la prédiction de performance",
      "PREDICTION_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}
