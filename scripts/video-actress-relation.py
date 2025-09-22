#!/usr/bin/env python3
"""
Script to create many-to-many relational datasets between videos and actresses/genres,
and optionally create a new video TSV dataset.
"""

import csv
import sys
import re
import argparse
from typing import Dict, List, Tuple, Optional

def load_actress_data(actress_csv_path: str) -> Dict[str, int]:
    """
    Load actress data from CSV and create a mapping from name to ID.
    
    Args:
        actress_csv_path: Path to the actress CSV file
        
    Returns:
        Dictionary mapping actress names to their IDs
    """
    actress_name_to_id = {}
    
    try:
        with open(actress_csv_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                actress_id = int(row['id'])
                name = row['name'].strip()
                display_name = row['display_name'].strip()
                
                # Add both name and display_name to the mapping
                if name:
                    actress_name_to_id[name] = actress_id
                if display_name and display_name != name:
                    actress_name_to_id[display_name] = actress_id
                    
    except FileNotFoundError:
        print(f"Error: Actress CSV file '{actress_csv_path}' not found.")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading actress CSV file: {e}")
        sys.exit(1)
        
    print(f"Loaded {len(set(actress_name_to_id.values()))} unique actresses")
    return actress_name_to_id

def load_genre_data(genre_csv_path: str) -> Dict[str, int]:
    """
    Load genre data from CSV and create a mapping from name to ID.
    
    Args:
        genre_csv_path: Path to the genre CSV file
        
    Returns:
        Dictionary mapping genre names to their IDs
    """
    genre_name_to_id = {}
    
    try:
        with open(genre_csv_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                genre_id = int(row['id'])
                name = row['name'].strip()
                display_name = row.get('display_name', '').strip()
                
                # Add both name and display_name to the mapping
                if name:
                    genre_name_to_id[name] = genre_id
                if display_name and display_name != name:
                    genre_name_to_id[display_name] = genre_id
                    
    except FileNotFoundError:
        print(f"Error: Genre CSV file '{genre_csv_path}' not found.")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading genre CSV file: {e}")
        sys.exit(1)
        
    print(f"Loaded {len(set(genre_name_to_id.values()))} unique genres")
    return genre_name_to_id

def load_maker_data(maker_csv_path: str) -> Dict[str, int]:
    """
    Load maker data from CSV and create a mapping from name to ID.
    
    Args:
        maker_csv_path: Path to the maker CSV file
        
    Returns:
        Dictionary mapping maker names to their IDs
    """
    maker_name_to_id = {}
    
    try:
        with open(maker_csv_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                maker_id = int(row['id'])
                name = row['name'].strip()
                display_name = row.get('display_name', '').strip()
                
                if name:
                    maker_name_to_id[name] = maker_id
                if display_name and display_name != name:
                    maker_name_to_id[display_name] = maker_id
                    
    except FileNotFoundError:
        print(f"Error: Maker CSV file '{maker_csv_path}' not found.")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading maker CSV file: {e}")
        sys.exit(1)
        
    print(f"Loaded {len(set(maker_name_to_id.values()))} unique makers")
    return maker_name_to_id

def load_maker_alias_table(alias_csv_path: str) -> Dict[str, Tuple[str, int]]:
    """
    Load maker alias table from TSV and return a mapping from alias name to (canonical name, id).
    """
    alias_map = {}
    try:
        with open(alias_csv_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file, delimiter='\t')
            for row in reader:
                name = row['name'].strip()
                alias = row['alias'].strip()
                alias_id = int(row['alias_id'])
                # Map both alias and canonical name to (canonical name, id)
                if alias:
                    alias_map[alias] = (name, alias_id)
                if name:
                    alias_map[name] = (name, alias_id)
    except Exception as e:
        print(f"Error reading maker alias table: {e}")
        sys.exit(1)
    print(f"Loaded {len(alias_map)} maker aliases")
    return alias_map

def load_genre_alias_table(alias_csv_path: str) -> Dict[str, Tuple[str, int]]:
    """
    Load genre alias table from TSV and return a mapping from alias name to (canonical name, id).
    """
    alias_map = {}
    try:
        with open(alias_csv_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file, delimiter='\t')
            for row in reader:
                name = row['name'].strip()
                alias = row['alias'].strip()
                alias_id = int(row['alias_id'])
                if alias:
                    alias_map[alias] = (name, alias_id)
                if name:
                    alias_map[name] = (name, alias_id)
    except Exception as e:
        print(f"Error reading genre alias table: {e}")
        sys.exit(1)
    print(f"Loaded {len(alias_map)} genre aliases")
    return alias_map

def load_series_alias_table(alias_csv_path: str) -> Dict[str, Tuple[str, int]]:
    """
    Load series alias table from TSV and return a mapping from alias name to (canonical name, id).
    """
    alias_map = {}
    try:
        with open(alias_csv_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file, delimiter='\t')
            for row in reader:
                name = row['name'].strip()
                alias = row['alias'].strip()
                alias_id = int(row['alias_id'])
                if alias:
                    alias_map[alias] = (name, alias_id)
                if name:
                    alias_map[name] = (name, alias_id)
    except Exception as e:
        print(f"Error reading series alias table: {e}")
        sys.exit(1)
    print(f"Loaded {len(alias_map)} series aliases")
    return alias_map

def parse_comma_separated_string(input_string: str) -> List[str]:
    """
    Parse comma-separated string and return a list of individual items.
    
    Args:
        input_string: Comma-separated string
        
    Returns:
        List of individual items
    """
    if not input_string or input_string.strip() == '':
        return []
    
    # Split by comma and clean up each item
    items = [item.strip() for item in input_string.split(',')]
    # Filter out empty strings
    items = [item for item in items if item]
    
    return items

def find_item_id(item_name: str, item_mapping: Dict[str, int]) -> Optional[int]:
    """
    Find item ID by name, trying different variations if exact match fails.
    
    Args:
        item_name: Name to search for
        item_mapping: Dictionary mapping names to IDs
        
    Returns:
        Item ID if found, None otherwise
    """
    # Try exact match first
    if item_name in item_mapping:
        return item_mapping[item_name]
    
    # Try case-insensitive match
    for name, item_id in item_mapping.items():
        if name.lower() == item_name.lower():
            return item_id
    
    # Try partial match (for names with parentheses or variations)
    item_name_clean = re.sub(r'\([^)]*\)', '', item_name).strip()
    if item_name_clean != item_name and item_name_clean in item_mapping:
        return item_mapping[item_name_clean]
    
    return None

def create_video_dataset(
    video_tsv_path: str,
    output_path: str,
    maker_mapping: Dict[str, int],
    series_mapping: Dict[str, int],
    maker_alias_map: Dict[str, Tuple[str, int]],
    series_alias_map: Dict[str, Tuple[str, int]]
):
    """
    Create a new video TSV dataset based on the Video entity structure,
    including maker_id and series_id columns.
    """
    print("Creating new video dataset...")

    # Add maker_id and series_id to the output columns
    output_columns = [
        'id',           # PrimaryGeneratedColumn
        'code',         # display_id from input
        'dmm_id',       # dmm_id from input
        'title',        # title from input
        'label',        # label (not in input, will be null)
        'release_date', # release_date from input
        'length',       # length (not in input, will be null)
        'description',  # description from input
        'maker_id',     # NEW: maker_id
        'series_id',    # NEW: series_id
    ]

    try:
        with open(video_tsv_path, 'r', encoding='utf-8') as input_file, \
             open(output_path, 'w', encoding='utf-8', newline='') as output_file:

            reader = csv.DictReader(input_file, delimiter='\t')
            writer = csv.writer(output_file, delimiter='\t')

            # Write header
            writer.writerow(output_columns)

            video_count = 0
            for row in reader:
                video_count += 1

                # Lookup maker_id
                maker_name = row.get('makers', '').strip()
                maker_id = None
                if maker_name:
                    maker_id = find_item_id(maker_name, maker_mapping)
                    if maker_id is None and maker_alias_map:
                        alias_result = maker_alias_map.get(maker_name)
                        if alias_result:
                            _, maker_id = alias_result

                # Lookup series_id
                series_name = row.get('series', '').strip()
                series_id = None
                if series_name:
                    series_id = find_item_id(series_name, series_mapping)
                    if series_id is None and series_alias_map:
                        alias_result = series_alias_map.get(series_name)
                        if alias_result:
                            _, series_id = alias_result

                # Map input columns to output columns
                output_row = [
                    video_count,  # Auto-increment ID
                    row.get('display_id', '').strip() or None,  # code (display_id)
                    row.get('dmm_id', '').strip() or None,      # dmm_id
                    row.get('title', '').strip() or '',         # title (required)
                    row.get('label', '').strip() or None,       # label
                    row.get('release_date', '').strip() or None, # release_date
                    row.get('length', '').strip() or None,      # length
                    row.get('description', '').strip() or None, # description
                    maker_id,                                   # NEW: maker_id
                    series_id,                                  # NEW: series_id
                ]

                writer.writerow(output_row)

        print(f"✅ Successfully created video dataset with {video_count} videos at: {output_path}")

    except FileNotFoundError:
        print(f"Error: Video TSV file '{video_tsv_path}' not found.")
        sys.exit(1)
    except Exception as e:
        print(f"Error creating video dataset: {e}")
        sys.exit(1)

def process_video_data(video_tsv_path: str, actress_mapping: Dict[str, int], genre_mapping: Dict[str, int], maker_mapping: Dict[str, int], series_mapping: Dict[str, int], maker_alias_map: Dict[str, Tuple[str, int]], genre_alias_map: Dict[str, Tuple[str, int]], series_alias_map: Dict[str, Tuple[str, int]]) -> Tuple[List[Tuple[int, int]], List[Tuple[int, int]], List[Tuple[int, int]], List[Tuple[int, int]]]:
    """
    Process video TSV file and extract video relationships.
    
    Args:
        video_tsv_path: Path to the video TSV file
        actress_mapping: Dictionary mapping actress names to IDs
        genre_mapping: Dictionary mapping genre names to IDs
        maker_mapping: Dictionary mapping maker names to IDs
        series_mapping: Dictionary mapping series names to IDs
        
    Returns:
        Tuple of (video-actress relationships, video-genre relationships, video-maker relationships, video-series relationships)
    """
    actress_relationships = []
    genre_relationships = []
    maker_relationships = []
    series_relationships = []
    not_found_actresses = {}
    not_found_genres = {}
    not_found_makers = {}
    not_found_series = {}
    total_actresses_processed = 0
    total_genres_processed = 0
    
    try:
        with open(video_tsv_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file, delimiter='\t')
            for row_num, row in enumerate(reader, start=1):
                video_id = int(row['id'])
                display_id = row.get('display_id', '').strip()
                actress_string = row.get('actress', '').strip()
                genre_string = row.get('genre', '').strip()
                maker_name = row.get('makers', '').strip()
                series_name = row.get('series', '').strip()

                # Actress processing (same as before)
                actresses = parse_comma_separated_string(actress_string)
                total_actresses_processed += len(actresses)
                for actress_name in actresses:
                    actress_id = find_item_id(actress_name, actress_mapping)
                    if actress_id is not None:
                        actress_relationships.append((video_id, actress_id))
                    else:
                        if actress_name not in not_found_actresses:
                            not_found_actresses[actress_name] = []
                        not_found_actresses[actress_name].append(display_id)

                # Genre processing (same as before)
                genres = parse_comma_separated_string(genre_string)
                total_genres_processed += len(genres)
                for genre_name in genres:
                    genre_id = find_item_id(genre_name, genre_mapping)
                    # Try alias table if not found
                    if genre_id is None and genre_alias_map:
                        alias_result = genre_alias_map.get(genre_name)
                        if alias_result:
                            _, genre_id = alias_result
                    if genre_id is not None:
                        genre_relationships.append((video_id, genre_id))
                    else:
                        if genre_name not in not_found_genres:
                            not_found_genres[genre_name] = []
                        not_found_genres[genre_name].append(display_id)

                # Maker processing (same as before)
                if maker_name:
                    maker_id = find_item_id(maker_name, maker_mapping)
                    # Try alias table if not found
                    if maker_id is None and maker_alias_map:
                        alias_result = maker_alias_map.get(maker_name)
                        if alias_result:
                            _, maker_id = alias_result
                    if maker_id is not None:
                        maker_relationships.append((video_id, maker_id))
                    else:
                        if maker_name not in not_found_makers:
                            not_found_makers[maker_name] = []
                        not_found_makers[maker_name].append(display_id)

                # Series processing (one-to-many, only one series per video)
                if series_name:
                    series_id = find_item_id(series_name, series_mapping)
                    # Try alias table if not found
                    if series_id is None and series_alias_map:
                        alias_result = series_alias_map.get(series_name)
                        if alias_result:
                            _, series_id = alias_result
                    if series_id is not None:
                        series_relationships.append((video_id, series_id))
                    else:
                        if series_name not in not_found_series:
                            not_found_series[series_name] = []
                        not_found_series[series_name].append(display_id)

    except Exception as e:
        print(f"Error reading video TSV file: {e}")
        sys.exit(1)

    # Save not found items
    save_not_found_items(not_found_actresses, "data/video_actresses_not_found.tsv", "Actresses")
    save_not_found_items(not_found_genres, "data/video_genres_not_found.tsv", "Genres")
    save_not_found_items(not_found_makers, "data/video_makers_not_found.tsv", "Makers")
    save_not_found_items(not_found_series, "data/video_series_not_found.tsv", "Series")

    return actress_relationships, genre_relationships, maker_relationships, series_relationships

def save_not_found_items(not_found_items: Dict[str, List[str]], output_path: str, item_type: str):
    """
    Save not found items to TSV file.
    
    Args:
        not_found_items: Dictionary of not found items and their videos
        output_path: Path to output TSV file
        item_type: Type of items (for reporting)
    """
    if not not_found_items:
        return
        
    print(f"\n{'='*60}")
    print(f"{item_type.upper()} NOT FOUND IN DATASET")
    print(f"{'='*60}")
    
    # Sort by frequency (most common first)
    sorted_not_found = sorted(not_found_items.items(), 
                            key=lambda x: len(x[1]), reverse=True)
    
    for i, (item_name, video_ids) in enumerate(sorted_not_found[:20]):  # Show top 20
        print(f"{i+1:2d}. '{item_name}' (appears in {len(video_ids)} video{'s' if len(video_ids) > 1 else ''})")
        if len(video_ids) <= 3:
            print(f"    Videos: {', '.join(video_ids)}")
        else:
            print(f"    Videos: {', '.join(video_ids[:3])}... and {len(video_ids)-3} more")
    
    if len(not_found_items) > 20:
        print(f"    ... and {len(not_found_items) - 20} more {item_type.lower()} not shown")
        
    try:
        with open(output_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f, delimiter='\t')
            writer.writerow(['name', 'not_found_videos'])
            
            for item_name, video_ids in sorted_not_found:
                # Join video IDs without spaces after commas
                videos_str = ','.join(video_ids)
                writer.writerow([item_name, videos_str])
                
        print(f"\n📄 Complete {item_type.lower()} list saved to: {output_path}")
        
    except Exception as e:
        print(f"Error saving not found {item_type.lower()} TSV: {e}")

def write_relationships(relationships: List[Tuple[int, int]], output_path: str, relationship_type: str):
    """
    Write relationships to TSV file.
    
    Args:
        relationships: List of (video_id, item_id) tuples
        output_path: Path to output TSV file
        relationship_type: Type of relationship (for column naming)
    """
    try:
        with open(output_path, 'w', encoding='utf-8', newline='') as file:
            writer = csv.writer(file, delimiter='\t')
            
            # Write header
            writer.writerow(['video_id', f'{relationship_type}_id'])
            
            # Write relationships
            for video_id, item_id in relationships:
                writer.writerow([video_id, item_id])
                
        print(f"\nSuccessfully wrote {len(relationships)} {relationship_type} relationships to '{output_path}'")
        
    except Exception as e:
        print(f"Error writing {relationship_type} output file: {e}")
        sys.exit(1)

def write_video_maker_relationships(relationships: List[Tuple[int, int]], output_path: str):
    """
    Write video-maker relationships to TSV file.
    
    Args:
        relationships: List of (video_id, maker_id) tuples
        output_path: Path to output TSV file
    """
    try:
        with open(output_path, 'w', encoding='utf-8', newline='') as file:
            writer = csv.writer(file, delimiter='\t')
            writer.writerow(['video_id', 'maker_id'])
            for video_id, maker_id in relationships:
                writer.writerow([video_id, maker_id])
        print(f"\nSuccessfully wrote {len(relationships)} maker relationships to '{output_path}'")
    except Exception as e:
        print(f"Error writing maker output file: {e}")
        sys.exit(1)

def load_series_data(series_csv_path: str) -> Dict[str, int]:
    """
    Load series data from CSV and create a mapping from name to ID.
    
    Args:
        series_csv_path: Path to the series CSV file
        
    Returns:
        Dictionary mapping series names to their IDs
    """
    series_name_to_id = {}
    
    try:
        with open(series_csv_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file, delimiter='|')  # Note: series.csv uses | delimiter
            for row in reader:
                series_id = int(row['id'])
                name = row['name'].strip()
                ruby = row.get('ruby', '').strip()
                
                # Add both name and ruby to the mapping
                if name:
                    series_name_to_id[name] = series_id
                if ruby and ruby != name:
                    series_name_to_id[ruby] = series_id
                    
    except FileNotFoundError:
        print(f"Error: Series CSV file '{series_csv_path}' not found.")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading series CSV file: {e}")
        sys.exit(1)
        
    print(f"Loaded {len(set(series_name_to_id.values()))} unique series")
    return series_name_to_id

def main():
    """Main function to process the files and create relationships."""
    parser = argparse.ArgumentParser(description='Create video relationships and datasets')
    parser.add_argument('video_tsv', help='Path to the video TSV file')
    parser.add_argument('actress_csv', help='Path to the actress CSV file')
    parser.add_argument('genre_csv', help='Path to the genre CSV file')
    parser.add_argument('maker_csv', help='Path to the maker CSV file')
    parser.add_argument('series_csv', help='Path to the series CSV file')
    parser.add_argument('--create-video-dataset', action='store_true', 
                       help='Create a new video TSV dataset based on Video entity structure')
    parser.add_argument('--video-output', default='data/videos.tsv',
                       help='Output path for the new video dataset (default: data/videos.tsv)')
    parser.add_argument('--maker-alias', dest='maker_alias', default=None, help='Optional path to maker alias TSV file')
    parser.add_argument('--genre-alias', dest='genre_alias', default=None, help='Optional path to genre alias TSV file')
    parser.add_argument('--series-alias', dest='series_alias', default=None, help='Optional path to series alias TSV file')
    
    args = parser.parse_args()
    
    
    print("Loading actress data...")
    actress_mapping = load_actress_data(args.actress_csv)
    
    print("Loading genre data...")
    genre_mapping = load_genre_data(args.genre_csv)
    
    print("Loading maker data...")
    maker_mapping = load_maker_data(args.maker_csv)
    
    print("Loading series data...")
    series_mapping = load_series_data(args.series_csv)
    
    maker_alias_map = {}
    if args.maker_alias:
        print("Loading maker alias table...")
        maker_alias_map = load_maker_alias_table(args.maker_alias)
    
    genre_alias_map = {}
    if args.genre_alias:
        print("Loading genre alias table...")
        genre_alias_map = load_genre_alias_table(args.genre_alias)
    
    series_alias_map = {}
    if args.series_alias:
        print("Loading series alias table...")
        series_alias_map = load_series_alias_table(args.series_alias)
        
        
    # Create video dataset if requested
    if args.create_video_dataset:
        create_video_dataset(
            args.video_tsv,
            args.video_output,
            maker_mapping,
            series_mapping,
            maker_alias_map,
            series_alias_map
        )
    
    print("Processing video data...")
    actress_relationships, genre_relationships, maker_relationships, series_relationships = process_video_data(
        args.video_tsv, actress_mapping, genre_mapping, maker_mapping, series_mapping, maker_alias_map, genre_alias_map, series_alias_map
    )
    
    print("Writing relationships...")
    write_relationships(actress_relationships, "data/video-actress.tsv", "actress")
    write_relationships(genre_relationships, "data/video-genre.tsv", "genre")
    write_relationships(maker_relationships, "data/video-maker.tsv", "maker")
    write_relationships(series_relationships, "data/video-series.tsv", "series")
    
    print(f"\n{'='*60}")
    print(f"FINAL RESULTS")
    print(f"{'='*60}")
    print(f"Actress relationships created: {len(actress_relationships)}")
    print(f"Genre relationships created: {len(genre_relationships)}")
    print(f"Maker relationships created: {len(maker_relationships)}")
    print(f"Series relationships created: {len(series_relationships)}")
    print(f"Total relationships created: {len(actress_relationships) + len(genre_relationships) + len(maker_relationships) + len(series_relationships)}")
    print(f"Output files: data/video-actress.tsv, data/video-genre.tsv, data/video-maker.tsv, data/video-series.tsv")
    
    if args.create_video_dataset:
        print(f"Video dataset: {args.video_output}")

if __name__ == "__main__":
    main()
