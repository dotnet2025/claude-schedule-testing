# Test cases – Pages

> **Status of every case below is `Not Run`** unless stated: the authoring environment had no .NET SDK or package registry access, so no automated test was executed. See `tests/test-results/test-execution-summary.md`.

### TC-PAGE-001
| Field | Value |
|---|---|
| Test Case ID | TC-PAGE-001 |
| Module | Pages |
| Scenario | Create page, slug auto-generated, draft by default |
| Preconditions | Logged in |
| Test Data | Unicode title |
| Steps | POST /api/pages |
| Expected Result | 201, slug generated, Draft |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PageTests.Create_generates_slug...) |
| Priority | Critical |

### TC-PAGE-002
| Field | Value |
|---|---|
| Test Case ID | TC-PAGE-002 |
| Module | Pages |
| Scenario | Duplicate slug |
| Preconditions | Page exists |
| Test Data | same slug |
| Steps | POST twice |
| Expected Result | Explicit: 409; generated: suffix -2 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PageTests.Duplicate_explicit_slug...) |
| Priority | Critical |

### TC-PAGE-003
| Field | Value |
|---|---|
| Test Case ID | TC-PAGE-003 |
| Module | Pages |
| Scenario | Empty/whitespace title |
| Preconditions | - |
| Test Data | "" , "   " |
| Steps | POST |
| Expected Result | 400 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PageTests.Empty_or_whitespace_title_is_rejected) |
| Priority | High |

### TC-PAGE-004
| Field | Value |
|---|---|
| Test Case ID | TC-PAGE-004 |
| Module | Pages |
| Scenario | Title length boundary 200/201 |
| Preconditions | - |
| Test Data | 200 / 201 chars |
| Steps | POST |
| Expected Result | 201 / 400 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PageTests.Too_long_title...) |
| Priority | Medium |

### TC-PAGE-005
| Field | Value |
|---|---|
| Test Case ID | TC-PAGE-005 |
| Module | Pages |
| Scenario | Invalid slug format |
| Preconditions | - |
| Test Data | Bad Slug! |
| Steps | POST |
| Expected Result | 400 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PageTests.Invalid_slug_format_is_rejected) |
| Priority | Medium |

### TC-PAGE-006
| Field | Value |
|---|---|
| Test Case ID | TC-PAGE-006 |
| Module | Pages |
| Scenario | Editing title preserves slug unless changed |
| Preconditions | Page exists |
| Test Data | - |
| Steps | PUT title only; PUT with slug |
| Expected Result | Slug preserved; slug changed when given |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PageTests.Editing_title_keeps_slug...) |
| Priority | High |

### TC-PAGE-007
| Field | Value |
|---|---|
| Test Case ID | TC-PAGE-007 |
| Module | Pages |
| Scenario | Publish/unpublish controls public visibility |
| Preconditions | Draft page |
| Test Data | - |
| Steps | publish, GET public, unpublish |
| Expected Result | 404, 200, 404 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PageTests.Publish_unpublish_controls_public_visibility) |
| Priority | Critical |

### TC-PAGE-008
| Field | Value |
|---|---|
| Test Case ID | TC-PAGE-008 |
| Module | Pages |
| Scenario | Draft preview requires auth |
| Preconditions | Draft |
| Test Data | - |
| Steps | GET /api/pages/{id} |
| Expected Result | 200 authed; 401 anon |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PageTests.Draft_is_previewable...) |
| Priority | High |

### TC-PAGE-009
| Field | Value |
|---|---|
| Test Case ID | TC-PAGE-009 |
| Module | Pages |
| Scenario | Delete page |
| Preconditions | Page |
| Test Data | - |
| Steps | DELETE twice |
| Expected Result | 204 then 404 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PageTests.Delete_removes_page...) |
| Priority | High |

### TC-PAGE-010
| Field | Value |
|---|---|
| Test Case ID | TC-PAGE-010 |
| Module | Pages |
| Scenario | Concurrent edit conflict |
| Preconditions | Page loaded twice |
| Test Data | stale stamp |
| Steps | PUT twice |
| Expected Result | Second gets 409 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PageTests.Stale_concurrency_stamp_is_409) |
| Priority | High |

### TC-PAGE-011
| Field | Value |
|---|---|
| Test Case ID | TC-PAGE-011 |
| Module | Pages |
| Scenario | HTML sanitization (XSS) |
| Preconditions | - |
| Test Data | script, onerror, javascript: |
| Steps | POST then GET |
| Expected Result | Dangerous markup removed, safe markup kept |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PageTests.Html_is_sanitized_on_save; UnitTests.Sanitizer...) |
| Priority | Critical |

### TC-PAGE-012
| Field | Value |
|---|---|
| Test Case ID | TC-PAGE-012 |
| Module | Pages |
| Scenario | Search, filter, sort, pagination (0/1/many) |
| Preconditions | 3 pages |
| Test Data | - |
| Steps | GET with query |
| Expected Result | Totals and page sizes correct |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PageTests.Search_filter_sort_and_pagination_work) |
| Priority | High |

### TC-PAGE-013
| Field | Value |
|---|---|
| Test Case ID | TC-PAGE-013 |
| Module | Pages |
| Scenario | Malformed JSON; emoji/unicode |
| Preconditions | - |
| Test Data | {not json; 🎉 日本語 |
| Steps | POST |
| Expected Result | 400; unicode preserved |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PageTests.Malformed_json...) |
| Priority | Medium |

### TC-PAGE-014
| Field | Value |
|---|---|
| Test Case ID | TC-PAGE-014 |
| Module | Pages |
| Scenario | Form validation and single submit (UI) |
| Preconditions | Mock API |
| Test Data | empty title; double click |
| Steps | Submit |
| Expected Result | Inline error; one POST |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (ContentEditPage.test.tsx) |
| Priority | High |

### TC-PAGE-015
| Field | Value |
|---|---|
| Test Case ID | TC-PAGE-015 |
| Module | Pages |
| Scenario | Duplicate slug error shown (UI) |
| Preconditions | Mock 409 |
| Test Data | - |
| Steps | Submit |
| Expected Result | Server message shown |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (ContentEditPage.test.tsx) |
| Priority | High |

### TC-PAGE-016
| Field | Value |
|---|---|
| Test Case ID | TC-PAGE-016 |
| Module | Pages |
| Scenario | Full page lifecycle (E2E) |
| Preconditions | Stack running |
| Test Data | - |
| Steps | Create, publish, view public, unpublish, delete |
| Expected Result | All steps succeed |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (e2e/pages.spec.ts) |
| Priority | Critical |

### TC-PAGE-017
| Field | Value |
|---|---|
| Test Case ID | TC-PAGE-017 |
| Module | Pages |
| Scenario | Rich text formatting toolbar behaviour |
| Preconditions | Editor open |
| Test Data | - |
| Steps | Apply headings H1-H6, lists, table, link, code, align, undo/redo |
| Expected Result | HTML saved and re-rendered |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Manual (TipTap interactions are not covered by jsdom tests (editor mocked in form tests)) |
| Priority | High |
