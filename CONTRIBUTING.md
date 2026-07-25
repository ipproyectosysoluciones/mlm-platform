# Contributing to Nexo Real

Gracias por tu interés en contribuir a Nexo Real! Este documento explica cómo empezar.

## Prerequisites

- Node.js >= 24.0.0
- pnpm >= 10.0.0
- Docker (for local development)
- PostgreSQL (via Docker)

## Getting Started

```bash
# Clone the repo
git clone https://github.com/ipproyectosysoluciones/mlm-platform.git
cd mlm-platform

# Install dependencies
pnpm install

# Start database
docker compose up -d postgres

# Run migrations
cd backend && pnpm sequelize db:migrate

# Seed database
pnpm seed

# Start development
pnpm dev
```

## Development Workflow

1. Create a branch from `development`:

   ```bash
   git checkout -b feat/your-feature development
   ```

2. Make your changes

3. Run tests:

   ```bash
   # Backend
   cd backend && pnpm test

   # Frontend
   cd frontend && pnpm test

   # Type check
   cd backend && npx tsc --noEmit -p tsconfig.check.json
   ```

4. Commit with [Conventional Commits](https://www.conventionalcommits.org/):

   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug"
   git commit -m "docs: update documentation"
   ```

5. Push and create a PR targeting `development`

## Code Style

- **TypeScript** for all new code
- **Prettier** for formatting (runs on commit via lint-staged)
- **ESLint** for linting
- Follow existing patterns in the codebase

## Testing

- Write tests for new features and bug fixes
- Backend tests use Jest
- Frontend tests use Vitest
- Run `pnpm test` from the relevant workspace

## Pull Request Guidelines

- Fill out the PR template completely
- Reference related issues (e.g., `Closes #123`)
- Keep PRs focused — one feature/fix per PR
- Ensure all tests pass
- Update documentation if needed

## Reporting Bugs

Use the [bug report template](https://github.com/ipproyectosysoluciones/mlm-platform/issues/new?template=bug_report.md) when opening an issue.

## Requesting Features

Use the [feature request template](https://github.com/ipproyectosysoluciones/mlm-platform/issues/new?template=feature_request.md).

## Questions?

Open a discussion or contact us at info@nexoreal.xyz.
