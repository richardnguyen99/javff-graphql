BEGIN;

-- create a temporary table to hold the data from the TSV file
CREATE TEMP TABLE series_tmp ON COMMIT DROP AS
SELECT * FROM series
WITH NO DATA;

-- copy the data from the TSV file into the temporary table
COPY series_tmp (id, name, ruby, dmm_id)
FROM '/tmp/series.tsv' -- should be copied to container first
DELIMITER E'\t' CSV HEADER;

-- insert the data from the temporary table into the actual table, ignoring
-- duplicates based on dmm_id
INSERT INTO series (id, name, ruby, dmm_id)
SELECT id, name, ruby, dmm_id
FROM series_tmp
ON CONFLICT (id) DO NOTHING;

-- update series id sequence
SELECT setval('series_id_seq', (SELECT MAX(id) FROM series), true);

COMMIT;
