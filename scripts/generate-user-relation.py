#!/usr/bin/env python3
import csv
import random
import os
from datetime import datetime, timedelta
from faker import Faker
from concurrent.futures import ThreadPoolExecutor, as_completed

fake = Faker()


def load_videos(file_path):
    """Load videos from TSV file"""

    videos = []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f, delimiter="\t")
            for row in reader:
                videos.append(row)
        print(f"Loaded {len(videos)} videos from {file_path}")
        return videos
    except FileNotFoundError:
        print(f"Error: {file_path} not found")
        return []


def generate_users(count=10000):
    """Generate users with unique usernames and emails"""

    users = []
    usernames = set()
    emails = set()

    for i in range(1, count + 1):
        # Ensure unique username
        while True:
            username = fake.user_name()
            if username not in usernames:
                usernames.add(username)
                break

        # Ensure unique email
        while True:
            email = fake.email()
            if email not in emails:
                emails.add(email)
                break

        users.append({"id": i, "username": username, "email": email})

    print(f"Generated {len(users)} users")
    return users


def generate_views_for_batch(video_batch, users, thread_id):
    """Generate views for a batch of videos (thread worker function)"""
    views = []

    for video in video_batch:
        video_id = video.get("id")
        if not video_id:
            continue

        num_views = random.randint(100, 1000)

        for _ in range(num_views):
            user = random.choice(users)

            start_date = datetime.now() - timedelta(days=730)
            end_date = datetime.now()
            view_time = fake.date_time_between(start_date=start_date, end_date=end_date)

            views.append(
                {
                    "user_id": user["id"],
                    "video_id": video_id,
                    "view_at": view_time.strftime("%Y-%m-%d %H:%M:%S"),
                }
            )

        print(f"Thread {thread_id}: Processed video {video_id} with {num_views} views")

    print(
        f"Thread {thread_id}: Generated {len(views)} views for batch of {len(video_batch)} videos"
    )

    return views


def generate_views_multithreaded(users, videos, batch_size=50, max_workers=None):
    """Generate user-video view relations using multithreading"""

    video_batches = []
    for i in range(0, len(videos), batch_size):
        batch = videos[i : i + batch_size]
        video_batches.append(batch)

    print(
        f"Split {len(videos)} videos into {len(video_batches)} batches of ~{batch_size} videos each"
    )

    all_views = []

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit tasks to thread pool
        future_to_thread = {}
        for i, batch in enumerate(video_batches):
            future = executor.submit(generate_views_for_batch, batch, users, i + 1)
            future_to_thread[future] = i + 1

        for future in as_completed(future_to_thread):
            thread_id = future_to_thread[future]
            try:
                batch_views = future.result()
                all_views.extend(batch_views)
                print(
                    f"Thread {thread_id}: Completed. Total views so far: {len(all_views)}"
                )
            except Exception as exc:
                print(f"Thread {thread_id}: Generated an exception: {exc}")

    print(f"Generated {len(all_views)} total views using multithreading")
    return all_views


def generate_ratings(users, videos):
    """Generate user-video rating relations (one rating per user per video max)"""

    ratings = []
    user_video_pairs = set()

    for video in videos:
        video_id = video.get("id")
        if not video_id:
            continue

        num_ratings = random.randint(1, 100)

        available_users = list(users)
        random.shuffle(available_users)

        for i in range(min(num_ratings, len(available_users))):
            user = available_users[i]
            user_video_pair = (user["id"], video_id)

            if user_video_pair in user_video_pairs:
                continue

            user_video_pairs.add(user_video_pair)

            start_date = datetime.now() - timedelta(days=730)
            end_date = datetime.now()
            created_time = fake.date_time_between(
                start_date=start_date, end_date=end_date
            )

            review = fake.text(max_nb_chars=200) if random.random() < 0.7 else ""

            ratings.append(
                {
                    "user_id": user["id"],
                    "video_id": video_id,
                    "rating": random.randint(0, 5),
                    "review": review,
                    "created_at": created_time.strftime("%Y-%m-%d %H:%M:%S"),
                }
            )

    print(f"Generated {len(ratings)} ratings")
    return ratings


def save_to_tsv(data, filename, fieldnames):
    """Save data to TSV file"""

    filepath = os.path.join("data", filename)

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter="\t")
        writer.writeheader()
        writer.writerows(data)

    print(f"Saved {len(data)} records to {filepath}")


def main():
    videos = load_videos("data/video.tsv")
    if not videos:
        print("No videos loaded. Exiting.")
        return

    users = generate_users(10000)

    print("\nGenerating views with multithreading...")
    views = generate_views_multithreaded(users, videos, batch_size=50, max_workers=4)

    print("\nGenerating ratings...")
    ratings = generate_ratings(users, videos)

    save_to_tsv(users, "user.tsv", ["id", "username", "email"])
    save_to_tsv(views, "user-video-view.tsv", ["user_id", "video_id", "view_at"])
    save_to_tsv(
        ratings,
        "user-video-rating.tsv",
        ["user_id", "video_id", "rating", "review", "created_at"],
    )

    print("Data generation completed!")


if __name__ == "__main__":
    main()
