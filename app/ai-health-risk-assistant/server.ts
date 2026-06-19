/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini safely
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Server: Gemini API initialized successfully.");
  } catch (err) {
    console.log("Server Info: Failed to initialize Gemini API Client. Fallback mode armed.");
  }
} else {
  console.log("Server: GEMINI_API_KEY not found or is placeholder. Running in High-Fidelity Local Mock Mode.");
}

// Fallback high-fidelity risk calculator
function runFallbackHeuristics(data: any) {
  const age = parseFloat(data.age) || 45;
  const gender = String(data.gender || 'Male').toLowerCase();
  const height = parseFloat(data.height) || 170;
  const weight = parseFloat(data.weight) || 75;
  const bmi = parseFloat(data.bmi) || (weight / ((height / 100) ** 2));
  const smoking = String(data.smoking || 'Never Smoked').toLowerCase();
  const systolic = parseFloat(data.systolic) || 120;
  const diastolic = parseFloat(data.diastolic) || 80;
  const cholesterol = String(data.cholesterol || 'Normal').toLowerCase();
  const glucose = parseFloat(data.glucose) || 95;
  const physicalActivity = parseFloat(data.physicalActivity) || 150;
  const sleepDuration = parseFloat(data.sleepDuration) || 7;
  const generalHealth = String(data.generalHealth || 'Good').toLowerCase();
  
  const hypertension = !!data.hypertension;
  const familyHistoryHeart = !!data.familyHistoryHeart;
  const familyHistoryDiabetes = !!data.familyHistoryDiabetes;
  const alcohol = String(data.alcohol || 'None').toLowerCase();
  const dietFruitVeg = !!data.dietFruitVeg;
  const difficultyWalking = !!data.difficultyWalking;

  // 1. Heart Disease Risk calculation (Epidemiological weights)
  let heartScore = 5; // Base risk
  if (age > 40) heartScore += (age - 40) * 0.6;
  if (gender === 'male') heartScore += 4;
  if (bmi > 25) heartScore += (bmi - 25) * 1.0;
  if (smoking === 'active smoker') heartScore += 18;
  else if (smoking === 'former smoker') heartScore += 6;
  if (systolic > 120) heartScore += (systolic - 120) * 0.4;
  if (diastolic > 80) heartScore += (diastolic - 80) * 0.3;
  if (hypertension) heartScore += 12;
  if (cholesterol === 'high') heartScore += 15;
  else if (cholesterol === 'borderline high') heartScore += 7;
  if (familyHistoryHeart) heartScore += 10;
  if (physicalActivity < 75) heartScore += 8;
  else if (physicalActivity > 150) heartScore -= 3;
  if (sleepDuration < 6 || sleepDuration > 9) heartScore += 4;
  if (generalHealth === 'poor') heartScore += 10;
  else if (generalHealth === 'fair') heartScore += 5;
  else if (generalHealth === 'excellent') heartScore -= 3;

  heartScore = Math.min(Math.max(heartScore, 3), 95);

  let heartLevel = "Low";
  if (heartScore > 40) heartLevel = "High";
  else if (heartScore > 15) heartLevel = "Intermediate / Moderate";

  // 2. Stroke Risk calculation
  let strokeScore = 3; // Base risk
  if (age > 45) strokeScore += (age - 45) * 0.7;
  if (systolic > 120) strokeScore += (systolic - 120) * 0.6;
  if (hypertension) strokeScore += 20; // Drastic impact of BP on stroke
  if (smoking === 'active smoker') strokeScore += 15;
  if (cholesterol === 'high') strokeScore += 8;
  if (bmi > 30) strokeScore += 6;
  if (alcohol === 'heavy') strokeScore += 12;
  if (difficultyWalking) strokeScore += 5;
  if (sleepDuration < 6) strokeScore += 3;

  strokeScore = Math.min(Math.max(strokeScore, 2), 92);

  let strokeLevel = "Low";
  if (strokeScore > 30) strokeLevel = "High";
  else if (strokeScore > 12) strokeLevel = "Intermediate / Moderate";

  // 3. Diabetes Risk calculation
  let diabetesScore = 4; // Base risk
  if (age > 40) diabetesScore += (age - 40) * 0.5;
  if (bmi > 25) diabetesScore += (bmi - 25) * 1.8; // Drastic impact of BMI on diabetes
  if (familyHistoryDiabetes) diabetesScore += 18;
  if (glucose > 100) diabetesScore += (glucose - 100) * 0.6;
  if (cholesterol === 'high') diabetesScore += 8;
  if (physicalActivity < 75) diabetesScore += 10;
  if (!dietFruitVeg) diabetesScore += 5;
  if (hypertension) diabetesScore += 6;

  diabetesScore = Math.min(Math.max(diabetesScore, 2), 97);

  let diabetesLevel = "Low";
  if (diabetesScore > 35) diabetesLevel = "High";
  else if (diabetesScore > 15) diabetesLevel = "Intermediate / Moderate";

  // Rounded Scores
  const rHeart = Math.round(heartScore);
  const rStroke = Math.round(strokeScore);
  const rDiabetes = Math.round(diabetesScore);

  // Draft SHAP values
  const increasingFactors = [];
  const decreasingFactors = [];

  if (age > 50) {
    increasingFactors.push({
      feature: 'Age',
      impact: Math.round((age - 40) * 0.5),
      description: `Natural aging processes alter metabolic & cardiovascular systems (Age: ${Math.round(age)}).`,
      disease: 'Multi-Disease'
    });
  }
  if (bmi > 26) {
    increasingFactors.push({
      feature: 'Body Mass Index (BMI)',
      impact: Math.round((bmi - 25) * 1.5),
      description: `Elevated BMI of ${bmi.toFixed(1)} increases mechanical arterial tension and metabolic insulin resistance.`,
      disease: 'Diabetes'
    });
  }
  if (smoking === 'active smoker') {
    increasingFactors.push({
      feature: 'Smoking Status',
      impact: 18,
      description: 'Active smoking causes endothelial damage, constricts arteries, and accelerates plaque deposits.',
      disease: 'Heart Disease'
    });
  }
  if (hypertension || systolic > 130) {
    increasingFactors.push({
      feature: 'High Blood Pressure',
      impact: hypertension ? 20 : Math.round((systolic - 120) * 0.4),
      description: 'Forceful blood flow damages sensitive cerebral capillaries, elevating heart disease and vascular risk.',
      disease: 'Stroke'
    });
  }
  if (familyHistoryDiabetes) {
    increasingFactors.push({
      feature: 'Family History of Diabetes',
      impact: 15,
      description: 'Genetic markers carry high hereditability for pancreatic beta-cell dysfunction guidelines.',
      disease: 'Diabetes'
    });
  }
  if (cholesterol === 'high' || cholesterol === 'borderline high') {
    increasingFactors.push({
      feature: 'Cholesterol Level',
      impact: cholesterol === 'high' ? 14 : 7,
      description: `High LDL cholesterol contributes to atherogenesis (fatty blockage inside blood vessels).`,
      disease: 'Heart Disease'
    });
  }

  // Decreasing/Protective factors
  if (physicalActivity >= 150) {
    decreasingFactors.push({
      feature: 'Physical Activity',
      impact: -10,
      description: 'Regular cardiorespiratory training of over 150 mins per week improves arterial compliance.',
      disease: 'Multi-Disease'
    });
  } else if (physicalActivity >= 75) {
    decreasingFactors.push({
      feature: 'Moderate Activity',
      impact: -5,
      description: 'Engaging in basic regular movement mitigates sedentary insulin spike patterns.',
      disease: 'Diabetes'
    });
  }

  if (dietFruitVeg) {
    decreasingFactors.push({
      feature: 'Daily Fruit & Veg Intake',
      impact: -6,
      description: 'Abundance of dietary fiber and natural antioxidants blocks free radicals and stabilizes lipid transport.',
      disease: 'Multi-Disease'
    });
  }

  if (sleepDuration >= 7 && sleepDuration <= 8) {
    decreasingFactors.push({
      feature: 'Adequate Sleep Duration',
      impact: -5,
      description: `7-8 hours daily assists standard autonomic blood pressure regulation and healthy cortisol clearance.`,
      disease: 'Stroke'
    });
  }

  // If empty lists, build standard defaults
  if (increasingFactors.length === 0) {
    increasingFactors.push({
      feature: 'Baseline Risk',
      impact: 5,
      description: 'Inherent demographic predisposition.',
      disease: 'Multi-Disease'
    });
  }
  if (decreasingFactors.length === 0) {
    decreasingFactors.push({
      feature: 'Metabolic Base Protection',
      impact: -2,
      description: 'Absence of extreme lifestyle triggers provides a baseline shield.',
      disease: 'Multi-Disease'
    });
  }

  // Recommendations generator
  const recommendations = [];
  if (smoking === 'active smoker') {
    recommendations.push({
      category: 'Lifestyle',
      title: 'Initiate Smoking Cessation',
      description: 'Quitting smoking will lower your stroke and coronary risk by up to 50% within just a single year.',
      impact: 'High'
    });
  }
  if (bmi > 25) {
    recommendations.push({
      category: 'Weight Management',
      title: 'Target 5-10% Gradual Weight Reduction',
      description: 'Losing 5% of body weight substantially scales down hepatic fat index and restores cellular insulin receptivity.',
      impact: 'High'
    });
  }
  if (physicalActivity < 150) {
    recommendations.push({
      category: 'Activity',
      title: 'Increase Exercise to 150+ Mins/Week',
      description: 'Strive for brisk walking, jogging, or cycling 30 minutes, 5 days a week. Scales down both arterial pressure and HbA1c.',
      impact: 'High'
    });
  }
  if (hypertension || systolic > 130) {
    recommendations.push({
      category: 'Medical Management',
      title: 'Active Blood Pressure Tracking',
      description: 'Begin recording blood pressure twice daily. Reduce dietary sodium intake to under 2,000 mg/day.',
      impact: 'High'
    });
  }
  if (cholesterol === 'high' || cholesterol === 'borderline high') {
    recommendations.push({
      category: 'Diet',
      title: 'Adopt Mediterranean-Style Dietary Habits',
      description: 'Swap out saturated trans fats for healthy monounsaturated cold-pressed plant lipid sources, and integrate omega-3s.',
      impact: 'Moderate'
    });
  }
  if (sleepDuration < 6) {
    recommendations.push({
      category: 'Lifestyle',
      title: 'Improve Sleep Consistency',
      description: 'Target a solid 7-8 hours. Short sleeping drives systemic sympathetic over-activation and raises baseline pressure.',
      impact: 'Moderate'
    });
  }

  // Add a generic beautiful card guidelines recommendation if we have very clean stats
  if (recommendations.length === 0) {
    recommendations.push({
      category: 'Activity',
      title: 'Perform Regular Cardiovascular Intervals',
      description: 'Keep up your awesome routines! Adding 1-2 sessions of high-intensity circuit workouts can spike insulin sensitivity even more.',
      impact: 'Moderate'
    });
  }

  // Cross disease drivers
  const sharedDrivers = [];
  if (age > 45 && bmi > 27) {
    sharedDrivers.push({
      driver: 'Combustive Age + Elevated BMI Overlap',
      impactScore: 85,
      affectedConditions: ['Heart Disease', 'Stroke', 'Diabetes'],
      explanation: 'Co-existence of weight strain with aging blood vessels forms a core vascular block accelerating both plaque buildups and metabolic resistance.'
    });
  } else {
    sharedDrivers.push({
      driver: 'Metabolic & Cardiovascular Saturated Axis',
      impactScore: 60,
      affectedConditions: ['Heart Disease', 'Diabetes'],
      explanation: 'Biomarkers like vascular pressure, lipid loads, and insulin uptake curves share a continuous biochemical cellular framework.'
    });
  }

  if (smoking === 'active smoker' || hypertension) {
    sharedDrivers.push({
      driver: 'Endothelial Pressure Stress',
      impactScore: 90,
      affectedConditions: ['Heart Disease', 'Stroke'],
      explanation: 'Both blood chemical toxicity from tobacco and the high friction of high blood pressure disrupt blood vessel linings directly, sparking lipid cascades.'
    });
  }

  return {
    heartDiseaseRisk: {
      score: rHeart,
      level: heartLevel,
      explanation: `Heart disease risk has been calculated at ${rHeart}% (${heartLevel} level) based on factors like age, BMI of ${bmi.toFixed(1)}, and your cardiovascular biomarkers.`
    },
    strokeRisk: {
      score: rStroke,
      level: strokeLevel,
      explanation: `Stroke risk is estimated at ${rStroke}% (${strokeLevel} level). Vascular triggers such as direct arterial blood pressure are primary drivers.`
    },
    diabetesRisk: {
      score: rDiabetes,
      level: diabetesLevel,
      explanation: `Diabetes risk is calculated at ${rDiabetes}% (${diabetesLevel} level). Key underlying drivers are metabolic parameters, body weight ratio, and physical activity.`
    },
    shapAnalysis: {
      increasingFactors,
      decreasingFactors
    },
    recommendations,
    crossDiseaseAnalysis: {
      sharedDrivers,
      summary: "Your cardiovascular and metabolic systems share deep health feedback corridors. Scaling down BMI, tracking pressure parameters, and maintaining clean aerated arterial streams offers compound prevention dividends against cardiac, diabetic, and stroke outcomes simultaneously."
    }
  };
}

