# Tasks: Sprint 11 — CRM.tsx Refactoring

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,645 (875 additions + 770 deletions) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Foundation → PR 2: Components → PR 3: Integration |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Hooks + constants | PR 1 | Purely additive (~280 lines) |
| 2 | All 7 components | PR 2 | Purely additive (~600 lines, may need further split) |
| 3 | CRM.tsx shell + barrel | PR 3 | ~50 new + ~770 deleted; base = PR 2 branch |

## Phase 1: Foundation ✓ (PR #1 — Feature Branch Chain)

- [x] 1.1 Create `frontend/src/features/crm/constants.ts` — shared constants (STATUS_COLORS, EMAIL_TEMPLATES, CRM_TABS, LEAD_STATUSES, LEAD_SOURCES); deduplicate STATUS_COLORS from LeadCard.tsx
- [x] 1.2 Create `frontend/src/hooks/useCRMLeads.ts` — lead CRUD, filters, detail loading, status changes, task completion, CSV export
- [x] 1.3 Create `frontend/src/hooks/useCRMTasks.ts` — all-tasks loading with loading/error state
- [x] 1.4 Create `frontend/src/hooks/useCRMKanban.ts` — kanban leads, stats, drag-and-drop status updates
- [x] 1.5 Create `frontend/src/hooks/useCRMMetrics.ts` — stats fetching (total/won/in-progress/conversion rate)
- [x] 1.6 Create `frontend/src/hooks/useCRMAnalytics.ts` — analytics report with period / date-range filtering and CSV export

## Phase 2: Sub-Components

- [ ] 2.1 Create `components/crm/CrmHeader.tsx` — back link, title, new lead/export/import action buttons
- [ ] 2.2 Create `components/crm/CrmTabs.tsx` — 4-tab navigation with active state, props for activeTab + onChange
- [ ] 2.3 Create `components/crm/LeadFilters.tsx` — search, status/source selects, advanced filter toggle, date/value ranges, named exports from constants
- [ ] 2.4 Create `components/crm/LeadDetailPanel.tsx` — slide-out panel: contact info, status selector, tasks, quick notes, email templates, edit/delete
- [ ] 2.5 Create `components/crm/TasksTab.tsx` — loading/empty/list states, uses existing TaskCard
- [ ] 2.6 Create `components/crm/StatsCards.tsx` — 4 metric cards (total/won/in-progress/conversion rate)
- [ ] 2.7 Create `components/crm/ImportCSVModal.tsx` — CSV upload with drag-and-drop area + results display (imported/total, errors list)

## Phase 3: Integration

- [ ] 3.1 Update `components/crm/index.ts` — add barrel exports for all new components
- [ ] 3.2 Refactor `pages/CRM.tsx` — orchestration-only (~180 lines): hook invocations, 4 tab conditionals, composed JSX
- [ ] 3.3 Run `tsc --noEmit` and `pnpm lint` — fix any import/type issues
