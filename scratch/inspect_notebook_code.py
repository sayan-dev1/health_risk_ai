import json

for notebook_name in ['diabetes_risk.ipynb', 'heart_risk.ipynb', 'stroke.ipynb']:
    print(f"=== NOTEBOOK: {notebook_name} ===")
    with open(f"notebooks/{notebook_name}", 'r', encoding='utf-8') as f:
        nb = json.load(f)
    
    # Let's search cells for key code snippets
    for cell in nb.get('cells', []):
        if cell.get('cell_type') == 'code':
            source = "".join(cell.get('source', []))
            if 'Age' in source or 'age' in source or 'preprocess' in source:
                # print snippet of code
                lines = source.split('\n')
                for line in lines:
                    if any(term in line for term in ['Age', 'age', 'scaler', 'OneHot', 'ColumnTransformer', 'map(']):
                        print(f"  {line.strip()[:100]}")
    print()
