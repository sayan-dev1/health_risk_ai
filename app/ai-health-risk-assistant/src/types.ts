/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HealthProfileInputs {
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  height: number; // cm
  weight: number; // kg
  smoking: 'Never Smoked' | 'Former Smoker' | 'Active Smoker';
  systolic: number; // mmHg
  diastolic: number; // mmHg
  cholesterol: 'Normal' | 'Borderline High' | 'High';
  glucose: number; // mg/dL
  physicalActivity: number; // minutes per week
  sleepDuration: number; // hours per night
  generalHealth: 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor';
  hypertension: boolean;
  familyHistoryHeart: boolean;
  familyHistoryDiabetes: boolean;
  alcohol: 'None' | 'Moderate' | 'Heavy';
  dietFruitVeg: boolean;
  difficultyWalking: boolean;
  
  // Unified inputs
  everMarried: boolean;
  workType: 'Private' | 'Self-employed' | 'Govt_job' | 'children' | 'Never_worked';
  residenceType: 'Urban' | 'Rural';
  cholesterolCheck: boolean;
  previousHeartAttack: boolean;
  mentalHealth: number; // days in last 30
  kidneyDisease: boolean;
  education: number; // 1-6 scale
  asthma: boolean;
}

export interface RiskMetric {
  score: number; // 0 to 100
  level: 'Low' | 'Intermediate / Moderate' | 'High';
  explanation: string;
}

export interface ShapFactor {
  feature: string;
  impact: number; // weight value (positive for increasing, negative for decreasing)
  description: string;
  disease: string; // "Heart Disease", "Stroke", "Diabetes", or "Multi-Disease"
}

export interface ShapAnalysis {
  increasingFactors: ShapFactor[];
  decreasingFactors: ShapFactor[];
}

export interface Recommendation {
  category: 'Lifestyle' | 'Diet' | 'Activity' | 'Medical Management' | string;
  title: string;
  description: string;
  impact: 'High' | 'Moderate' | string;
}

export interface SharedDriver {
  driver: string;
  impactScore: number; // 1 to 100
  affectedConditions: string[];
  explanation: string;
}

export interface CrossDiseaseAnalysis {
  sharedDrivers: SharedDriver[];
  summary: string;
}

export interface RiskAssessmentResult {
  heartDiseaseRisk: RiskMetric;
  strokeRisk: RiskMetric;
  diabetesRisk: RiskMetric;
  shapAnalysis: ShapAnalysis;
  recommendations: Recommendation[];
  crossDiseaseAnalysis: CrossDiseaseAnalysis;
}
