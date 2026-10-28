# Test cases – User Master

> **Status of every case below is `Not Run`.** The authoring environment had no .NET SDK, and the NuGet/npm registries were blocked, so nothing could be compiled or executed. See `tests/test-results/test-execution-summary.md`. These cases replace the earlier TC-USR-001..006 (superseded by the User Master work).

### TC-USR-001
| Field | Value |
|---|---|
| Test Case ID | TC-USR-001 |
| Module | User Master |
| Scenario | Create valid user |
| Preconditions | Admin |
| Test Data | - |
| Steps | POST /api/users with names, username, email, password, role |
| Expected Result | 201 + Location; displayName = first+last; username stored lower-case; CreatedBy set; LastLoginAt null |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend UserMasterTests.Create_valid_user_returns_201_with_derived_display_name_and_audit) |
| Priority | Critical |

### TC-USR-002
| Field | Value |
|---|---|
| Test Case ID | TC-USR-002 |
| Module | User Master |
| Scenario | Reject missing required field (firstName, lastName, username, email, password) |
| Preconditions | Admin |
| Test Data | - |
| Steps | POST with one field removed |
| Expected Result | 400 for each |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend UserMasterTests.Create_rejects_missing_required_field) |
| Priority | Critical |

### TC-USR-003
| Field | Value |
|---|---|
| Test Case ID | TC-USR-003 |
| Module | User Master |
| Scenario | Reject duplicate email / username (case-insensitive) |
| Preconditions | User exists |
| Test Data | - |
| Steps | POST same email upper-cased; POST same username upper-cased |
| Expected Result | 409 both |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend UserMasterTests.Create_rejects_duplicate_email_and_username_case_insensitively) |
| Priority | Critical |

### TC-USR-004
| Field | Value |
|---|---|
| Test Case ID | TC-USR-004 |
| Module | User Master |
| Scenario | Reject invalid email, short/illegal username, weak password, unknown role |
| Preconditions | Admin |
| Test Data | - |
| Steps | POST invalid variants |
| Expected Result | 400 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend UserMasterTests.Create_rejects_invalid_input) |
| Priority | High |

### TC-USR-005
| Field | Value |
|---|---|
| Test Case ID | TC-USR-005 |
| Module | User Master |
| Scenario | Boundary: names 100/101 chars, phone 26 chars |
| Preconditions | Admin |
| Test Data | - |
| Steps | POST |
| Expected Result | 100 accepted, 101 and phone>25 rejected (400) |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend UserMasterTests.Field_length_boundaries_are_enforced) |
| Priority | Medium |

### TC-USR-006
| Field | Value |
|---|---|
| Test Case ID | TC-USR-006 |
| Module | User Master |
| Scenario | View details; unknown id |
| Preconditions | Admin |
| Test Data | - |
| Steps | GET /api/users/{id}; GET /api/users/999999 |
| Expected Result | 200 / 404 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend UserMasterTests.Get_by_id_and_unknown_id) |
| Priority | Medium |

### TC-USR-007
| Field | Value |
|---|---|
| Test Case ID | TC-USR-007 |
| Module | User Master |
| Scenario | Edit profile |
| Preconditions | Admin |
| Test Data | - |
| Steps | PUT /api/users/{id} |
| Expected Result | 200; names, username, email, phone updated; UpdatedAt/UpdatedBy set |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend UserMasterTests.Update_profile_changes_names_username_email_phone_company_and_audit) |
| Priority | High |

### TC-USR-008
| Field | Value |
|---|---|
| Test Case ID | TC-USR-008 |
| Module | User Master |
| Scenario | Update uniqueness rules |
| Preconditions | Two users |
| Test Data | - |
| Steps | PUT with other user's email/username; with own |
| Expected Result | 409 / 200; unknown id 404 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend UserMasterTests.Update_rejects_email_or_username_owned_by_another_user_but_allows_keeping_own) |
| Priority | High |

### TC-USR-009
| Field | Value |
|---|---|
| Test Case ID | TC-USR-009 |
| Module | User Master |
| Scenario | No privilege escalation through PUT |
| Preconditions | Admin |
| Test Data | - |
| Steps | PUT body containing role=Admin,isActive=false |
| Expected Result | Role/status unchanged (fields ignored) |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend UserMasterTests.Put_ignores_role_and_status_fields_so_it_cannot_escalate_privilege) |
| Priority | Critical |

