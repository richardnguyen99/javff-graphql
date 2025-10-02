BEGIN;

CREATE TEMP TABLE videos_tmp ON COMMIT DROP AS
SELECT * FROM videos
WITH NO DATA;

COPY videos_tmp
FROM '/tmp/videos.tsv'
DELIMITER E'\t' CSV HEADER;

INSERT INTO video (id, code, title, dmm_id, description, release_date, length, label, series_id, maker_id);

COMMIT;
