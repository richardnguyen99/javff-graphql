BEGIN;

-- create a temporary table to hold the data from the TSV file
CREATE TEMP TABLE video_tmp ON COMMIT DROP AS
SELECT * FROM video
WITH NO DATA;

-- copy the data from the TSV file into the temporary table
COPY video_tmp (id, code, dmm_id, title, label, release_date, length, description, maker_id, series_id)
FROM '/tmp/video.tsv'  -- should be copied to container first
DELIMITER E'\t' CSV HEADER;

-- insert the data from the temporary table into the actual table, ignoring
-- duplicates based on dmm_id
INSERT INTO video
SELECT *
FROM video_tmp
ON CONFLICT (id) DO NOTHING;

-- update series id sequence
SELECT setval('video_id_seq', (SELECT MAX(id) FROM video), true);

COMMIT;

