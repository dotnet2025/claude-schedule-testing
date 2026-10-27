# Test cases – Dashboard

> **Status of every case below is `Not Run`** unless stated: the authoring environment had no .NET SDK or package registry access, so no automated test was executed. See `tests/test-results/test-execution-summary.md`.

### TC-DASH-001
| Field | Value |
|---|---|
| Test Case ID | TC-DASH-001 |
| Module | Dashboard |
| Scenario | Metrics rendered from API |
| Preconditions | Mock API |
| Test Data | 7 posts etc. |
| Steps | Render |
| Expected Result | Values shown |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (DashboardPage.test.tsx) |
| Priority | High |

### TC-DASH-002
| Field | Value |
|---|---|
| Test Case ID | TC-DASH-002 |
| Module | Dashboard |
| Scenario | Admin-only widgets hidden for Editor |
| Preconditions | Editor |
| Test Data | - |
| Steps | Render |
| Expected Result | No user count / Manage users |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (DashboardPage.test.tsx) |
| Priority | High |

### TC-DASH-003
| Field | Value |
|---|---|
| Test Case ID | TC-DASH-003 |
| Module | Dashboard |
| Scenario | Empty and error states |
| Preconditions | Mock empty/500 |
| Test Data | - |
| Steps | Render |
| Expected Result | Empty message / error text |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (DashboardPage.test.tsx) |
| Priority | Medium |

### TC-DASH-004
| Field | Value |
|---|---|
| Test Case ID | TC-DASH-004 |
| Module | Dashboard |
| Scenario | Dashboard metrics match DB |
| Preconditions | Seeded data |
| Test Data | - |
| Steps | GET /api/dashboard |
| Expected Result | Counts equal real counts |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Manual (Covered indirectly by AuthorizationTests; dedicated count assertion not written) |
| Priority | Medium |

### TC-DASH-005
| Field | Value |
|---|---|
| Test Case ID | TC-DASH-005 |
| Module | Dashboard |
| Scenario | Loading indicator visible |
| Preconditions | Slow API |
| Test Data | - |
| Steps | Open dashboard |
| Expected Result | Spinner shown |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Manual (-) |
| Priority | Low |
