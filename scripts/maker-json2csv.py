import json
import csv
import sys

if len(sys.argv) != 3:
    print("Usage: python maker-json2csv.py <input_json_path> <output_csv_path>")
    sys.exit(1)

input_path = sys.argv[1]
output_path = sys.argv[2]

with open(input_path, "r", encoding="utf-8") as f:
    data = json.load(f)

makers = data.get("maker", [])

if not makers:
    print("No makers found in the input JSON.")
    sys.exit(0)

fields = [k for k in makers[0].keys() if k != "list_url"]

with open(output_path, "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    for maker in makers:
        row = {k: v for k, v in maker.items() if k in fields}
        writer.writerow(row)

print(f"CSV written to {output_path}")
