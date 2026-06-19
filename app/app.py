import os
import sys

# Limit thread counts to prevent OpenBLAS memory allocation failures on Windows
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"

import re
import joblib
import pandas as pd
import numpy as np
import scipy.sparse
import shap
from flask import Flask, request, jsonify
from flask_cors import CORS

# Ensure workspace root is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from explainability.shap_helper import ShapExplainer
from recomendations.recomendation_engine import generate_recommendations

app = Flask(__name__)
CORS(app)

# --------------------------
# LOAD ML MODELS & ASSETS
# --------------------------
MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'notebooks', 'models')

def load_pickle(filename):
    path = os.path.join(MODELS_DIR, filename)
    if os.path.exists(path):
        try:
            return joblib.load(path)
        except Exception as e:
            print(f"Error loading {filename}: {e}")
    else:
        print(f"File not found: {path}")
    return None

print("Loading Heart Disease Model Assets...")
heart_model = load_pickle("heart_model.pkl")
heart_prep = load_pickle("heart_preprocessor.pkl")
heart_threshold = load_pickle("heart_threshold.pkl") or 0.2
heart_bg = load_pickle("heart_background.pkl")

print("Loading Stroke Model Assets...")
stroke_model = load_pickle("stroke_model.pkl")
stroke_prep = load_pickle("stroke_preprocessor.pkl")
stroke_threshold = load_pickle("stroke_threshold.pkl") or 0.1
stroke_bg = load_pickle("stroke_background.pkl")

print("Loading Diabetes Model Assets...")
diabetes_model = load_pickle("diabetes_model.pkl")
diabetes_prep = load_pickle("diabetes_preprocessor.pkl")
diabetes_threshold = load_pickle("diabetes_threshold.pkl") or 0.1
diabetes_bg = load_pickle("diabetes_background.pkl")

# --------------------------
# INITIALIZE SHAP EXPLAINERS
# --------------------------
print("Initializing SHAP Explainers...")
heart_explainer = None
stroke_explainer = None
diabetes_explainer = None

if heart_model is not None and heart_prep is not None and heart_bg is not None:
    try:
        # Preprocess the background dataset
        heart_bg_trans = heart_prep.transform(heart_bg)
        if scipy.sparse.issparse(heart_bg_trans):
            heart_bg_trans = heart_bg_trans.toarray()
        heart_explainer = ShapExplainer(heart_model, heart_bg_trans)
        print("Heart SHAP explainer ready.")
    except Exception as e:
        print(f"Failed to initialize Heart SHAP explainer: {e}")

if stroke_model is not None and stroke_prep is not None and stroke_bg is not None:
    try:
        stroke_bg_trans = stroke_prep.transform(stroke_bg)
        if scipy.sparse.issparse(stroke_bg_trans):
            stroke_bg_trans = stroke_bg_trans.toarray()
        stroke_explainer = ShapExplainer(stroke_model, stroke_bg_trans)
        print("Stroke SHAP explainer ready.")
    except Exception as e:
        print(f"Failed to initialize Stroke SHAP explainer: {e}")

if diabetes_model is not None and diabetes_prep is not None and diabetes_bg is not None:
    try:
        diabetes_bg_trans = diabetes_prep.transform(diabetes_bg)
        if scipy.sparse.issparse(diabetes_bg_trans):
            diabetes_bg_trans = diabetes_bg_trans.toarray()
        diabetes_explainer = ShapExplainer(diabetes_model, diabetes_bg_trans)
        print("Diabetes SHAP explainer ready.")
    except Exception as e:
        print(f"Failed to initialize Diabetes SHAP explainer: {e}")

