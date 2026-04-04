# Skill Registry

**Orchestrator use only.** Read this registry once per session to resolve skill paths, then pass pre-resolved paths directly to each sub-agent's launch prompt. Sub-agents receive the path and load the skill directly — they do NOT read this registry.

## User Skills

| Trigger                                           | Skill                   | Path                                                                           |
| ------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------ |
| Angular projects, standalone components, signals  | angular-core            | file:///home/bladimir/.claude/skills/angular/core/SKILL.md                     |
| Angular forms, signal forms, reactive forms       | angular-forms           | file:///home/bladimir/.claude/skills/angular/forms/SKILL.md                    |
| Angular performance, lazy loading, SSR            | angular-performance     | file:///home/bladimir/.claude/skills/angular/performance/SKILL.md              |
| Angular architecture, scope rule                  | angular-architecture    | file:///home/bladimir/.claude/skills/angular/architecture/SKILL.md             |
| Create new skill, add agent instructions          | skill-creator           | file:///home/bladimir/.config/opencode/skills/skill-creator/SKILL.md           |
| React 19, React Compiler patterns                 | react-19                | file:///home/bladimir/.config/opencode/skills/react-19/SKILL.md                |
| Zustand state management                          | zustand-5               | file:///home/bladimir/.config/opencode/skills/zustand-5/SKILL.md               |
| Zod validation                                    | zod-4                   | file:///home/bladimir/.config/opencode/skills/zod-4/SKILL.md                   |
| Tailwind CSS 4                                    | tailwind-4              | file:///home/bladimir/.config/opencode/skills/tailwind-4/SKILL.md              |
| Playwright E2E testing                            | playwright              | file:///home/bladimir/.config/opencode/skills/playwright/SKILL.md              |
| GitHub PR review                                  | pr-review               | file:///home/bladimir/.config/opencode/skills/pr-review/SKILL.md               |
| Technical review, code assessments                | technical-review        | file:///home/bladimir/.config/opencode/skills/technical-review/SKILL.md        |
| TypeScript patterns                               | typescript              | file:///home/bladimir/.config/opencode/skills/typescript/SKILL.md              |
| Next.js 15 App Router                             | nextjs-15               | file:///home/bladimir/.config/opencode/skills/nextjs-15/SKILL.md               |
| Create Jira tasks                                 | jira-task               | file:///home/bladimir/.config/opencode/skills/jira-task/SKILL.md               |
| Create Jira epics                                 | jira-epic               | file:///home/bladimir/.config/opencode/skills/jira-epic/SKILL.md               |
| Redis development, caching, vector search         | redis-development       | file:///home/bladimir/.agents/skills/redis-development/SKILL.md                |
| Vitest testing framework                          | vitest                  | file:///home/bladimir/.agents/skills/vitest/SKILL.md                           |
| Git commit with conventional commits              | git-commit              | file:///home/bladimir/.agents/skills/git-commit/SKILL.md                       |
| Frontend design, web components                   | frontend-design         | file:///home/bladimir/.agents/skills/frontend-design/SKILL.md                  |
| Database schema design                            | database-schema-design  | file:///home/bladimir/.agents/skills/database-schema-design/SKILL.md           |
| Playwright browser automation                     | playwright-cli          | file:///home/bladimir/.agents/skills/playwright-cli/SKILL.md                   |
| Workflow automation, build scripts                | workflow-automation     | file:///home/bladimir/.agents/skills/workflow-automation/SKILL.md              |
| pnpm package manager                              | pnpm                    | file:///home/bladimir/.agents/skills/pnpm/SKILL.md                             |
| GitHub CLI operations                             | gh-cli                  | file:///home/bladimir/.agents/skills/gh-cli/SKILL.md                           |
| Create pull requests                              | create-pr               | file:///home/bladimir/.agents/skills/create-pr/SKILL.md                        |
| Loom video transcript                             | loom-transcript         | file:///home/bladimir/.agents/skills/loom-transcript/SKILL.md                  |
| Linear issue analysis                             | linear-issue            | file:///home/bladimir/.agents/skills/linear-issue/SKILL.md                     |
| Reproduction bug from Linear ticket               | reproduce-bug           | file:///home/bladimir/.agents/skills/reproduce-bug/SKILL.md                    |
| UI content design, copy, i18n strings             | content-design          | file:///home/bladimir/.agents/skills/content-design/SKILL.md                   |
| Responsive web design                             | responsive-design       | file:///home/bladimir/.agents/skills/responsive-design/SKILL.md                |
| PostgreSQL optimization                           | postgresql-optimization | file:///home/bladimir/.agents/skills/postgresql-optimization/SKILL.md          |
| Supabase Postgres best practices                  | supabase-postgres       | file:///home/bladimir/.agents/skills/supabase-postgres-best-practices/SKILL.md |
| Theme styling for artifacts                       | theme-factory           | file:///home/bladimir/.agents/skills/theme-factory/SKILL.md                    |
| Stream/presentation deck                          | stream-deck             | file:///home/bladimir/.config/opencode/skills/stream-deck/SKILL.md             |
| Find and install skills                           | find-skills             | file:///home/bladimir/.agents/skills/find-skills/SKILL.md                      |
| PayPal payments, checkout, subscriptions, IPN     | paypal-integration      | file:///home/bladimir/.agents/skills/paypal-integration/SKILL.md               |
| Cloudflare Workers, Pages, KV, D1, R2, Tunnel     | cloudflare              | file:///home/bladimir/.agents/skills/cloudflare/SKILL.md                       |
| Sentry Node.js, error monitoring, tracing         | sentry-node-sdk         | file:///home/bladimir/.agents/skills/sentry-node-sdk/SKILL.md                  |
| Sentry React, session replay, profiling           | sentry-react-sdk        | file:///home/bladimir/.agents/skills/sentry-react-sdk/SKILL.md                 |
| Sentry fix issues, debug production errors        | sentry-fix-issues       | file:///home/bladimir/.agents/skills/sentry-fix-issues/SKILL.md                |
| Sentry create alerts, notifications               | sentry-create-alert     | file:///home/bladimir/.agents/skills/sentry-create-alert/SKILL.md              |
| Sentry SDK setup, install SDK                     | sentry-sdk-setup        | file:///home/bladimir/.agents/skills/sentry-sdk-setup/SKILL.md                 |
| Sentry workflow, triage, PR review                | sentry-workflow         | file:///home/bladimir/.agents/skills/sentry-workflow/SKILL.md                  |
| Sentry code review, PR comments                   | sentry-code-review      | file:///home/bladimir/.agents/skills/sentry-code-review/SKILL.md               |
| TypeScript + React code review, anti-patterns     | ts-react-reviewer       | file:///home/bladimir/.agents/skills/typescript-react-reviewer/SKILL.md        |
| Playwright best practices, POM, CI/CD, a11y       | playwright-best         | file:///home/bladimir/.agents/skills/playwright-best-practices/SKILL.md        |
| API design principles, REST, GraphQL              | api-design-principles   | file:///home/bladimir/.agents/skills/api-design-principles/SKILL.md            |
| Product strategy, positioning, roadmap            | product-strategy        | file:///home/bladimir/.agents/skills/product-strategy-session/SKILL.md         |
| shadcn/ui components, install, customize          | shadcn-ui               | file:///home/bladimir/.agents/skills/shadcn-ui/SKILL.md                        |
| SEO, AEO, metadata, JSON-LD, structured data      | seo-aeo                 | file:///home/bladimir/.agents/skills/seo-aeo-best-practices/SKILL.md           |
| TDD, test-driven development                      | test-driven-dev         | file:///home/bladimir/.agents/skills/test-driven-development/SKILL.md          |
| UI/UX design, styles, palettes, a11y, charts      | ui-ux-pro-max           | file:///home/bladimir/.agents/skills/ui-ux-pro-max/SKILL.md                    |
| PRD, product requirements, user stories           | prd                     | file:///home/bladimir/.agents/skills/prd/SKILL.md                              |
| MCP server builder, FastMCP, MCP SDK              | mcp-builder             | file:///home/bladimir/.agents/skills/mcp-builder/SKILL.md                      |
| Web design guidelines, a11y audit, UX review      | web-design-guidelines   | file:///home/bladimir/.agents/skills/web-design-guidelines/SKILL.md            |
| TypeScript advanced types, generics, mapped types | ts-advanced-types       | file:///home/bladimir/.agents/skills/typescript-advanced-types/SKILL.md        |
| Next.js best practices, RSC, metadata, bundling   | next-best-practices     | file:///home/bladimir/.agents/skills/next-best-practices/SKILL.md              |
| tsdown bundler, Rolldown, .d.ts generation        | tsdown                  | file:///home/bladimir/.agents/skills/tsdown/SKILL.md                           |
| Turborepo monorepo, turbo.json, pipelines         | turborepo               | file:///home/bladimir/.agents/skills/turborepo/SKILL.md                        |
| Vercel React performance optimization             | vercel-react-perf       | file:///home/bladimir/.agents/skills/vercel-react-best-practices/SKILL.md      |
| Database schema design, SQL, NoSQL, migrations    | database-schema-design  | file:///home/bladimir/.agents/skills/database-schema-design/SKILL.md           |
| n8n workflow automation patterns                  | n8n-conventions         | file:///home/bladimir/.agents/skills/n8n-conventions/SKILL.md                  |

