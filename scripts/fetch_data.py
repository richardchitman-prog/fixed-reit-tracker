import json
import pandas as pd

# Sample data to demonstrate the function
sample_data = {
    'name': ['Alpha', 'Beta', 'Gamma'],
    'value': [1.23, None, 3.45],  # None represents a NULL value
    'count': [10, 20, None],      # None will be handled
}

def fetch_data():
    df = pd.DataFrame(sample_data)
    # Replace NaN with None for JSON serialization
    df = df.where(pd.notnull(df), None)
    return df

if __name__ == '__main__':
    data = fetch_data()
    # Convert DataFrame to JSON without NaNs
    json_data = data.to_json(orient='records')
    valid_json = json.loads(json_data)
    print(json.dumps(valid_json, indent=4))