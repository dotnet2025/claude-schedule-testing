# Test cases – Company Users (Company–User mapping)

> **Status of every case below is `Not Run`**: this run had no .NET SDK, no NuGet/npm access and no browser, so none of the tests were compiled or executed. See `tests/test-results/test-execution-summary.md`.

### TC-CU-001
| Field | Value |
|---|---|
| Test Case ID | TC-CU-001 |
| Module | Company Users |
| Scenario | Assign existing user |
| Preconditions | Admin; company + user exist |
| Test Data | generated per test |
| Steps | POST /api/company-users {companyId,userId,isPrimaryCompany:true} |
| Expected Result | 201 with company/user details, IsActive true, primary true |
| Automated test | Assign_existing_user_returns_201_with_details; companyUsers.test.tsx (assign) |
| Status | Not Run |

### TC-CU-002
| Field | Value |
|---|---|
| Test Case ID | TC-CU-002 |
| Module | Company Users |
| Scenario | Create new user and assign |
| Preconditions | Admin; active company |
| Test Data | generated per test |
| Steps | POST /api/companies/{id}/users |
| Expected Result | 201 {user, assignment}; no password in body; the new user can log in (hash created by User Master service) |
| Automated test | Create_new_user_and_assign_in_one_call; companyUsers.test.tsx (create); company-users.spec.ts |
| Status | Not Run |

### TC-CU-003
| Field | Value |
|---|---|
| Test Case ID | TC-CU-003 |
| Module | Company Users |
| Scenario | Reject duplicate mapping |
| Preconditions | Active mapping exists |
| Test Data | generated per test |
| Steps | POST same company/user twice (both assign endpoints) |
| Expected Result | 409 Conflict |
| Automated test | Duplicate_active_assignment_is_409 |
| Status | Not Run |

### TC-CU-004
| Field | Value |
|---|---|
| Test Case ID | TC-CU-004 |
| Module | Company Users |
| Scenario | Invalid CompanyId |
| Preconditions | - |
| Test Data | generated per test |
| Steps | POST /api/company-users with unknown / 0 CompanyId; GET unknown ids |
| Expected Result | 404 for unknown id, 400 for 0 (validation), GETs 404 |
| Automated test | Invalid_company_or_user_is_404_and_bad_ids_are_400 |
| Status | Not Run |

### TC-CU-005
| Field | Value |
|---|---|
| Test Case ID | TC-CU-005 |
| Module | Company Users |
| Scenario | Invalid UserId |
| Preconditions | - |
| Test Data | generated per test |
| Steps | POST /api/company-users with unknown UserId |
| Expected Result | 404 |
| Automated test | Invalid_company_or_user_is_404_and_bad_ids_are_400 |
| Status | Not Run |

### TC-CU-006
| Field | Value |
|---|---|
| Test Case ID | TC-CU-006 |
| Module | Company Users |
| Scenario | Inactive company |
| Preconditions | Company IsActive=false |
| Test Data | generated per test |
| Steps | Assign existing / create new user |
| Expected Result | 400 Bad Request; no user row created |
| Automated test | Inactive_company_cannot_receive_assignments |
| Status | Not Run |

### TC-CU-007
| Field | Value |
|---|---|
| Test Case ID | TC-CU-007 |
| Module | Company Users |
| Scenario | Active assignment for inactive user |
| Preconditions | User IsActive=false |
| Test Data | generated per test |
| Steps | POST with isActive true / false |
| Expected Result | true -> 400; false -> 201 |
| Automated test | Inactive_user_cannot_get_active_assignment_but_can_get_inactive_one |
| Status | Not Run |

### TC-CU-008
| Field | Value |
|---|---|
| Test Case ID | TC-CU-008 |
| Module | Company Users |
| Scenario | View users for a company |
| Preconditions | Mappings exist |
| Test Data | generated per test |
| Steps | GET /api/companies/{id}/users |
| Expected Result | Paged list only for that company |
| Automated test | View_users_of_company_companies_of_user_and_multi_company_membership |
| Status | Not Run |

### TC-CU-009
| Field | Value |
|---|---|
| Test Case ID | TC-CU-009 |
| Module | Company Users |
| Scenario | View companies for a user |
| Preconditions | Mappings exist |
| Test Data | generated per test |
| Steps | GET /api/users/{id}/companies |
| Expected Result | List with primary first |
| Automated test | View_users_of_company_companies_of_user_and_multi_company_membership |
| Status | Not Run |

### TC-CU-010
| Field | Value |
|---|---|
| Test Case ID | TC-CU-010 |
| Module | Company Users |
| Scenario | User in multiple companies |
| Preconditions | - |
| Test Data | generated per test |
| Steps | Assign one user to two companies |
| Expected Result | Both mappings exist; ActiveUserCount correct |
| Automated test | View_users_of_company_companies_of_user_and_multi_company_membership |
| Status | Not Run |

