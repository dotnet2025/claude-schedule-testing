# Test cases – Media Library

> **Status of every case below is `Not Run`** unless stated: the authoring environment had no .NET SDK or package registry access, so no automated test was executed. See `tests/test-results/test-execution-summary.md`.

### TC-MEDIA-001
| Field | Value |
|---|---|
| Test Case ID | TC-MEDIA-001 |
| Module | Media Library |
| Scenario | Upload, serve, delete valid PNG |
| Preconditions | Logged in |
| Test Data | PNG bytes |
| Steps | POST, GET file, DELETE |
| Expected Result | 201, bytes identical, 204, then 404 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (MediaTests.Valid_png...) |
| Priority | Critical |

### TC-MEDIA-002
| Field | Value |
|---|---|
| Test Case ID | TC-MEDIA-002 |
| Module | Media Library |
| Scenario | Disallowed extensions |
| Preconditions | - |
| Test Data | exe, html, svg, no ext, double ext |
| Steps | POST |
| Expected Result | 400 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (MediaTests.Disallowed_extensions_are_rejected) |
| Priority | Critical |

### TC-MEDIA-003
| Field | Value |
|---|---|
| Test Case ID | TC-MEDIA-003 |
| Module | Media Library |
| Scenario | Spoofed content (signature mismatch) |
| Preconditions | - |
| Test Data | MZ header as .png; PNG as .pdf |
| Steps | POST |
| Expected Result | 400 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (MediaTests.Spoofed_content...) |
| Priority | Critical |

### TC-MEDIA-004
| Field | Value |
|---|---|
| Test Case ID | TC-MEDIA-004 |
| Module | Media Library |
| Scenario | Empty / oversize (10MB+1) |
| Preconditions | - |
| Test Data | 0 bytes; 10MB+1 |
| Steps | POST |
| Expected Result | 400/413 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (MediaTests.Empty_and_oversized_files_are_rejected) |
| Priority | High |

### TC-MEDIA-005
| Field | Value |
|---|---|
| Test Case ID | TC-MEDIA-005 |
| Module | Media Library |
| Scenario | Duplicate names and path traversal names |
| Preconditions | - |
| Test Data | same.png x2; ../../etc/passwd.png |
| Steps | POST |
| Expected Result | Distinct ids; sanitised display name |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (MediaTests.Duplicate_filenames...) |
| Priority | Critical |

### TC-MEDIA-006
| Field | Value |
|---|---|
| Test Case ID | TC-MEDIA-006 |
| Module | Media Library |
| Scenario | Upload requires auth |
| Preconditions | - |
| Test Data | - |
| Steps | POST anon |
| Expected Result | 401 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (MediaTests.Upload_requires_authentication) |
| Priority | Critical |

### TC-MEDIA-007
| Field | Value |
|---|---|
| Test Case ID | TC-MEDIA-007 |
| Module | Media Library |
| Scenario | Delete media referenced as featured image |
| Preconditions | Page uses image |
| Test Data | - |
| Steps | DELETE media |
| Expected Result | 204; page kept, image cleared; bad id rejected |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (MediaTests.Deleting_media_used...) |
| Priority | High |

### TC-MEDIA-008
| Field | Value |
|---|---|
| Test Case ID | TC-MEDIA-008 |
| Module | Media Library |
| Scenario | Signature unit tests |
| Preconditions | - |
| Test Data | GIF/JPG/WebP/PDF headers |
| Steps | FileValidator |
| Expected Result | Correct accept/reject |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (UnitTests.SignatureMatches) |
| Priority | High |

### TC-MEDIA-009
| Field | Value |
|---|---|
| Test Case ID | TC-MEDIA-009 |
| Module | Media Library |
| Scenario | Picker selection and empty state (UI) |
| Preconditions | Mock |
| Test Data | - |
| Steps | Open picker |
| Expected Result | Select returns item; empty message |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (MediaPicker.test.tsx) |
| Priority | Medium |

### TC-MEDIA-010
| Field | Value |
|---|---|
| Test Case ID | TC-MEDIA-010 |
| Module | Media Library |
| Scenario | Upload/delete/details and rejection via browser (E2E) |
| Preconditions | Stack |
| Test Data | png, exe, fake png |
| Steps | Upload in UI |
| Expected Result | Success / error toasts |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (e2e/media.spec.ts) |
| Priority | High |

### TC-MEDIA-011
| Field | Value |
|---|---|
| Test Case ID | TC-MEDIA-011 |
| Module | Media Library |
| Scenario | Insert image from library into rich text |
| Preconditions | Editor open |
| Test Data | - |
| Steps | Click image tool, choose media |
| Expected Result | <img> inserted |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Manual (Needs real TipTap in browser) |
| Priority | High |

### TC-MEDIA-012
| Field | Value |
|---|---|
| Test Case ID | TC-MEDIA-012 |
| Module | Media Library |
| Scenario | Missing file on disk |
| Preconditions | Metadata exists, blob removed |
| Test Data | - |
| Steps | GET file |
| Expected Result | 404 (graceful) |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Manual (Handled in code (OpenReadAsync null -> 404); no test) |
| Priority | Medium |

### TC-MEDIA-013
| Field | Value |
|---|---|
| Test Case ID | TC-MEDIA-013 |
| Module | Media Library |
| Scenario | Copy URL, grid/list toggle, filter by type |
| Preconditions | Media exists |
| Test Data | - |
| Steps | Use controls |
| Expected Result | Works |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Manual (-) |
| Priority | Low |
