import json
import re

for notebook_name in ['diabetes_risk.ipynb', 'heart_risk.ipynb', 'stroke.ipynb']:
    print(f"=== NOTEBOOK: {notebook_name} ===")
    with open(f"notebooks/{notebook_name}", 'r', encoding='utf-8') as f:
        nb = json.load(f)
    
    # Search cells for model evaluation output
    for cell in nb.get('cells', []):
        if cell.get('cell_type') == 'code':
            source = "".join(cell.get('source', []))
            if any(term in source for term in ['accuracy_score', 'classification_report', 'roc_auc_score', 'confusion_matrix', 'f1_score']):
                print("Code:")
                print(source[:300] + "\n...")
                
                # Check output of this cell
                for output in cell.get('outputs', []):
                    if output.get('output_type') == 'stream':
                        text = "".join(output.get('text', []))
                        print("Output text:")
                        print(text)
                    elif output.get('output_type') == 'execute_result':
                        data = output.get('data', {})
                        text_plain = "".join(data.get('text/plain', []))
                        print("Execute result:")
                        print(text_plain)
                print("-" * 40)
    print()
