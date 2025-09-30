import pandas as pd
import re
from collections import defaultdict


def extract_label_and_code(display_id):
    """Extract label and numeric code from display_id"""
    # Handle cases like "SS-017-3" by taking everything before the last dash and number
    match = re.match(r"^([a-zA-Z]+)[-_]?(\d+)(?:[-_]\d+)?$", display_id)
    if match:
        return match.group(1).lower(), match.group(2)
    return None, None


def extract_prefix_suffix_from_fetched(fetched_dmm_id, original_code, source):
    """Extract prefix and suffix from fetched_dmm_id by locating the code part"""
    if not fetched_dmm_id or not original_code:
        return None, None

    # For digital sources, the code might have leading zeros
    # For DVD sources, the code is usually as-is
    if source == "digital":
        # Try to find the code with leading zeros first
        padded_code = original_code.zfill(5)  # Pad to 5 digits
        if padded_code in fetched_dmm_id:
            code_to_find = padded_code
        else:
            # Try without leading zeros
            code_to_find = str(int(original_code))
    else:  # DVD
        code_to_find = original_code

    # Find the position of the code in fetched_dmm_id
    code_pos = fetched_dmm_id.find(code_to_find)

    if code_pos != -1:
        # Extract prefix (everything before the code)
        prefix = fetched_dmm_id[:code_pos]

        # Extract suffix (everything after the code)
        suffix_start = code_pos + len(code_to_find)
        suffix = fetched_dmm_id[suffix_start:]

        return prefix, suffix

    return None, None


def process_mapping_file(file_path):
    """Process the mapping TSV file and extract prefix/suffix patterns"""
    # Read the TSV file
    df = pd.read_csv(file_path, sep="\t")

    # Dictionary to store patterns by alias
    patterns = defaultdict(lambda: {"prefixes": set(), "suffixes": set()})

    # Process each row
    for _, row in df.iterrows():
        display_id = row.get("display_id", "")
        fetched_dmm_id = row.get("fetched_dmm_id", "")
        source = row.get("source", "")

        if not display_id or not fetched_dmm_id:
            continue

        # Extract label and code from display_id
        label, code = extract_label_and_code(display_id)

        if label and code:
            # Extract prefix and suffix from fetched_dmm_id
            prefix, suffix = extract_prefix_suffix_from_fetched(
                fetched_dmm_id, code, source
            )

            if prefix is not None:  # prefix can be empty string
                patterns[label]["prefixes"].add(prefix)
                patterns[label]["suffixes"].add(
                    suffix or ""
                )  # Convert None to empty string

                # Debug output
                print(f"Processing: {display_id} -> {fetched_dmm_id} ({source})")
                print(f"  Label: {label}, Code: {code}")
                print(f"  Prefix: '{prefix}', Suffix: '{suffix}'")
                print()

    return patterns


def generate_alias_lookup(patterns, output_file):
    """Generate the alias lookup TSV file with prefix_2 and suffix_2 columns"""
    output_data = []

    for alias, data in patterns.items():
        # Get the most common prefix and suffix for each alias
        prefixes = list(data["prefixes"])
        suffixes = list(data["suffixes"])

        # Take the first (or most common) prefix and suffix
        # You might want to add logic to choose the most frequent one
        prefix_1 = prefixes[0] if prefixes else ""
        suffix_1 = suffixes[0] if suffixes else ""

        # Remove duplicates and empty strings for selection
        prefixes = [p for p in prefixes if p]
        suffixes = [s for s in suffixes if s]

        # If we have multiple patterns, you might want to choose based on frequency
        # For now, we'll just take the first non-empty one
        if prefixes:
            prefix_1 = prefixes[0]
        if suffixes:
            suffix_1 = suffixes[0]

        output_data.append(
            {
                "alias": alias,
                "prefix_1": prefix_1,
                "suffix_1": suffix_1,
                "prefix_2": "",  # Empty for manual correction
                "suffix_2": "",  # Empty for manual correction
            }
        )

    # Create DataFrame and save to TSV
    output_df = pd.DataFrame(output_data)
    output_df = output_df.sort_values("alias")
    output_df.to_csv(output_file, sep="\t", index=False)

    return output_df


def main():
    input_file = ".tmp/videos-with-id-mapping.tsv"
    output_file = "data/video-alias-lookup-generated.tsv"

    print(f"Processing mapping file: {input_file}")

    # Process the input file
    patterns = process_mapping_file(input_file)

    # Generate output TSV
    result_df = generate_alias_lookup(patterns, output_file)

    print(f"Processing complete. Output saved to {output_file}")
    print(f"Generated {len(result_df)} alias patterns")

    # Display results
    print("\nGenerated alias lookup table:")
    print(result_df.to_string(index=False))

    # Show some statistics
    print(f"\nStatistics:")
    print(f"Total unique aliases: {len(patterns)}")

    # Show pattern details
    print(f"\nPattern details (first 5):")
    for alias, data in list(patterns.items())[:5]:
        print(f"{alias}:")
        print(f"  Prefixes: {list(data['prefixes'])}")
        print(f"  Suffixes: {list(data['suffixes'])}")


if __name__ == "__main__":
    main()
