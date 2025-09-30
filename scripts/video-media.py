#!/usr/bin/env python3
import os
import csv
import requests
import json
import time
import threading
import argparse
from queue import Queue
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlencode
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
        empty_videos_file,
        failed_requests_file,
        append_mode=False,
    ):
        self.lock = threading.Lock()
        self.covers_file = Path(covers_file)
        self.sample_images_file = Path(sample_images_file)
        self.sample_videos_file = Path(sample_videos_file)
        self.empty_videos_file = Path(empty_videos_file)
        self.failed_requests_file = Path(failed_requests_file)
        self.append_mode = append_mode

        # Initialize files with headers
        self._initialize_files()

    def _initialize_files(self):
        """Initialize TSV files with headers"""
        files_config = [
            (self.covers_file, ["video_id", "attribute", "url"]),
            (self.sample_images_file, ["video_id", "attribute", "ordering", "url"]),
            (self.sample_videos_file, ["video_id", "attribute", "url"]),
            (
                self.empty_videos_file,
                [
                    "id",
                    "display_id",
                    "dmm_id",
                    "first_transformed_dmm_id",
                    "second_transformed_dmm_id",
                    "title",
                ],
            ),
            (
                self.failed_requests_file,
                [
                    "id",
                    "display_id",
                    "dmm_id",
                    "first_transformed_dmm_id",
                    "second_transformed_dmm_id",
                    "title",
                ],
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

    def write_empty_video(self, video_data, is_retry_mode=False):
        """Thread-safe write of empty video data"""
        # Use a temporary file name for retry mode to avoid conflicts
        if is_retry_mode:
            empty_file = (
                self.empty_videos_file.parent
                / f"{self.empty_videos_file.stem}-new{self.empty_videos_file.suffix}"
            )
        else:
            empty_file = self.empty_videos_file

        with self.lock:
            with open(empty_file, "a", encoding="utf-8", newline="") as f:
                writer = csv.writer(f, delimiter="\t")
                writer.writerow(video_data)

    def write_failed_request(self, video_data):
        """Thread-safe write of failed request data"""
        with self.lock:
            with open(
                self.failed_requests_file, "a", encoding="utf-8", newline=""
            ) as f:
                writer = csv.writer(f, delimiter="\t")
                writer.writerow(video_data)

    def finalize_retry(self):
        """Finalize retry mode by replacing original files with new ones"""
        import shutil

        retry_file = (
            self.empty_videos_file.parent
            / f"{self.empty_videos_file.stem}-new{self.empty_videos_file.suffix}"
        )

        if retry_file.exists():
            # Check if new file has only headers (meaning all retries were successful)
            with open(retry_file, "r", encoding="utf-8") as f:
                lines = f.readlines()
                if len(lines) <= 1:  # Only header line
                    print(
                        "All retry videos were successfully processed! Removing no-samples file"
                    )
                    if self.empty_videos_file.exists():
                        self.empty_videos_file.unlink()  # Delete the original file
                    retry_file.unlink()  # Delete the temporary file too
                else:
                    print(
                        f"Replacing {self.empty_videos_file} with updated retry results"
                    )
                    shutil.move(str(retry_file), str(self.empty_videos_file))


def load_alias_lookup(file_path):
    """Load the alias lookup table from TSV file"""
    aliases = {}
    if not file_path:
        print("No alias lookup file provided")
        return aliases

    try:
        with open(file_path, "r", encoding="utf-8", newline="") as file:
            reader = csv.DictReader(file, delimiter="\t")
            for row in reader:
                alias = row.get("alias", "").strip()
                prefix_1 = row.get("prefix_1", "").strip()
                suffix_1 = row.get("suffix_1", "").strip()
                prefix_2 = row.get("prefix_2", "").strip()
                suffix_2 = row.get("suffix_2", "").strip()
                if alias:
                    aliases[alias] = {
                        "prefix_1": prefix_1,
                        "suffix_1": suffix_1,
                        "prefix_2": prefix_2,
                        "suffix_2": suffix_2,
                    }
        print(f"Loaded {len(aliases)} alias mappings from {file_path}")
        return aliases
    except FileNotFoundError:
        print(f"Warning: {file_path} not found, proceeding without alias lookup")
        return {}
    except Exception as e:
        print(f"Error reading alias lookup file: {e}")
        return {}


def transform_dmm_id(dmm_id, alias_lookup, use_second_transform=False):
    """Transform dmm_id using alias lookup if needed"""
    if not dmm_id or not alias_lookup:
        return dmm_id

    # Extract letters and numbers from dmm_id
    match = re.match(r"^([a-zA-Z]+)(\d+)$", dmm_id)
    if not match:
        return dmm_id

    letters, numbers = match.groups()
    letters_lower = letters.lower()

    if letters_lower in alias_lookup:
        alias_info = alias_lookup[letters_lower]

        if use_second_transform:
            # Use prefix_2 and suffix_2 for second transformation
            prefix = alias_info.get("prefix_2", "")
            suffix = alias_info.get("suffix_2", "")
            transform_type = "second"
        else:
            # Use prefix and suffix for first transformation
            prefix = alias_info.get("prefix_1", "")
            suffix = alias_info.get("suffix_1", "")
            transform_type = "first"

        # Only transform if we have a prefix or suffix
        if prefix or suffix:
            new_dmm_id = f"{prefix}{numbers}{suffix}"
            print(
                f"  {transform_type.capitalize()} transformation: {dmm_id} -> {new_dmm_id}"
            )
            return new_dmm_id
        else:
            print(f"  No {transform_type} transformation available for {dmm_id}")

    return dmm_id


def check_url_exists(url, timeout=10):
    """Check if a URL returns a successful response"""
    try:
        response = requests.head(url, timeout=timeout, allow_redirects=False)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False


def bruteforce_video_covers(video_id, dmm_id):
    """Bruteforce video cover URLs"""
    covers_data = []

    cover_patterns = {
        "list": f"https://pics.dmm.co.jp/digital/video/{dmm_id}/{dmm_id}pt.jpg",
        "small": f"https://pics.dmm.co.jp/digital/video/{dmm_id}/{dmm_id}ps.jpg",
        "large": f"https://pics.dmm.co.jp/digital/video/{dmm_id}/{dmm_id}pl.jpg",
    }

    for attribute, url in cover_patterns.items():
        if check_url_exists(url):
            covers_data.append([video_id, attribute, url])
            print(f"    [Thread] Found cover [{attribute}]: {url}")

    return covers_data


def bruteforce_sample_images(video_id, dmm_id, max_images=50):
    """Bruteforce sample image URLs"""
    sample_images_data = []

    patterns = {
        "sample_s": f"https://pics.dmm.co.jp/digital/video/{dmm_id}/{dmm_id}-",
        "sample_l": f"https://pics.dmm.co.jp/digital/video/{dmm_id}/{dmm_id}jp-",
    }

    for attribute, base_url in patterns.items():
        print(f"    [Thread] Checking {attribute} images...")
        consecutive_failures = 0

        for n in range(1, max_images + 1):
            url = f"{base_url}{n}.jpg"

            if check_url_exists(url):
                sample_images_data.append([video_id, attribute, n, url])
                print(f"      [Thread] Found {attribute}[{n}]: {url}")
                consecutive_failures = 0
            else:
                consecutive_failures += 1
                if consecutive_failures >= 3:
                    print(
                        f"      [Thread] Stopping {attribute} search after {consecutive_failures} consecutive failures"
                    )
                    break

    return sample_images_data


def bruteforce_worker(bruteforce_task, writer, is_retry_mode=False):
    """Worker function for bruteforce threads"""
    video_id = bruteforce_task["video_id"]
    video_code = bruteforce_task["video_code"]
    original_dmm_id = bruteforce_task["original_dmm_id"]
    first_transformed_dmm_id = bruteforce_task.get("first_transformed_dmm_id", "")
    second_transformed_dmm_id = bruteforce_task.get("second_transformed_dmm_id", "")
    title = bruteforce_task.get("title", "")  # Get title from task
    dmm_ids_to_try = bruteforce_task["dmm_ids_to_try"]

    print(f"[Thread] Starting bruteforce for video {video_id}")

    found_data = False

    for dmm_id_attempt in dmm_ids_to_try:
        print(f"  [Thread] Trying bruteforce with dmm_id: {dmm_id_attempt}")

        # Bruteforce covers
        covers_data = bruteforce_video_covers(video_id, dmm_id_attempt)

        # Bruteforce sample images
        sample_images_data = bruteforce_sample_images(video_id, dmm_id_attempt)

        if covers_data or sample_images_data:
            # Write data directly to files
            writer.write_covers(covers_data)
            writer.write_sample_images(sample_images_data)
            found_data = True
            print(
                f"  [Thread] Bruteforce successful for video {video_id} with dmm_id: {dmm_id_attempt}"
            )
            print(
                f"  [Thread] Added {len(covers_data)} covers, {len(sample_images_data)} sample images"
            )
            break

    if not found_data:
        writer.write_empty_video(
            [
                video_id,
                video_code,
                original_dmm_id,
                first_transformed_dmm_id,
                second_transformed_dmm_id,
                title,
            ],
            is_retry_mode,
        )
        print(
            f"  [Thread] No sample data found for video {video_id} (bruteforce failed)"
        )


def read_videos_tsv(file_path):
    """Read the videos TSV file and return a list of video records"""
    videos = []
    with open(file_path, "r", encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file, delimiter="\t")
        for row in reader:
            videos.append(row)
    return videos


def read_no_samples_tsv(file_path):
    """Read the no-samples TSV file and convert to video format"""
    videos = []
    with open(file_path, "r", encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file, delimiter="\t")
        for row in reader:
            # Convert no-samples format to video format
            # Handle both 'code' and 'display_id' column names for backward compatibility
            display_id = row.get("display_id", "") or row.get("code", "")
            video = {
                "id": row.get("id", ""),
                "display_id": display_id,
                "dmm_id": row.get("dmm_id", ""),
                "title": row.get("title", ""),  # Include title from retry file
            }
            videos.append(video)
    return videos


def fetch_dmm_api(app_id, aff_id, dmm_id):
    """Fetch data from DMM API for a given dmm_id"""
    base_url = "https://api.dmm.com/affiliate/v3/ItemList"
    params = {
        "api_id": app_id,
        "affiliate_id": aff_id,
        "site": "FANZA",
        "service": "digital",
        "floor": "videoa",
        "cid": dmm_id,
    }

    url = f"{base_url}?{urlencode(params)}"

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data for dmm_id {dmm_id}: {e}")
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


def process_video_data(video_id, api_response):
    """Process API response and extract image/video data"""
    video_covers_data = []
    sample_images_data = []
    sample_videos_data = []

    try:
        if not is_api_success(api_response):
            return video_covers_data, sample_images_data, sample_videos_data

        items = api_response.get("result", {}).get("items", [])
        if not items:
            return video_covers_data, sample_images_data, sample_videos_data

        item = items[0]

        # Process imageURL
        image_url = item.get("imageURL", {})
        for attribute, url in image_url.items():
            if url:
                video_covers_data.append([video_id, attribute, url])

        # Process sampleImageURL
        sample_image_url = item.get("sampleImageURL", {})
        for attribute, data in sample_image_url.items():
            if isinstance(data, dict) and "image" in data:
                images = data["image"]
                if isinstance(images, list):
                    for i, url in enumerate(images):
                        if url:
                            sample_images_data.append([video_id, attribute, i + 1, url])

        # Process sampleMovieURL
        sample_movie_url = item.get("sampleMovieURL", {})
        for attribute, url in sample_movie_url.items():
            if attribute.startswith("size_") and url:
                sample_videos_data.append([video_id, attribute, url])

    except Exception as e:
        print(f"Error processing data for video_id {video_id}: {e}")

    return video_covers_data, sample_images_data, sample_videos_data


def extract_title_from_api_response(api_response):
    """Extract title from API response if available"""
    try:
        if not is_api_success(api_response):
            return ""

        items = api_response.get("result", {}).get("items", [])
        if not items:
            return ""

        item = items[0]
        return item.get("title", "")
    except Exception as e:
        print(f"Error extracting title from API response: {e}")
        return ""


def process_videos(videos, alias_lookup, writer, app_id, aff_id, is_retry_mode=False):
    """Process a list of videos"""
    batch_covers = []
    batch_sample_images = []
    batch_sample_videos = []
    batch_size = 50
    processed_count = 0

    mode_str = "retry" if is_retry_mode else "normal"
    print(f"Processing {len(videos)} videos in {mode_str} mode...")

    # Start thread pool executor
    with ThreadPoolExecutor(max_workers=4) as executor:
        # Process each video
        for i, video in enumerate(videos):
            video_id = video.get("id")
            video_code = video.get("display_id", "")
            original_dmm_id = video.get("dmm_id")
            existing_title = video.get("title", "")  # For retry mode

            if not video_id or not original_dmm_id:
                print(f"Skipping video at row {i+1}: missing id or dmm_id")
                continue

            print(
                f"Processing video {i+1}/{len(videos)}: {video_id} (dmm_id: {original_dmm_id})"
            )

            title = existing_title  # Start with existing title (if any)

            # Step 1: Try first transformation
            first_transformed_dmm_id = transform_dmm_id(
                original_dmm_id, alias_lookup, use_second_transform=False
            )

            # Use the transformed ID if different from original, otherwise use original
            dmm_id_to_use = (
                first_transformed_dmm_id
                if first_transformed_dmm_id != original_dmm_id
                else original_dmm_id
            )

            print(f"  Trying first API request with dmm_id: {dmm_id_to_use}")
            api_response = fetch_dmm_api(app_id, aff_id, dmm_id_to_use)

            # Extract title from first API response if not already available
            if not title and api_response:
                title = extract_title_from_api_response(api_response)

            if is_api_success(api_response):
                # First attempt successful
                covers, sample_images, sample_videos = process_video_data(
                    video_id, api_response
                )
                batch_covers.extend(covers)
                batch_sample_images.extend(sample_images)
                batch_sample_videos.extend(sample_videos)
                processed_count += 1

                print(
                    f"  First request successful! Added {len(covers)} covers, {len(sample_images)} sample images, {len(sample_videos)} sample videos to batch"
                )

            else:
                # Step 2: Try second transformation
                print(f"  First request failed, trying second transformation...")
                second_transformed_dmm_id = transform_dmm_id(
                    original_dmm_id, alias_lookup, use_second_transform=True
                )

                if second_transformed_dmm_id != original_dmm_id:
                    print(
                        f"  Trying second API request with dmm_id: {second_transformed_dmm_id}"
                    )
                    api_response = fetch_dmm_api(
                        app_id, aff_id, second_transformed_dmm_id
                    )

                    # Extract title from second API response if not already available
                    if not title and api_response:
                        title = extract_title_from_api_response(api_response)

                    if is_api_success(api_response):
                        # Second attempt successful
                        covers, sample_images, sample_videos = process_video_data(
                            video_id, api_response
                        )
                        batch_covers.extend(covers)
                        batch_sample_images.extend(sample_images)
                        batch_sample_videos.extend(sample_videos)
                        processed_count += 1

                        print(
                            f"  Second request successful! Added {len(covers)} covers, {len(sample_images)} sample images, {len(sample_videos)} sample videos to batch"
                        )

                    else:
                        # Both API attempts failed, queue for bruteforce
                        print(f"  Both API requests failed, queuing for bruteforce...")

                        # Create bruteforce task with both original and second transformed ID
                        dmm_ids_to_try = [original_dmm_id, second_transformed_dmm_id]

                        bruteforce_task = {
                            "video_id": video_id,
                            "video_code": video_code,
                            "original_dmm_id": original_dmm_id,
                            "first_transformed_dmm_id": first_transformed_dmm_id,
                            "second_transformed_dmm_id": second_transformed_dmm_id,
                            "title": title,
                            "dmm_ids_to_try": dmm_ids_to_try,
                        }

                        executor.submit(
                            bruteforce_worker, bruteforce_task, writer, is_retry_mode
                        )
                else:
                    # No second transformation available, queue for bruteforce with original ID only
                    print(
                        f"  No second transformation available, queuing for bruteforce..."
                    )

                    dmm_ids_to_try = [original_dmm_id]
                    if first_transformed_dmm_id != original_dmm_id:
                        dmm_ids_to_try.append(first_transformed_dmm_id)

                    bruteforce_task = {
                        "video_id": video_id,
                        "video_code": video_code,
                        "original_dmm_id": original_dmm_id,
                        "first_transformed_dmm_id": first_transformed_dmm_id,
                        "second_transformed_dmm_id": "",
                        "title": title,
                        "dmm_ids_to_try": dmm_ids_to_try,
                    }

                    executor.submit(
                        bruteforce_worker, bruteforce_task, writer, is_retry_mode
                    )

            # Write batch to files when batch size is reached
            if processed_count >= batch_size:
                print(f"\nWriting batch of {processed_count} API results to files...")
                writer.write_covers(batch_covers)
                writer.write_sample_images(batch_sample_images)
                writer.write_sample_videos(batch_sample_videos)

                # Reset batch
                batch_covers = []
                batch_sample_images = []
                batch_sample_videos = []
                processed_count = 0

        # Write remaining batch
        if processed_count > 0:
            print(f"\nWriting final batch of {processed_count} API results to files...")
            writer.write_covers(batch_covers)
            writer.write_sample_images(batch_sample_images)
            writer.write_sample_videos(batch_sample_videos)


def generate_output_paths(input_file, args):
    """Generate output file paths based on input file and arguments"""
    input_path = Path(input_file)
    base_name = input_path.stem  # filename without extension
    base_dir = input_path.parent

    # Default paths based on input filename
    covers_file = args.output_covers or str(base_dir / f"{base_name}-covers.tsv")
    sample_images_file = args.output_sample_images or str(
        base_dir / f"{base_name}-sample-images.tsv"
    )
    sample_videos_file = args.output_sample_videos or str(
        base_dir / f"{base_name}-sample-videos.tsv"
    )
    empty_videos_file = args.output_no_samples or str(
        base_dir / f"{base_name}-no-samples.tsv"
    )
    failed_requests_file = args.output_failed or str(
        base_dir / f"{base_name}-api-failed.tsv"
    )

    return (
        covers_file,
        sample_images_file,
        sample_videos_file,
        empty_videos_file,
        failed_requests_file,
    )


def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description="Fetch video media data from DMM API and bruteforce missing content",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic usage
  python video-media.py -i data/video.tsv --app-id YOUR_APP_ID --aff-id YOUR_AFF_ID

  # With alias lookup
  python video-media.py -i data/video.tsv --app-id APP_ID --aff-id AFF_ID --alias data/alias.tsv

  # Retry failed videos
  python video-media.py -i data/video.tsv --retry data/video-no-samples.tsv --app-id APP_ID --aff-id AFF_ID

  # Append to existing files
  python video-media.py -i data/video.tsv --app-id APP_ID --aff-id AFF_ID --append

  # Custom output paths
  python video-media.py -i data/video.tsv --app-id APP_ID --aff-id AFF_ID --output-covers custom/covers.tsv
        """,
    )

    # Required arguments
    parser.add_argument(
        "-i", "--input", type=str, required=True, help="Input video TSV file (required)"
    )

    parser.add_argument(
        "--app-id", type=str, required=True, help="DMM API App ID (required)"
    )

    parser.add_argument(
        "--aff-id", type=str, required=True, help="DMM API Affiliate ID (required)"
    )

    # Optional arguments
    parser.add_argument(
        "--alias", type=str, help="Alias lookup TSV file for DMM ID transformation"
    )

    parser.add_argument(
        "--retry",
        type=str,
        metavar="FILE",
        help="Retry processing videos from a no-samples TSV file",
    )

    parser.add_argument(
        "--append",
        action="store_true",
        help="Append to existing output files instead of creating new ones",
    )

    # Output file options
    parser.add_argument(
        "--output-covers", type=str, help="Custom output path for video covers TSV"
    )

    parser.add_argument(
        "--output-sample-images",
        type=str,
        help="Custom output path for sample images TSV",
    )

    parser.add_argument(
        "--output-sample-videos",
        type=str,
        help="Custom output path for sample videos TSV",
    )

    parser.add_argument(
        "--output-no-samples", type=str, help="Custom output path for no-samples TSV"
    )

    parser.add_argument(
        "--output-failed",
        type=str,
        help="Custom output path for failed API requests TSV",
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

    # Load alias lookup table
    alias_lookup = load_alias_lookup(args.alias)

    # Generate output paths
    (
        covers_file,
        sample_images_file,
        sample_videos_file,
        empty_videos_file,
        failed_requests_file,
    ) = generate_output_paths(args.input, args)

    # Create writer with output paths
    writer = ThreadSafeWriter(
        covers_file=covers_file,
        sample_images_file=sample_images_file,
        sample_videos_file=sample_videos_file,
        empty_videos_file=empty_videos_file,
        failed_requests_file=failed_requests_file,
        append_mode=args.append,
    )

    # Determine which videos to process
    if args.retry:
        print(f"Retry mode: Processing videos from {args.retry}")
        try:
            videos = read_no_samples_tsv(args.retry)
            is_retry_mode = True

            # Initialize the new retry file with header (for retry mode)
            retry_file = (
                Path(empty_videos_file).parent
                / f"{Path(empty_videos_file).stem}-new{Path(empty_videos_file).suffix}"
            )
            ensure_directory(retry_file)
            with open(retry_file, "w", encoding="utf-8", newline="") as f:
                csv_writer = csv.writer(f, delimiter="\t")
                # Use consistent header format with title
                csv_writer.writerow(
                    [
                        "id",
                        "display_id",
                        "dmm_id",
                        "first_transformed_dmm_id",
                        "second_transformed_dmm_id",
                        "title",
                    ]
                )

        except FileNotFoundError:
            print(f"Error: {args.retry} file not found")
            return
        except Exception as e:
            print(f"Error reading {args.retry}: {e}")
            return
    else:
        print(f"Normal mode: Processing videos from {args.input}")
        try:
            videos = read_videos_tsv(args.input)
            is_retry_mode = False
        except FileNotFoundError:
            print(f"Error: {args.input} file not found")
            return
        except Exception as e:
            print(f"Error reading {args.input}: {e}")
            return

    # Display output file paths
    print(f"\nOutput files:")
    print(f"  Covers: {covers_file}")
    print(f"  Sample images: {sample_images_file}")
    print(f"  Sample videos: {sample_videos_file}")
    print(f"  No samples: {empty_videos_file}")
    print(f"  Failed requests: {failed_requests_file}")
    print(f"  Mode: {'Append' if args.append else 'Overwrite'}")

    # Process videos
    process_videos(
        videos, alias_lookup, writer, args.app_id, args.aff_id, is_retry_mode
    )

    # In retry mode, replace the original file with the new one
    if args.retry:
        writer.finalize_retry()

    print(f"\nProcessing complete!")
    print(f"Output files saved as specified above")


if __name__ == "__main__":
    main()