### TC-USR-010
| Field | Value |
|---|---|
| Test Case ID | TC-USR-010 |
| Module | User Master |
| Scenario | Change role via PATCH /role |
| Preconditions | Admin |
| Test Data | - |
| Steps | PATCH role Admin; invalid role; unknown id |
| Expected Result | 200 / 400 / 404 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend UserMasterTests.Change_role_via_patch_and_validate_value) |
| Priority | High |

### TC-USR-011
| Field | Value |
|---|---|
| Test Case ID | TC-USR-011 |
| Module | User Master |
| Scenario | Deactivate/activate; inactive user cannot log in or refresh |
| Preconditions | Active user with refresh token |
| Test Data | - |
| Steps | PATCH status false; login; refresh; PATCH true; login |
| Expected Result | 401/401 while inactive; 200 after reactivation |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend UserMasterTests.Deactivate_and_reactivate_user_and_inactive_user_cannot_login_or_refresh) |
| Priority | Critical |

### TC-USR-012
| Field | Value |
|---|---|
| Test Case ID | TC-USR-012 |
| Module | User Master |
| Scenario | Last active Admin protection |
| Preconditions | Admin(s) |
| Test Data | - |
| Steps | Demote/deactivate/delete the only active admin |
| Expected Result | 409 (role), 400 (self status/delete) |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend UserMasterTests.Last_active_admin_cannot_be_demoted_deactivated_or_deleted; AuthorizationTests.Last_active_admin_is_protected...; e2e/permissions.spec.ts) |
| Priority | Critical |

### TC-USR-013
| Field | Value |
|---|---|
| Test Case ID | TC-USR-013 |
| Module | User Master |
| Scenario | Password reset |
| Preconditions | User with session |
| Test Data | - |
| Steps | POST /reset-password |
| Expected Result | 204; old password 401; new 200; old refresh token 401 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend UserMasterTests.Reset_password_new_works_old_fails_and_refresh_tokens_are_revoked) |
| Priority | Critical |

### TC-USR-014
| Field | Value |
|---|---|
| Test Case ID | TC-USR-014 |
| Module | User Master |
| Scenario | Password reset validation |
| Preconditions | User |
| Test Data | - |
| Steps | Weak passwords; unknown id |
| Expected Result | 400 / 404 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend UserMasterTests.Reset_password_rejects_weak_passwords) |
| Priority | High |

### TC-USR-015
| Field | Value |
|---|---|
| Test Case ID | TC-USR-015 |
| Module | User Master |
| Scenario | List: search, role/status filter, sort, pagination |
| Preconditions | ≥5 users |
| Test Data | - |
| Steps | GET with search/role/isActive/sortBy/sortDir/page/pageSize |
| Expected Result | Correct totals, order, totalPages |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend UserMasterTests.List_supports_search_role_status_sort_and_paging) |
| Priority | High |

### TC-USR-016
| Field | Value |
|---|---|
| Test Case ID | TC-USR-016 |
| Module | User Master |
| Scenario | Safe delete |
| Preconditions | Unreferenced + content author |
| Test Data | - |
| Steps | DELETE both |
| Expected Result | 204 for unreferenced; 409 'Deactivate' for author; 404 unknown |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend UserMasterTests.Delete_unreferenced_user_succeeds_and_referenced_user_is_refused_with_409) |
| Priority | High |

### TC-USR-017
| Field | Value |
|---|---|
| Test Case ID | TC-USR-017 |
| Module | User Master |
| Scenario | Login by username or email; LastLoginAt |
| Preconditions | User |
| Test Data | - |
| Steps | Login with username (mixed case), email, wrong password |
| Expected Result | 200/200/401; LastLoginAt set after success |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend UserMasterTests.Login_works_with_username_and_with_email_and_sets_last_login) |
| Priority | High |

### TC-USR-018
| Field | Value |
|---|---|
| Test Case ID | TC-USR-018 |
| Module | User Master |
| Scenario | Editor forbidden on every user endpoint |
| Preconditions | Editor |
| Test Data | - |
| Steps | GET/POST/PUT/PATCH/POST/DELETE |
| Expected Result | 403; target role unchanged |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend UserMasterTests.Editor_is_forbidden_from_every_user_management_endpoint_and_cannot_self_promote; AuthorizationTests.Editor_cannot_manage_users_or_settings) |
| Priority | Critical |

