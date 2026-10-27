# Test cases – Categories & Tags

> **Status of every case below is `Not Run`** unless stated: the authoring environment had no .NET SDK or package registry access, so no automated test was executed. See `tests/test-results/test-execution-summary.md`.

### TC-CAT-001
| Field | Value |
|---|---|
| Test Case ID | TC-CAT-001 |
| Module | Categories & Tags |
| Scenario | Unique names (case-insensitive) and validation |
| Preconditions | - |
| Test Data | Dup, DUP, empty tag |
| Steps | POST |
| Expected Result | 201, 409, 400 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PostTests.Categories_and_tags_enforce_unique...) |
| Priority | High |

### TC-CAT-002
| Field | Value |
|---|---|
| Test Case ID | TC-CAT-002 |
| Module | Categories & Tags |
| Scenario | Deleting a category keeps posts |
| Preconditions | Post in category |
| Test Data | - |
| Steps | DELETE category |
| Expected Result | 204; post still exists; second delete 404 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PostTests.Categories_and_tags_enforce_unique...) |
| Priority | High |

### TC-CAT-003
| Field | Value |
|---|---|
| Test Case ID | TC-CAT-003 |
| Module | Categories & Tags |
| Scenario | Edit category / tag, slug uniqueness on update |
| Preconditions | - |
| Test Data | - |
| Steps | PUT |
| Expected Result | 200 / 409 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Manual (Service implemented; no dedicated test) |
| Priority | Medium |

### TC-CAT-004
| Field | Value |
|---|---|
| Test Case ID | TC-CAT-004 |
| Module | Categories & Tags |
| Scenario | Category management UI (create via browser) |
| Preconditions | Stack |
| Test Data | - |
| Steps | New category dialog |
| Expected Result | Row appears |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (e2e/posts.spec.ts) |
| Priority | Medium |
