-- =============================================================================
-- E2E Seed Script — Nexo Real (PostgreSQL)
-- =============================================================================
-- Pobla la DB con el árbol Unilevel completo de Nexo Real para tests E2E.
-- Populates the DB with Nexo Real's full Unilevel tree for E2E tests.
--
-- Contraseña de todos los usuarios / Password for all users:
--   super_admin / admin / advisor / vendor : Nexo2024!
--   user                                   : usuario123
--   guest                                  : invitado123
--
-- Bcrypt hash (cost 12) de 'Nexo2024!' / Bcrypt hash (cost 12) for 'Nexo2024!':
--   $2a$12$Sbwck.9Dg5fXbj34Oti2..q0Gqz9jAHsS4OeXY.pWyt7wUQPBtNaK
-- Bcrypt hash (cost 12) de 'usuario123':
--   $2a$12$Y7kH4Qk9zU3.5xLnPvR7ReKq5VZDk7pVCdkPqL1bOtV8GqA0mDW7K
-- Bcrypt hash (cost 12) de 'invitado123':
--   $2a$12$W2mKsL7rX1pCqMnOaT4YXeHj8NbVdU9fGzI3kRoP6tS5wQlE0mFyJ
--
-- NOTA: Este archivo usa sintaxis PostgreSQL.
-- NOTE: This file uses PostgreSQL syntax.
--   • Sin USE database — no MySQL-style USE statement
--   • ON CONFLICT DO NOTHING — en lugar de ON DUPLICATE KEY UPDATE
--   • NOW() → NOW() es válido en PostgreSQL también
-- =============================================================================

-- ── Usuarios / Users ──────────────────────────────────────────────────────────
-- Árbol Unilevel:
--   super_admin (root)
--   └── admin
--       ├── finance
--       ├── sales
--       │   ├── advisor_1 (valentina.ospina)
--       │   │   ├── user_1 (andres.martinez)
--       │   │   └── user_2 (luisa.fernandez)
--       │   └── advisor_2 (santiago.gomez)
--       │       └── user_3 (miguel.torres)
--       └── vendor_1 (camilo.restrepo)
--           └── vendor_2 (isabella.vargas)
--   + guest (invitado — sin sponsor / no sponsor)

INSERT INTO users (
  id, email, password_hash, referral_code,
  sponsor_id, position, level, status, role, currency,
  created_at, updated_at
) VALUES
  -- Nivel 0 — raíz del sistema / System root
  ('00000000-0000-0000-0000-000000000001',
   'superadmin@nexoreal.com',
   '$2a$12$Sbwck.9Dg5fXbj34Oti2..q0Gqz9jAHsS4OeXY.pWyt7wUQPBtNaK',
   'NXR-SA-001', NULL, NULL, 1, 'active', 'super_admin', 'COP', NOW(), NOW()),

  -- Nivel 1 — admin general / General admin
  ('00000000-0000-0000-0000-000000000002',
   'admin@nexoreal.com',
   '$2a$12$Sbwck.9Dg5fXbj34Oti2..q0Gqz9jAHsS4OeXY.pWyt7wUQPBtNaK',
   'NXR-AD-002', '00000000-0000-0000-0000-000000000001',
   NULL, 2, 'active', 'admin', 'COP', NOW(), NOW()),

  -- Nivel 2 — roles operativos / Operational roles
  ('00000000-0000-0000-0000-000000000003',
   'finanzas@nexoreal.com',
   '$2a$12$Sbwck.9Dg5fXbj34Oti2..q0Gqz9jAHsS4OeXY.pWyt7wUQPBtNaK',
   'NXR-FN-003', '00000000-0000-0000-0000-000000000002',
   NULL, 3, 'active', 'finance', 'COP', NOW(), NOW()),

  ('00000000-0000-0000-0000-000000000004',
   'ventas@nexoreal.com',
   '$2a$12$Sbwck.9Dg5fXbj34Oti2..q0Gqz9jAHsS4OeXY.pWyt7wUQPBtNaK',
   'NXR-SL-004', '00000000-0000-0000-0000-000000000002',
   NULL, 3, 'active', 'sales', 'COP', NOW(), NOW()),

  ('00000000-0000-0000-0000-000000000007',
   'camilo.restrepo@nexoreal.com',
   '$2a$12$Sbwck.9Dg5fXbj34Oti2..q0Gqz9jAHsS4OeXY.pWyt7wUQPBtNaK',
   'NXR-VD-007', '00000000-0000-0000-0000-000000000002',
   NULL, 3, 'active', 'vendor', 'COP', NOW(), NOW()),

  -- Nivel 3 — asesores y vendor_2 / Advisors and vendor_2
  ('00000000-0000-0000-0000-000000000005',
   'valentina.ospina@nexoreal.com',
   '$2a$12$Sbwck.9Dg5fXbj34Oti2..q0Gqz9jAHsS4OeXY.pWyt7wUQPBtNaK',
   'NXR-AV-005', '00000000-0000-0000-0000-000000000004',
   NULL, 4, 'active', 'advisor', 'COP', NOW(), NOW()),

  ('00000000-0000-0000-0000-000000000006',
   'santiago.gomez@nexoreal.com',
   '$2a$12$Sbwck.9Dg5fXbj34Oti2..q0Gqz9jAHsS4OeXY.pWyt7wUQPBtNaK',
   'NXR-AV-006', '00000000-0000-0000-0000-000000000004',
   NULL, 4, 'active', 'advisor', 'COP', NOW(), NOW()),

  ('00000000-0000-0000-0000-000000000008',
   'isabella.vargas@nexoreal.com',
   '$2a$12$Sbwck.9Dg5fXbj34Oti2..q0Gqz9jAHsS4OeXY.pWyt7wUQPBtNaK',
   'NXR-VD-008', '00000000-0000-0000-0000-000000000007',
   NULL, 4, 'active', 'vendor', 'COP', NOW(), NOW()),

  -- Nivel 4 — usuarios finales / End users
  ('00000000-0000-0000-0000-000000000009',
   'andres.martinez@nexoreal.com',
   '$2a$12$Y7kH4Qk9zU3.5xLnPvR7ReKq5VZDk7pVCdkPqL1bOtV8GqA0mDW7K',
   'NXR-US-009', '00000000-0000-0000-0000-000000000005',
   NULL, 5, 'active', 'user', 'COP', NOW(), NOW()),

  ('00000000-0000-0000-0000-000000000010',
   'luisa.fernandez@nexoreal.com',
   '$2a$12$Y7kH4Qk9zU3.5xLnPvR7ReKq5VZDk7pVCdkPqL1bOtV8GqA0mDW7K',
   'NXR-US-010', '00000000-0000-0000-0000-000000000005',
   NULL, 5, 'active', 'user', 'COP', NOW(), NOW()),

  ('00000000-0000-0000-0000-000000000011',
   'miguel.torres@nexoreal.com',
   '$2a$12$Y7kH4Qk9zU3.5xLnPvR7ReKq5VZDk7pVCdkPqL1bOtV8GqA0mDW7K',
   'NXR-US-011', '00000000-0000-0000-0000-000000000006',
   NULL, 5, 'active', 'user', 'COP', NOW(), NOW()),

  -- Guest — sin sponsor / No sponsor
  ('00000000-0000-0000-0000-000000000012',
   'invitado@nexoreal.com',
   '$2a$12$W2mKsL7rX1pCqMnOaT4YXeHj8NbVdU9fGzI3kRoP6tS5wQlE0mFyJ',
   'NXR-GT-012', NULL,
   NULL, 1, 'active', 'guest', 'COP', NOW(), NOW())