# --------------------------
# MAPPINGS AND CLEANERS
# --------------------------
def clean_feature_name(name):
    # Strip prefixes like onehotencoder__, standardscaler__, pipeline__
    cleaned = re.sub(r'^(onehotencoder|standardscaler|pipeline|num|cat)__', '', name)
    # Remove suffixes like _1.0 or _Yes
    cleaned = re.sub(r'_(1\.0|Yes|yes)$', '', cleaned)
    
    name_map = {
        'Sex_Male': 'Male Gender',
        'Sex_Female': 'Female Gender',
        'Sex': 'Gender',
        'gender_Male': 'Male Gender',
        'gender_Female': 'Female Gender',
        'gender_Other': 'Other Gender',
        'gender': 'Gender',
        'AgeCategory': 'Age Category',
        'age': 'Age',
        'Age': 'Age Category Bracket',
        'BMI': 'Body Mass Index (BMI)',
        'bmi': 'Body Mass Index (BMI)',
        'Smoking': 'Smoking Status',
        'Smoker': 'Smoking Status',
        'smoking_status_smokes': 'Smoking Status (Active)',
        'smoking_status_formerly smoked': 'Smoking Status (Former)',
        'smoking_status_never smoked': 'Smoking Status (Never)',
        'smoking_status': 'Smoking Status',
        'PhysicalActivity': 'Physical Activity',
        'PhysActivity': 'Physical Activity',
        'AlcoholDrinking': 'Alcohol Consumption',
        'HvyAlcoholConsump': 'Heavy Alcohol Consumption',
        'KidneyDisease': 'Kidney Disease History',
        'SleepTime': 'Sleep Duration',
        'DiffWalking': 'Difficulty Walking',
        'DiffWalk': 'Difficulty Walking',
        'Asthma': 'Asthma History',
        'HighBP': 'High Blood Pressure',
        'HighChol': 'High Cholesterol',
        'CholCheck': 'Cholesterol Checked Recently',
        'HeartDiseaseorAttack': 'Prior Heart Attack/Disease',
        'previousHeartAttack': 'Prior Heart Attack/Disease',
        'Fruits': 'Daily Fruit Intake',
        'Veggies': 'Daily Vegetable Intake',
        'GenHealth': 'General Health Evaluation',
        'GenHlth': 'General Health (CDC Scale)',
        'generalHealth': 'General Health Evaluation',
        'MentalHealth': 'Mental Health (Poor Days/Month)',
        'MentHlth': 'Mental Health (Poor Days/Month)',
        'PhysHlth': 'Physical Health (Poor Days/Month)',
        'Education': 'Education Level',
        'avg_glucose_level': 'Average Glucose Level',
        'glucose': 'Fasting Glucose',
        'hypertension': 'Hypertension History',
        'ever_married': 'Ever Married',
        'work_type': 'Employment Type',
        'Residence_type': 'Residence Area'
    }
    
    if cleaned in name_map:
        return name_map[cleaned]
        
    for key, display in name_map.items():
        if key in cleaned:
            val = cleaned.replace(key, '').strip('_')
            if val:
                return f"{display} ({val})"
            return display
            
    return cleaned.replace('_', ' ').title()

def get_clinical_description(clean_name, impact, user_val):
    desc_templates = {
        'High Blood Pressure': {
            'pos': "High blood pressure adds direct mechanical stress to artery walls, predisposing them to rupture or plaque formation.",
            'neg': "Controlled blood pressure minimizes capillary strain and prevents microvascular target organ damage."
        },
        'Body Mass Index (BMI)': {
            'pos': f"An elevated BMI of {user_val} demands higher cardiac output and increases baseline vascular resistance and metabolic load.",
            'neg': f"Optimal body mass index ({user_val}) reduces adipose-driven inflammation and improves general metabolic health."
        },
        'Smoking Status': {
            'pos': "Tobacco smoke triggers arterial endothelial inflammation and contributes directly to atherogenesis.",
            'neg': "Absence of active tobacco smoke prevents vascular spasms and avoids toxin-related cardiovascular degradation."
        },
        'Physical Activity': {
            'pos': "Sedentary behavior reduces nitric oxide synthesis in arterial linings and degrades cardiorespiratory conditioning.",
            'neg': "Regular exercise optimizes insulin sensitivity, enhances cardiovascular reserve, and preserves arterial compliance."
        },
        'Sleep Duration': {
            'pos': f"Sub-optimal sleep ({user_val} hours) elevates cortisol levels and maintains elevated nocturnal sympathetic tone.",
            'neg': f"Adequate rest duration ({user_val} hours) supports physiological pressure dipping and cellular restoration."
        },
        'Fasting Glucose': {
            'pos': f"High blood sugar ({user_val} mg/dL) promotes vascular advanced glycation end-products, accelerating microvascular damage.",
            'neg': f"Stable glycemic levels ({user_val} mg/dL) avoid systemic glucose toxicity and preserve microvascular health."
        },
        'Average Glucose Level': {
            'pos': f"Elevated glucose levels ({user_val} mg/dL) cause endothelial cell death, promoting microvascular capillary complications.",
            'neg': f"Normal average blood glucose ({user_val} mg/dL) prevents glycemic vascular damage."
        },
        'High Cholesterol': {
            'pos': "High LDL cholesterol leads to lipid deposition in arterial walls, accelerating atheromatous plaque build-up.",
            'neg': "Low or borderline cholesterol values reduce plaque formation hazards in critical arteries."
        },
        'Prior Heart Attack/Disease': {
            'pos': "Previous cardiac injury damages cardiac muscle and structures, severely lowering threshold for subsequent failures.",
            'neg': "No prior cardiac injury indicates a fully intact myocardium and coronary vascular bed."
        },
        'Difficulty Walking': {
            'pos': "Difficulty walking or climbing stairs reflects functional motor limits, strongly correlating with cardiovascular fatigue.",
            'neg': "Preserved functional mobility supports standard metabolic clearance and cardiovascular health."
        },
        'General Health Evaluation': {
            'pos': f"Fair or poor self-evaluated health ({user_val}) is a strong independent predictor of overall cardiometabolic events.",
            'neg': f"Excellent or good self-health rating ({user_val}) reflects robust metabolic status and stable biometrics."
        },
        'Age': {
            'pos': f"Natural aging (Age: {user_val}) decreases arterial compliance, stiffening large blood vessels over time.",
            'neg': "Younger demographic profile protects against long-term degenerative vascular processes."
        },
        'Age Category': {
            'pos': f"Advancing age category ({user_val}) increases lifetime exposure to vascular pressure and metabolic oxidation.",
            'neg': "Lower age category bracket provides a baseline protective shield against structural vessel damage."
        }
    }
    
    for key, template in desc_templates.items():
        if key in clean_name:
            return template['pos'] if impact > 0 else template['neg']
            
    # Default description
    if impact > 0:
        return f"{clean_name} (Value: {user_val}) increases predicted risk by adding a positive coefficient to the logistic model."
    else:
        return f"{clean_name} (Value: {user_val}) acts protectively, reducing predicted risk values relative to the base population."

