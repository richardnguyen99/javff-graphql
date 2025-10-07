WITH single_actress_videos AS (
  SELECT video_id as id
  FROM video_actresses
  GROUP BY video_id
  HAVING COUNT(actress_id) = 1
  ORDER BY video_id
) SELECT v.id, v.code, a.id, a.display_name
FROM video AS v
LEFT JOIN video_actresses AS va ON v.id = va.video_id
LEFT JOIN actress AS a ON va.actress_id = a.id
WHERE v.id IN (SELECT id FROM single_actress_videos)
  AND a.id = :actress_id
ORDER BY v.id ASC;
