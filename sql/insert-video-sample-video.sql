BEGIN;

-- create a temporary table to hold the data from the TSV file
CREATE TEMP TABLE video_sample_video_tmp ON COMMIT DROP AS
SELECT * FROM video_sample_video
WITH NO DATA;

-- copy the data from the TSV file into the temporary table
COPY video_sample_video_tmp (video_id, attribute, url)
FROM '/tmp/video-sample-video.tsv'  -- should be copied to container first
DELIMITER E'\t' CSV HEADER;

-- insert the data from the temporary table into the actual table
INSERT INTO video_sample_video (video_id, attribute, url)
SELECT video_id, attribute, url
FROM video_sample_video_tmp
ON CONFLICT (video_id, attribute) DO NOTHING;

-- update series id sequence
SELECT setval('video_sample_video_id_seq', (SELECT COUNT(*) FROM video_sample_video_tmp), true);

COMMIT;



