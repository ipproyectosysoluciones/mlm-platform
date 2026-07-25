# Proposal: Sprint 11 — CRM.tsx Refactoring

## Intent

CRM.tsx is 953 lines across 4 domains (leads, kanban, tasks, stats) with 20+ useState hooks and inline modals. Follow the Dashboard refactoring pattern (735→181 lines) to improve testability and enable independent feature work.

## Scope

### In Scope
- Extract 7 sub-components into `components/crm/`
- Extract 5 custom hooks for data fetching
- Reduce CRM.tsx to orchestration-only (~180 lines)
- Update barrel export

### Out of Scope
- No API/service/i18n changes, no new features, no routing changes, no test creation

## Capabilities

### New Capabilities
None (pure code reorganization)

### Modified Capabilities
None (requirements unchanged)

## Approach

**7 components** to extract:

| Component | Lines | Responsibility |
|-----------|-------|---------------|
| CrmHeader | 60 | Back link, title, action buttons |
| CrmTabs | 20 | Tab navigation (4 tabs) |
| LeadFilters | 115 | Search bar, status/source selects, advanced filters |
| LeadDetailPanel | 220 | Lead detail slide-out + tasks, notes, email templates |
| TasksTab | 25 | Tasks tab (loading/empty/list) |
| StatsCards | 45 | 4 metric cards |
| ImportCSVModal | 95 | CSV upload + result display |

**5 hooks** to extract: `useLeads`, `useLeadDetail`, `useTasks`, `useCRMStats`, `useImportCSV`

**Naming**: PascalCase components, camelCase hooks, named exports. Hooks go in `components/crm/hooks/`.

**Target**: CRM.tsx from 953→~180 lines (tab routing + hook invocations + composed JSX).

## Affected Areas

| Area | Impact |
|------|--------|
| `frontend/src/pages/CRM.tsx` | Modified (953→180 lines) |
| `frontend/src/components/crm/CrmHeader.tsx` | New |
| `frontend/src/components/crm/CrmTabs.tsx` | New |
| `frontend/src/components/crm/LeadFilters.tsx` | New |
| `frontend/src/components/crm/LeadDetailPanel.tsx` | New |
| `frontend/src/components/crm/TasksTab.tsx` | New |
| `frontend/src/components/crm/StatsCards.tsx` | New |
| `frontend/src/components/crm/ImportCSVModal.tsx` | New |
| `frontend/src/components/crm/hooks/useLeads.ts` | New |
| `frontend/src/components/crm/hooks/useLeadDetail.ts` | New |
| `frontend/src/components/crm/hooks/useTasks.ts` | New |
| `frontend/src/components/crm/hooks/useCRMStats.ts` | New |
| `frontend/src/components/crm/hooks/useImportCSV.ts` | New |
| `frontend/src/components/crm/index.ts` | Modified |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| State coupling between hooks | Low | Split per domain — verify tabs independently |
| Import breakage | Low | Named exports + verify with `tsc --noEmit` |
| EMAIL_TEMPLATES duplication | Low | Move to `constants.ts` |

## Rollback Plan

Revert `CRM.tsx` to HEAD, delete new files. Zero schema/API changes.

## Dependencies

None

## Success Criteria

- [ ] CRM.tsx ≤200 lines
- [ ] Visual regression check on all 4 tabs
- [ ] Leads tab: search, filter, CRUD, import/export all work
- [ ] Kanban tab: unchanged
- [ ] Tasks tab: loads and renders
- [ ] Stats tab: 4 metric cards render
- [ ] `tsc --noEmit` passes
- [ ] `pnpm lint` passes
