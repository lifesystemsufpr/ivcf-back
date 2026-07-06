-- Normalize existing user emails to lowercase so lookups and the unique
-- constraint behave case-insensitively (BUG-CT02 / BUG-CT04).
-- Rows whose lowercased email would collide with another user are left
-- untouched: those are pre-existing duplicate accounts that must be
-- resolved manually before they can be normalized.
UPDATE "user" u
SET "email" = TRIM(LOWER(u."email"))
WHERE u."email" <> TRIM(LOWER(u."email"))
  AND NOT EXISTS (
    SELECT 1
    FROM "user" o
    WHERE o."id" <> u."id"
      AND TRIM(LOWER(o."email")) = TRIM(LOWER(u."email"))
  );
