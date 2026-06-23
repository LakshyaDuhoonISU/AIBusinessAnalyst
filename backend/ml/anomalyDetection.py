"""
Anomaly Detection Script

Uses the IQR (Interquartile Range) method to detect anomalies in datasets.
This is a statistical approach that doesn't require training data.

How it works:
1. Reads dataset JSON from stdin
2. For each numeric column, calculates Q1, Q3, and IQR
3. Flags values outside [Q1 - 1.5*IQR, Q3 + 1.5*IQR] as anomalies
4. Assigns severity based on deviation distance
5. Outputs anomalies as JSON to stdout

Usage (called from Node.js via child process):
  echo '<json_data>' | python3 anomalyDetection.py
"""

import sys
import json
import numpy as np


def detect_anomalies_iqr(values, column_name):
    """
    Detect anomalies using the IQR method.
    
    Args:
        values: List of (index, value) tuples
        column_name: Name of the column being analyzed
    
    Returns:
        List of anomaly dictionaries
    """
    if len(values) < 4:
        return []
    
    # Extract just the numeric values
    nums = np.array([v[1] for v in values])
    
    # Calculate Q1 (25th percentile), Q3 (75th percentile), and IQR
    q1 = np.percentile(nums, 25)
    q3 = np.percentile(nums, 75)
    iqr = q3 - q1
    
    # Define bounds
    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr
    
    # Calculate mean for expected value
    mean = np.mean(nums)
    
    anomalies = []
    
    for idx, val in values:
        if val < lower_bound or val > upper_bound:
            # Calculate deviation for severity
            deviation = abs(val - mean) / (iqr if iqr > 0 else 1)
            
            # Assign severity
            if deviation > 3:
                severity = "high"
            elif deviation > 2:
                severity = "medium"
            else:
                severity = "low"
            
            anomalies.append({
                "column": column_name,
                "rowIndex": int(idx),
                "actualValue": round(float(val), 2),
                "expectedValue": round(float(mean), 2),
                "lowerBound": round(float(lower_bound), 2),
                "upperBound": round(float(upper_bound), 2),
                "severity": severity,
                "type": "unusually_low" if val < lower_bound else "unusually_high",
            })
    
    return anomalies


def main():
    """Main function: reads input, detects anomalies, outputs results."""
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())
        
        data = input_data.get("data", [])
        column_names = input_data.get("columnNames", [])
        column_types = input_data.get("columnTypes", {})
        
        if not data:
            print(json.dumps({"error": "No data provided"}))
            return
        
        all_anomalies = []
        
        # Check each numeric column for anomalies
        numeric_columns = [
            col for col in column_names 
            if column_types.get(col) == "number"
        ]
        
        for col in numeric_columns:
            # Extract (index, value) pairs
            values = []
            for i, row in enumerate(data):
                val = row.get(col)
                if val is not None and val != "":
                    try:
                        values.append((i, float(val)))
                    except (ValueError, TypeError):
                        continue
            
            # Detect anomalies for this column
            anomalies = detect_anomalies_iqr(values, col)
            all_anomalies.extend(anomalies)
        
        # Sort by severity (high first) and limit results
        severity_order = {"high": 0, "medium": 1, "low": 2}
        all_anomalies.sort(key=lambda x: severity_order.get(x["severity"], 3))
        
        print(json.dumps({
            "anomalies": all_anomalies[:20],
            "totalFound": len(all_anomalies),
        }))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))


if __name__ == "__main__":
    main()
