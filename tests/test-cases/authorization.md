# Test cases – Roles & Permissions

> **Status of every case below is `Not Run`** unless stated: the authoring environment had no .NET SDK or package registry access, so no automated test was executed. See `tests/test-results/test-execution-summary.md`.

### TC-AUTHZ-001
| Field | Value |
|---|---|
| Test Case ID | TC-AUTHZ-001 |
| Module | Roles & Permissions |
| Scenario | Anonymous cannot call admin endpoints |
| Preconditions | - |
| Test Data | - |
| Steps | GET each admin endpoint |
| Expected Result | 401 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthorizationTests.Anonymous_cannot_access_admin_endpoints) |
| Priority | Critical |

### TC-AUTHZ-002
| Field | Value |
|---|---|
| Test Case ID | TC-AUTHZ-002 |
| Module | Roles & Permissions |
| Scenario | Editor forbidden from users/settings |
| Preconditions | Editor logged in |
| Test Data | - |
| Steps | GET/POST/DELETE users; PUT settings |
| Expected Result | 403 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthorizationTests.Editor_cannot_manage_users_or_settings) |
| Priority | Critical |

### TC-AUTHZ-003
| Field | Value |
|---|---|
| Test Case ID | TC-AUTHZ-003 |
| Module | Roles & Permissions |
| Scenario | Editor can manage content |
| Preconditions | Editor |
| Test Data | - |
| Steps | Create page, category |
| Expected Result | 200/201 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthorizationTests.Editor_can_manage_content) |
| Priority | Critical |

### TC-AUTHZ-004
| Field | Value |
|---|---|
| Test Case ID | TC-AUTHZ-004 |
| Module | Roles & Permissions |
| Scenario | Admin can manage users and settings |
| Preconditions | Admin |
| Test Data | - |
| Steps | GET users; PUT settings |
| Expected Result | 200 and public settings reflect change |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthorizationTests.Admin_can_manage_users_and_settings) |
| Priority | Critical |

### TC-AUTHZ-005
| Field | Value |
|---|---|
| Test Case ID | TC-AUTHZ-005 |
| Module | Roles & Permissions |
| Scenario | Dashboard user count hidden from Editor |
| Preconditions | Both roles |
| Test Data | - |
| Steps | GET /api/dashboard |
| Expected Result | totalUsers null for Editor |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthorizationTests.Dashboard_hides_user_count_from_editor) |
| Priority | Medium |

### TC-AUTHZ-006
| Field | Value |
|---|---|
| Test Case ID | TC-AUTHZ-006 |
| Module | Roles & Permissions |
| Scenario | Protected route redirect/403 (UI) |
| Preconditions | Mock sessions |
| Test Data | anonymous/editor/admin |
| Steps | Open /admin, /admin/users |
| Expected Result | Redirect, 403, allowed |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (ProtectedRoute.test.tsx) |
| Priority | Critical |

### TC-AUTHZ-007
| Field | Value |
|---|---|
| Test Case ID | TC-AUTHZ-007 |
| Module | Roles & Permissions |
| Scenario | Editor UI hides admin menu and API refuses (E2E) |
| Preconditions | Editor created via UI |
| Test Data | - |
| Steps | Login as editor |
| Expected Result | No Users/Settings links; /admin/users 403; API 403 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (e2e/permissions.spec.ts) |
| Priority | Critical |
