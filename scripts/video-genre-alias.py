#!/usr/bin/env python3
import csv
import re
import argparse
from pathlib import Path
from difflib import SequenceMatcher
import sys


def normalize_name(name):
    """Normalize genre name for better matching"""
    if not name:
        return ""

    # Remove spaces, convert to lowercase, remove common symbols
    normalized = name.replace(" ", "").replace("　", "").lower()
    normalized = normalized.replace("!", "").replace("？", "").replace("?", "")
    normalized = normalized.replace("・", "").replace(".", "").replace("-", "")
    normalized = (
        normalized.replace("〜", "").replace("~", "").replace("(", "").replace(")", "")
    )
    normalized = (
        normalized.replace("（", "")
        .replace("）", "")
        .replace("【", "")
        .replace("】", "")
    )
    normalized = normalized.replace("●", "").replace("○", "").replace("◆", "")

    return normalized


def calculate_similarity(str1, str2):
    """Calculate similarity between two strings"""
    norm1 = normalize_name(str1)
    norm2 = normalize_name(str2)

    # Exact match after normalization
    if norm1 == norm2:
        return 1.0

    # Use SequenceMatcher for fuzzy matching
    return SequenceMatcher(None, norm1, norm2).ratio()


def load_genre_data(genre_file):
    """Load existing genre data from TSV file"""
    genre_data = {}

    try:
        with open(genre_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f, delimiter="\t")
            for row in reader:
                genre_id = int(row["id"])
                name = row["name"]
                dmm_id = row.get("dmm_id", "")
                ruby = row.get("ruby", "")
                display_name = row.get("display_name", "")

                genre_data[genre_id] = {
                    "name": name,
                    "dmm_id": dmm_id,
                    "ruby": ruby,
                    "display_name": display_name,
                }
    except FileNotFoundError:
        print(f"Error: Genre file not found: {genre_file}")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading genre file: {e}")
        sys.exit(1)

    return genre_data


def load_existing_aliases(alias_file):
    """Load existing alias data"""
    aliases = set()

    try:
        with open(alias_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f, delimiter="\t")
            for row in reader:
                aliases.add((row["name"], int(row["alias_id"]), row["alias"]))
    except FileNotFoundError:
        # File doesn't exist yet, will be created
        pass
    except Exception as e:
        print(f"Warning: Error reading alias file: {e}")

    return aliases


def get_next_genre_id(genre_data):
    """Get the next available ID for the genre file"""
    if not genre_data:
        return 1
    return max(genre_data.keys()) + 1


def save_genre_data(genre_file, genre_data):
    """Save genre data to TSV file"""
    # Sort by ID for consistent output
    sorted_genres = sorted(genre_data.items())

    with open(genre_file, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f, delimiter="\t")
        writer.writerow(["id", "name", "ruby", "display_name", "dmm_id"])
        for genre_id, genre_info in sorted_genres:
            writer.writerow(
                [
                    genre_id,
                    genre_info["name"],
                    genre_info["ruby"],
                    genre_info["display_name"],
                    genre_info["dmm_id"],
                ]
            )


def check_genre_exists_by_name(genre_data, genre_name):
    """Check if a genre already exists by name (case-insensitive)"""
    normalized_search = normalize_name(genre_name)

    for genre_id, genre_info in genre_data.items():
        if normalize_name(genre_info["name"]) == normalized_search:
            return True, genre_id, genre_info["name"]

    return False, None, None


def find_best_match(alternative_name, genre_data, threshold=0.7):
    """Find the best matching canonical genre name"""
    best_match = None
    best_score = 0

    for genre_id, genre_info in genre_data.items():
        canonical_name = genre_info["name"]
        display_name = genre_info["display_name"]

        # Check similarity against both canonical name and display name
        canonical_similarity = calculate_similarity(alternative_name, canonical_name)
        display_similarity = (
            calculate_similarity(alternative_name, display_name) if display_name else 0
        )

        # Use the higher similarity score
        similarity = max(canonical_similarity, display_similarity)

        if similarity > best_score and similarity >= threshold:
            best_score = similarity
            best_match = {
                "id": genre_id,
                "name": canonical_name,
                "display_name": display_name,
                "similarity": similarity,
            }

    return best_match, best_score


