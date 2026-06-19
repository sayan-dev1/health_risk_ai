import pandas as pd


def extract_risk_factors(
    shap_values,
    feature_names,
    top_n=5
):
    """
    Returns the most influential features
    contributing to increased risk.
    """

    df = pd.DataFrame({
        "feature": feature_names,
        "impact": shap_values
    })

    df["abs_impact"] = df["impact"].abs()

    df = df.sort_values(
        by="abs_impact",
        ascending=False
    )

    return df.head(top_n)


def get_positive_risk_factors(
    shap_values,
    feature_names,
    top_n=5
):
    """
    Features increasing risk.
    """

    df = pd.DataFrame({
        "feature": feature_names,
        "impact": shap_values
    })

    positive = df[df["impact"] > 0]

    positive = positive.sort_values(
        by="impact",
        ascending=False
    )

    return positive.head(top_n)


def get_protective_factors(
    shap_values,
    feature_names,
    top_n=5
):
    """
    Features reducing risk.
    """

    df = pd.DataFrame({
        "feature": feature_names,
        "impact": shap_values
    })

    negative = df[df["impact"] < 0]

    negative = negative.sort_values(
        by="impact",
        ascending=True
    )

    return negative.head(top_n)