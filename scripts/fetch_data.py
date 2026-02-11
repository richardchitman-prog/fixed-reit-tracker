import json
import pandas as pd

# Function to handle NaN and None values correctly

def handle_nan_none(data):
    return data.fillna('').where(pd.notnull(data), None).to_dict() 

# Example data fetching and JSON generation

def fetch_data():
    # Simulate fetching data
    data = pd.DataFrame({
        'value': [1, 2, None, 4, float('nan')],
        'name': ['apple', 'banana', 'cherry', 'date', None]
    })

    cleaned_data = handle_nan_none(data)
    return json.dumps(cleaned_data)

if __name__ == '__main__':
    result = fetch_data()
    print(result)