ON CONFLICT (id) DO NOTHING;

-- ── Tabla de cierre — auto-referencias / Closure table — self-references ──────

INSERT INTO user_closure (ancestor_id, descendant_id, depth, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 0, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 0, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 0, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 0, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 0, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006', 0, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000007', 0, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000008', 0, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000009', 0, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000010', 0, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011', 0, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000012', 0, NOW(), NOW())
ON CONFLICT (ancestor_id, descendant_id) DO NOTHING;

-- ── Tabla de cierre — relaciones padre-hijo / Closure — parent-child ──────────
-- Unilevel: cada nodo conecta con TODOS sus ancestros.
-- Unilevel: each node connects to ALL its ancestors.

-- admin es descendiente de super_admin
INSERT INTO user_closure (ancestor_id, descendant_id, depth, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 1, NOW(), NOW())
ON CONFLICT (ancestor_id, descendant_id) DO NOTHING;

-- finance, sales, vendor_1 son descendientes de admin (depth 1) y super_admin (depth 2)
INSERT INTO user_closure (ancestor_id, descendant_id, depth, created_at, updated_at) VALUES
  -- finance
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 1, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 2, NOW(), NOW()),
  -- sales
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 1, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 2, NOW(), NOW()),
  -- vendor_1
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000007', 1, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007', 2, NOW(), NOW())
ON CONFLICT (ancestor_id, descendant_id) DO NOTHING;

-- advisor_1, advisor_2 bajo sales; vendor_2 bajo vendor_1
-- (depth desde sales=1, admin=2, super_admin=3)
INSERT INTO user_closure (ancestor_id, descendant_id, depth, created_at, updated_at) VALUES
  -- advisor_1 (valentina.ospina)
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 1, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 2, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 3, NOW(), NOW()),
  -- advisor_2 (santiago.gomez)
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000006', 1, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000006', 2, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 3, NOW(), NOW()),
  -- vendor_2 (isabella.vargas) bajo vendor_1
  ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000008', 1, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000008', 2, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000008', 3, NOW(), NOW())
ON CONFLICT (ancestor_id, descendant_id) DO NOTHING;

-- user_1, user_2 bajo advisor_1
-- (depth desde advisor_1=1, sales=2, admin=3, super_admin=4)
INSERT INTO user_closure (ancestor_id, descendant_id, depth, created_at, updated_at) VALUES
  -- andres.martinez (user_1)
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000009', 1, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000009', 2, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000009', 3, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000009', 4, NOW(), NOW()),
  -- luisa.fernandez (user_2)
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000010', 1, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000010', 2, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000010', 3, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 4, NOW(), NOW())
ON CONFLICT (ancestor_id, descendant_id) DO NOTHING;

-- user_3 bajo advisor_2
INSERT INTO user_closure (ancestor_id, descendant_id, depth, created_at, updated_at) VALUES
  -- miguel.torres (user_3)
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000011', 1, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000011', 2, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000011', 3, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 4, NOW(), NOW())
ON CONFLICT (ancestor_id, descendant_id) DO NOTHING;

-- ── Verificación / Verification ───────────────────────────────────────────────
SELECT 'Users created:' AS info, COUNT(*) AS count FROM users;
SELECT 'Closure entries:' AS info, COUNT(*) AS count FROM user_closure;
SELECT role, COUNT(*) AS count FROM users GROUP BY role ORDER BY role;
