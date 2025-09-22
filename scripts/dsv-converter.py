import argparse
import csv

def main():
    parser = argparse.ArgumentParser(description="Convert a delimiter-separated value file to another delimiter.")
    parser.add_argument('--from', dest='from_delim', required=True, help='Input delimiter (e.g., "," or "\\t")')
    parser.add_argument('--to', dest='to_delim', required=True, help='Output delimiter (e.g., "," or "\\t")')
    parser.add_argument('input_file', help='Input file path')
    parser.add_argument('output_file', help='Output file path')
    args = parser.parse_args()

    from_delim = bytes(args.from_delim, "utf-8").decode("unicode_escape")
    to_delim = bytes(args.to_delim, "utf-8").decode("unicode_escape")

    with open(args.input_file, newline='', encoding='utf-8') as infile, \
         open(args.output_file, 'w', newline='', encoding='utf-8') as outfile:
        reader = csv.reader(infile, delimiter=from_delim)
        writer = csv.writer(outfile, delimiter=to_delim, lineterminator='\n')
        for row in reader:
            writer.writerow(row)

if __name__ == '__main__':
    main()