### TC-USR-019
| Field | Value |
|---|---|
| Test Case ID | TC-USR-019 |
| Module | User Master |
| Scenario | Anonymous gets 401 |
| Preconditions | - |
| Test Data | - |
| Steps | Call user endpoints without token |
| Expected Result | 401 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend UserMasterTests.Anonymous_gets_401_on_user_endpoints) |
| Priority | Critical |

### TC-USR-020
| Field | Value |
|---|---|
| Test Case ID | TC-USR-020 |
| Module | User Master |
| Scenario | Credentials never in responses |
| Preconditions | Admin |
| Test Data | - |
| Steps | Create/list/get |
| Expected Result | No passwordHash, refresh token, password, hash prefix |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend UserMasterTests.Responses_never_contain_password_hash_tokens_or_the_password) |
| Priority | Critical |

### TC-USR-021
| Field | Value |
|---|---|
| Test Case ID | TC-USR-021 |
| Module | User Master |
| Scenario | Company assignment |
| Preconditions | Companies |
| Test Data | - |
| Steps | Create user with valid/unknown/inactive company; filter by company |
| Expected Result | 201 / 400 / 400; filter works |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend UserMasterTests.Company_assignment_validates_existence_and_active_state) |
| Priority | Medium |

### TC-USR-022
| Field | Value |
|---|---|
| Test Case ID | TC-USR-022 |
| Module | User Master |
| Scenario | Seeded admin has first/last name and username |
| Preconditions | Seed enabled |
| Test Data | - |
| Steps | GET /api/auth/me |
| Expected Result | firstName, lastName, username 'admin', displayName derived |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend UserMasterTests.Seeded_admin_has_names_and_username) |
| Priority | Medium |

### TC-USR-023
| Field | Value |
|---|---|
| Test Case ID | TC-USR-023 |
| Module | User Master |
| Scenario | Stale tokens rejected after deactivation / role change |
| Preconditions | Admin-role user with token |
| Test Data | - |
| Steps | Demote; deactivate; call API with old token |
| Expected Result | 401 for old token; 403 with fresh Editor token; 401 after deactivation |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (backend UserMasterTests.Access_token_of_deactivated_or_demoted_user_is_rejected) |
| Priority | Critical |

### TC-USR-024
| Field | Value |
|---|---|
| Test Case ID | TC-USR-024 |
| Module | User Master |
| Scenario | Migration back-fills existing users (split DisplayName, username from e-mail local part, unique) |
| Preconditions | DB created from InitialCreate with users |
| Test Data | - |
| Steps | Apply AddCompanyAndUserMaster |
| Expected Result | FirstName/LastName/Username populated, unique; UpdatedAt=CreatedAt; no data loss |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Manual (needs dotnet ef; see docs/known-issues.md KI-013) |
| Priority | High |

### TC-USR-UI-001
| Field | Value |
|---|---|
| Test Case ID | TC-USR-UI-001 |
| Module | User Master |
| Scenario | User list renders; password hash never rendered |
| Preconditions | Admin |
| Test Data | - |
| Steps | Open /admin/masters/users |
| Expected Result | Rows with role/status chips; no hash text |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (frontend UsersPage.test.tsx) |
| Priority | High |

### TC-USR-UI-002
| Field | Value |
|---|---|
| Test Case ID | TC-USR-UI-002 |
| Module | User Master |
| Scenario | Filters/search/sort/paging send server params, reset page |
| Preconditions | Admin |
| Test Data | - |
| Steps | Change role/status/company/search/sort/page |
| Expected Result | Request query contains params; page resets to 1 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (UsersPage.test.tsx) |
| Priority | High |

### TC-USR-UI-003
| Field | Value |
|---|---|
| Test Case ID | TC-USR-UI-003 |
| Module | User Master |
| Scenario | Create user form: validation + submit |
| Preconditions | Admin |
| Test Data | - |
| Steps | Empty submit; invalid; valid |
| Expected Result | Inline errors, no request; valid body posted incl. companyId and role |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (UsersPage.test.tsx, validateUser) |
| Priority | High |

