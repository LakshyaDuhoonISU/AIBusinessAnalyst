"""
Forecasting Script

Uses Linear Regression from scikit-learn to predict future business metrics.

How it works:
1. Reads dataset JSON from stdin
2. Identifies numeric columns suitable for forecasting
3. Fits a Linear Regression model on each numeric column
4. Predicts values for the next N periods
5. Calculates confidence score based on R² value
6. Outputs predictions as JSON to stdout

Usage (called from Node.js via child process):
  echo '<json_data>' | python3 forecast.py

Input format (JSON):
  {
    "data": [{"col1": val1, ...}, ...],
    "columnNames": ["col1", "col2", ...],
    "columnTypes": {"col1": "number", "col2": "date", ...},
    "periods": 3
  }

Output format (JSON):
  {
    "forecasts": [
      {
        "metric": "Revenue",
        "currentValue": 50000,
        "predictedValue": 54200,
        "confidence": 82,
        "trend": "increasing",
        "predictions": [51000, 52500, 54200]
      }
    ]
  }
"""

import sys
import json
import numpy as np

def forecast_metric(values, periods=3):
    """
    Forecast future values using Linear Regression.
    
    Args:
        values: List of numeric values (time-ordered)
        periods: Number of future periods to predict
    
    Returns:
        Dictionary with predictions, confidence, and trend
    """
    if len(values) < 3:
        return None
    
    # Create feature matrix (X = time index) and target (y = values)
    X = np.arange(len(values)).reshape(-1, 1)
    y = np.array(values)
    
    # --- Simple Linear Regression (manual implementation) ---
    # This avoids import issues - uses the normal equation: β = (X'X)^(-1) X'y
    n = len(values)
    x_flat = np.arange(n, dtype=float)
    
    # Calculate means
    x_mean = np.mean(x_flat)
    y_mean = np.mean(y)
    
    # Calculate slope (β1) and intercept (β0)
    numerator = np.sum((x_flat - x_mean) * (y - y_mean))
    denominator = np.sum((x_flat - x_mean) ** 2)
    
    if denominator == 0:
        return None
    
    slope = numerator / denominator
    intercept = y_mean - slope * x_mean
    
    # Calculate R² (coefficient of determination) for confidence
    y_pred_train = slope * x_flat + intercept
    ss_res = np.sum((y - y_pred_train) ** 2)
    ss_tot = np.sum((y - y_mean) ** 2)
    
    r_squared = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
    r_squared = max(0, min(1, r_squared))  # Clamp between 0 and 1
    
    # Generate predictions for future periods
    future_x = np.arange(n, n + periods, dtype=float)
    predictions = (slope * future_x + intercept).tolist()
    
    # Round predictions to 2 decimal places
    predictions = [round(p, 2) for p in predictions]
    
    # Determine trend direction
    if slope > 0:
        trend = "increasing"
    elif slope < 0:
        trend = "decreasing"
    else:
        trend = "stable"
    
    # Confidence score based on R² (as percentage)
    confidence = round(r_squared * 100)
    
    return {
        "currentValue": round(float(values[-1]), 2),
        "predictedValue": predictions[-1],
        "confidence": confidence,
        "trend": trend,
        "predictions": predictions,
        "slope": round(float(slope), 4),
    }


def main():
    """Main function: reads input, runs forecasting, outputs results."""
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())
        
        data = input_data.get("data", [])
        column_names = input_data.get("columnNames", [])
        column_types = input_data.get("columnTypes", {})
        periods = input_data.get("periods", 3)
        
        if not data:
            print(json.dumps({"error": "No data provided"}))
            return
        
        # Find numeric columns to forecast
        numeric_columns = [
            col for col in column_names 
            if column_types.get(col) == "number"
        ]
        
        forecasts = []
        
        for col in numeric_columns:
            # Extract values for this column
            values = []
            for row in data:
                val = row.get(col)
                if val is not None and val != "":
                    try:
                        values.append(float(val))
                    except (ValueError, TypeError):
                        continue
            
            if len(values) < 3:
                continue
            
            # Run forecasting
            result = forecast_metric(values, periods)
            
            if result:
                result["metric"] = col
                forecasts.append(result)
        
        # Output results as JSON
        print(json.dumps({"forecasts": forecasts}))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))


if __name__ == "__main__":
    main()
