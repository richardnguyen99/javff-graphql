import pandas as pd
import requests
import csv
import re
import time
from urllib.parse import urlencode, quote
from pathlib import Path
import argparse


def extract_video_labels(video_codes):
    """Extract unique video labels from comma-separated video codes"""
    labels = set()
    if pd.isna(video_codes):
        return labels

    codes = video_codes.split(",")
    for code in codes:
        code = code.strip()
        # Extract label part (letters before dash and numbers)
        match = re.match(r"^([A-Z]+)", code)
        if match:
            labels.add(match.group(1))

    return labels


def search_dmm_api(app_id, aff_id, keyword):
    """Search DMM API for videos with the given keyword"""
    base_url = "https://api.dmm.com/affiliate/v3/ItemList"

    params = {
        "api_id": app_id,
        "affiliate_id": aff_id,
        "site": "FANZA",
        "service": "digital",
        "floor": "videoa",
        "keyword": keyword,
        "hits": 50,  # Get more results to increase chances of finding matches
    }

    url = f"{base_url}?{urlencode(params, quote_via=quote)}"

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error searching for keyword '{keyword}': {e}")
        return None


def find_maker_from_api_response(api_response, label):
    """Find maker information from API response if content_id contains the label"""
    if not api_response or api_response.get("result", {}).get("status") != 200:
        return None

    items = api_response.get("result", {}).get("items", [])

    for item in items:
        content_id = item.get("content_id", "").lower()

        # Check if content_id contains the label
        if label.lower() in content_id:
            iteminfo = item.get("iteminfo", {})
            makers = iteminfo.get("maker", [])

            if makers and len(makers) > 0:
                maker = makers[0]  # Take the first maker

                # Handle ruby field properly - ensure it's always a string
                ruby = maker.get("ruby", "")
                if ruby is None or pd.isna(ruby):
                    ruby = ""

                return {
                    "name": maker.get("name", ""),
                    "dmm_id": maker.get("id", ""),
                    "ruby": ruby,
                }

    return None


def clean_dataframe_for_output(df):
    """Clean DataFrame by replacing all NaN values with empty strings and ensuring proper types"""
    # Make a copy to avoid modifying the original
    df_clean = df.copy()

    # Replace all NaN values with empty strings
    df_clean = df_clean.fillna("")

    # Ensure specific column types
    if "id" in df_clean.columns:
        # Convert id to int, but handle any potential string values
        df_clean["id"] = (
            pd.to_numeric(df_clean["id"], errors="coerce").fillna(0).astype(int)
        )

    if "alias_id" in df_clean.columns:
        # Convert alias_id to int, but handle any potential string values
        df_clean["alias_id"] = (
            pd.to_numeric(df_clean["alias_id"], errors="coerce").fillna(0).astype(int)
        )

    # Convert all other columns to string and ensure no NaN
    for col in df_clean.columns:
        if col not in ["id", "alias_id"]:
            df_clean[col] = df_clean[col].astype(str).replace("nan", "")

    return df_clean


def read_maker_file(maker_file):
    """Read the maker file and return DataFrame"""
    try:
        # Read with specific dtype to preserve integers
        df = pd.read_csv(
            maker_file,
            sep="\t",
            dtype={"id": int, "name": str, "dmm_id": str, "ruby": str},
            na_filter=False,
        )
        return df
    except FileNotFoundError:
        # Create empty maker file with headers
        df = pd.DataFrame(columns=["id", "name", "dmm_id", "ruby"])
        df.to_csv(maker_file, sep="\t", index=False)
        return df
    except ValueError:
        # Fallback if there are type issues - read normally and clean
        df = pd.read_csv(maker_file, sep="\t")
        df = clean_dataframe_for_output(df)
        return df


