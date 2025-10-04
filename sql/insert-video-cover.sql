BEGIN;

-- create a temporary table to hold the data from the TSV file
CREATE TEMP TABLE video_cover_tmp ON COMMIT DROP AS
SELECT * FROM video_cover
WITH NO DATA;

-- copy the data from the TSV file into the temporary table
COPY video_cover_tmp (video_id, attribute, url)
FROM '/tmp/video-cover.tsv'  -- should be copied to container first
DELIMITER E'\t' CSV HEADER;

-- insert the data from the temporary table into the actual table
INSERT INTO video_cover (video_id, attribute, url)
SELECT video_id, attribute, url
FROM video_cover_tmp
ON CONFLICT (video_id, attribute) DO NOTHING;

-- update series id sequence
SELECT setval('video_cover_id_seq', (SELECT COUNT(*) FROM video_cover_tmp), true);

COMMIT;


