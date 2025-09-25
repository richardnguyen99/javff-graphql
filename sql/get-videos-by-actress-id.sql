-- SQL query that retrieves all videos featuring a specific actress
SELECT v.id, v.code, v.dmm_id, v.title, STRING_AGG(va.actress_id::text, ',') AS actress_ids
FROM video AS v
JOIN video_actresses AS va ON v.id = va.video_id
WHERE va.video_id IN (
  SELECT v.id
  FROM video AS v
  JOIN video_actresses AS va ON v.id = va.video_id
  WHERE va.actress_id = 300
  GROUP BY v.id
)
GROUP BY v.id
ORDER BY v.id;


