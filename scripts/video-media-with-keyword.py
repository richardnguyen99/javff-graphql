#!/usr/bin/env python3
import os
import csv
import requests
import json
import time
import threading
import argparse
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlencode, quote
from pathlib import Path
import re


def ensure_directory(file_path):
    """Create directory for file if it doesn't exist"""
    Path(file_path).parent.mkdir(parents=True, exist_ok=True)


class ThreadSafeWriter:
    """Thread-safe writer for TSV files"""

    def __init__(
        self,
        covers_file,
        sample_images_file,
        sample_videos_file,
        mapping_file,
        append_mode=False,
    ):
        self.lock = threading.Lock()
        self.covers_file = Path(covers_file)
        self.sample_images_file = Path(sample_images_file)
        self.sample_videos_file = Path(sample_videos_file)
        self.mapping_file = Path(mapping_file)
        self.append_mode = append_mode
        self.processed_video_ids = set()  # Track successfully processed videos

        # Initialize files with headers
        self._initialize_files()

    def _initialize_files(self):
        """Initialize TSV files with headers"""
        files_config = [
            (self.covers_file, ["video_id", "attribute", "url"]),
            (self.sample_images_file, ["video_id", "attribute", "ordering", "url"]),
            (self.sample_videos_file, ["video_id", "attribute", "url"]),
            (
                self.mapping_file,
                ["id", "display_id", "dmm_id", "fetched_dmm_id", "source"],
            ),
        ]

        with self.lock:
            for file_path, headers in files_config:
                ensure_directory(file_path)
                # Create header if file doesn't exist or not in append mode
                if not file_path.exists() or not self.append_mode:
                    mode = "a" if self.append_mode and file_path.exists() else "w"
                    with open(file_path, mode, encoding="utf-8", newline="") as f:
                        if mode == "w":  # Only write header for new files
                            writer = csv.writer(f, delimiter="\t")
                            writer.writerow(headers)

    def write_covers(self, covers_data):
        """Thread-safe write of cover data"""
        if not covers_data:
            return

        with self.lock:
            with open(self.covers_file, "a", encoding="utf-8", newline="") as f:
                writer = csv.writer(f, delimiter="\t")
                writer.writerows(covers_data)

    def write_sample_images(self, sample_images_data):
        """Thread-safe write of sample images data"""
        if not sample_images_data:
            return

        with self.lock:
            with open(self.sample_images_file, "a", encoding="utf-8", newline="") as f:
                writer = csv.writer(f, delimiter="\t")
                writer.writerows(sample_images_data)

    def write_sample_videos(self, sample_videos_data):
        """Thread-safe write of sample videos data"""
        if not sample_videos_data:
            return

        with self.lock:
            with open(self.sample_videos_file, "a", encoding="utf-8", newline="") as f:
                writer = csv.writer(f, delimiter="\t")
                writer.writerows(sample_videos_data)

    def write_mapping(self, mapping_data):
        """Thread-safe write of mapping data"""
        with self.lock:
            with open(self.mapping_file, "a", encoding="utf-8", newline="") as f:
                writer = csv.writer(f, delimiter="\t")
                writer.writerow(mapping_data)

    def mark_video_processed(self, video_id):
        """Mark a video as successfully processed"""
        with self.lock:
            self.processed_video_ids.add(video_id)

    def get_processed_video_ids(self):
        """Get the set of successfully processed video IDs"""
        with self.lock:
            return self.processed_video_ids.copy()


def read_no_samples_with_title_tsv(file_path):
    """Read the no-samples TSV file with title column"""
    videos = []
    with open(file_path, "r", encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file, delimiter="\t")
        for row in reader:
            video = {
                "id": row.get("id", ""),
                "display_id": row.get("display_id", ""),
                "dmm_id": row.get("dmm_id", ""),
                "first_transformed_dmm_id": row.get("first_transformed_dmm_id", ""),
                "second_transformed_dmm_id": row.get("second_transformed_dmm_id", ""),
                "title": row.get("title", ""),
            }
            videos.append(video)
    return videos


