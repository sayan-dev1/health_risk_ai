import joblib
import os

models_dir = 'notebooks/models'
for model_prefix in ['heart', 'stroke', 'diabetes']:
    print(f"=== {model_prefix.upper()} PREPROCESSOR ===")
    prep_path = os.path.join(models_dir, f"{model_prefix}_preprocessor.pkl")
    prep = joblib.load(prep_path)
    
    if hasattr(prep, 'transformers_'):
        for name, transformer, columns in prep.transformers_:
            print(f"  Transformer: '{name}', Columns: {columns}")
            if name == 'onehotencoder' or (hasattr(transformer, 'categories_')):
                print(f"    Categories: {transformer.categories_}")
            elif hasattr(transformer, 'steps'):
                for step_name, step_trans in transformer.steps:
                    print(f"    Step: '{step_name}', Class: {step_trans.__class__.__name__}")
                    if hasattr(step_trans, 'categories_'):
                        print(f"      Categories: {step_trans.categories_}")
    print()
