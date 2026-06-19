# src/explainability/shap_helper.py

import shap
import pandas as pd


class ShapExplainer:

    def __init__(self, model, background_data=None):
        """
        model: trained model loaded from pkl
        background_data: transformed training sample
        """

        self.model = model

        model_name = model.__class__.__name__

        if model_name in [
            "LogisticRegression",
            "LinearRegression"
        ]:

            if background_data is None:
                raise ValueError(
                    "background_data required for LinearExplainer"
                )

            self.explainer = shap.LinearExplainer(
                model,
                background_data
            )

        else:

            self.explainer = shap.TreeExplainer(
                model
            )

    def get_shap_values(self, X):

        shap_values = self.explainer.shap_values(X)

        if isinstance(shap_values, list):
            shap_values = shap_values[1]

        return shap_values

    def get_top_features(
        self,
        X,
        feature_names,
        top_n=5
    ):

        shap_values = self.get_shap_values(X)

        impacts = shap_values[0]

        result = pd.DataFrame(
            {
                "feature": feature_names,
                "impact": impacts
            }
        )

        result["abs_impact"] = (
            result["impact"].abs()
        )

        result = result.sort_values(
            "abs_impact",
            ascending=False
        )

        return result.head(top_n)

    def get_risk_drivers(
        self,
        X,
        feature_names,
        top_n=5
    ):

        shap_values = self.get_shap_values(X)

        impacts = shap_values[0]

        result = pd.DataFrame(
            {
                "feature": feature_names,
                "impact": impacts
            }
        )

        positive = (
            result[result["impact"] > 0]
            .sort_values(
                "impact",
                ascending=False
            )
            .head(top_n)
        )

        negative = (
            result[result["impact"] < 0]
            .sort_values(
                "impact"
            )
            .head(top_n)
        )

        return positive, negative