def update_no_samples_file(input_file, processed_video_ids):
    """Remove successfully processed videos from the no-samples file"""
    if not processed_video_ids:
        print("No videos were successfully processed, keeping original file unchanged")
        return

    print(
        f"Updating {input_file} - removing {len(processed_video_ids)} successfully processed videos"
    )

    # Read all videos from the original file
    try:
        all_videos = read_no_samples_with_title_tsv(input_file)
    except Exception as e:
        print(f"Error reading original file for update: {e}")
        return

    # Filter out successfully processed videos
    remaining_videos = [
        video for video in all_videos if video.get("id", "") not in processed_video_ids
    ]

    # Create a backup of the original file
    backup_file = f"{input_file}.backup"
    try:
        import shutil

        shutil.copy2(input_file, backup_file)
        print(f"Created backup: {backup_file}")
    except Exception as e:
        print(f"Warning: Could not create backup: {e}")

    # Write the updated file
    try:
        with open(input_file, "w", encoding="utf-8", newline="") as f:
            if (
                remaining_videos or all_videos
            ):  # Write header if we have any videos or had any videos
                fieldnames = [
                    "id",
                    "display_id",
                    "dmm_id",
                    "first_transformed_dmm_id",
                    "second_transformed_dmm_id",
                    "title",
                ]
                writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter="\t")
                writer.writeheader()

                for video in remaining_videos:
                    writer.writerow(video)

        print(
            f"Updated {input_file}: {len(remaining_videos)} videos remaining (removed {len(all_videos) - len(remaining_videos)} processed videos)"
        )

        if not remaining_videos:
            print(
                "All videos were successfully processed! The no-samples file is now empty (contains only headers)."
            )

    except Exception as e:
        print(f"Error updating {input_file}: {e}")
        # Try to restore from backup
        if os.path.exists(backup_file):
            try:
                shutil.copy2(backup_file, input_file)
                print(f"Restored original file from backup due to error")
            except Exception as restore_error:
                print(f"Failed to restore from backup: {restore_error}")


def fetch_dmm_search_api(app_id, aff_id, title, service="digital", floor="videoa"):
    """Search DMM API using title keyword"""
    base_url = "https://api.dmm.com/affiliate/v3/ItemList"

    # Determine site based on service
    site = "FANZA"

    params = {
        "api_id": app_id,
        "affiliate_id": aff_id,
        "site": site,
        "service": service,
        "floor": floor,
        "keyword": title,
        "hits": 5,  # Get more results to increase chances of finding exact match
    }

    url = f"{base_url}?{urlencode(params, quote_via=quote)}"

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error searching for title '{title}': {e}")
        return None


def is_api_success(api_response):
    """Check if API response indicates success with data"""
    if not api_response:
        return False

    result = api_response.get("result", {})
    return (
        result.get("status") == 200
        and result.get("result_count", 0) > 0
        and len(result.get("items", [])) > 0
    )


