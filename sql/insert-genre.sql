BEGIN;

-- create a temporary table to hold the data from the TSV file
CREATE TEMP TABLE genres_tmp ON COMMIT DROP AS
SELECT * FROM genre
WITH NO DATA;

-- copy the data from the TSV file into the temporary table
COPY genres_tmp (name, ruby, display_name, dmm_id)
FROM '/tmp/genre.tsv'  -- should be copied to container first
DELIMITER E'\t' CSV HEADER;

-- insert the data from the temporary table into the actual table
INSERT INTO genre (name, ruby, display_name, dmm_id)
SELECT name, ruby, display_name, dmm_id
FROM genres_tmp;

-- update series id sequence
SELECT setval('genre_id_seq', (SELECT MAX(id) FROM genre), true);

COMMIT;

