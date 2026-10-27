# Test cases – Public Website & SEO

> **Status of every case below is `Not Run`** unless stated: the authoring environment had no .NET SDK or package registry access, so no automated test was executed. See `tests/test-results/test-execution-summary.md`.

### TC-PUB-001
| Field | Value |
|---|---|
| Test Case ID | TC-PUB-001 |
| Module | Public Website & SEO |
| Scenario | Public post list shows published only with pagination |
| Preconditions | Mock |
| Test Data | 12 items |
| Steps | Open /blog |
| Expected Result | Cards, pager |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PublicPages.test.tsx) |
| Priority | High |

### TC-PUB-002
| Field | Value |
|---|---|
| Test Case ID | TC-PUB-002 |
| Module | Public Website & SEO |
| Scenario | Empty and error states |
| Preconditions | Mock |
| Test Data | - |
| Steps | Open /blog |
| Expected Result | Empty text / alert |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PublicPages.test.tsx) |
| Priority | Medium |

### TC-PUB-003
| Field | Value |
|---|---|
| Test Case ID | TC-PUB-003 |
| Module | Public Website & SEO |
| Scenario | Post detail sets title and meta description |
| Preconditions | Mock |
| Test Data | - |
| Steps | Open post |
| Expected Result | document.title and meta set |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PublicPages.test.tsx) |
| Priority | High |

### TC-PUB-004
| Field | Value |
|---|---|
| Test Case ID | TC-PUB-004 |
| Module | Public Website & SEO |
| Scenario | Missing/draft slug shows 404 |
| Preconditions | Mock 404 |
| Test Data | - |
| Steps | Open /blog/draft |
| Expected Result | 404 page |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PublicPages.test.tsx) |
| Priority | Critical |

### TC-PUB-005
| Field | Value |
|---|---|
| Test Case ID | TC-PUB-005 |
| Module | Public Website & SEO |
| Scenario | Drafts not exposed by public API |
| Preconditions | Draft page/post |
| Test Data | - |
| Steps | GET public slug |
| Expected Result | 404 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PageTests / PostTests) |
| Priority | Critical |

### TC-PUB-006
| Field | Value |
|---|---|
| Test Case ID | TC-PUB-006 |
| Module | Public Website & SEO |
| Scenario | Public search term empty -> empty list |
| Preconditions | - |
| Test Data | "" |
| Steps | GET search |
| Expected Result | [] |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PostTests.Public_search...) |
| Priority | Low |

### TC-PUB-007
| Field | Value |
|---|---|
| Test Case ID | TC-PUB-007 |
| Module | Public Website & SEO |
| Scenario | Unknown route shows 404 (E2E) |
| Preconditions | Stack |
| Test Data | - |
| Steps | Open /pages/missing |
| Expected Result | 404 heading |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (e2e/pages.spec.ts) |
| Priority | High |

### TC-SEO-001
| Field | Value |
|---|---|
| Test Case ID | TC-SEO-001 |
| Module | Public Website & SEO |
| Scenario | Canonical link where implemented |
| Preconditions | Open post |
| Test Data | - |
| Steps | Inspect head |
| Expected Result | canonical set for posts/pages |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Manual (Implemented in useDocumentMeta; no assertion) |
| Priority | Low |

### TC-RESP-001
| Field | Value |
|---|---|
| Test Case ID | TC-RESP-001 |
| Module | Public Website & SEO |
| Scenario | Responsive layouts desktop/tablet/mobile |
| Preconditions | Browser |
| Test Data | 375/768/1280 px |
| Steps | Open admin and public |
| Expected Result | No horizontal overflow; drawer/menu work |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Manual (No automated viewport tests written) |
| Priority | High |
