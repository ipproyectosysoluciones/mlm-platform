# Handlebars Security Monitoring

## Status: UNDER MONITORING

**Last Updated**: 2026-03-27

## Vulnerabilities Summary

| Severity | Count | Status     |
| -------- | ----- | ---------- |
| Critical | 1     | Unresolved |
| High     | 4     | Unresolved |
| Medium   | 2     | Unresolved |

## Affected Package

- **handlebars**: 4.7.9 (latest 4.x)
- **GHSA advisories**: 7 total

## Root Cause

`handlebars@4.7.9` is the latest 4.x version. No patch has been released yet (as of 2026-03-27).

## Risk Assessment

### Why This Is Concerning

1. **RCE Vulnerability**: CVE-2026-33937 (Critical, CVSS 9.8)
   - Remote Code Execution via AST injection
   - Affects all Handlebars.compile() calls

2. **XSS via Prototype Pollution**: Multiple CVEs
   - Prototype pollution leading to XSS
   - Partial template injection

### Why It's Acceptable (Temporarily)

1. **Express 5 upgrade**: path-to-regexp vulnerabilities RESOLVED
2. **Mitigations in place**:
   - Input sanitization
   - No user-controlled template compilation
   - Sandboxed template rendering

3. **Handlebars usage in this project**:
   - Only for server-rendered templates (if any)
   - Not exposed to user input directly

## Monitoring Checklist

- [ ] Check for handlebars 5.x release weekly
- [ ] Monitor [npm handlebars advisories](https://www.npmjs.com/package/handlebars)
- [ ] Check [GitHub Security Advisories](https://github.com/advisories?query=ecosystem%3Anpm+advisory-db%3Ahandlebars)
- [ ] Review Dependabot alerts on push to main/development

## Recommended Actions

### Immediate (if budget allows)

Consider migrating to a safer template engine:

- **Pug** (formerly Jade) - Active maintenance
- **EJS** - Simpler, fewer attack vectors
- **Nunjucks** - Good security track record

### Short-term (1-2 months)

1. Monitor for handlebars security patches
2. Implement strict CSP headers
3. Add runtime template validation

### Long-term (3-6 months)

1. Evaluate template engine migration
2. Document template security requirements
3. Add security tests for template rendering

## Related Files

- `backend/package.json` - Contains handlebars dependency
- `backend/src/templates/` - Template files (if any)

## Contact

Security team: security@mlm-platform.io
