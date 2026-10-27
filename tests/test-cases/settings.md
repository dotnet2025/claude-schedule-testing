# Test cases – Website Settings

> **Status of every case below is `Not Run`** unless stated: the authoring environment had no .NET SDK or package registry access, so no automated test was executed. See `tests/test-results/test-execution-summary.md`.

### TC-SET-001
| Field | Value |
|---|---|
| Test Case ID | TC-SET-001 |
| Module | Website Settings |
| Scenario | Admin updates settings and public endpoint reflects it |
| Preconditions | Admin |
| Test Data | - |
| Steps | PUT then anon GET |
| Expected Result | Name persisted |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthorizationTests.Admin_can_manage_users_and_settings) |
| Priority | High |

### TC-SET-002
| Field | Value |
|---|---|
| Test Case ID | TC-SET-002 |
| Module | Website Settings |
| Scenario | Editor cannot update settings |
| Preconditions | Editor |
| Test Data | - |
| Steps | PUT |
| Expected Result | 403 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthorizationTests.Editor_cannot_manage...) |
| Priority | Critical |

### TC-SET-003
| Field | Value |
|---|---|
| Test Case ID | TC-SET-003 |
| Module | Website Settings |
| Scenario | Invalid email / empty name rejected |
| Preconditions | Admin |
| Test Data | bad email |
| Steps | PUT |
| Expected Result | 400 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Manual (DTO validation; no test) |
| Priority | Medium |

### TC-SET-004
| Field | Value |
|---|---|
| Test Case ID | TC-SET-004 |
| Module | Website Settings |
| Scenario | Logo/favicon/footer shown on public layout |
| Preconditions | Settings set |
| Test Data | - |
| Steps | Open site |
| Expected Result | Shown |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Manual (-) |
| Priority | Medium |
