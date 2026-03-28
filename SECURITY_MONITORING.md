# Security Monitoring

## Status: ACTIVE - Weekly Audit Configured

**Last Updated**: 2026-03-27

## Current Vulnerabilities

| Package                  | Critical | High | Medium | Total  | Status                       |
| ------------------------ | -------- | ---- | ------ | ------ | ---------------------------- |
| **picomatch**            | 0        | 4    | 4      | 8      | Under monitoring (devDep)    |
| **brace-expansion**      | 0        | 0    | 5      | 5      | Under monitoring (devDep)    |
| **serialize-javascript** | 0        | 2    | 1      | 3      | Under monitoring (devDep)    |
| **handlebars**           | 1        | 4    | 2      | 7      | ✅ REMOVED from dependencies |
| **TOTAL**                | 1        | 10   | 12     | **17** | -                            |

## Actions Completed

### 2026-03-27

- [x] Update express to v5.2.1 (resolves path-to-regexp)
- [x] Remove handlebars dependency (eliminates 7 vulnerabilities)
- [x] Update lint-staged to v16.4.0
- [x] Add weekly security audit GitHub Action

## Resolved Vulnerabilities

| Package        | Version | Status                       |
| -------------- | ------- | ---------------------------- |
| path-to-regexp | 8.4.0   | ✅ Resolved via express v5   |
| handlebars     | Removed | ✅ Removed from dependencies |

## Remaining Vulnerabilities

### picomatch (8 vulns)

- **Type**: Method Injection (Prototype Pollution), ReDoS
- **Severity**: 4 High, 4 Medium
- **Root cause**: Transitive dependency of lint-staged
- **Risk**: Dev-only dependency (git hooks), low production risk
- **Fix**: Waiting for lint-staged to update picomatch

### brace-expansion (5 vulns)

- **Type**: Memory exhaustion via zero-step sequences
- **Severity**: 5 Medium
- **Root cause**: Transitive dependency
- **Risk**: Dev-only dependency, low production risk
- **Fix**: Waiting for dependency chain update

### serialize-javascript (3 vulns)

- **Type**: ReDoS, RCE
- **Severity**: 2 High, 1 Medium
- **Root cause**: Transitive dependency of qrcode
- **Risk**: Low (serialization is controlled)
- **Fix**: Monitor for updates

## Monitoring Configuration

### GitHub Action: security-audit.yml

- **Schedule**: Every Monday at 8:00 AM UTC
- **Tools**: npm audit, Trivy
- **Output**: GitHub Security tab + weekly report

## Weekly Checklist

- [ ] Check npm audit output
- [ ] Review Dependabot alerts
- [ ] Update SECURITY_WEEKLY.md
- [ ] Check for new vulnerability disclosures

## Resources

- [Dependabot Alerts](https://github.com/ipproyectosysoluciones/mlm-platform/security/dependabot)
- [GitHub Security Advisories](https://github.com/advisories?query=ecosystem%3Anpm)