def read_alias_file(alias_file):
    """Read the alias file and return DataFrame with proper columns"""
    try:
        df = pd.read_csv(alias_file, sep="\t")

        # Remove any unwanted columns that might have been added during processing
        expected_columns = ["name", "alias", "alias_id"]

        # Keep only the expected columns if they exist
        existing_columns = [col for col in expected_columns if col in df.columns]
        if existing_columns:
            df = df[existing_columns].copy()

        # Ensure all expected columns exist
        for col in expected_columns:
            if col not in df.columns:
                if col == "alias_id":
                    df[col] = 0
                else:
                    df[col] = ""

        # Reorder columns to match expected order
        df = df[expected_columns]

        # Set proper data types
        if "alias_id" in df.columns:
            df["alias_id"] = (
                pd.to_numeric(df["alias_id"], errors="coerce").fillna(0).astype(int)
            )

        return df

    except FileNotFoundError:
        # Create empty alias file with headers
        df = pd.DataFrame(columns=["name", "alias", "alias_id"])
        df.to_csv(alias_file, sep="\t", index=False)
        return df


def get_next_maker_id(maker_df):
    """Get the next available ID for the maker file"""
    if len(maker_df) == 0:
        return 1
    return int(maker_df["id"].max()) + 1


def save_maker_file(maker_file, maker_df):
    """Save maker DataFrame to file with proper formatting"""
    # Clean the DataFrame before saving
    df_clean = clean_dataframe_for_output(maker_df)

    # Ensure only expected columns for maker file
    expected_columns = ["id", "name", "dmm_id", "ruby"]
    df_clean = df_clean[expected_columns]

    # Save to file
    df_clean.to_csv(maker_file, sep="\t", index=False)

    return df_clean


def save_alias_file(alias_file, alias_df):
    """Save alias DataFrame to file with proper formatting"""
    # Clean the DataFrame before saving
    df_clean = clean_dataframe_for_output(alias_df)

    # Ensure only expected columns for alias file
    expected_columns = ["name", "alias", "alias_id"]
    df_clean = df_clean[expected_columns]

    # Save to file
    df_clean.to_csv(alias_file, sep="\t", index=False)

    return df_clean


def update_maker_file(maker_file, maker_df, new_maker):
    """Add new maker to the maker file"""
    next_id = get_next_maker_id(maker_df)

    # Ensure ruby is always a string, never NaN
    ruby_value = new_maker.get("ruby", "")
    if ruby_value is None or pd.isna(ruby_value):
        ruby_value = ""

    new_row = {
        "id": int(next_id),
        "name": str(new_maker["name"]),
        "dmm_id": str(new_maker["dmm_id"]),
        "ruby": str(ruby_value),
    }

    # Add to DataFrame using pd.concat
    new_df = pd.DataFrame([new_row])
    maker_df = pd.concat([maker_df, new_df], ignore_index=True)

    # Save the updated DataFrame
    maker_df = save_maker_file(maker_file, maker_df)

    return maker_df, next_id


def add_not_found_maker(maker_file, maker_df, maker_name):
    """Add a not-found maker to the maker file with empty dmm_id"""
    next_id = get_next_maker_id(maker_df)

    new_row = {
        "id": int(next_id),
        "name": str(maker_name),
        "dmm_id": "",  # Empty dmm_id for not-found makers
        "ruby": "",  # Empty ruby for not-found makers
    }

    # Add to DataFrame using pd.concat
    new_df = pd.DataFrame([new_row])
    maker_df = pd.concat([maker_df, new_df], ignore_index=True)

    # Save the updated DataFrame
    maker_df = save_maker_file(maker_file, maker_df)

    print(f"Added not-found maker: '{maker_name}' (ID: {next_id})")
    return maker_df, next_id


def check_maker_exists_by_name(maker_df, maker_name):
    """Check if a maker exists in the maker file by name (case-insensitive)"""
    existing = maker_df[maker_df["name"].str.lower() == str(maker_name).strip().lower()]
    return len(existing) > 0, existing


