# Branching Strategy - MLM Platform

## Estructura de Branches

```
main                    # Producción estable
├── develop            # Desarrollo integración
│   ├── feature/user-preferences
│   ├── feature/notifications
│   └── feature/analytics
└── hotfix/*           # Fixes urgentes
```

## Flujos de Trabajo

### Feature Development
```bash
# 1. Crear feature desde develop
git checkout develop
git pull origin develop
git checkout -b feature/nueva-funcionalidad

# 2. Desarrollar y commit
git add .
git commit -m "feat: descripción"

# 3. Push y PR
git push origin feature/nueva-funcionalidad

# 4. Crear PR hacia develop
# 5. After review y merge, borrar branch
git branch -d feature/nueva-funcionalidad
git push origin --delete feature/nueva-funcionalidad
```

### Release to Production
```bash
# 1. Merge develop a main
git checkout main
git merge develop

# 2. Tag release
git tag -a v1.2.0 -m "Release 1.2.0"
git push origin main --tags

# 3. CD workflow se ejecuta automáticamente
```

### Hotfix
```bash
# 1. Crear hotfix desde main
git checkout main
git checkout -b hotfix/fix-urgente

# 2. Fix y merge
git checkout main
git merge hotfix/fix-urgente

# 3. Tag
git tag -a v1.2.1 -m "Hotfix: descripción"
```

## Naming Conventions

| Type       | Prefix          | Ejemplo                          |
| ---------- | --------------- | -------------------------------- |
| Feature    | `feature/`       | `feature/user-preferences`       |
| Bug Fix    | `bugfix/`        | `bugfix/login-error`             |
| Hotfix     | `hotfix/`        | `hotfix/security-patch`          |
| Release    | `release/`       | `release/v1.2.0`                 |
| Docs       | `docs/`          | `docs/api-documentation`         |
| Refactor   | `refactor/`      | `refactor/auth-module`           |

## Branches Actuales

| Branch                      | Descripción                     | Estado   |
| --------------------------- | ------------------------------- | -------- |
| `main`                        | Producción                      | ✅ Stable |
| `develop`                     | Integración de features         | 🔄 Active |
| `feature/user-preferences`   | Preferencias de usuario         | 🆕 Ready |
| `feature/notifications`      | Sistema de notificaciones       | 🆕 Ready |
| `feature/analytics`          | Dashboard de analytics          | 🆕 Ready |

## Commits Messages

Usar Conventional Commits:
```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
style: formato
refactor:重构
test: tests
chore: mantenimiento
perf: performance
ci: CI/CD
```
