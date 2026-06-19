import sys
import os
sys.path.append(os.path.abspath('.'))
import joblib
import pandas as pd
import scipy.sparse
from explainability.shap_helper import ShapExplainer

# Load Heart Model, Preprocessor and Background
heart_model = joblib.load('notebooks/models/heart_model.pkl')
heart_prep = joblib.load('notebooks/models/heart_preprocessor.pkl')
heart_bg = joblib.load('notebooks/models/heart_background.pkl')

print("Loaded heart assets.")
print(f"Background shape: {heart_bg.shape}")

# Preprocess the background data as required by ShapExplainer (transformed training sample)
transformed_bg = heart_prep.transform(heart_bg)
if scipy.sparse.issparse(transformed_bg):
    transformed_bg = transformed_bg.toarray()

# Now initialize ShapExplainer
explainer = ShapExplainer(heart_model, transformed_bg)
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

X_heart_trans = heart_prep.transform(test_heart_data)
if scipy.sparse.issparse(X_heart_trans):
    X_heart_trans = X_heart_trans.toarray()

feature_names = heart_prep.get_feature_names_out()
print(f"Feature names out: {feature_names}")

shap_vals = explainer.get_shap_values(X_heart_trans)
print(f"Shap values shape: {shap_vals.shape}")

pos, neg = explainer.get_risk_drivers(X_heart_trans, feature_names)
print("Positive drivers:")
print(pos)
print("Negative drivers:")
print(neg)