## Project Conventions

| File         | Path                                                  | Notes                       |
| ------------ | ----------------------------------------------------- | --------------------------- |
| agents.md    | /media/bladimir/Datos1/Datos/MLM/AGENTS.md            | Project orchestration rules |
| .env.example | /media/bladimir/Datos1/Datos/MLM/backend/.env.example | Environment template        |

## SDD Workflow Skills (not for direct sub-agent use)

| Phase       | Path                                                               |
| ----------- | ------------------------------------------------------------------ |
| sdd-explore | file:///home/bladimir/.config/opencode/skills/sdd-explore/SKILL.md |
| sdd-propose | file:///home/bladimir/.config/opencode/skills/sdd-propose/SKILL.md |
| sdd-spec    | file:///home/bladimir/.config/opencode/skills/sdd-spec/SKILL.md    |
| sdd-design  | file:///home/bladimir/.config/opencode/skills/sdd-design/SKILL.md  |
| sdd-tasks   | file:///home/bladimir/.config/opencode/skills/sdd-tasks/SKILL.md   |
| sdd-apply   | file:///home/bladimir/.config/opencode/skills/sdd-apply/SKILL.md   |
| sdd-verify  | file:///home/bladimir/.config/opencode/skills/sdd-verify/SKILL.md  |
| sdd-archive | file:///home/bladimir/.config/opencode/skills/sdd-archive/SKILL.md |
