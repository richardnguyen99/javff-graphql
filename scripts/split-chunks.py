import os
import sys


def split_tsv_file(input_file, chunk_size_mb=50):
    """
    Split a TSV file into smaller chunks while preserving complete lines.
    Each chunk will have the header and maintain line integrity.

    Args:
        input_file (str): Path to the input TSV file
        chunk_size_mb (int): Maximum size of each chunk in MB
    """
    chunk_size_bytes = chunk_size_mb * 1024 * 1024

    if not os.path.exists(input_file):
        print(f"Error: File {input_file} not found")
        return

    # Get the base filename without extension
    base_name = os.path.splitext(input_file)[0]

    with open(input_file, "r", encoding="utf-8") as file:
        # Read the header
        header = file.readline()

        chunk_num = 1
        current_chunk_size = 0
        current_chunk_lines = []

        for line in file:
            line_size = len(line.encode("utf-8"))

            # Check if adding this line would exceed the chunk size
            if (
                current_chunk_size + line_size > chunk_size_bytes
                and current_chunk_lines
            ):
                # Write current chunk
                write_chunk(base_name, chunk_num, header, current_chunk_lines)
                print(f"Created chunk {chunk_num}: {len(current_chunk_lines)} lines")

                # Reset for next chunk
                chunk_num += 1
                current_chunk_lines = []
                current_chunk_size = len(header.encode("utf-8"))

            # Add line to current chunk
            current_chunk_lines.append(line)
            current_chunk_size += line_size

        # Write the last chunk if it has content
        if current_chunk_lines:
            write_chunk(base_name, chunk_num, header, current_chunk_lines)
            print(f"Created chunk {chunk_num}: {len(current_chunk_lines)} lines")

    print(f"Split complete! Created {chunk_num} chunks.")


def write_chunk(base_name, chunk_num, header, lines):
    """Write a chunk file with header and lines"""
    chunk_filename = f"{base_name}_chunk_{chunk_num:03d}.tsv"

    with open(chunk_filename, "w", encoding="utf-8") as chunk_file:
        # Write header
        chunk_file.write(header)
        # Write lines
        chunk_file.writelines(lines)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python split_tsv.py <input_file.tsv>")
        print("This will split the TSV file into 50MB chunks")
        sys.exit(1)

    input_file = sys.argv[1]
    split_tsv_file(input_file, chunk_size_mb=50)
