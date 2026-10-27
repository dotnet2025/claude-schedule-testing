# Test cases – Posts

> **Status of every case below is `Not Run`** unless stated: the authoring environment had no .NET SDK or package registry access, so no automated test was executed. See `tests/test-results/test-execution-summary.md`.

### TC-POST-001
| Field | Value |
|---|---|
| Test Case ID | TC-POST-001 |
| Module | Posts |
| Scenario | Post CRUD with categories and tags; public filtering |
| Preconditions | Category/tag exist |
| Test Data | - |
| Steps | Create, publish, update, delete |
| Expected Result | Visible publicly only when published |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PostTests.Post_crud_with_categories...) |
| Priority | Critical |

### TC-POST-002
| Field | Value |
|---|---|
| Test Case ID | TC-POST-002 |
| Module | Posts |
| Scenario | Duplicate slug / unknown category |
| Preconditions | - |
| Test Data | - |
| Steps | POST |
| Expected Result | 409 / 400 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PostTests.Duplicate_slug_and_unknown_category...) |
| Priority | High |

### TC-POST-003
| Field | Value |
|---|---|
| Test Case ID | TC-POST-003 |
| Module | Posts |
| Scenario | Public search only returns published |
| Preconditions | Pub+draft |
| Test Data | unique word |
| Steps | GET search |
| Expected Result | Only published |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PostTests.Public_search...) |
| Priority | High |

### TC-POST-004
| Field | Value |
|---|---|
| Test Case ID | TC-POST-004 |
| Module | Posts |
| Scenario | Post lifecycle through UI incl. category page and search (E2E) |
| Preconditions | Stack |
| Test Data | - |
| Steps | Create category/post, publish, browse |
| Expected Result | Appears on category and search |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (e2e/posts.spec.ts) |
| Priority | Critical |

### TC-POST-005
| Field | Value |
|---|---|
| Test Case ID | TC-POST-005 |
| Module | Posts |
| Scenario | Drafts not on public blog (E2E) |
| Preconditions | Stack |
| Test Data | - |
| Steps | Save draft, open /blog |
| Expected Result | Not listed |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (e2e/posts.spec.ts) |
| Priority | Critical |

### TC-POST-006
| Field | Value |
|---|---|
| Test Case ID | TC-POST-006 |
| Module | Posts |
| Scenario | Related posts |
| Preconditions | Posts share a category |
| Test Data | - |
| Steps | GET related |
| Expected Result | Up to 3 published related posts |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Manual (Endpoint implemented; no automated assertion) |
| Priority | Low |