def process_search_data(video_id, api_response, source_type):
    """Process API search response and extract image/video data"""
    video_covers_data = []
    sample_images_data = []
    sample_videos_data = []
    fetched_dmm_id = None

    try:
        if not is_api_success(api_response):
            return (
                video_covers_data,
                sample_images_data,
                sample_videos_data,
                fetched_dmm_id,
            )

        items = api_response.get("result", {}).get("items", [])
        if not items:
            return (
                video_covers_data,
                sample_images_data,
                sample_videos_data,
                fetched_dmm_id,
            )

        # Use the first item (most relevant)
        item = items[0]

        # Get content_id for mapping
        fetched_dmm_id = item.get("content_id", "")

        # Process imageURL
        image_url = item.get("imageURL", {})
        for attribute, url in image_url.items():
            if url:
                video_covers_data.append([video_id, f"{attribute}_{source_type}", url])

        # Process sampleImageURL
        sample_image_url = item.get("sampleImageURL", {})
        for attribute, data in sample_image_url.items():
            if isinstance(data, dict) and "image" in data:
                images = data["image"]
                if isinstance(images, list):
                    for i, url in enumerate(images):
                        if url:
                            sample_images_data.append(
                                [video_id, f"{attribute}_{source_type}", i + 1, url]
                            )

        # Process sampleMovieURL
        sample_movie_url = item.get("sampleMovieURL", {})
        for attribute, url in sample_movie_url.items():
            if attribute.startswith("size_") and url:
                sample_videos_data.append([video_id, f"{attribute}_{source_type}", url])

    except Exception as e:
        print(f"Error processing search data for video_id {video_id}: {e}")

    return video_covers_data, sample_images_data, sample_videos_data, fetched_dmm_id


def search_worker(video, writer, app_id, aff_id):
    """Worker function for title search threads"""
    video_id = video["id"]
    display_id = video["display_id"]
    dmm_id = video["dmm_id"]
    title = video["title"]

    if not title.strip():
        print(f"[Thread] Skipping video {video_id}: no title provided")
        return

    print(f"[Thread] Searching for video {video_id} with title: {title}")

    found_data = False

    # Try digital search first
    print(f"  [Thread] Searching digital for: {title}")
    digital_response = fetch_dmm_search_api(app_id, aff_id, title, "digital", "videoa")

    if is_api_success(digital_response):
        covers, sample_images, sample_videos, fetched_dmm_id = process_search_data(
            video_id, digital_response, "digital"
        )

        if covers or sample_images or sample_videos:
            writer.write_covers(covers)
            writer.write_sample_images(sample_images)
            writer.write_sample_videos(sample_videos)
            writer.write_mapping(
                [video_id, display_id, dmm_id, fetched_dmm_id, "digital"]
            )
            writer.mark_video_processed(video_id)  # Mark as successfully processed
            found_data = True
            print(f"  [Thread] Digital search successful for video {video_id}")
            print(
                f"  [Thread] Added {len(covers)} covers, {len(sample_images)} sample images, {len(sample_videos)} sample videos"
            )

    # If digital search didn't yield results, try DVD search
    if not found_data:
        print(f"  [Thread] Searching DVD for: {title}")
        dvd_response = fetch_dmm_search_api(app_id, aff_id, title, "mono", "dvd")

        if is_api_success(dvd_response):
            covers, sample_images, sample_videos, fetched_dmm_id = process_search_data(
                video_id, dvd_response, "dvd"
            )

            if covers or sample_images or sample_videos:
                writer.write_covers(covers)
                writer.write_sample_images(sample_images)
                writer.write_sample_videos(sample_videos)
                writer.write_mapping(
                    [video_id, display_id, dmm_id, fetched_dmm_id, "dvd"]
                )
                writer.mark_video_processed(video_id)  # Mark as successfully processed
                found_data = True
                print(f"  [Thread] DVD search successful for video {video_id}")
                print(
                    f"  [Thread] Added {len(covers)} covers, {len(sample_images)} sample images, {len(sample_videos)} sample videos"
                )

    if not found_data:
        print(
            f"  [Thread] No media found for video {video_id} in either digital or DVD search"
        )


def process_videos_by_title(videos, writer, app_id, aff_id):
    """Process videos using title-based search"""
    print(f"Processing {len(videos)} videos using title search...")

    # Start thread pool executor
    with ThreadPoolExecutor(max_workers=4) as executor:
        # Process each video
        for i, video in enumerate(videos):
            video_id = video.get("id")
            title = video.get("title", "").strip()

            if not video_id:
                print(f"Skipping video at row {i+1}: missing id")
                continue

            if not title:
                print(f"Skipping video {video_id}: missing title")
                continue

            print(f"Queuing video {i+1}/{len(videos)}: {video_id}")

            # Submit search task to thread pool
            executor.submit(search_worker, video, writer, app_id, aff_id)

            # Add small delay between submissions to avoid overwhelming the API
            time.sleep(0.1)


