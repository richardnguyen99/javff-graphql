BEGIN;

-- create a temporary table to hold the data from the TSV file
CREATE TEMP TABLE video_actresses_tmp ON COMMIT DROP AS
SELECT * FROM video_actresses
WITH NO DATA;

-- copy the data from the TSV file into the temporary table
COPY video_actresses_tmp (video_id, actress_id)
FROM '/tmp/video-actresses.tsv'  -- should be copied to container first
DELIMITER E'\t' CSV HEADER;

-- insert the data from the temporary table into the actual table
INSERT INTO video_actresses (video_id, actress_id)
SELECT video_id, actress_id
FROM video_actresses_tmp
ON CONFLICT (video_id, actress_id) DO NOTHING;

COMMIT;

