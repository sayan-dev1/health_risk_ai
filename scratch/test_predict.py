import joblib
import pandas as pd
import numpy as np

# Load Heart Model and Preprocessor
heart_model = joblib.load('notebooks/models/heart_model.pkl')
heart_prep = joblib.load('notebooks/models/heart_preprocessor.pkl')

print("Loaded heart model and preprocessor successfully.")

# Create a test sample for heart risk
# Categorical columns: ['AgeCategory', 'GenHealth', 'Sex', 'Smoking', 'PhysicalActivity', 'AlcoholDrinking', 'KidneyDisease', 'DiffWalking', 'Asthma']
# Numerical columns: ['BMI', 'MentalHealth', 'SleepTime']
test_heart_data = pd.DataFrame([{
    'AgeCategory': '45-49',
    'GenHealth': 'Good',
    'Sex': 'Male',
    'Smoking': 'No',
    'PhysicalActivity': 'Yes',
    'AlcoholDrinking': 'No',
    'KidneyDisease': 'No',
    'DiffWalking': 'No',
    'Asthma': 'No',
    'BMI': 24.5,
    'MentalHealth': 0.0,
    'SleepTime': 7.0
}])

print("Heart data df:")
print(test_heart_data)

try:
    X_heart = heart_prep.transform(test_heart_data)
    prob_heart = heart_model.predict_proba(X_heart)[0][1]
    print(f"Heart Risk Probability: {prob_heart}")
except Exception as e:
    print(f"Error predicting Heart Risk: {e}")
    import traceback; traceback.print_exc()

# Load Stroke Model and Preprocessor
stroke_model = joblib.load('notebooks/models/stroke_model.pkl')
stroke_prep = joblib.load('notebooks/models/stroke_preprocessor.pkl')

print("\nLoaded stroke model and preprocessor successfully.")

# Categorical columns: ['gender', 'ever_married', 'work_type', 'Residence_type', 'smoking_status']
# Numerical columns: ['age', 'avg_glucose_level', 'bmi', 'hypertension']
test_stroke_data = pd.DataFrame([{
    'gender': 'Male',
    'ever_married': 'Yes',
    'work_type': 'Private',
    'Residence_type': 'Urban',
    'smoking_status': 'never smoked',
    'age': 45.0,
    'avg_glucose_level': 85.0,
    'bmi': 24.5,
    'hypertension': 0.0
}])

try:
    X_stroke = stroke_prep.transform(test_stroke_data)
    prob_stroke = stroke_model.predict_proba(X_stroke)[0][1]
    print(f"Stroke Risk Probability: {prob_stroke}")
except Exception as e:
    print(f"Error predicting Stroke Risk: {e}")
    import traceback; traceback.print_exc()

# Load Diabetes Model and Preprocessor
diabetes_model = joblib.load('notebooks/models/diabetes_model.pkl')
diabetes_prep = joblib.load('notebooks/models/diabetes_preprocessor.pkl')

print("\nLoaded diabetes model and preprocessor successfully.")

# Categorical columns: ['HighBP', 'HighChol', 'CholCheck', 'Smoker', 'Stroke', 'HeartDiseaseorAttack', 'PhysActivity', 'Fruits', 'Veggies', 'HvyAlcoholConsump', 'GenHlth', 'DiffWalk', 'Sex']
# Numerical columns: ['BMI', 'MentHlth', 'PhysHlth', 'Age', 'Education']
test_diabetes_data = pd.DataFrame([{
    'HighBP': 0.0,
    'HighChol': 0.0,
    'CholCheck': 1.0,
    'Smoker': 0.0,
    'Stroke': 0.0,
    'HeartDiseaseorAttack': 0.0,
    'PhysActivity': 1.0,
    'Fruits': 1.0,
    'Veggies': 1.0,
    'HvyAlcoholConsump': 0.0,
    'GenHlth': 3.0,
    'DiffWalk': 0.0,
    'Sex': 1.0,
    'BMI': 24.5,
    'MentHlth': 0.0,
    'PhysHlth': 0.0,
    'Age': 6.0, # 45-49
    'Education': 4.0
}])

try:
    X_diabetes = diabetes_prep.transform(test_diabetes_data)
    prob_diabetes = diabetes_model.predict_proba(X_diabetes)[0][1]
    print(f"Diabetes Risk Probability: {prob_diabetes}")
except Exception as e:
    print(f"Error predicting Diabetes Risk: {e}")
    import traceback; traceback.print_exc()