def update_alias_file(
    alias_file, alias_df, original_name, correct_maker_name, maker_id
):
    """Add new alias to the alias file"""

    # Skip if the original name is the same as the correct maker name
    if str(original_name).strip() == str(correct_maker_name).strip():
        print(
            f"Skipping self-referencing alias: '{original_name}' -> '{correct_maker_name}'"
        )
        return alias_df

    new_row = {
        "name": str(original_name),
        "alias": str(correct_maker_name),
        "alias_id": int(maker_id),
    }

    # Check if alias already exists
    existing = alias_df[
        (alias_df["name"] == str(original_name))
        & (alias_df["alias"] == str(correct_maker_name))
    ]

    if len(existing) == 0:
        # Add to DataFrame
        new_df = pd.DataFrame([new_row])
        alias_df = pd.concat([alias_df, new_df], ignore_index=True)

        # Save the updated DataFrame
        alias_df = save_alias_file(alias_file, alias_df)

        print(
            f"Added alias: '{original_name}' -> '{correct_maker_name}' (ID: {maker_id})"
        )
    else:
        print(f"Alias already exists: '{original_name}' -> '{correct_maker_name}'")

    return alias_df


def clean_existing_alias_file(alias_file):
    """Remove self-referencing aliases from existing alias file and clean up columns"""
    try:
        # Read the file
        df = pd.read_csv(alias_file, sep="\t")

        print(
            f"Original alias file has {len(df)} entries with columns: {list(df.columns)}"
        )

        # Keep only the expected columns
        expected_columns = ["name", "alias", "alias_id"]
        existing_expected_cols = [col for col in expected_columns if col in df.columns]

        if existing_expected_cols:
            df = df[existing_expected_cols].copy()

        # Count original entries
        original_count = len(df)

        # Create temporary columns for comparison (case-insensitive)
        df["name_temp"] = df["name"].astype(str).str.strip().str.lower()
        df["alias_temp"] = df["alias"].astype(str).str.strip().str.lower()

        # Filter out self-referencing aliases
        valid_aliases = df[df["name_temp"] != df["alias_temp"]].copy()

        # Drop the temporary columns
        valid_aliases = valid_aliases.drop(
            ["name_temp", "alias_temp"], axis=1, errors="ignore"
        )

        # Ensure we have all expected columns
        for col in expected_columns:
            if col not in valid_aliases.columns:
                if col == "alias_id":
                    valid_aliases[col] = 0
                else:
                    valid_aliases[col] = ""

        # Reorder columns
        valid_aliases = valid_aliases[expected_columns]

        # Count removed entries
        removed_count = original_count - len(valid_aliases)

        print(
            f"Cleaning existing alias file: removed {removed_count} self-referencing aliases"
        )
        print(f"Cleaned file has {len(valid_aliases)} entries")

        # Save the cleaned file
        save_alias_file(alias_file, valid_aliases)

        return valid_aliases

    except FileNotFoundError:
        print("Alias file not found, will be created during processing")
        return pd.DataFrame(columns=["name", "alias", "alias_id"])
    except Exception as e:
        print(f"Error cleaning alias file: {e}")
        return read_alias_file(alias_file)


