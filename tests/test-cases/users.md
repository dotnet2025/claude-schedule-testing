# Test cases – User Management

> **Status of every case below is `Not Run`** unless stated: the authoring environment had no .NET SDK or package registry access, so no automated test was executed. See `tests/test-results/test-execution-summary.md`.

### TC-USR-001
| Field | Value |
|---|---|
| Test Case ID | TC-USR-001 |
| Module | User Management |
| Scenario | Create/duplicate/invalid user |
| Preconditions | Admin |
| Test Data | - |
| Steps | POST users |
| Expected Result | 201 no password in body; 409; 400 email; 400 role |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthorizationTests.Last_active_admin...) |
| Priority | Critical |

### TC-USR-002
| Field | Value |
|---|---|
| Test Case ID | TC-USR-002 |
| Module | User Management |
| Scenario | Deactivate user blocks login |
| Preconditions | Admin |
| Test Data | - |
| Steps | PUT isActive=false; login |
| Expected Result | Login 401 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthorizationTests.Last_active_admin...) |
| Priority | Critical |

### TC-USR-003
| Field | Value |
|---|---|
| Test Case ID | TC-USR-003 |
| Module | User Management |
| Scenario | Last active admin protection |
| Preconditions | Single admin |
| Test Data | - |
| Steps | Demote/deactivate/delete self |
| Expected Result | 409 / 400 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthorizationTests.Last_active_admin...; e2e/permissions.spec.ts) |
| Priority | Critical |

### TC-USR-004
| Field | Value |
|---|---|
| Test Case ID | TC-USR-004 |
| Module | User Management |
| Scenario | Delete user |
| Preconditions | Admin |
| Test Data | - |
| Steps | DELETE |
| Expected Result | 204 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthorizationTests.Last_active_admin...) |
| Priority | Medium |

### TC-USR-005
| Field | Value |
|---|---|
| Test Case ID | TC-USR-005 |
| Module | User Management |
| Scenario | Admin password reset revokes sessions |
| Preconditions | - |
| Test Data | newPassword |
| Steps | PUT |
| Expected Result | Old password/refresh tokens stop working |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Manual (Implemented; no test) |
| Priority | High |

### TC-USR-006
| Field | Value |
|---|---|
| Test Case ID | TC-USR-006 |
| Module | User Management |
| Scenario | Search and pagination of users |
| Preconditions | >10 users |
| Test Data | - |
| Steps | GET |
| Expected Result | Paged |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Manual (-) |
| Priority | Low |