def map_age_category_heart(age):
    if age < 25: return '18-24'
    elif age < 30: return '25-29'
    elif age < 35: return '30-34'
    elif age < 40: return '35-39'
    elif age < 45: return '40-44'
    elif age < 50: return '45-49'
    elif age < 55: return '50-54'
    elif age < 60: return '55-59'
    elif age < 65: return '60-64'
    elif age < 70: return '65-69'
    elif age < 75: return '70-74'
    elif age < 80: return '75-79'
    else: return '80 or older'

def map_age_category_diabetes(age):
    if age < 25: return 1.0
    elif age < 30: return 2.0
    elif age < 35: return 3.0
    elif age < 40: return 4.0
    elif age < 45: return 5.0
    elif age < 50: return 6.0
    elif age < 55: return 7.0
    elif age < 60: return 8.0
    elif age < 65: return 9.0
    elif age < 70: return 10.0
    elif age < 75: return 11.0
    elif age < 80: return 12.0
    else: return 13.0

# --------------------------
# API ENDPOINT
# --------------------------
@app.route('/api/predict-risk', methods=['POST'])
def predict_risk():
    data = request.json
    print("Python Backend: Prediction request received:", data)
    
    # 1. Parse unified inputs
    age = float(data.get('age', 45))
    gender = str(data.get('gender', 'Male'))
    height = float(data.get('height', 170))
    weight = float(data.get('weight', 70))
    bmi = float(data.get('bmi', 24.2))
    if bmi == 0 or bmi is None:
        bmi = weight / ((height / 100) ** 2)
        
    smoking = str(data.get('smoking', 'Never Smoked'))
    systolic = float(data.get('systolic', 120))
    diastolic = float(data.get('diastolic', 80))
    cholesterol = str(data.get('cholesterol', 'Normal'))
    glucose = float(data.get('glucose', 90))
    physical_activity = float(data.get('physicalActivity', 120))
    sleep_duration = float(data.get('sleepDuration', 7))
    general_health = str(data.get('generalHealth', 'Good'))
    hypertension = bool(data.get('hypertension', False))
    family_history_heart = bool(data.get('familyHistoryHeart', False))
    family_history_diabetes = bool(data.get('familyHistoryDiabetes', False))
    alcohol = str(data.get('alcohol', 'None'))
    diet_fruit_veg = bool(data.get('dietFruitVeg', True))
    difficulty_walking = bool(data.get('difficultyWalking', False))
    
    # New unified variables
    ever_married = bool(data.get('everMarried', True))
    work_type = str(data.get('workType', 'Private'))
    residence_type = str(data.get('residenceType', 'Urban'))
    cholesterol_check = bool(data.get('cholesterolCheck', True))
    previous_heart_attack = bool(data.get('previousHeartAttack', False))
    mental_health = float(data.get('mentalHealth', 0))
    kidney_disease = bool(data.get('kidneyDisease', False))
    education = float(data.get('education', 4))
    asthma = bool(data.get('asthma', False))

    # --------------------------
    # MODEL 1: HEART DISEASE
    # --------------------------
    # Mapping
    # Categorical: ['AgeCategory', 'GenHealth', 'Sex', 'Smoking', 'PhysicalActivity', 'AlcoholDrinking', 'KidneyDisease', 'DiffWalking', 'Asthma']
    # Numerical: ['BMI', 'MentalHealth', 'SleepTime']
    gen_health_heart = general_health
    if gen_health_heart == 'Very Good':
        gen_health_heart = 'Very good'
        
    heart_df = pd.DataFrame([{
        'AgeCategory': map_age_category_heart(age),
        'GenHealth': gen_health_heart,
        'Sex': gender if gender in ['Male', 'Female'] else 'Male',
        'Smoking': 'Yes' if smoking in ['Active Smoker', 'Former Smoker'] else 'No',
        'PhysicalActivity': 'Yes' if physical_activity > 0 else 'No',
        'AlcoholDrinking': 'Yes' if alcohol in ['Moderate', 'Heavy'] else 'No',
        'KidneyDisease': 'Yes' if kidney_disease else 'No',
        'DiffWalking': 'Yes' if difficulty_walking else 'No',
        'Asthma': 'Yes' if asthma else 'No',
        'BMI': bmi,
        'MentalHealth': mental_health,
        'SleepTime': sleep_duration
    }])
    
    heart_score = 0.0
    heart_level = 'Low'
    heart_shap_pos, heart_shap_neg = [], []
    
    if heart_model is not None and heart_prep is not None:
        try:
            X_heart_trans = heart_prep.transform(heart_df)
            if scipy.sparse.issparse(X_heart_trans):
                X_heart_trans = X_heart_trans.toarray()
            
            # Predict
            prob = heart_model.predict_proba(X_heart_trans)[0][1]
            heart_score = float(prob * 100)
            
            # Determine Level using threshold pkl
            heart_thresh_val = float(heart_threshold)
            if prob > (heart_thresh_val * 2):
                heart_level = 'High'
            elif prob > heart_thresh_val:
                heart_level = 'Intermediate / Moderate'
            else:
                heart_level = 'Low'
                
            # SHAP
            if heart_explainer is not None:
                feature_names = heart_prep.get_feature_names_out()
                pos_df, neg_df = heart_explainer.get_risk_drivers(X_heart_trans, feature_names, top_n=6)
                
                # Retrieve raw values to include in rationales
                raw_values = {
                    'AgeCategory': map_age_category_heart(age),
                    'GenHealth': general_health,
                    'Sex': gender,
                    'Smoking': smoking,
                    'PhysicalActivity': f"{physical_activity} min/week",
                    'AlcoholDrinking': alcohol,
                    'KidneyDisease': 'Yes' if kidney_disease else 'No',
                    'DiffWalking': 'Yes' if difficulty_walking else 'No',
                    'Asthma': 'Yes' if asthma else 'No',
                    'BMI': f"{bmi:.1f}",
                    'MentalHealth': f"{mental_health} days",
                    'SleepTime': f"{sleep_duration} hours"
                }
                
                # Convert SHAP results into output structure
                # Multiply weights by 10 to make them scale nicely as integer impacts (e.g. +12, -8)
                for _, row in pos_df.iterrows():
                    feat_raw = row['feature']
                    clean_name = clean_feature_name(feat_raw)
                    raw_key = re.sub(r'^(onehotencoder|standardscaler|pipeline|num|cat)__', '', feat_raw)
                    raw_key = re.sub(r'_(Yes|No|Male|Female|Other|Normal|High|Borderline High|Urban|Rural|formerly smoked|never smoked|smokes|children|Never_worked|Private|Self-employed|Govt_job)$', '', raw_key)
                    raw_key = re.sub(r'_(1\.0|2\.0|3\.0|4\.0|5\.0|0\.0)$', '', raw_key)
                    
                    user_val = raw_values.get(raw_key, 'Yes')
                    impact = int(round(row['impact'] * 15))
                    if impact == 0:
                        impact = 1
                    
                    heart_shap_pos.append({
                        'feature': clean_name,
                        'impact': impact,
                        'description': get_clinical_description(clean_name, row['impact'], user_val),
                        'disease': 'Heart Disease'
                    })
                    
                for _, row in neg_df.iterrows():
                    feat_raw = row['feature']
                    clean_name = clean_feature_name(feat_raw)
                    raw_key = re.sub(r'^(onehotencoder|standardscaler|pipeline|num|cat)__', '', feat_raw)
                    raw_key = re.sub(r'_(Yes|No|Male|Female|Other|Normal|High|Borderline High|Urban|Rural|formerly smoked|never smoked|smokes|children|Never_worked|Private|Self-employed|Govt_job)$', '', raw_key)
                    raw_key = re.sub(r'_(1\.0|2\.0|3\.0|4\.0|5\.0|0\.0)$', '', raw_key)
                    
                    user_val = raw_values.get(raw_key, 'No')
                    impact = int(round(row['impact'] * 15))
                    if impact == 0:
                        impact = -1
                        
                    heart_shap_neg.append({
                        'feature': clean_name,
                        'impact': impact,
                        'description': get_clinical_description(clean_name, row['impact'], user_val),
                        'disease': 'Heart Disease'
                    })
        except Exception as e:
            print(f"Error evaluating Heart Disease Model: {e}")

    # --------------------------
    # MODEL 2: STROKE RISK
    # --------------------------
    # Mapping
    # Categorical: ['gender', 'ever_married', 'work_type', 'Residence_type', 'smoking_status']
    # Numerical: ['age', 'avg_glucose_level', 'bmi', 'hypertension']
    stroke_smoking = 'never smoked'
    if smoking == 'Active Smoker':
        stroke_smoking = 'smokes'
    elif smoking == 'Former Smoker':
        stroke_smoking = 'formerly smoked'
        
    stroke_df = pd.DataFrame([{
        'gender': gender,
        'ever_married': 'Yes' if ever_married else 'No',
        'work_type': work_type,
        'Residence_type': residence_type,
        'smoking_status': stroke_smoking,
        'age': age,
        'avg_glucose_level': glucose,
        'bmi': bmi,
        'hypertension': 1.0 if hypertension else 0.0
    }])
    
    stroke_score = 0.0
    stroke_level = 'Low'
    stroke_shap_pos, stroke_shap_neg = [], []
    
    if stroke_model is not None and stroke_prep is not None:
        try:
            X_stroke_trans = stroke_prep.transform(stroke_df)
            if scipy.sparse.issparse(X_stroke_trans):
                X_stroke_trans = X_stroke_trans.toarray()
                
            prob = stroke_model.predict_proba(X_stroke_trans)[0][1]
            stroke_score = float(prob * 100)
            
            stroke_thresh_val = float(stroke_threshold)
            if prob > (stroke_thresh_val * 2.5):
                stroke_level = 'High'
            elif prob > stroke_thresh_val:
                stroke_level = 'Intermediate / Moderate'
            else:
                stroke_level = 'Low'
                
            if stroke_explainer is not None:
                feature_names = stroke_prep.get_feature_names_out()
                pos_df, neg_df = stroke_explainer.get_risk_drivers(X_stroke_trans, feature_names, top_n=6)
                
                raw_values = {
                    'gender': gender,
                    'ever_married': 'Yes' if ever_married else 'No',
                    'work_type': work_type.replace('_', ' ').title(),
                    'Residence_type': residence_type,
                    'smoking_status': smoking,
                    'age': f"{age:.0f}",
                    'avg_glucose_level': f"{glucose:.1f} mg/dL",
                    'bmi': f"{bmi:.1f}",
                    'hypertension': 'Yes' if hypertension else 'No'
                }
                
                for _, row in pos_df.iterrows():
                    feat_raw = row['feature']
                    clean_name = clean_feature_name(feat_raw)
                    raw_key = re.sub(r'^(onehotencoder|standardscaler|pipeline|num|cat)__', '', feat_raw)
                    raw_key = re.sub(r'_(Yes|No|Male|Female|Other|Normal|High|Borderline High|Urban|Rural|formerly smoked|never smoked|smokes|children|Never_worked|Private|Self-employed|Govt_job)$', '', raw_key)
                    raw_key = re.sub(r'_(1\.0|2\.0|3\.0|4\.0|5\.0|0\.0)$', '', raw_key)
                    
                    user_val = raw_values.get(raw_key, 'Yes')
                    impact = int(round(row['impact'] * 15))
                    if impact == 0:
                        impact = 1
                        
                    stroke_shap_pos.append({
                        'feature': clean_name,
                        'impact': impact,
                        'description': get_clinical_description(clean_name, row['impact'], user_val),
                        'disease': 'Stroke'
                    })
                    
                for _, row in neg_df.iterrows():
                    feat_raw = row['feature']
                    clean_name = clean_feature_name(feat_raw)
                    raw_key = re.sub(r'^(onehotencoder|standardscaler|pipeline|num|cat)__', '', feat_raw)
                    raw_key = re.sub(r'_(Yes|No|Male|Female|Other|Normal|High|Borderline High|Urban|Rural|formerly smoked|never smoked|smokes|children|Never_worked|Private|Self-employed|Govt_job)$', '', raw_key)
                    raw_key = re.sub(r'_(1\.0|2\.0|3\.0|4\.0|5\.0|0\.0)$', '', raw_key)
                    
                    user_val = raw_values.get(raw_key, 'No')
                    impact = int(round(row['impact'] * 15))
                    if impact == 0:
                        impact = -1
                        
                    stroke_shap_neg.append({
                        'feature': clean_name,
                        'impact': impact,
                        'description': get_clinical_description(clean_name, row['impact'], user_val),
                        'disease': 'Stroke'
                    })
        except Exception as e:
            print(f"Error evaluating Stroke Model: {e}")

    # --------------------------
    # MODEL 3: DIABETES RISK
    # --------------------------
    # Mapping
    # Categorical: ['HighBP', 'HighChol', 'CholCheck', 'Smoker', 'Stroke', 'HeartDiseaseorAttack', 'PhysActivity', 'Fruits', 'Veggies', 'HvyAlcoholConsump', 'GenHlth', 'DiffWalk', 'Sex']
    # Numerical: ['BMI', 'MentHlth', 'PhysHlth', 'Age', 'Education']
    gen_health_map = {
        'Excellent': 1.0,
        'Very Good': 2.0,
        'Good': 3.0,
        'Fair': 4.0,
        'Poor': 5.0
    }
    
    diabetes_df = pd.DataFrame([{
        'HighBP': 1.0 if hypertension else 0.0,
        'HighChol': 1.0 if cholesterol in ['High', 'Borderline High'] else 0.0,
        'CholCheck': 1.0 if cholesterol_check else 0.0,
        'Smoker': 1.0 if smoking in ['Active Smoker', 'Former Smoker'] else 0.0,
        'Stroke': 0.0, # baseline
        'HeartDiseaseorAttack': 1.0 if previous_heart_attack else 0.0,
        'PhysActivity': 1.0 if physical_activity > 0 else 0.0,
        'Fruits': 1.0 if diet_fruit_veg else 0.0,
        'Veggies': 1.0 if diet_fruit_veg else 0.0,
        'HvyAlcoholConsump': 1.0 if alcohol == 'Heavy' else 0.0,
        'GenHlth': float(gen_health_map.get(general_health, 3.0)),
        'DiffWalk': 1.0 if difficulty_walking else 0.0,
        'Sex': 1.0 if gender == 'Male' else 0.0,
        'BMI': bmi,
        'MentHlth': mental_health,
        'PhysHlth': 2.0 if difficulty_walking else 0.0, # physical health days estimated
        'Age': map_age_category_diabetes(age),
        'Education': education
    }])
    
    diabetes_score = 0.0
    diabetes_level = 'Low'
    diabetes_shap_pos, diabetes_shap_neg = [], []
    
    if diabetes_model is not None and diabetes_prep is not None:
        try:
            X_diabetes_trans = diabetes_prep.transform(diabetes_df)
            if scipy.sparse.issparse(X_diabetes_trans):
                X_diabetes_trans = X_diabetes_trans.toarray()
                
            prob = diabetes_model.predict_proba(X_diabetes_trans)[0][1]
            diabetes_score = float(prob * 100)
            
            diabetes_thresh_val = float(diabetes_threshold)
            if prob > (diabetes_thresh_val * 2.5):
                diabetes_level = 'High'
            elif prob > diabetes_thresh_val:
                diabetes_level = 'Intermediate / Moderate'
            else:
                diabetes_level = 'Low'
                
            if diabetes_explainer is not None:
                feature_names = diabetes_prep.get_feature_names_out()
                pos_df, neg_df = diabetes_explainer.get_risk_drivers(X_diabetes_trans, feature_names, top_n=6)
                
                raw_values = {
                    'HighBP': 'Yes' if hypertension else 'No',
                    'HighChol': 'Yes' if cholesterol in ['High', 'Borderline High'] else 'No',
                    'CholCheck': 'Yes' if cholesterol_check else 'No',
                    'Smoker': smoking,
                    'Stroke': 'No',
                    'HeartDiseaseorAttack': 'Yes' if previous_heart_attack else 'No',
                    'PhysActivity': f"{physical_activity} min/week",
                    'Fruits': 'Yes' if diet_fruit_veg else 'No',
                    'Veggies': 'Yes' if diet_fruit_veg else 'No',
                    'HvyAlcoholConsump': 'Yes' if alcohol == 'Heavy' else 'No',
                    'GenHlth': general_health,
                    'DiffWalk': 'Yes' if difficulty_walking else 'No',
                    'Sex': gender,
                    'BMI': f"{bmi:.1f}",
                    'MentHlth': f"{mental_health} days",
                    'PhysHlth': 'Yes' if difficulty_walking else 'No',
                    'Age': f"Bracket {map_age_category_diabetes(age):.0f}",
                    'Education': f"Level {education:.0f}"
                }
                
                for _, row in pos_df.iterrows():
                    feat_raw = row['feature']
                    clean_name = clean_feature_name(feat_raw)
                    raw_key = re.sub(r'^(onehotencoder|standardscaler|pipeline|num|cat)__', '', feat_raw)
                    raw_key = re.sub(r'_(Yes|No|Male|Female|Other|Normal|High|Borderline High|Urban|Rural|formerly smoked|never smoked|smokes|children|Never_worked|Private|Self-employed|Govt_job)$', '', raw_key)
                    raw_key = re.sub(r'_(1\.0|2\.0|3\.0|4\.0|5\.0|0\.0)$', '', raw_key)
                    
                    user_val = raw_values.get(raw_key, 'Yes')
                    impact = int(round(row['impact'] * 15))
                    if impact == 0:
                        impact = 1
                        
                    diabetes_shap_pos.append({
                        'feature': clean_name,
                        'impact': impact,
                        'description': get_clinical_description(clean_name, row['impact'], user_val),
                        'disease': 'Diabetes'
                    })
                    
                for _, row in neg_df.iterrows():
                    feat_raw = row['feature']
                    clean_name = clean_feature_name(feat_raw)
                    raw_key = re.sub(r'^(onehotencoder|standardscaler|pipeline|num|cat)__', '', feat_raw)
                    raw_key = re.sub(r'_(Yes|No|Male|Female|Other|Normal|High|Borderline High|Urban|Rural|formerly smoked|never smoked|smokes|children|Never_worked|Private|Self-employed|Govt_job)$', '', raw_key)
                    raw_key = re.sub(r'_(1\.0|2\.0|3\.0|4\.0|5\.0|0\.0)$', '', raw_key)
                    
                    user_val = raw_values.get(raw_key, 'No')
                    impact = int(round(row['impact'] * 15))
                    if impact == 0:
                        impact = -1
                        
                    diabetes_shap_neg.append({
                        'feature': clean_name,
                        'impact': impact,
                        'description': get_clinical_description(clean_name, row['impact'], user_val),
                        'disease': 'Diabetes'
                    })
        except Exception as e:
            print(f"Error evaluating Diabetes Model: {e}")

    # --------------------------
    # MERGE SHAP RESULTS
    # --------------------------
    # Combine SHAP factors across models to display the top ones
    increasing_factors = heart_shap_pos + stroke_shap_pos + diabetes_shap_pos
    decreasing_factors = heart_shap_neg + stroke_shap_neg + diabetes_shap_neg
    
    # Sort by absolute impact and remove duplicates based on feature name and disease name
    def deduplicate_factors(factors, descending=True):
        seen = set()
        deduped = []
        # Sort by absolute impact
        sorted_factors = sorted(factors, key=lambda x: abs(x['impact']), reverse=descending)
        for f in sorted_factors:
            key = (f['feature'], f['disease'])
            if key not in seen:
                seen.add(key)
                deduped.append(f)
        return deduped

    increasing_factors = deduplicate_factors(increasing_factors, descending=True)[:8]
    decreasing_factors = deduplicate_factors(decreasing_factors, descending=True)[:8]

    # --------------------------
    # RECOMMENDATIONS
    # --------------------------
    # Generate structured recommendations using recomendation_engine
    raw_recs = generate_recommendations(
        user_data={
            'BMI': bmi,
            'Smoking': 'Yes' if smoking == 'Active Smoker' else 'No',
            'PhysicalActivity': 'Yes' if physical_activity > 0 else 'No',
            'SleepTime': sleep_duration,
            'AlcoholDrinking': 'Yes' if alcohol in ['Moderate', 'Heavy'] else 'No',
            'GenHealth': general_health
        },
        heart_risk=heart_score / 100.0,
        stroke_risk=stroke_score / 100.0,
        diabetes_risk=diabetes_score / 100.0
    )
    
    # Format recommendations matching interface: { category, title, description, impact }
    formatted_recs = []
    for rec in raw_recs:
        category = "Lifestyle"
        impact = "Moderate"
        
        # Smart categorization mapping
        title_lower = rec['title'].lower()
        if "cardio" in title_lower or "heart" in title_lower or "blood pressure" in title_lower:
            category = "Medical Management"
            impact = "High" if heart_score > 25 else "Moderate"
        elif "smoking" in title_lower:
            category = "Lifestyle"
            impact = "High"
        elif "weight" in title_lower or "bmi" in title_lower:
            category = "Diet"
            impact = "High" if bmi >= 30 else "Moderate"
        elif "sleep" in title_lower:
            category = "Lifestyle"
            impact = "Moderate"
        elif "activity" in title_lower or "exercise" in title_lower:
            category = "Activity"
            impact = "High"
        
        formatted_recs.append({
            'category': category,
            'title': rec['title'],
            'description': rec['message'],
            'impact': impact
        })

    # --------------------------
    # CROSS-DISEASE ANALYSIS
    # --------------------------
    # Core requirement: Highlight the 8 shared features:
    # Age, Gender, BMI, Smoking Status, Physical Activity, Mental Health, General Health, Difficulty Walking
    shared_drivers = []
    
    # 1. Somatic Overload (BMI)
    if bmi >= 25:
        shared_drivers.append({
            'driver': "Elevated Body Mass Index (BMI)",
            'impactScore': int(min(95, 45 + (bmi - 25) * 4.5)),
            'affectedConditions': ["Heart Disease", "Stroke", "Diabetes"],
            'explanation': f"A body mass index of {bmi:.1f} places continuous workload pressure on cardiac output while accelerating pancreatic beta-cell strain and vascular capillary damage."
        })
        
    # 2. Smoking Exposure
    if smoking in ['Active Smoker', 'Former Smoker']:
        shared_drivers.append({
            'driver': f"Tobacco Exposure ({smoking})",
            'impactScore': 90 if smoking == 'Active Smoker' else 60,
            'affectedConditions': ["Heart Disease", "Stroke", "Diabetes"],
            'explanation': "Tobacco compounds cause immediate capillary vasoconstriction, accelerate vascular plaque aggregation, and exacerbate glucose oxidation pathways."
        })
        
    # 3. Age Demographic Factor
    if age > 45:
        shared_drivers.append({
            'driver': f"Advancing Age ({age:.0f} Years)",
            'impactScore': int(min(98, 40 + (age - 45) * 1.5)),
            'affectedConditions': ["Heart Disease", "Stroke", "Diabetes"],
            'explanation': "Aging decreases natural vascular compliance and elasticity (leading to vascular stiffening) while standard metabolic clearance functions gradually decline."
        })
        
    # 4. Sedentary Lifestyle
    if physical_activity < 150:
        shared_drivers.append({
            'driver': "Sedentary Activity Profile",
            'impactScore': int(min(85, 50 + (150 - physical_activity) * 0.25)),
            'affectedConditions': ["Heart Disease", "Diabetes"],
            'explanation': f"Failing to meet the 150 min/week active exercise threshold impairs endothelial nitric oxide synthesis and limits muscle glucose disposal."
        })
        
    # 5. General Health Evaluation
    if general_health in ['Fair', 'Poor']:
        shared_drivers.append({
            'driver': "Suboptimal General Wellness Status",
            'impactScore': 80 if general_health == 'Poor' else 55,
            'affectedConditions': ["Heart Disease", "Diabetes", "Stroke"],
            'explanation': f"Self-reported health of '{general_health}' strongly aligns with systemic biomarkers indicating active physiological stress and sub-clinical cardiovascular load."
        })

    # 6. Difficulty Walking
    if difficulty_walking:
        shared_drivers.append({
            'driver': "Functional Mobility Impairment",
            'impactScore': 75,
            'affectedConditions': ["Heart Disease", "Diabetes", "Stroke"],
            'explanation': "Physical walking limitations reduce the ability to sustain metabolic demand-response cycles, leading to arterial congestion and increased cardiac hazards."
        })

    # 7. Gender-specific Predispositions
    if gender == 'Male':
        shared_drivers.append({
            'driver': "Male Gender Risk Corridor",
            'impactScore': 50,
            'affectedConditions': ["Heart Disease", "Stroke"],
            'explanation': "Male gender is historically correlated with earlier onset of arterial plaque accumulation and lower baseline cardioprotective estrogen buffers."
        })

    # 8. Mental Health Strain
    if mental_health > 5:
        shared_drivers.append({
            'driver': f"High Mental Distress ({mental_health:.0f} Days/Month)",
            'impactScore': int(min(80, 30 + mental_health * 1.5)),
            'affectedConditions': ["Heart Disease", "Diabetes"],
            'explanation': "Chronic poor mental health triggers sustained cortisol release and elevated heart rate patterns, accelerating endocrine strain."
        })

    # Default baseline if empty
    if len(shared_drivers) == 0:
        shared_drivers.append({
            'driver': "Baseline Lifestyle Protective Buffers",
            'impactScore': 40,
            'affectedConditions': ["Heart Disease", "Stroke", "Diabetes"],
            'explanation': "Your shared risk factors (Age, BMI, Smoking, Exercise) fall within protective ranges, creating a synergized defense axis."
        })

    cross_disease = {
        'sharedDrivers': shared_drivers,
        'summary': "Your health profile shows overlapping risk pathways. By modifying core behaviors such as weight ratios, exercise routines, and tobacco exposures, you achieve compound prevention benefits across cardiac, cerebral, and endocrine systems simultaneously."
    }

    # Assemble response
    response_data = {
        'heartDiseaseRisk': {
            'score': round(heart_score),
            'level': heart_level,
            'explanation': f"Heart risk estimated at {heart_score:.1f}% ({heart_level} level) based on Balanced Logistic Regression. Primary attributions include demographic parameters and cardiovascular biometrics."
        },
        'strokeRisk': {
            'score': round(stroke_score),
            'level': stroke_level,
            'explanation': f"Stroke risk computed at {stroke_score:.1f}% ({stroke_level} level). Triggers like age, glucose levels, and blood pressure are heavily weighted by the model."
        },
        'diabetesRisk': {
            'score': round(diabetes_score),
            'level': diabetes_level,
            'explanation': f"Diabetes risk calculated at {diabetes_score:.1f}% ({diabetes_level} level). Key underlying drivers are body weight ratios, physical activity levels, and glycemic indicators."
        },
        'shapAnalysis': {
            'increasingFactors': increasing_factors,
            'decreasingFactors': decreasing_factors
        },
        'recommendations': formatted_recs,
        'crossDiseaseAnalysis': cross_disease
    }
    
    return jsonify(response_data)

if __name__ == '__main__':
    print("Starting  Python Model Inference Backend...")
    app.run(host='0.0.0.0', port=5000, debug=True)
