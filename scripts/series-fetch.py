import requests
import os 
import sys
import json

series = []

def main():
    if len(sys.argv) != 2:
        print("Usage: python series-fetch.py <output_json_path>")
        sys.exit(1)

    output_path = sys.argv[1]
    app_id = os.getenv("APP_ID")
    affiliate_id = os.getenv("AFFILIATE_ID")
    
    if not app_id or not affiliate_id:
        print("Please set the APP_ID and AFFILIATE_ID environment variables.")
        sys.exit(1)
        
    base_url = f"https://api.dmm.com/affiliate/v3/SeriesSearch?api_id={app_id}&affiliate_id={affiliate_id}&floor_id=43&output=json"
    page = 1
    hits = 500
    
    while True:
        url = f"{base_url}&hits={hits}&offset={((page - 1) * hits) + 1}"
        print(f"Fetching page {page}...")
        response = requests.get(url)
        
        if response.status_code != 200:
            print(f"Error fetching data: {response.status_code}")
            break
        
        data = response.json()
        series_list = data.get("result", {}).get("series", [])
        
        if not series_list:
            print("No more series found.")
            break
        
        series.extend(series_list)
        page += 1
        
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({"series": series}, f, ensure_ascii=False, indent=4)  

if __name__ == "__main__":
    main()
