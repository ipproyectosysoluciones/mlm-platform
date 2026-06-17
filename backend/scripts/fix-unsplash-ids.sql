-- =============================================================================
-- Fix broken Unsplash photo IDs in production database
-- Replaces 11 broken photo IDs (returning 404) with verified working ones.
-- Targets: properties.images and tour_packages.images (JSONB array columns)
--
-- Run with: docker exec mlm-postgres-1 psql -U mlm -d mlm_db -f /tmp/fix-unsplash-ids.sql
-- Or paste directly into psql session.
-- =============================================================================

BEGIN;

-- ─── Property Images (9 replacements) ───────────────────────────────────────

-- LIVING: 1600566753190-17f0baa2a6c0 → 1616486338812-3dadae4b4ace
UPDATE properties
SET images = replace(images::text, '1600566753190-17f0baa2a6c0', '1616486338812-3dadae4b4ace')::jsonb
WHERE images::text LIKE '%1600566753190-17f0baa2a6c0%';

-- OCEAN_VIEW: 1613490493805-039e3e03b6d5 → 1520250497591-112f2f40a3f4
UPDATE properties
SET images = replace(images::text, '1613490493805-039e3e03b6d5', '1520250497591-112f2f40a3f4')::jsonb
WHERE images::text LIKE '%1613490493805-039e3e03b6d5%';

-- COLONIAL: 1560448204771-d60f8d8b7392 → 1577717903315-1691ae25ab3f
UPDATE properties
SET images = replace(images::text, '1560448204771-d60f8d8b7392', '1577717903315-1691ae25ab3f')::jsonb
WHERE images::text LIKE '%1560448204771-d60f8d8b7392%';

-- TROPICAL: 1600573472591-ee6981cf35fb → 1580587771525-78b9dba3b914
UPDATE properties
SET images = replace(images::text, '1600573472591-ee6981cf35fb', '1580587771525-78b9dba3b914')::jsonb
WHERE images::text LIKE '%1600573472591-ee6981cf35fb%';

-- DINING: 1600585154084-4e7c8c5a13c4 → 1617806118233-18e1de247200
UPDATE properties
SET images = replace(images::text, '1600585154084-4e7c8c5a13c4', '1617806118233-18e1de247200')::jsonb
WHERE images::text LIKE '%1600585154084-4e7c8c5a13c4%';

-- BEACH_HOUSE: 1564013799919-ab6767e3e5a4 → 1505693416388-ac5ce068fe85
UPDATE properties
SET images = replace(images::text, '1564013799919-ab6767e3e5a4', '1505693416388-ac5ce068fe85')::jsonb
WHERE images::text LIKE '%1564013799919-ab6767e3e5a4%';

-- PENTHOUSE: 1600585153490-76fb20fd1d00 → 1502672260266-1c1ef2d93688
UPDATE properties
SET images = replace(images::text, '1600585153490-76fb20fd1d00', '1502672260266-1c1ef2d93688')::jsonb
WHERE images::text LIKE '%1600585153490-76fb20fd1d00%';

-- ENTRANCE: 1600607687920-4e03b0f3f0a8 → 1600566752355-35792bedcfea
UPDATE properties
SET images = replace(images::text, '1600607687920-4e03b0f3f0a8', '1600566752355-35792bedcfea')::jsonb
WHERE images::text LIKE '%1600607687920-4e03b0f3f0a8%';

-- CONDO_EXT: 1523217553220-27bbec67eb5d → 1486406146926-c627a92ad1ab
UPDATE properties
SET images = replace(images::text, '1523217553220-27bbec67eb5d', '1486406146926-c627a92ad1ab')::jsonb
WHERE images::text LIKE '%1523217553220-27bbec67eb5d%';

-- ─── Tour Package Images (2 replacements) ───────────────────────────────────

-- SCUBA: 1501785888108-6c792c0e2a49 → 1682687220742-aba13b6e50ba
UPDATE tour_packages
SET images = replace(images::text, '1501785888108-6c792c0e2a49', '1682687220742-aba13b6e50ba')::jsonb
WHERE images::text LIKE '%1501785888108-6c792c0e2a49%';

-- CENOTE: 1559128010-cd27cf0d77bc → 1547483238-2cbf881a559f
UPDATE tour_packages
SET images = replace(images::text, '1559128010-cd27cf0d77bc', '1547483238-2cbf881a559f')::jsonb
WHERE images::text LIKE '%1559128010-cd27cf0d77bc%';

-- ─── Verification ────────────────────────────────────────────────────────────

-- Should return 0 rows (no broken IDs remaining)
SELECT id, title FROM properties
WHERE images::text LIKE ANY(ARRAY[
  '%1600566753190-17f0baa2a6c0%',
  '%1613490493805-039e3e03b6d5%',
  '%1560448204771-d60f8d8b7392%',
  '%1600573472591-ee6981cf35fb%',
  '%1600585154084-4e7c8c5a13c4%',
  '%1564013799919-ab6767e3e5a4%',
  '%1600585153490-76fb20fd1d00%',
  '%1600607687920-4e03b0f3f0a8%',
  '%1523217553220-27bbec67eb5d%'
]);

SELECT id, title FROM tour_packages
WHERE images::text LIKE ANY(ARRAY[
  '%1501785888108-6c792c0e2a49%',
  '%1559128010-cd27cf0d77bc%'
]);

COMMIT;

-- Expected output: all UPDATE statements affect rows, both SELECT verifications return 0 rows.