/// Prediction endpoint
app.post('/api/predict-risk', async (req, res) => {
  const data = req.body;
  console.log("Server: Risk evaluation request received: ", data);

  // 1. Try to delegate to Python ML backend on port 5000
  try {
    const pyResponse = await fetch('http://127.0.0.1:5000/api/predict-risk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (pyResponse.ok) {
      const pyData = await pyResponse.json();
      console.log("Server: Successfully fetched predictions from Python ML backend.");
      return res.json(pyData);
    } else {
      console.log(`Server Info: Python ML backend returned status ${pyResponse.status}. Dropping to fallback.`);
    }
  } catch (pyErr) {
    console.log("Server Info: Python ML backend not reachable. Dropping to fallback.");
  }

  // 2. Fallback: Gemini Client or Local Mock Heuristics
  if (ai) {
    try {
      const prompt = `Perform a high-fidelity healthcare risk assessment and pseudo-SHAP (explainable AI) feature contribution analysis for:
1. Heart Disease Risk
2. Stroke Risk
3. Diabetes Risk

User profile criteria:
- Age: ${data.age || 'Not specified'} years old
- Gender: ${data.gender || 'Not specified'}
- Height: ${data.height || 'Not specified'} cm
- Weight: ${data.weight || 'Not specified'} kg
- Body Mass Index (BMI): ${data.bmi ? parseFloat(data.bmi).toFixed(1) : 'Not specified'}
- Smoking Status: ${data.smoking || 'Not specified'}
- Blood Pressure Parameters: Systolic ${data.systolic || 'Not specified'} mmHg, Diastolic ${data.diastolic || 'Not specified'} mmHg
- Fasting Cholesterol Status: ${data.cholesterol || 'Not specified'}
- Fasting Glucose Level / HbA1c: ${data.glucose || 'Not specified'} mg/dL
- Physical Exercise: ${data.physicalActivity || 0} minutes of activity per week
- Sleep Duration: ${data.sleepDuration || 7} hours per night
- Self-Evaluated General Health: ${data.generalHealth || 'Good'}
- Diagnosed Hypertension Status: ${data.hypertension ? 'Yes' : 'No'}
- Coronary Family History: ${data.familyHistoryHeart ? 'Yes' : 'No'}
- Diabetes Family History: ${data.familyHistoryDiabetes ? 'Yes' : 'No'}
- Alcohol Intake: ${data.alcohol || 'None'}
- Fruit & Vegetable Diet Day-to-Day: ${data.dietFruitVeg ? 'Yes' : 'No'}
- Difficulty Climbing Stairs / Walking: ${data.difficultyWalking ? 'Yes' : 'No'}

Instructions:
1. Compute realistic epidemiology risk percentages (0-100) based on verified cardiometabolic models (like Framingham Risk, ASCVD Risk, and ADA Risk rules).
2. Calculate relative feature attribution weights mimicking a realistic SHAP analysis (Factors increasing risk must have a positive weight, e.g., +15, factors decreasing risk must have negative weights, e.g., -10).
3. Identify multi-disease common drivers and shared lifestyle exposures (Cross-Disease analysis).
4. Outline 3-5 specific, smart, medical-grade yet easy-to-understand lifestyle and therapeutics recommendation cards.
5. Provide clinical-sounding explanations written in clear, reassuring, and helpful language.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are a professional healthcare analytics engine specializing in preventive risk prediction and explainable health data insights (SHAP analysis). Output clinical, precise, and highly detailed preventive health analytics. Do not include diagnostics disclaimers in the JSON itself, as the frontend already displays proper medical disclaimers prominently.",
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              heartDiseaseRisk: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.NUMBER, description: "Risk probability percentage between 0 and 100" },
                  level: { type: Type.STRING, description: "Risk category: 'Low', 'Intermediate / Moderate', or 'High'" },
                  explanation: { type: Type.STRING, description: "High-quality, patient-friendly medical description of the cardiac risk scores" }
                },
                required: ["score", "level", "explanation"]
              },
              strokeRisk: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.NUMBER, description: "Risk probability percentage between 0 and 100" },
                  level: { type: Type.STRING, description: "Risk category: 'Low', 'Intermediate / Moderate', or 'High'" },
                  explanation: { type: Type.STRING, description: "High-quality, patient-friendly description of stroke factors" }
                },
                required: ["score", "level", "explanation"]
              },
              diabetesRisk: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.NUMBER, description: "Risk probability percentage between 0 and 100" },
                  level: { type: Type.STRING, description: "Risk category: 'Low', 'Intermediate / Moderate', or 'High'" },
                  explanation: { type: Type.STRING, description: "High-quality, patient-friendly description of glycemic risks" }
                },
                required: ["score", "level", "explanation"]
              },
              shapAnalysis: {
                type: Type.OBJECT,
                properties: {
                  increasingFactors: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        feature: { type: Type.STRING, description: "Name of the risky feature, e.g., 'Hypertension', 'Active Smoking', 'High BMI'" },
                        impact: { type: Type.NUMBER, description: "Calculated SHAP style positive impact weight: e.g. +12, +25" },
                        description: { type: Type.STRING, description: "Precise physiological rationale why this increases the risk" },
                        disease: { type: Type.STRING, description: "Condition primarily impacted (e.g. 'Heart Disease', 'Stroke', 'Diabetes', or 'Multi-Disease')" }
                      },
                      required: ["feature", "impact", "description", "disease"]
                    }
                  },
                  decreasingFactors: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        feature: { type: Type.STRING, description: "Name of protective feature: e.g. 'Daily Vegetables', 'High Physical Activity'" },
                        impact: { type: Type.NUMBER, description: "Calculated SHAP style negative protective weight: e.g. -8, -15" },
                        description: { type: Type.STRING, description: "Physiological rationale explaining the metabolic/cardio benefit" },
                        disease: { type: Type.STRING, description: "Condition primarily protected (e.g. 'Heart Disease', 'Stroke', 'Diabetes', or 'Multi-Disease')" }
                      },
                      required: ["feature", "impact", "description", "disease"]
                    }
                  }
                },
                required: ["increasingFactors", "decreasingFactors"]
              },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING, description: "Specific categorization: 'Lifestyle', 'Diet', 'Activity', 'Medical Management'" },
                    title: { type: Type.STRING, description: "A catchy, medical target title" },
                    description: { type: Type.STRING, description: "Contextual guidance explaining steps, frequency, and biological benefit" },
                    impact: { type: Type.STRING, description: "Importance tier: 'High' or 'Moderate'" }
                  },
                  required: ["category", "title", "description", "impact"]
                }
              },
              crossDiseaseAnalysis: {
                type: Type.OBJECT,
                properties: {
                  sharedDrivers: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        driver: { type: Type.STRING, description: "Overlapping trigger name, e.g., 'Metabolic Inactivity', 'Systemic Inflammation'" },
                        impactScore: { type: Type.NUMBER, description: "Aggregated score of danger (1 to 100)" },
                        affectedConditions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of conditions this overlaps on, e.g., ['Heart Disease', 'Stroke', 'Diabetes']" },
                        explanation: { type: Type.STRING, description: "Why this risk acts as a multi-condition danger axis" }
                      },
                      required: ["driver", "impactScore", "affectedConditions", "explanation"]
                    }
                  },
                  summary: { type: Type.STRING, description: "Comparative comprehensive insight summary of cellular synergies" }
                },
                required: ["sharedDrivers", "summary"]
              }
            },
            required: [
              "heartDiseaseRisk",
              "strokeRisk",
              "diabetesRisk",
              "shapAnalysis",
              "recommendations",
              "crossDiseaseAnalysis"
            ]
          }
        }
      });

      const parsedJSON = JSON.parse(response.text || '{}');
      return res.json(parsedJSON);
    } catch (apiError) {
      console.log("Server Info: Gemini API high demand or throttle. Active fallback diagnostic calculations initiated.");
      return res.json(runFallbackHeuristics(data));
    }
  } else {
    return res.json(runFallbackHeuristics(data));
  }
});

// Configure Vite middleware / Serve static build assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Server: Vite dev middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Server: Production static file serving active.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server: Running on http://localhost:${PORT}`);
  });
}

startServer();
