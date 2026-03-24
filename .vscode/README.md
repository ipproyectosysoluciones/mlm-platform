# VS Code Configuration for MLM Platform

## Recommended Extensions

When you open this project in VS Code, it will prompt you to install the recommended extensions. Click **"Install All"** to get the full development experience.

### Essential Extensions

| Extension | Purpose |
|-----------|---------|
| **TypeScript** | Language support with latest features |
| **Prettier** | Code formatting |
| **ESLint** | Code linting |
| **Tailwind CSS IntelliSense** | Tailwind autocomplete |
| **GitLens** | Advanced Git features |
| **Docker** | Docker support |
| **REST Client** | Test API endpoints |
| **i18n Ally** | Manage translations |
| **SQLTools** | Database queries |

---

## Quick Commands

### Format Document
`Ctrl + Shift + P` → `Format Document`

### Run ESLint Fix
`Ctrl + Shift + P` → `ESLint: Fix all problems`

### Open Terminal
`Ctrl + `` ` ``

### Git Commands
- `Ctrl + Shift + G` → Source Control panel
- `Ctrl + Enter` → Commit (when changes staged)

---

## Workspace Settings

The workspace settings include:

- **Auto-format on save** with Prettier
- **TypeScript inlay hints** for better DX
- **Path aliases** configured in path-intellisense
- **Tailwind CSS** class name autocomplete
- **ESLint** auto-fix on save

---

## Environment Setup

1. Copy environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your values in `.env.local`

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Start development servers:
   ```bash
   # Terminal 1 - Backend
   cd backend && pnpm dev

   # Terminal 2 - Frontend
   cd frontend && pnpm dev
   ```

---

## API Testing with REST Client

Use the included `.http` files or create new ones:

```http
### Login
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@mlm.com",
  "password": "admin123"
}
```