def save_aliases(alias_file, aliases):
    """Save aliases to TSV file"""
    # Ensure parent directory exists
    Path(alias_file).parent.mkdir(parents=True, exist_ok=True)

    # Sort aliases by name for consistent output
    sorted_aliases = sorted(aliases, key=lambda x: x[0])

    with open(alias_file, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f, delimiter="\t")
        writer.writerow(["name", "alias", "alias_id"])
        for name, alias_id, alias in sorted_aliases:
            writer.writerow([name, alias, alias_id])


def update_not_found_file(not_found_file, processed_names):
    """Update the not-found file by removing processed entries"""
    remaining_entries = []

    # Read current entries
    with open(not_found_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            if row["name"] not in processed_names:
                remaining_entries.append(row)

    # Write back remaining entries
    with open(not_found_file, "w", encoding="utf-8", newline="") as f:
        if remaining_entries:
            fieldnames = ["name", "not_found_videos"]
            writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter="\t")
            writer.writeheader()
            writer.writerows(remaining_entries)
        else:
            # Write empty file with header
            writer = csv.writer(f, delimiter="\t")
            writer.writerow(["name", "not_found_videos"])


def add_not_found_genre(genre_file, genre_data, genre_name):
    """Add a not-found genre to the genre file with empty dmm_id"""
    next_id = get_next_genre_id(genre_data)

    new_row = {
        "id": int(next_id),
        "name": str(genre_name),
        "dmm_id": "",  # Empty dmm_id for not-found genres
        "ruby": "",  # Empty ruby for not-found genres
        "display_name": "",  # Empty display_name for not-found genres
    }

    # Add to genre data
    genre_data[next_id] = {
        "name": genre_name,
        "dmm_id": "",
        "ruby": "",
        "display_name": "",
    }

    print(f"Added not-found genre: '{genre_name}' (ID: {next_id})")
    return genre_data, next_id


