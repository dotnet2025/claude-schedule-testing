# Test cases – Company Master

> **Status of every case below is `Not Run`.** No .NET SDK and no npm/NuGet access were available, so nothing was compiled or executed. See `tests/test-results/test-execution-summary.md`.

### TC-CMP-001
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-001 |
| Module | Company Master |
| Scenario | Create valid company |
| Preconditions | Admin |
| Test Data | - |
| Steps | POST /api/companies |
| Expected Result | 201 + Location; code trimmed + upper-cased; active by default; CreatedBy/At set |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend CompanyMasterTests.Create_valid_company_returns_201_with_audit_fields_and_normalised_code) |
| Priority | Critical |

### TC-CMP-002
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-002 |
| Module | Company Master |
| Scenario | Reject missing/blank code or name |
| Preconditions | Admin |
| Test Data | - |
| Steps | POST without/blank field |
| Expected Result | 400 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend CompanyMasterTests.Create_rejects_missing_required_field) |
| Priority | Critical |

### TC-CMP-003
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-003 |
| Module | Company Master |
| Scenario | Reject duplicate code (case-insensitive) |
| Preconditions | Company exists |
| Test Data | - |
| Steps | POST same code lower-case |
| Expected Result | 409 mentioning code |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend CompanyMasterTests.Create_rejects_duplicate_code_case_insensitively_with_409) |
| Priority | Critical |

### TC-CMP-004
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-004 |
| Module | Company Master |
| Scenario | Reject invalid email / non-http(s) website |
| Preconditions | Admin |
| Test Data | - |
| Steps | POST bad email; ftp:, javascript:, scheme-less URLs |
| Expected Result | 400 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend CompanyMasterTests.Create_rejects_invalid_email_or_website) |
| Priority | High |

### TC-CMP-005
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-005 |
| Module | Company Master |
| Scenario | Boundaries: code 30/31, name 200/201, phone 25/26, postal 20/21, address 250, city 100 |
| Preconditions | Admin |
| Test Data | - |
| Steps | POST |
| Expected Result | Max accepted, max+1 rejected |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend CompanyMasterTests.Field_length_boundaries) |
| Priority | Medium |

### TC-CMP-006
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-006 |
| Module | Company Master |
| Scenario | View details; unknown id |
| Preconditions | Admin |
| Test Data | - |
| Steps | GET /api/companies/{id} |
| Expected Result | 200 / 404 problem+json |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend CompanyMasterTests.Get_by_id_and_unknown_id_is_404_problem_details) |
| Priority | Medium |

### TC-CMP-007
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-007 |
| Module | Company Master |
| Scenario | Update company |
| Preconditions | Company |
| Test Data | - |
| Steps | PUT |
| Expected Result | 200; fields + UpdatedAt/UpdatedBy changed; CreatedAt unchanged; own code allowed |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend CompanyMasterTests.Update_changes_fields_and_audit_and_keeps_own_code) |
| Priority | High |

### TC-CMP-008
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-008 |
| Module | Company Master |
| Scenario | Update conflicts |
| Preconditions | Two companies |
| Test Data | - |
| Steps | PUT other's code; unknown id; blank name |
| Expected Result | 409 / 404 / 400 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend CompanyMasterTests.Update_rejects_code_of_another_company_and_unknown_id) |
| Priority | High |

### TC-CMP-009
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-009 |
| Module | Company Master |
| Scenario | Activate / deactivate |
| Preconditions | Company |
| Test Data | - |
| Steps | PATCH /status |
| Expected Result | 200 with new state; unknown id 404 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend CompanyMasterTests.Activate_and_deactivate_via_patch) |
| Priority | High |

### TC-CMP-010
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-010 |
| Module | Company Master |
| Scenario | Search by code/name, status filter, sort (code/name/created), pagination |
| Preconditions | 5 companies |
| Test Data | - |
| Steps | GET with params |
| Expected Result | Correct totals/order/totalPages; case-insensitive; empty result |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend CompanyMasterTests.List_search_filter_sort_and_paging) |
| Priority | High |

### TC-CMP-011
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-011 |
| Module | Company Master |
| Scenario | Paging shape and clamps |
| Preconditions | - |
| Test Data | - |
| Steps | GET pageSize=1000&page=0 |
| Expected Result | items,total,page,pageSize,totalPages present; pageSize=100; page=1 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend CompanyMasterTests.List_response_shape_and_page_size_clamp) |
| Priority | Medium |

### TC-CMP-012
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-012 |
| Module | Company Master |
| Scenario | Delete unreferenced company |
| Preconditions | Company |
| Test Data | - |
| Steps | DELETE twice |
| Expected Result | 204 then 404 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend CompanyMasterTests.Delete_unreferenced_company_succeeds) |
| Priority | High |

### TC-CMP-013
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-013 |
| Module | Company Master |
| Scenario | Prevent deleting referenced company |
| Preconditions | User assigned |
| Test Data | - |
| Steps | DELETE |
| Expected Result | 409 with 'Deactivate' guidance; company intact; deactivation succeeds |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend CompanyMasterTests.Delete_company_referenced_by_a_user_is_refused_with_409_and_guidance) |
| Priority | Critical |

