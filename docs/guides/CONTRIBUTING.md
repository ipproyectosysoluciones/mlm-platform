# Guía de Contribución

¡Gracias por tu interés en contribuir! Este documento proporciona las directrices para contribuir al proyecto.

## 📋 Requisitos

- Node.js 18+
- pnpm como gestor de paquetes
- Docker (para desarrollo local)

## 🚀 Configuración del Entorno

```bash
# Clonar repositorio
git clone <repo-url>
cd MLM

# Instalar dependencias
cd backend && pnpm install
cd ../frontend && pnpm install

# Configurar variables de entorno
cd backend
cp .env.example .env
```

## 🔄 Flujo de Trabajo

1. **Fork** el repositorio
2. **Clone** tu fork:

   ```bash
   git clone https://github.com/tu-usuario/MLM.git
   ```

3. **Crea una rama** para tu funcionalidad:

   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```

4. **Haz tus cambios** siguiendo las directrices de código
5. **Agrega tests** para nuevas funcionalidades
6. **Commit** tus cambios:

   ```bash
   git commit -m "feat: agregar nueva funcionalidad"
   ```

7. **Push** a tu fork:

   ```bash
   git push origin feature/nueva-funcionalidad
   ```

8. Abre un **Pull Request**

## 📝 Reglas de Código

### TypeScript

- Usar `strict` mode
- Definir tipos explícitos para funciones y variables
- No usar `any` sin justificación
- Nombres descriptivos en español/inglés

### Commits

Usar Conventional Commits (ver sección **📝 Commits Convencionales** más abajo):

```text
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: formato, comas, etc.
refactor: refactoring
test: agregar tests
chore: mantenimiento
```

> Siempre usar `--no-gpg-sign` (ver más abajo)

### Testing

- Tests obligatorios para nuevas funcionalidades
- Coverage mínimo: 80%
- Nombrar tests: `describe` → `it`

## 🧪 Ejecutar Tests

```bash
# Todos los tests
pnpm test

# Tests con coverage
pnpm test:coverage

# E2E
pnpm test:e2e
```

## 📚 Documentación

- JSDocs obligatorios en funciones públicas
- Documentar en español e inglés (bilingüe)
- README actualizado para nuevas features

## ❓ ¿Dudas?

- Abre un Issue para讨论
- Consulta la documentación en `/api-docs`

---

## 📝 Commits Convencionales

Este proyecto usa [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Formato
git commit --no-gpg-sign -m "type(scope): description"

# Tipos válidos
feat:     Nueva funcionalidad
fix:      Corrección de bug
chore:    Mantenimiento / configuración
docs:     Documentación
test:     Tests
refactor: Refactoring sin cambio de comportamiento
security: Fix de seguridad

# Ejemplos
git commit --no-gpg-sign -m "feat(admin): add CRUD for properties"
git commit --no-gpg-sign -m "fix(security): normalize req.files cast"
```

> ⚠️ **Nota**: Siempre usar `--no-gpg-sign` en este repositorio (GPG key configuración pendiente).

## 📖 JSDoc Bilingüe

Todos los archivos nuevos o modificados DEBEN incluir JSDoc bilingüe (ES + EN):

```typescript
/**
 * @fileoverview ComponentName - English description
 * @description Spanish description
 * @module path/to/module
 */

/**
 * Function description in English.
 * Descripción de la función en español.
 */
```

---

## 📄 Licencia

Al contribuir, aceptas que tus contribuciones serán licenciadas bajo MIT.
