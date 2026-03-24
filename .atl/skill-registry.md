# Skill Registry

**Orchestrator use only.** Read this registry once per session to resolve skill paths, then pass pre-resolved paths directly to each sub-agent's launch prompt. Sub-agents receive the path and load the skill directly — they do NOT read this registry.

## User Skills

| Trigger                                          | Skill                   | Path                                                                           |
| ------------------------------------------------ | ----------------------- | ------------------------------------------------------------------------------ |
| Angular projects, standalone components, signals | angular-core            | file:///home/bladimir/.claude/skills/angular/core/SKILL.md                     |
| Angular forms, signal forms, reactive forms      | angular-forms           | file:///home/bladimir/.claude/skills/angular/forms/SKILL.md                    |
| Angular performance, lazy loading, SSR           | angular-performance     | file:///home/bladimir/.claude/skills/angular/performance/SKILL.md              |
| Angular architecture, scope rule                 | angular-architecture    | file:///home/bladimir/.claude/skills/angular/architecture/SKILL.md             |
| Create new skill, add agent instructions         | skill-creator           | file:///home/bladimir/.config/opencode/skills/skill-creator/SKILL.md           |
| React 19, React Compiler patterns                | react-19                | file:///home/bladimir/.config/opencode/skills/react-19/SKILL.md                |
| Zustand state management                         | zustand-5               | file:///home/bladimir/.config/opencode/skills/zustand-5/SKILL.md               |
| Zod validation                                   | zod-4                   | file:///home/bladimir/.config/opencode/skills/zod-4/SKILL.md                   |
| Tailwind CSS 4                                   | tailwind-4              | file:///home/bladimir/.config/opencode/skills/tailwind-4/SKILL.md              |
| Playwright E2E testing                           | playwright              | file:///home/bladimir/.config/opencode/skills/playwright/SKILL.md              |
| GitHub PR review                                 | pr-review               | file:///home/bladimir/.config/opencode/skills/pr-review/SKILL.md               |
| Technical review, code assessments               | technical-review        | file:///home/bladimir/.config/opencode/skills/technical-review/SKILL.md        |
| TypeScript patterns                              | typescript              | file:///home/bladimir/.config/opencode/skills/typescript/SKILL.md              |
| Next.js 15 App Router                            | nextjs-15               | file:///home/bladimir/.config/opencode/skills/nextjs-15/SKILL.md               |
| Create Jira tasks                                | jira-task               | file:///home/bladimir/.config/opencode/skills/jira-task/SKILL.md               |
| Create Jira epics                                | jira-epic               | file:///home/bladimir/.config/opencode/skills/jira-epic/SKILL.md               |
| Redis development, caching, vector search        | redis-development       | file:///home/bladimir/.agents/skills/redis-development/SKILL.md                |
| Vitest testing framework                         | vitest                  | file:///home/bladimir/.agents/skills/vitest/SKILL.md                           |
| Git commit with conventional commits             | git-commit              | file:///home/bladimir/.agents/skills/git-commit/SKILL.md                       |
| Frontend design, web components                  | frontend-design         | file:///home/bladimir/.agents/skills/frontend-design/SKILL.md                  |
| Database schema design                           | database-schema-design  | file:///home/bladimir/.agents/skills/database-schema-design/SKILL.md           |
| Playwright browser automation                    | playwright-cli          | file:///home/bladimir/.agents/skills/playwright-cli/SKILL.md                   |
| Workflow automation, build scripts               | workflow-automation     | file:///home/bladimir/.agents/skills/workflow-automation/SKILL.md              |
| pnpm package manager                             | pnpm                    | file:///home/bladimir/.agents/skills/pnpm/SKILL.md                             |
| GitHub CLI operations                            | gh-cli                  | file:///home/bladimir/.agents/skills/gh-cli/SKILL.md                           |
| Create pull requests                             | create-pr               | file:///home/bladimir/.agents/skills/create-pr/SKILL.md                        |
| Loom video transcript                            | loom-transcript         | file:///home/bladimir/.agents/skills/loom-transcript/SKILL.md                  |
| Linear issue analysis                            | linear-issue            | file:///home/bladimir/.agents/skills/linear-issue/SKILL.md                     |
| Reproduction bug from Linear ticket              | reproduce-bug           | file:///home/bladimir/.agents/skills/reproduce-bug/SKILL.md                    |
| UI content design, copy, i18n strings            | content-design          | file:///home/bladimir/.agents/skills/content-design/SKILL.md                   |
| Responsive web design                            | responsive-design       | file:///home/bladimir/.agents/skills/responsive-design/SKILL.md                |
| PostgreSQL optimization                          | postgresql-optimization | file:///home/bladimir/.agents/skills/postgresql-optimization/SKILL.md          |
| Supabase Postgres best practices                 | supabase-postgres       | file:///home/bladimir/.agents/skills/supabase-postgres-best-practices/SKILL.md |
| Theme styling for artifacts                      | theme-factory           | file:///home/bladimir/.agents/skills/theme-factory/SKILL.md                    |
| Stream/presentation deck                         | stream-deck             | file:///home/bladimir/.config/opencode/skills/stream-deck/SKILL.md             |
| Find and install skills                          | find-skills             | file:///home/bladimir/.agents/skills/find-skills/SKILL.md                      |

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
