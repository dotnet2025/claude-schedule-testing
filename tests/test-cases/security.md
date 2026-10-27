# Test cases – Security

> **Status of every case below is `Not Run`** unless stated: the authoring environment had no .NET SDK or package registry access, so no automated test was executed. See `tests/test-results/test-execution-summary.md`.

### TC-SEC-001
| Field | Value |
|---|---|
| Test Case ID | TC-SEC-001 |
| Module | Security |
| Scenario | Stored XSS via script/onerror/javascript: |
| Preconditions | - |
| Test Data | payloads |
| Steps | Save content |
| Expected Result | Stripped |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (PageTests.Html_is_sanitized_on_save) |
| Priority | Critical |

### TC-SEC-002
| Field | Value |
|---|---|
| Test Case ID | TC-SEC-002 |
| Module | Security |
| Scenario | SQL injection in search / login |
| Preconditions | - |
| Test Data | ' OR 1=1 -- |
| Steps | Search / login |
| Expected Result | No error, no leakage |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Manual (EF Core parameterises queries; not explicitly tested) |
| Priority | High |

### TC-SEC-003
| Field | Value |
|---|---|
| Test Case ID | TC-SEC-003 |
| Module | Security |
| Scenario | Password hash never returned |
| Preconditions | - |
| Test Data | - |
| Steps | Login/user APIs |
| Expected Result | No password fields |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthTests, AuthorizationTests) |
| Priority | Critical |

### TC-SEC-004
| Field | Value |
|---|---|
| Test Case ID | TC-SEC-004 |
| Module | Security |
| Scenario | Unsafe upload types and signature spoofing |
| Preconditions | - |
| Test Data | - |
| Steps | Upload |
| Expected Result | Rejected |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (MediaTests) |
| Priority | Critical |

### TC-SEC-005
| Field | Value |
|---|---|
| Test Case ID | TC-SEC-005 |
| Module | Security |
| Scenario | Tampered/expired JWT |
| Preconditions | - |
| Test Data | - |
| Steps | Call API |
| Expected Result | 401 |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Automated (AuthTests) |
| Priority | Critical |

### TC-SEC-006
| Field | Value |
|---|---|
| Test Case ID | TC-SEC-006 |
| Module | Security |
| Scenario | Security headers present |
| Preconditions | - |
| Test Data | - |
| Steps | Any response |
| Expected Result | nosniff, frame deny, referrer policy |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Manual (Middleware implemented; no assertion) |
| Priority | Medium |

### TC-SEC-007
| Field | Value |
|---|---|
| Test Case ID | TC-SEC-007 |
| Module | Security |
| Scenario | CORS limited to configured origins |
| Preconditions | - |
| Test Data | other origin |
| Steps | Preflight |
| Expected Result | No ACAO header |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Manual (-) |
| Priority | Medium |

### TC-SEC-008
| Field | Value |
|---|---|
| Test Case ID | TC-SEC-008 |
| Module | Security |
| Scenario | Stack traces hidden outside Development |
| Preconditions | Production env |
| Test Data | - |
| Steps | Force 500 |
| Expected Result | Generic detail |
| Actual Result | Not executed |
| Status | Not Run |
| Automation | Manual (-) |
| Priority | Medium |
