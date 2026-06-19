def generate_recommendations(
    user_data,
    heart_risk,
    stroke_risk,
    diabetes_risk
):
    recommendations = []

    # --------------------------
    # RISK-BASED RECOMMENDATIONS
    # --------------------------

    if heart_risk >= 0.7:
        recommendations.append({
            "title": "Cardiovascular Health",
            "message": "Your heart disease risk is elevated. Consider regular cardiovascular screening and lifestyle improvements."
        })

    if stroke_risk >= 0.7:
        recommendations.append({
            "title": "Stroke Prevention",
            "message": "Your stroke risk is elevated. Monitor blood pressure and maintain a healthy lifestyle."
        })

    if diabetes_risk >= 0.7:
        recommendations.append({
            "title": "Blood Sugar Management",
            "message": "Your diabetes risk is elevated. Focus on diet, exercise, and regular health checkups."
        })

    # --------------------------
    # BMI
    # --------------------------

    bmi = user_data.get("BMI", 0)

    if bmi >= 30:
        recommendations.append({
            "title": "Weight Management",
            "message": "High BMI is associated with increased cardiovascular and metabolic risk."
        })

    elif bmi < 18.5:
        recommendations.append({
            "title": "Healthy Weight",
            "message": "Your BMI indicates you may be underweight. Consider consulting a healthcare professional."
        })

    # --------------------------
    # SMOKING
    # --------------------------

    smoking = user_data.get("Smoking", "No")

    if smoking == "Yes":
        recommendations.append({
            "title": "Smoking Cessation",
            "message": "Smoking is a major contributor to heart disease, stroke and diabetes complications."
        })

    # --------------------------
    # PHYSICAL ACTIVITY
    # --------------------------

    activity = user_data.get("PhysicalActivity", "Yes")

    if activity == "No":
        recommendations.append({
            "title": "Increase Activity",
            "message": "Aim for at least 150 minutes of moderate physical activity per week."
        })

    # --------------------------
    # SLEEP
    # --------------------------

    sleep = user_data.get("SleepTime", 7)

    if sleep < 6:
        recommendations.append({
            "title": "Improve Sleep",
            "message": "Low sleep duration is associated with poorer cardiovascular and metabolic health."
        })

    elif sleep > 10:
        recommendations.append({
            "title": "Review Sleep Patterns",
            "message": "Excessive sleep duration can sometimes indicate underlying health concerns."
        })

    # --------------------------
    # ALCOHOL
    # --------------------------

    alcohol = user_data.get("AlcoholDrinking", "No")

    if alcohol == "Yes":
        recommendations.append({
            "title": "Alcohol Consumption",
            "message": "Reducing excessive alcohol consumption can improve long-term health outcomes."
        })

    # --------------------------
    # GENERAL HEALTH
    # --------------------------

    gen_health = user_data.get("GenHealth", "")

    if gen_health in ["Poor", "Fair"]:
        recommendations.append({
            "title": "General Health Improvement",
            "message": "Consider regular health assessments and preventive healthcare measures."
        })

    # --------------------------
    # FALLBACK
    # --------------------------

    if len(recommendations) == 0:
        recommendations.append({
            "title": "Healthy Lifestyle",
            "message": "Maintain your current healthy habits and continue preventive healthcare practices."
        })

    return recommendations