/**
 * Global test setup — runs before every test file.
 *
 * - Stubs required environment variables so modules that read them at
 *   import-time (e.g. ai.service.ts) don't throw.
 * - Does NOT import any application module directly; mocking happens
 *   per-test-file with vi.mock().
 */

process.env['OPENAI_API_KEY'] = 'test-key';
process.env['OPENAI_MODEL'] = 'gpt-4o-mini';
process.env['MLM_BACKEND_URL'] = 'http://localhost:3000';
process.env['BOT_SECRET'] = 'test-secret';
process.env['N8N_WEBHOOK_URL'] = 'http://localhost:5678/webhook';
process.env['BOT_LOG_LEVEL'] = 'silent';