### TC-USR-UI-004
| Field | Value |
|---|---|
| Test Case ID | TC-USR-UI-004 |
| Module | User Master |
| Scenario | Server conflict message shown in dialog |
| Preconditions | Admin |
| Test Data | - |
| Steps | Submit duplicate email |
| Expected Result | 409 detail displayed |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (UsersPage.test.tsx) |
| Priority | High |

### TC-USR-UI-005
| Field | Value |
|---|---|
| Test Case ID | TC-USR-UI-005 |
| Module | User Master |
| Scenario | Edit sends PUT (profile) + PATCH role |
| Preconditions | Admin |
| Test Data | - |
| Steps | Edit, change role, save |
| Expected Result | PUT without role; PATCH {role} |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (UsersPage.test.tsx) |
| Priority | High |

### TC-USR-UI-006
| Field | Value |
|---|---|
| Test Case ID | TC-USR-UI-006 |
| Module | User Master |
| Scenario | View is read-only |
| Preconditions | Admin |
| Test Data | - |
| Steps | Open View |
| Expected Result | Inputs disabled, no Save |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (UsersPage.test.tsx) |
| Priority | Medium |

### TC-USR-UI-007
| Field | Value |
|---|---|
| Test Case ID | TC-USR-UI-007 |
| Module | User Master |
| Scenario | Activate/deactivate; self switch disabled; last-admin message |
| Preconditions | Admin |
| Test Data | - |
| Steps | Toggle |
| Expected Result | PATCH {isActive}; own switch disabled; 409 shown |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (UsersPage.test.tsx) |
| Priority | High |

### TC-USR-UI-008
| Field | Value |
|---|---|
| Test Case ID | TC-USR-UI-008 |
| Module | User Master |
| Scenario | Reset password dialog |
| Preconditions | Admin |
| Test Data | - |
| Steps | Weak, mismatched, valid |
| Expected Result | Inline errors; POST {newPassword} only when valid |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (UsersPage.test.tsx) |
| Priority | Critical |

### TC-USR-UI-009
| Field | Value |
|---|---|
| Test Case ID | TC-USR-UI-009 |
| Module | User Master |
| Scenario | Delete confirmation + 409 guidance |
| Preconditions | Admin |
| Test Data | - |
| Steps | Delete referenced user |
| Expected Result | Toast with 'Deactivate' guidance |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (UsersPage.test.tsx) |
| Priority | Medium |

### TC-USR-UI-010
| Field | Value |
|---|---|
| Test Case ID | TC-USR-UI-010 |
| Module | User Master |
| Scenario | Masters nav visible to Admin only |
| Preconditions | Admin / Editor |
| Test Data | - |
| Steps | Render AdminLayout |
| Expected Result | Admin sees Company Master/User Master; Editor sees neither |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AdminLayout.test.tsx) |
| Priority | High |

### TC-USR-UI-011
| Field | Value |
|---|---|
| Test Case ID | TC-USR-UI-011 |
| Module | User Master |
| Scenario | Login accepts username |
| Preconditions | - |
| Test Data | - |
| Steps | Type username, submit |
| Expected Result | POST body email=username; navigates |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (LoginPage.test.tsx) |
| Priority | Medium |

### TC-USR-E2E-001
| Field | Value |
|---|---|
| Test Case ID | TC-USR-E2E-001 |
| Module | User Master |
| Scenario | Create, username login, reset password, deactivate |
| Preconditions | Admin, running stack |
| Test Data | - |
| Steps | UI flow |
| Expected Result | Old password rejected, new works, inactive refused |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (e2e/masters.spec.ts) |
| Priority | High |

### TC-USR-E2E-002
| Field | Value |
|---|---|
| Test Case ID | TC-USR-E2E-002 |
| Module | User Master |
| Scenario | Legacy /admin/users redirects |
| Preconditions | Admin |
| Test Data | - |
| Steps | Visit /admin/users |
| Expected Result | Redirect to /admin/masters/users |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (e2e/masters.spec.ts) |
| Priority | Low |

### TC-USR-E2E-003
| Field | Value |
|---|---|
| Test Case ID | TC-USR-E2E-003 |
| Module | User Master |
| Scenario | Editor cannot see/open Masters; API 403 |
| Preconditions | Editor |
| Test Data | - |
| Steps | Sign in; visit URLs; call API |
| Expected Result | No nav links; 403 page; 403 API |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (e2e/permissions.spec.ts) |
| Priority | Critical |
