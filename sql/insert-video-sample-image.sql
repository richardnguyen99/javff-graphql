BEGIN;

-- create a temporary table to hold the data from the TSV file
CREATE TEMP TABLE video_sample_image_tmp ON COMMIT DROP AS
SELECT * FROM video_sample_image
WITH NO DATA;

-- copy the data from the TSV file into the temporary table
COPY video_sample_image_tmp (video_id, attribute, ordering, url)
FROM '/tmp/video-sample-image.tsv'  -- should be copied to container first
DELIMITER E'\t' CSV HEADER;

-- insert the data from the temporary table into the actual table
INSERT INTO video_sample_image (video_id, attribute, ordering, url)
SELECT video_id, attribute, ordering, url
FROM video_sample_image_tmp
ON CONFLICT (video_id, attribute, ordering) DO NOTHING;

-- update series id sequence
SELECT setval('video_sample_image_id_seq', (SELECT COUNT(*) FROM video_sample_image_tmp), true);

COMMIT;


