#!/usr/bin/env python3

import argparse
import pandas as pd
import sys

def parse_args():
    parser = argparse.ArgumentParser(description="Remove duplicates from a delimited file based on specified columns.")
    parser.add_argument('--columns', required=True, help='Comma-separated list of columns to check for duplicates.')
    parser.add_argument('--delimiter', default=',', help='Delimiter used in the file (default: ,). Use \"\\t\" for tab.')
    parser.add_argument('--prune', action='store_true', help='Remove all duplicates and keep no record.')
    parser.add_argument('--show-removed', action='store_true', help='Output only the removed duplicate records.')
    parser.add_argument('file', help='Input file (CSV/TSV/etc).')
    return parser.parse_args()

def main():
    args = parse_args()
    columns = [col.strip() for col in args.columns.split(',')]
    delimiter = args.delimiter.encode().decode('unicode_escape')  # handle '\t'

    try:
        # Read the file with pandas - don't force string conversion initially
        df = pd.read_csv(args.file, delimiter=delimiter)
        
        # Validate that specified columns exist
        missing_columns = [col for col in columns if col not in df.columns]
        if missing_columns:
            print(f"Error: Columns {missing_columns} not found in file. Available columns: {list(df.columns)}", file=sys.stderr)
            sys.exit(1)
        
        # Show some debug info
        print(f"Checking for compound duplicates in columns: {columns}", file=sys.stderr)
        print(f"Sample data:", file=sys.stderr)
        print(df[columns].head(10).to_string(index=False), file=sys.stderr)
        
        # Check for compound duplicates
        compound_duplicates = df.duplicated(subset=columns, keep=False)
        total_compound_duplicates = compound_duplicates.sum()
        print(f"Found {total_compound_duplicates} rows with compound duplicates", file=sys.stderr)
        
        # Mark duplicates based on specified columns (keep='first' means keep the first occurrence)
        is_duplicate = df.duplicated(subset=columns, keep='first')
        
        # Get the removed rows (duplicates)
        removed_rows = df[is_duplicate].copy()
        
        # Get the kept rows (non-duplicates or first occurrence)
        output_rows = df[~is_duplicate].copy()
        
        if args.prune:
            # For prune mode: remove ALL rows that have duplicates (including first occurrence)
            output_rows = df[~compound_duplicates].copy()
            removed_rows = df[compound_duplicates].copy()
        
        # Output results
        if args.show_removed:
            if not removed_rows.empty:
                removed_rows.to_csv(sys.stdout, sep=delimiter, index=False, lineterminator='\n')
            else:
                # Still output header even if no removed rows
                pd.DataFrame(columns=df.columns).to_csv(sys.stdout, sep=delimiter, index=False, lineterminator='\n')
        else:
            output_rows.to_csv(sys.stdout, sep=delimiter, index=False, lineterminator='\n')
            
        # Print summary to stderr
        total_rows = len(df)
        removed_count = len(removed_rows)
        kept_count = len(output_rows)
        
        print(f"Total rows: {total_rows}", file=sys.stderr)
        print(f"Removed rows: {removed_count}", file=sys.stderr)
        print(f"Kept rows: {kept_count}", file=sys.stderr)
        
        if not removed_rows.empty:
            print(f"Examples of removed compound duplicates:", file=sys.stderr)
            print(removed_rows[columns].head().to_string(index=False), file=sys.stderr)
        
    except FileNotFoundError:
        print(f"Error: File '{args.file}' not found.", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error processing file: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