### TC-CU-011
| Field | Value |
|---|---|
| Test Case ID | TC-CU-011 |
| Module | Company Users |
| Scenario | Set primary |
| Preconditions | - |
| Test Data | generated per test |
| Steps | Assign with isPrimaryCompany true |
| Expected Result | Mapping is primary |
| Automated test | Only_one_active_primary_per_user_and_changing_primary_demotes_the_old_one |
| Status | Not Run |

### TC-CU-012
| Field | Value |
|---|---|
| Test Case ID | TC-CU-012 |
| Module | Company Users |
| Scenario | Change primary |
| Preconditions | User has primary A |
| Test Data | generated per test |
| Steps | PUT mapping B isPrimaryCompany true |
| Expected Result | B primary, A not, atomically |
| Automated test | Only_one_active_primary_per_user_and_changing_primary_demotes_the_old_one |
| Status | Not Run |

### TC-CU-013
| Field | Value |
|---|---|
| Test Case ID | TC-CU-013 |
| Module | Company Users |
| Scenario | Only one active primary per user |
| Preconditions | 3 companies |
| Test Data | generated per test |
| Steps | Assign third as primary |
| Expected Result | Exactly one active primary |
| Automated test | Only_one_active_primary_per_user_and_changing_primary_demotes_the_old_one |
| Status | Not Run |

### TC-CU-014
| Field | Value |
|---|---|
| Test Case ID | TC-CU-014 |
| Module | Company Users |
| Scenario | DB enforces single primary |
| Preconditions | 2 mappings, one primary |
| Test Data | generated per test |
| Steps | Raw SQL sets second primary |
| Expected Result | Database rejects (filtered unique index) |
| Automated test | Database_filtered_unique_index_rejects_a_second_active_primary |
| Status | Not Run |

### TC-CU-015
| Field | Value |
|---|---|
| Test Case ID | TC-CU-015 |
| Module | Company Users |
| Scenario | Edit assignment status |
| Preconditions | - |
| Test Data | generated per test |
| Steps | PUT {isActive:false,isPrimaryCompany:true} then {false,false}; body also carries companyId/userId |
| Expected Result | 400 for inactive primary; 200 and ids/role unchanged |
| Automated test | Edit_status_and_primary_only_and_deactivating_clears_primary; companyUsers.test.tsx (edit) |
| Status | Not Run |

### TC-CU-016
| Field | Value |
|---|---|
| Test Case ID | TC-CU-016 |
| Module | Company Users |
| Scenario | Unassign without deleting user |
| Preconditions | Primary mapping |
| Test Data | generated per test |
| Steps | DELETE /api/company-users/{id}; confirm dialog in UI |
| Expected Result | 204; mapping inactive, primary cleared; user and company remain |
| Automated test | Unassign_soft_deletes_keeps_user_and_company_and_clears_primary; companyUsers.test.tsx (remove) |
| Status | Not Run |

### TC-CU-017
| Field | Value |
|---|---|
| Test Case ID | TC-CU-017 |
| Module | Company Users |
| Scenario | Reactivate inactive assignment |
| Preconditions | Inactive mapping |
| Test Data | generated per test |
| Steps | POST assign again |
| Expected Result | 200 (not 201), same CompanyUserId, active; no duplicate row |
| Automated test | Assigning_again_reactivates_inactive_mapping_with_200 |
| Status | Not Run |

### TC-CU-018
| Field | Value |
|---|---|
| Test Case ID | TC-CU-018 |
| Module | Company Users |
| Scenario | Transaction rollback |
| Preconditions | SQLite trigger makes mapping insert fail |
| Test Data | generated per test |
| Steps | POST /api/companies/{id}/users |
| Expected Result | 409; user NOT persisted, cannot log in |
| Automated test | Create_user_and_assign_rolls_back_when_assignment_fails |
| Status | Not Run |

### TC-CU-019
| Field | Value |
|---|---|
| Test Case ID | TC-CU-019 |
| Module | Company Users |
| Scenario | Create user validation / user-side failure |
| Preconditions | - |
| Test Data | generated per test |
| Steps | Duplicate email/username (case-insensitive), bad role/email/password, unknown company |
| Expected Result | 409/400/404 and no orphan users |
| Automated test | Create_user_validation_and_duplicates_leave_nothing_behind |
| Status | Not Run |

### TC-CU-020
| Field | Value |
|---|---|
| Test Case ID | TC-CU-020 |
| Module | Company Users |
| Scenario | Editor forbidden / anonymous 401 |
| Preconditions | Editor + anonymous clients |
| Test Data | generated per test |
| Steps | Call all 9 endpoints |
| Expected Result | 403 / 401 |
| Automated test | Editor_is_forbidden_and_anonymous_unauthorized_on_every_endpoint |
| Status | Not Run |

