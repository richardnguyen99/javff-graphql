"""Add sequential IDs to video CSV and save
"""

import csv
import sys

if len(sys.argv) != 3:
    print("Usage: python video-addid.py <input_csv_path> <output_csv_path>")
    sys.exit(1)
    
input_path = sys.argv[1]
output_path = sys.argv[2]

with open(input_path, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f, delimiter="\t")
    rows = list(reader)
    
    if not rows:
        print("No data found in the input CSV.")
        sys.exit(0)
    
    fields = ["id"] + reader.fieldnames
    with open(output_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields, delimiter="\t")
        writer.writeheader()
        for i, row in enumerate(rows, 1):
            row["id"] = i  # Add sequential ID
            writer.writerow(row)
            
print(f"CSV with IDs written to {output_path}")

