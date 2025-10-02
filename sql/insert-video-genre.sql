BEGIN;

-- create a temporary table to hold the data from the TSV file
CREATE TEMP TABLE video_genres_tmp ON COMMIT DROP AS
SELECT * FROM video_genres
WITH NO DATA;

-- copy the data from the TSV file into the temporary table
COPY video_genres_tmp (video_id, genre_id)
FROM '/tmp/video-genres.tsv'  -- should be copied to container first
DELIMITER E'\t' CSV HEADER;

-- insert the data from the temporary table into the actual table
INSERT INTO video_genres (video_id, genre_id)
SELECT video_id, genre_id
FROM video_genres_tmp
ON CONFLICT (video_id, genre_id) DO NOTHING;

COMMIT;