def process_not_found_makers(
    not_found_file, maker_file, alias_file, app_id, aff_id, append_not_found=False
):
    """Process the not found makers file and update maker/alias files"""

    # Read files
    not_found_df = pd.read_csv(not_found_file, sep="\t")
    maker_df = read_maker_file(maker_file)

    # Clean existing alias file first
    alias_df = clean_existing_alias_file(alias_file)

    print(f"Processing {len(not_found_df)} makers from {not_found_file}")
    if append_not_found:
        print("Append not-found makers option is enabled")

    for idx, row in not_found_df.iterrows():
        maker_name = row["name"]
        video_codes = row["not_found_videos"]

        print(f"\nProcessing maker: {maker_name}")

        # First check if maker already exists in the maker file by name
        maker_exists, existing_maker_rows = check_maker_exists_by_name(
            maker_df, maker_name
        )

        if maker_exists:
            # Maker already exists by name, no need to search API or add
            existing_maker = existing_maker_rows.iloc[0]
            existing_id = int(existing_maker["id"])
            existing_name = str(existing_maker["name"])
            print(
                f"Maker already exists by name with ID {existing_id}: {existing_name}"
            )
            continue

        # Extract video labels
        labels = extract_video_labels(video_codes)
        print(f"Found labels: {list(labels)}")

        found_maker = None

        # Search for each label
        for label in labels:
            print(f"Searching for label: {label}")

            # Search DMM API
            api_response = search_dmm_api(app_id, aff_id, label)

            if api_response:
                # Find maker from API response
                maker_info = find_maker_from_api_response(api_response, label)

                if maker_info:
                    found_maker = maker_info
                    print(
                        f"Found maker: {maker_info['name']} (DMM ID: {maker_info['dmm_id']}) (Ruby: '{maker_info['ruby']}')"
                    )
                    break

            # Add delay between API requests
            time.sleep(0.5)

        if found_maker:
            # Check if maker exists in maker file by dmm_id
            existing_maker = maker_df[maker_df["dmm_id"] == str(found_maker["dmm_id"])]

            if len(existing_maker) > 0:
                # Maker exists, add alias (only if not self-referencing)
                existing_id = int(existing_maker.iloc[0]["id"])
                existing_name = str(existing_maker.iloc[0]["name"])

                print(f"Maker exists with ID {existing_id}: {existing_name}")

                # Only create alias if the names are different
                if str(maker_name).strip() != str(existing_name).strip():
                    alias_df = update_alias_file(
                        alias_file, alias_df, maker_name, existing_name, existing_id
                    )
                else:
                    print(
                        f"Names are identical, no alias needed: '{maker_name}' == '{existing_name}'"
                    )
            else:
                # Maker doesn't exist, add to maker file
                print(f"Adding new maker: {found_maker['name']}")
                maker_df, new_id = update_maker_file(maker_file, maker_df, found_maker)

                # Add alias (only if not self-referencing)
                if str(maker_name).strip() != str(found_maker["name"]).strip():
                    alias_df = update_alias_file(
                        alias_file, alias_df, maker_name, found_maker["name"], new_id
                    )
                else:
                    print(
                        f"Names are identical, no alias needed: '{maker_name}' == '{found_maker['name']}'"
                    )
        else:
            # No maker found via API
            if append_not_found:
                print(f"No maker found for: {maker_name}, adding as not-found maker")
                maker_df, new_id = add_not_found_maker(maker_file, maker_df, maker_name)
            else:
                print(f"No maker found for: {maker_name}")


def main():
    parser = argparse.ArgumentParser(
        description="Process not-found makers and update maker/alias files using DMM API"
    )

    parser.add_argument(
        "--not-found-file",
        default=".tmp/video_makers_not_found.tsv",
        help="Path to not found makers TSV file",
    )

    parser.add_argument(
        "--maker-file", default="data/maker.tsv", help="Path to maker TSV file"
    )

    parser.add_argument(
        "--alias-file",
        default="data/maker-alias.tsv",
        help="Path to maker alias TSV file",
    )

    parser.add_argument("--app-id", help="DMM API App ID")

    parser.add_argument("--aff-id", help="DMM API Affiliate ID")

    parser.add_argument(
        "--clean-only",
        action="store_true",
        help="Only clean existing alias file without processing new makers",
    )

    parser.add_argument(
        "--append-not-found",
        action="store_true",
        help="Append makers that cannot be found via API to the maker file with empty dmm_id",
    )

    args = parser.parse_args()

    if args.clean_only:
        print("Cleaning existing alias file only...")
        clean_existing_alias_file(args.alias_file)
        print("Cleaning complete!")
        return

    # For normal processing, require API credentials unless only appending not-found makers
    if not args.append_not_found and (not args.app_id or not args.aff_id):
        print(
            "Error: --app-id and --aff-id are required unless using --append-not-found only"
        )
        return

    # Validate files exist
    if not Path(args.not_found_file).exists():
        print(f"Error: Not found file {args.not_found_file} does not exist")
        return

    # Ensure directories exist
    Path(args.maker_file).parent.mkdir(parents=True, exist_ok=True)
    Path(args.alias_file).parent.mkdir(parents=True, exist_ok=True)

    print(f"Configuration:")
    print(f"  Not found makers: {args.not_found_file}")
    print(f"  Maker file: {args.maker_file}")
    print(f"  Alias file: {args.alias_file}")
    print(f"  Append not-found: {args.append_not_found}")

    # Process the files
    process_not_found_makers(
        args.not_found_file,
        args.maker_file,
        args.alias_file,
        args.app_id,
        args.aff_id,
        args.append_not_found,
    )

    print("\nProcessing complete!")


if __name__ == "__main__":
    main()
