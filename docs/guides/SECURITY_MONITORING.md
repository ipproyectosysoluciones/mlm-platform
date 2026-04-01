# Security Monitoring

## Status: ✅ ALL VULNERABILITIES RESOLVED

**Last Updated**: 2026-03-27

## Current Vulnerabilities

✅ **No known vulnerabilities found** - All issues resolved via pnpm overrides

## Actions Completed

### 2026-03-27

- [x] Update express to v5.2.1 (resolves path-to-regexp)
- [x] Remove handlebars dependency (eliminates 7 vulnerabilities)
- [x] Update lint-staged to v16.4.0
- [x] Add weekly security audit GitHub Action
- [x] **Resolve remaining 4 vulnerabilities via pnpm overrides**:
  - serialize-javascript: >=7.0.5 (was <7.0.5)
  - brace-expansion: >=1.1.13, >=2.0.3, >=5.0.5
  - Run `pnpm dedupe` to apply overrides

## Resolved Vulnerabilities (2026-03-27)

| Package              | Vulnerability                            | Fix Applied                            |
| -------------------- | ---------------------------------------- | -------------------------------------- |
| serialize-javascript | CPU Exhaustion DoS (GHSA-qj8w-gfj5-8c6v) | Override to >=7.0.5                    |
| brace-expansion      | Memory Exhaustion (GHSA-f886-m6hf-6m8v)  | Override to >=1.1.13, >=2.0.3, >=5.0.5 |
| path-to-regexp       | Path traversal                           | Resolved via express v5                |
| handlebars           | 7 vulnerabilities (RCE, Prototype Poll.) | Removed from dependencies              |

## Previous Vulnerabilities (Now Resolved)

### picomatch (8 vulns) - ✅ RESOLVED

- **Type**: Method Injection (Prototype Pollution), ReDoS
- **Severity**: 4 High, 4 Medium
- **Root cause**: Transitive dependency of lint-staged
- **Risk**: Dev-only dependency (git hooks), low production risk
- **Fix**: Using picomatch@4.0.4 (latest) via lint-staged@16.4.0

### brace-expansion (5 vulns) - ✅ RESOLVED

- **Type**: Memory exhaustion via zero-step sequences
- **Severity**: 5 Medium
- **Root cause**: Transitive dependency (jest, eslint, sequelize-cli)
- **Fix**: pnpm overrides force >=1.1.13, >=2.0.3, >=5.0.5

### serialize-javascript (3 vulns) - ✅ RESOLVED

- **Type**: ReDoS, RCE
- **Severity**: 2 High, 1 Medium
- **Root cause**: Transitive dependency of qrcode via vite-plugin-pwa
- **Fix**: pnpm override forces >=7.0.5

## Monitoring Configuration

### GitHub Action: security-audit.yml

- **Schedule**: Every Monday at 8:00 AM UTC
- **Tools**: npm audit, Trivy
- **Output**: GitHub Security tab + weekly report

## Weekly Checklist

- [x] Check npm audit output
- [x] Review Dependabot alerts
- [x] Update SECURITY_MONITORING.md
- [ ] Check for new vulnerability disclosures

## Resources

- [Dependabot Alerts](https://github.com/ipproyectosysoluciones/mlm-platform/security/dependabot)
- [GitHub Security Advisories](https://github.com/advisories?query=ecosystem%3Anpm)