### TC-CMP-014
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-014 |
| Module | Company Master |
| Scenario | Logo from media library; ON DELETE SET NULL |
| Preconditions | Uploaded image |
| Test Data | - |
| Steps | Create with unknown logo; with real logo; delete media |
| Expected Result | 400; 201 with logoUrl; logo cleared after media delete |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend CompanyMasterTests.Logo_must_exist_in_media_library_and_deleting_the_media_clears_it) |
| Priority | Medium |

### TC-CMP-015
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-015 |
| Module | Company Master |
| Scenario | Authorization: Editor 403, anonymous 401 on all endpoints |
| Preconditions | Editor |
| Test Data | - |
| Steps | All six endpoints |
| Expected Result | 403 / 401; data unchanged |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend CompanyMasterTests.Editor_is_forbidden_and_anonymous_is_unauthorized_on_every_company_endpoint) |
| Priority | Critical |

### TC-CMP-016
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-016 |
| Module | Company Master |
| Scenario | Concurrent duplicate create |
| Preconditions | Admin |
| Test Data | - |
| Steps | 4 parallel POSTs same code |
| Expected Result | Exactly one 201, others 409 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend CompanyMasterTests.Concurrent_duplicate_creates_yield_one_success_and_conflicts_only) |
| Priority | Medium |

### TC-CMP-017
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-017 |
| Module | Company Master |
| Scenario | Errors are ProblemDetails without stack traces |
| Preconditions | Admin |
| Test Data | - |
| Steps | POST invalid |
| Expected Result | application/problem+json, no stack |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend CompanyMasterTests.Errors_are_problem_details_without_stack_traces) |
| Priority | Medium |

### TC-CMP-018
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-018 |
| Module | Company Master |
| Scenario | Migration creates Companies table with unique CompanyCode and SET NULL FKs |
| Preconditions | Clean DB and DB at InitialCreate |
| Test Data | - |
| Steps | Apply AddCompanyAndUserMaster |
| Expected Result | Table + indexes exist; existing data preserved |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Manual (needs dotnet ef; KI-013) |
| Priority | High |

### TC-CMP-UI-001
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-UI-001 |
| Module | Company Master |
| Scenario | List renders with status chips and counts; empty and error states |
| Preconditions | Admin |
| Test Data | - |
| Steps | Open /admin/masters/companies |
| Expected Result | Rows; 'No companies found.'; API error text |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (frontend CompaniesPage.test.tsx) |
| Priority | High |

### TC-CMP-UI-002
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-UI-002 |
| Module | Company Master |
| Scenario | Search/status/sort/paging send server params |
| Preconditions | Admin |
| Test Data | - |
| Steps | Interact with filters |
| Expected Result | Query has search,isActive,sortBy,page; page resets |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (CompaniesPage.test.tsx) |
| Priority | High |

### TC-CMP-UI-003
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-UI-003 |
| Module | Company Master |
| Scenario | Client validation (required, lengths, email, http(s) URL) |
| Preconditions | Admin |
| Test Data | - |
| Steps | Submit invalid |
| Expected Result | Inline errors; no request |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (CompaniesPage.test.tsx, validateCompany) |
| Priority | High |

### TC-CMP-UI-004
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-UI-004 |
| Module | Company Master |
| Scenario | Create + server duplicate-code error then success |
| Preconditions | Admin |
| Test Data | - |
| Steps | Submit twice |
| Expected Result | 409 detail shown; then 'Company saved' |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (CompaniesPage.test.tsx) |
| Priority | High |

### TC-CMP-UI-005
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-UI-005 |
| Module | Company Master |
| Scenario | View read-only; Edit prefilled and PUT |
| Preconditions | Admin |
| Test Data | - |
| Steps | Open View/Edit |
| Expected Result | Disabled inputs / PUT body |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (CompaniesPage.test.tsx) |
| Priority | Medium |

### TC-CMP-UI-006
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-UI-006 |
| Module | Company Master |
| Scenario | Toggle active via PATCH |
| Preconditions | Admin |
| Test Data | - |
| Steps | Click switch |
| Expected Result | PATCH {isActive:false}; toast |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (CompaniesPage.test.tsx) |
| Priority | High |

### TC-CMP-UI-007
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-UI-007 |
| Module | Company Master |
| Scenario | Delete confirmation, cancel, 409 guidance |
| Preconditions | Admin |
| Test Data | - |
| Steps | Delete |
| Expected Result | Dialog; cancel no request; guidance toast |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (CompaniesPage.test.tsx) |
| Priority | High |

### TC-CMP-UI-008
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-UI-008 |
| Module | Company Master |
| Scenario | Responsive layout (375/768/1280) |
| Preconditions | Browser |
| Test Data | - |
| Steps | Resize |
| Expected Result | Columns collapse, no horizontal page scroll |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Manual (not automated; KI-010) |
| Priority | Low |

### TC-CMP-E2E-001
| Field | Value |
|---|---|
| Test Case ID | TC-CMP-E2E-001 |
| Module | Company Master |
| Scenario | Company full lifecycle in the browser |
| Preconditions | Admin, running stack |
| Test Data | - |
| Steps | Create, duplicate, search, view, edit, deactivate, delete |
| Expected Result | All steps succeed with expected messages |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (e2e/masters.spec.ts) |
| Priority | High |