def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description="Search for video media using title keywords from no-samples file",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic usage with custom output paths
  python title-search.py -i data/videos-no-samples.tsv --app-id APP_ID --aff-id AFF_ID \\
    --output-covers data/title-covers.tsv \\
    --output-sample-images data/title-sample-images.tsv \\
    --output-sample-videos data/title-sample-videos.tsv \\
    --output-mapping data/title-mapping.tsv

  # Append to existing files
  python title-search.py -i data/videos-no-samples.tsv --app-id APP_ID --aff-id AFF_ID \\
    --output-covers data/covers.tsv --append \\
    --output-sample-images data/sample-images.tsv \\
    --output-sample-videos data/sample-videos.tsv \\
    --output-mapping data/mapping.tsv
        """,
    )

    # Required arguments
    parser.add_argument(
        "-i",
        "--input",
        type=str,
        required=True,
        help="Input no-samples TSV file with title column (required)",
    )

    parser.add_argument(
        "--app-id", type=str, required=True, help="DMM API App ID (required)"
    )

    parser.add_argument(
        "--aff-id", type=str, required=True, help="DMM API Affiliate ID (required)"
    )

    parser.add_argument(
        "--output-covers",
        type=str,
        required=True,
        help="Output path for video covers TSV (required)",
    )

    parser.add_argument(
        "--output-sample-images",
        type=str,
        required=True,
        help="Output path for sample images TSV (required)",
    )

    parser.add_argument(
        "--output-sample-videos",
        type=str,
        required=True,
        help="Output path for sample videos TSV (required)",
    )

    parser.add_argument(
        "--output-mapping",
        type=str,
        required=True,
        help="Output path for ID mapping TSV (required)",
    )

    # Optional arguments
    parser.add_argument(
        "--append",
        action="store_true",
        help="Append to existing output files instead of overwriting",
    )

    return parser.parse_args()


def main():
    args = parse_arguments()

    # Validate input file
    if not args.input.endswith(".tsv"):
        print("Error: Input file must be a TSV file")
        return

    if not Path(args.input).exists():
        print(f"Error: Input file {args.input} not found")
        return

    # Read videos with titles
    try:
        videos = read_no_samples_with_title_tsv(args.input)
    except Exception as e:
        print(f"Error reading {args.input}: {e}")
        return

    if not videos:
        print("No videos found in input file")
        return

    # Create writer with output paths
    writer = ThreadSafeWriter(
        covers_file=args.output_covers,
        sample_images_file=args.output_sample_images,
        sample_videos_file=args.output_sample_videos,
        mapping_file=args.output_mapping,
        append_mode=args.append,
    )

    # Display configuration
    print(f"\nConfiguration:")
    print(f"  Input file: {args.input}")
    print(f"  Videos to process: {len(videos)}")
    print(f"  Output files:")
    print(f"    Covers: {args.output_covers}")
    print(f"    Sample images: {args.output_sample_images}")
    print(f"    Sample videos: {args.output_sample_videos}")
    print(f"    ID mapping: {args.output_mapping}")
    print(f"  Mode: {'Append' if args.append else 'Overwrite'}")

    # Process videos
    process_videos_by_title(videos, writer, args.app_id, args.aff_id)

    # Update the input no-samples file by removing successfully processed videos
    processed_video_ids = writer.get_processed_video_ids()
    if processed_video_ids:
        update_no_samples_file(args.input, processed_video_ids)

    print(f"\nProcessing complete!")
    print(f"Results saved to specified output files")
    if processed_video_ids:
        print(
            f"Successfully processed {len(processed_video_ids)} videos and updated input file"
        )


if __name__ == "__main__":
    main()