### TC-CU-021
| Field | Value |
|---|---|
| Test Case ID | TC-CU-021 |
| Module | Company Users |
| Scenario | Role independent of membership |
| Preconditions | Editor user |
| Test Data | generated per test |
| Steps | Assign/edit/unassign |
| Expected Result | System role stays Editor |
| Automated test | Membership_changes_never_change_the_system_role |
| Status | Not Run |

### TC-CU-022
| Field | Value |
|---|---|
| Test Case ID | TC-CU-022 |
| Module | Company Users |
| Scenario | Search / filter / sort |
| Preconditions | Several mappings |
| Test Data | generated per test |
| Steps | Query params search, companyId, userIsActive, assignmentIsActive, sortBy, desc |
| Expected Result | Server-side results; UI sends params |
| Automated test | Search_filter_sort_and_paging_use_the_paging_shape; companyUsers.test.tsx (search/filters) |
| Status | Not Run |

### TC-CU-023
| Field | Value |
|---|---|
| Test Case ID | TC-CU-023 |
| Module | Company Users |
| Scenario | Pagination shape and boundaries |
| Preconditions | 5 mappings |
| Test Data | generated per test |
| Steps | pageSize=2 pages 1..3; page=0; pageSize=100000; no match |
| Expected Result | {items,total,page,pageSize,totalPages}; normalised; empty page valid |
| Automated test | Search_filter_sort_and_paging_use_the_paging_shape; companyUsers.test.tsx (pagination) |
| Status | Not Run |

### TC-CU-024
| Field | Value |
|---|---|
| Test Case ID | TC-CU-024 |
| Module | Company Users |
| Scenario | Concurrent primary updates |
| Preconditions | User with 6 mappings |
| Test Data | generated per test |
| Steps | 6 parallel PUT isPrimaryCompany=true |
| Expected Result | Each 200/409, exactly one active primary remains |
| Automated test | Parallel_primary_updates_leave_exactly_one_primary |
| Status | Not Run |

### TC-CU-025
| Field | Value |
|---|---|
| Test Case ID | TC-CU-025 |
| Module | Company Users |
| Scenario | Concurrent duplicate assignment |
| Preconditions | - |
| Test Data | generated per test |
| Steps | 5 parallel identical POSTs |
| Expected Result | One 201, rest 409, one row |
| Automated test | Parallel_duplicate_assignments_create_a_single_mapping |
| Status | Not Run |

### TC-CU-026
| Field | Value |
|---|---|
| Test Case ID | TC-CU-026 |
| Module | Company Users |
| Scenario | Company master prerequisite |
| Preconditions | - |
| Test Data | generated per test |
| Steps | Create/dup code/validation/update/search |
| Expected Result | 201/409/400/200 |
| Automated test | Company_master_basics_validate_and_reject_duplicate_codes |
| Status | Not Run |

### TC-CU-027
| Field | Value |
|---|---|
| Test Case ID | TC-CU-027 |
| Module | Company Users |
| Scenario | Profile fields and no secrets |
| Preconditions | - |
| Test Data | generated per test |
| Steps | GET /api/auth/me, /api/company-users |
| Expected Result | Username present, no passwordHash |
| Automated test | Existing_users_migrated_with_profile_fields_and_hash_is_never_returned |
| Status | Not Run |

### TC-CU-028
| Field | Value |
|---|---|
| Test Case ID | TC-CU-028 |
| Module | Company Users |
| Scenario | UI refresh after CRUD / validation messages / empty state / error state |
| Preconditions | MSW |
| Test Data | generated per test |
| Steps | Assign, create, edit, remove from tab and list |
| Expected Result | Toasts, list reloaded, messages shown |
| Automated test | companyUsers.test.tsx |
| Status | Not Run |

### TC-CU-029
| Field | Value |
|---|---|
| Test Case ID | TC-CU-029 |
| Module | Company Users |
| Scenario | Migration on existing DB (manual) |
| Preconditions | DB created from InitialCreate with users |
| Test Data | generated per test |
| Steps | Apply AddCompanyUserMapping |
| Expected Result | Users get FirstName=DisplayName, Username=lower(email); tables created |
| Automated test | Manual - not possible without dotnet |
| Status | Not Run |

### TC-CU-030
| Field | Value |
|---|---|
| Test Case ID | TC-CU-030 |
| Module | Company Users |
| Scenario | Responsive layout / visual (manual) |
| Preconditions | - |
| Test Data | generated per test |
| Steps | View company users list and dialogs at 375/768/1280 |
| Expected Result | No horizontal page scroll; table scrolls |
| Automated test | Manual |
| Status | Not Run |

