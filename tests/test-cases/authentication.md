# Test cases – Authentication

> **Status of every case below is `Not Run`** unless stated: the authoring environment had no .NET SDK or package registry access, so no automated test was executed. See `tests/test-results/test-execution-summary.md`.

### TC-AUTH-001
| Field | Value |
|---|---|
| Test Case ID | TC-AUTH-001 |
| Module | Authentication |
| Scenario | Login with valid Admin credentials |
| Preconditions | Admin seeded and active |
| Test Data | Dev admin credentials |
| Steps | POST /api/auth/login |
| Expected Result | 200, access+refresh token, no password hash |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthTests.Login_with_valid_admin...) |
| Priority | Critical |

### TC-AUTH-002
| Field | Value |
|---|---|
| Test Case ID | TC-AUTH-002 |
| Module | Authentication |
| Scenario | Login with wrong password |
| Preconditions | Admin exists |
| Test Data | Wrong password |
| Steps | POST login |
| Expected Result | 401/400, no tokens |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthTests.Login_with_invalid_credentials_fails) |
| Priority | Critical |

### TC-AUTH-003
| Field | Value |
|---|---|
| Test Case ID | TC-AUTH-003 |
| Module | Authentication |
| Scenario | Login with unknown user |
| Preconditions | - |
| Test Data | nobody@test.local |
| Steps | POST login |
| Expected Result | 401 with same message as wrong password |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthTests.Login_with_invalid_credentials_fails) |
| Priority | High |

### TC-AUTH-004
| Field | Value |
|---|---|
| Test Case ID | TC-AUTH-004 |
| Module | Authentication |
| Scenario | Login with empty fields |
| Preconditions | - |
| Test Data | "" / "" |
| Steps | POST login |
| Expected Result | 400 validation |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthTests.Login_with_invalid_credentials_fails; LoginPage.test) |
| Priority | Medium |

### TC-AUTH-005
| Field | Value |
|---|---|
| Test Case ID | TC-AUTH-005 |
| Module | Authentication |
| Scenario | Protected endpoint without token |
| Preconditions | - |
| Test Data | none |
| Steps | GET /api/auth/me |
| Expected Result | 401 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthTests.Protected_endpoint_without_token_is_401) |
| Priority | Critical |

### TC-AUTH-006
| Field | Value |
|---|---|
| Test Case ID | TC-AUTH-006 |
| Module | Authentication |
| Scenario | Tampered JWT |
| Preconditions | Valid token |
| Test Data | Modified signature |
| Steps | GET /api/auth/me |
| Expected Result | 401 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthTests.Tampered_token_is_rejected) |
| Priority | Critical |

### TC-AUTH-007
| Field | Value |
|---|---|
| Test Case ID | TC-AUTH-007 |
| Module | Authentication |
| Scenario | Expired JWT |
| Preconditions | - |
| Test Data | Token expired 1h ago |
| Steps | GET /api/auth/me |
| Expected Result | 401 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthTests.Expired_token_is_rejected) |
| Priority | Critical |

### TC-AUTH-008
| Field | Value |
|---|---|
| Test Case ID | TC-AUTH-008 |
| Module | Authentication |
| Scenario | Current user profile |
| Preconditions | Logged in |
| Test Data | - |
| Steps | GET /api/auth/me |
| Expected Result | 200 with own profile |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthTests.Me_returns_current_user) |
| Priority | High |

### TC-AUTH-009
| Field | Value |
|---|---|
| Test Case ID | TC-AUTH-009 |
| Module | Authentication |
| Scenario | Refresh token rotation and reuse detection |
| Preconditions | Logged in |
| Test Data | Old refresh token |
| Steps | Refresh twice with the same token |
| Expected Result | First OK; reuse 401 and token family revoked |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthTests.Refresh_rotates_token...) |
| Priority | Critical |

### TC-AUTH-010
| Field | Value |
|---|---|
| Test Case ID | TC-AUTH-010 |
| Module | Authentication |
| Scenario | Invalid refresh token |
| Preconditions | - |
| Test Data | garbage |
| Steps | POST refresh |
| Expected Result | 401 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthTests.Invalid_refresh_token_is_401) |
| Priority | High |

### TC-AUTH-011
| Field | Value |
|---|---|
| Test Case ID | TC-AUTH-011 |
| Module | Authentication |
| Scenario | Logout revokes refresh token |
| Preconditions | Logged in |
| Test Data | - |
| Steps | POST logout then refresh |
| Expected Result | 204 then 401 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthTests.Logout_revokes_refresh_token) |
| Priority | High |

### TC-AUTH-012
| Field | Value |
|---|---|
| Test Case ID | TC-AUTH-012 |
| Module | Authentication |
| Scenario | Change password rules |
| Preconditions | Editor logged in |
| Test Data | wrong current / short / no digit / valid |
| Steps | POST change-password |
| Expected Result | 400,400,400,204; old password stops working |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthTests.Change_password...) |
| Priority | High |

### TC-AUTH-013
| Field | Value |
|---|---|
| Test Case ID | TC-AUTH-013 |
| Module | Authentication |
| Scenario | Login form validation (UI) |
| Preconditions | Login page open |
| Test Data | empty, malformed email |
| Steps | Submit |
| Expected Result | Inline errors, no API call |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (LoginPage.test.tsx) |
| Priority | High |

### TC-AUTH-014
| Field | Value |
|---|---|
| Test Case ID | TC-AUTH-014 |
| Module | Authentication |
| Scenario | Login success navigation (UI) |
| Preconditions | Mock API |
| Test Data | valid creds |
| Steps | Submit |
| Expected Result | Redirect to /admin |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (LoginPage.test.tsx) |
| Priority | High |

### TC-AUTH-015
| Field | Value |
|---|---|
| Test Case ID | TC-AUTH-015 |
| Module | Authentication |
| Scenario | Login brute-force rate limiting |
| Preconditions | Rate limit configured low |
| Test Data | >N attempts/minute |
| Steps | Repeat login |
| Expected Result | 429 after limit |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Manual (Not automated: tests raise the limit to avoid flakiness) |
| Priority | High |

### TC-AUTH-016
| Field | Value |
|---|---|
| Test Case ID | TC-AUTH-016 |
| Module | Authentication |
| Scenario | Access token refresh on 401 (client) |
| Preconditions | Expired access token |
| Test Data | - |
| Steps | Any API call |
| Expected Result | Single refresh then retry |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (client.test.ts) |
| Priority | High |

### TC-AUTH-017
| Field | Value |
|---|---|
| Test Case ID | TC-AUTH-017 |
| Module | Authentication |
| Scenario | Session survives browser refresh; logout ends it (E2E) |
| Preconditions | Running stack |
| Test Data | admin creds |
| Steps | Login, reload, logout |
| Expected Result | Dashboard persists; after logout /admin redirects to login |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (e2e/auth.spec.ts) |
| Priority | High |

### TC-AUTH-018
| Field | Value |
|---|---|
| Test Case ID | TC-AUTH-018 |
| Module | Authentication |
| Scenario | Login E2E valid/invalid/redirect |
| Preconditions | Running stack |
| Test Data | admin / wrong |
| Steps | Open login, submit |
| Expected Result | Dashboard / error / redirect to login |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (e2e/auth.spec.ts) |
| Priority | Critical |
