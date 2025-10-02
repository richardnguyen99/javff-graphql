BEGIN;

-- create a temporary table to hold the data from the TSV file
CREATE TEMP TABLE makers_tmp ON COMMIT DROP AS
SELECT * FROM maker
WITH NO DATA;

-- copy the data from the TSV file into the temporary table
COPY makers_tmp
FROM '/tmp/maker.tsv'  -- should be copied to container first
DELIMITER E'\t' CSV HEADER;

-- insert the data from the temporary table into the actual table, ignoring
-- duplicates based on dmm_id
INSERT INTO maker (id, name, dmm_id, ruby)
SELECT *
FROM makers_tmp
ON CONFLICT (id) DO NOTHING;

-- update series id sequence
SELECT setval('maker_id_seq', (SELECT MAX(id) FROM maker), true);

COMMIT;