def process_not_found_genres(
    not_found_file,
    genre_file,
    alias_file,
    similarity_threshold=0.7,
    dry_run=False,
    append_not_found=False,
):
    """Main processing function"""

    # Load data
    print("Loading genre data...")
    genre_data = load_genre_data(genre_file)
    print(f"Loaded {len(genre_data)} genres")

    print("Loading existing aliases...")
    existing_aliases = load_existing_aliases(alias_file)
    print(f"Found {len(existing_aliases)} existing aliases")

    # Process not-found file
    new_aliases = []
    new_genres = []
    processed_names = set()

    try:
        with open(not_found_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f, delimiter="\t")

            for row in reader:
                alternative_name = row["name"].strip()
                not_found_videos = row["not_found_videos"].strip()

                print(f"\nProcessing: {alternative_name}")

                # Check if already exists in aliases
                already_exists = any(
                    alias[0] == alternative_name for alias in existing_aliases
                )
                if already_exists:
                    print(f"  → Already exists in aliases, skipping")
                    processed_names.add(alternative_name)
                    continue

                # Check if genre already exists by name in genre data
                exists, existing_id, existing_name = check_genre_exists_by_name(
                    genre_data, alternative_name
                )
                if exists:
                    print(
                        f"  → Already exists in genre data: '{existing_name}' (ID: {existing_id})"
                    )
                    processed_names.add(alternative_name)
                    continue

                # Find best match
                match, score = find_best_match(
                    alternative_name, genre_data, similarity_threshold
                )

                if match:
                    canonical_name = match["name"]
                    genre_id = match["id"]
                    similarity = match["similarity"]
                    display_name = match["display_name"]

                    print(
                        f"  → Found match: '{canonical_name}' (ID: {genre_id}, similarity: {similarity:.3f})"
                    )
                    if display_name:
                        print(f"    Display name: '{display_name}'")

                    # Check if this exact alias already exists
                    alias_tuple = (alternative_name, genre_id, canonical_name)
                    if alias_tuple not in existing_aliases:
                        new_aliases.append(alias_tuple)
                        processed_names.add(alternative_name)
                        print(f"  → Added new alias")
                    else:
                        print(f"  → Alias already exists")
                        processed_names.add(alternative_name)
                else:
                    print(f"  → No match found (threshold: {similarity_threshold})")

                    # Handle not-found genres if append_not_found is enabled
                    if append_not_found:
                        genre_data, new_id = add_not_found_genre(
                            genre_file, genre_data, alternative_name
                        )

                        new_genres.append(
                            {
                                "id": new_id,
                                "name": alternative_name,
                                "dmm_id": "",
                                "ruby": "",
                                "display_name": "",
                            }
                        )

                        processed_names.add(alternative_name)

    except FileNotFoundError:
        print(f"Error: Not-found file not found: {not_found_file}")
        sys.exit(1)

    # Summary
    print(f"\n" + "=" * 60)
    print(f"PROCESSING SUMMARY")
    print(f"=" * 60)
    print(f"New aliases found: {len(new_aliases)}")
    print(f"New genres added: {len(new_genres)}")
    print(f"Names to be removed from not-found file: {len(processed_names)}")

    if new_aliases:
        print(f"\nNEW ALIASES:")
        for name, alias_id, alias in new_aliases:
            print(f"  '{name}' → '{alias}' (ID: {alias_id})")

    if new_genres:
        print(f"\nNEW GENRES:")
        for genre in new_genres:
            print(f"  '{genre['name']}' (ID: {genre['id']}) - no dmm_id")

    if dry_run:
        print(f"\nDRY RUN MODE - No files were modified")
        return

    # Update files
    if new_aliases:
        print(f"\nUpdating alias file...")
        all_aliases = existing_aliases.union(set(new_aliases))
        save_aliases(alias_file, all_aliases)
        print(f"Saved {len(all_aliases)} aliases to {alias_file}")

    if new_genres:
        print(f"\nUpdating genre file...")
        save_genre_data(genre_file, genre_data)
        print(f"Added {len(new_genres)} new genres to {genre_file}")

    if processed_names:
        print(f"Updating not-found file...")
        update_not_found_file(not_found_file, processed_names)
        print(f"Removed {len(processed_names)} processed entries from {not_found_file}")

    print(f"\nProcessing complete!")


def main():
    parser = argparse.ArgumentParser(
        description="Match alternative genre names with canonical names and update alias file"
    )

    parser.add_argument("not_found_file", help="Path to the not-found genres TSV file")

    parser.add_argument("genre_file", help="Path to the existing genre TSV file")

    parser.add_argument(
        "alias_file",
        help="Path to the genre alias TSV file (will be created if not exists)",
    )

    parser.add_argument(
        "-t",
        "--threshold",
        type=float,
        default=0.7,
        help="Similarity threshold for matching (0.0-1.0, default: 0.7)",
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without making changes",
    )

    parser.add_argument(
        "--append-not-found",
        action="store_true",
        help="Add genres that cannot be matched to the genre file with empty dmm_id, ruby, and display_name",
    )

    args = parser.parse_args()

    # Validate threshold
    if not 0.0 <= args.threshold <= 1.0:
        print("Error: Threshold must be between 0.0 and 1.0")
        sys.exit(1)

    # Validate files exist
    if not Path(args.not_found_file).exists():
        print(f"Error: Not-found file does not exist: {args.not_found_file}")
        sys.exit(1)

    if not Path(args.genre_file).exists():
        print(f"Error: Genre file does not exist: {args.genre_file}")
        sys.exit(1)

    print(f"Configuration:")
    print(f"  Not-found file: {args.not_found_file}")
    print(f"  Genre file: {args.genre_file}")
    print(f"  Alias file: {args.alias_file}")
    print(f"  Similarity threshold: {args.threshold}")
    print(f"  Append not-found: {args.append_not_found}")
    print(f"  Dry run: {args.dry_run}")

    # Process files
    process_not_found_genres(
        args.not_found_file,
        args.genre_file,
        args.alias_file,
        args.threshold,
        args.dry_run,
        args.append_not_found,
    )


if __name__ == "__main__":
    main()
