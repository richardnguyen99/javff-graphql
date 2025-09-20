"""Generate CSV from a series CSV file with only id and name
"""

import csv
import sys


if len(sys.argv) != 3:
    print("Usage: python series-nameonly.py <input_csv_path> <output_csv_path>")
    sys.exit(1)

input_path = sys.argv[1]
output_path = sys.argv[2]

with open(input_path, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f, delimiter="|")
    series = [row for row in reader]

if not series:
    print("No series found in the input CSV.")
    sys.exit(0)

with open(output_path, "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["id", "series_id", "name"], delimiter="|")
    writer.writeheader()
    for serie in series:
        writer.writerow({"id": serie["id"], "series_id": serie["series_id"], "name": serie["name"]})

print(f"CSV written to {output_path}")
