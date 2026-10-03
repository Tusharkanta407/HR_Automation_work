# HR Mock Domain REST API — Workflow Node Endpoint Guide

> **Live Base URL**: `https://hr-automation-work.onrender.com`  
> **Interactive Swagger UI**: [`https://hr-automation-work.onrender.com/swagger/index.html`](https://hr-automation-work.onrender.com/swagger/index.html)  
> **Health Check**: `https://hr-automation-work.onrender.com/health`

---

## 1. Master Workflow Node Mapping Table

| # | Workflow Node Type | HTTP Method | Live Endpoint Path | Required Node Config / Inputs | Description & Engine Usage |
|:--|:---|:---:|:---|:---|:---|
| 1 | `GET_EMPLOYEES` | `GET` | `/api/employees` | `department` (opt), `status` (opt) | Fetch directory of employees |
| 2 | `GET_EMPLOYEE` | `GET` | `/api/employees/{id}` | `employeeId` (e.g. `EMP-101`) | Fetch single employee profile |
| 3 | `CREATE_EMPLOYEE` | `POST` | `/api/employees` | `name`, `email`, `department`, `position`, `salary` | Provision new employee from candidate |
| 4 | `UPDATE_EMPLOYEE` | `PATCH` | `/api/employees/{id}` | `employeeId`, fields to update | Update department, salary, or status |
| 5 | `GET_ATTENDANCE` | `GET` | `/api/attendance` | `period` (e.g. `2026-09`), `belowThresholdOnly` | Query attendance logs across employees |
| 6 | `GET_MONTHLY_ATTENDANCE`| `GET` | `/api/attendance/monthly` | `period` (e.g. `2026-09`) | Aggregated monthly attendance summary |
| 7 | `GET_LEAVE_RECORDS` | `GET` | `/api/leave` | `status` (`PENDING`, `APPROVED`), `employeeId` | Fetch leave requests & approval pipeline |
| 8 | `GET_CANDIDATES` | `GET` | `/api/candidates` | `stage` (`APPLIED`, `INTERVIEW`), `status` | Retrieve pipeline candidates |
| 9 | `GET_CANDIDATE` | `GET` | `/api/candidates/{id}` | `candidateId` (e.g. `CAND-201`) | Retrieve specific candidate details & resume |
| 10 | `UPDATE_CANDIDATE_STATUS` | `PATCH` | `/api/candidates/{id}/status` | `candidateId`, `stage`, `status` | Advance candidate through recruiting stages |
| 11 | `GET_ASSESSMENT_RESULT` | `GET` | `/api/assessments/{id}` | `assessmentId` (e.g. `ASM-301`) or candidateId | Fetch technical/coding assessment score |
| 12 | `GET_INTERVIEWERS` | `GET` | `/api/interviewers` | `department` (opt) | List available interviewers |
| 13 | `GET_INTERVIEWER_AVAILABILITY` | `GET` | `/api/interviewers/availability` | `interviewerId` (e.g. `INTV-401`), `date` | Find open calendar time slots |
| 14 | `SCHEDULE_INTERVIEW` | `POST` | `/api/interviews` | `candidateId`, `interviewerId`, `scheduledAt` | Schedule meeting & generate Meet link |
| 15 | `ASSIGN_INTERVIEWER` | `POST` | `/api/interviews/assign` | `candidateId`, `interviewerId`, `date` | Assign matched interviewer to applicant |
| 16 | `CREATE_ONBOARDING_TASK` | `POST` | `/api/onboarding/tasks` | `employeeId`, `title`, `description`, `dueDate` | Add checklist item for new hires |
| 17 | `HTTP_REQUEST` | `ANY` | `/api/http-request` | `method`, `headers`, `body` | Universal echo endpoint for testing custom webhooks |

---

## 2. Pre-Seeded Test Data Cheat Sheet

Use these verified IDs and email addresses in your workflow tests:

### 👤 Employees
| ID | Name | Email | Department | Role | Status |
|:---|:---|:---|:---|:---|:---|
| `EMP-101` | Tusharkanta Behera | `beheratusharkanta27@gmail.com` | Engineering | Senior Full Stack Engineer | `ACTIVE` |
| `EMP-102` | Tushar B | `t98531818@gmail.com` | DevOps & Cloud | Staff Platform Specialist | `ACTIVE` |
| `EMP-103` | Tusharkanta (CGU) | `2301020601@cgu-odisha.ac.in` | AI Research | AI Solutions Developer | `ACTIVE` |
| `EMP-104` | Priya Sharma | `priya.sharma@example.com` | Product | Senior Product Manager | `ACTIVE` |

### 🎯 Candidates
| ID | Name | Email | Role | Stage | Status |
|:---|:---|:---|:---|:---|:---|
| `CAND-201` | Tusharkanta Behera | `beheratusharkanta27@gmail.com` | Lead Automation Architect | `INTERVIEW` | `ACTIVE` |
| `CAND-202` | Tushar B | `t98531818@gmail.com` | Cloud Infrastructure Lead | `ASSESSMENT` | `ACTIVE` |
| `CAND-203` | Tusharkanta (CGU) | `2301020601@cgu-odisha.ac.in` | AI Research Scientist | `APPLIED` | `ACTIVE` |

### ⏱️ Attendance (< 75% triggers low-attendance condition branch)
* **`ATT-001`** (`EMP-101`): `68.18%` (`isBelowThreshold = true`) 🚨 **Triggers Low Attendance Alert**
* **`ATT-002`** (`EMP-102`): `95.45%` (`isBelowThreshold = false`)
* **`ATT-003`** (`EMP-103`): `72.72%` (`isBelowThreshold = true`) 🚨 **Triggers Low Attendance Alert**

### 🏖️ Leave Records
* **`LEV-001`**: `EMP-101`, `SICK`, 3 days, `APPROVED`
* **`LEV-002`**: `EMP-103`, `CASUAL`, 2 days, `APPROVED`

### 📝 Assessments
* **`ASM-301`** (`CAND-201`): Score `92/100` (92%), Status: `PASSED`
* **`ASM-302`** (`CAND-202`): Score `88/100` (88%), Status: `PASSED`
* **`ASM-303`** (`CAND-203`): Score `95/100` (95%), Status: `PASSED`

### 📅 Interviewers
* **`INTV-401`**: `beheratusharkanta27@gmail.com` (Engineering)
* **`INTV-402`**: `t98531818@gmail.com` (Architecture)
* **`INTV-403`**: `2301020601@cgu-odisha.ac.in` (AI Research)

---

## 3. Node Specification & Testing Commands

### 1. `GET_EMPLOYEES`
* **Method**: `GET`
* **URL**: `https://hr-automation-work.onrender.com/api/employees`
* **Query Parameters**:
  * `department` *(string, optional)*: Filter by department (e.g. `Engineering`)
  * `status` *(string, optional)*: Filter by status (e.g. `ACTIVE`)
* **Testing Command**:
```bash
curl -X GET "https://hr-automation-work.onrender.com/api/employees?department=Engineering"
```
* **Sample Response**:
```json
[
  {
    "id": "EMP-101",
    "name": "Tusharkanta Behera",
    "email": "beheratusharkanta27@gmail.com",
    "department": "Engineering",
    "position": "Senior Full Stack Engineer",
    "salary": 125000,
    "status": "ACTIVE",
    "joinedAt": "2025-04-03T10:00:00Z"
  }
]
```

---

### 2. `GET_EMPLOYEE`
* **Method**: `GET`
* **URL**: `https://hr-automation-work.onrender.com/api/employees/{id}`
* **Path Parameter**: `id` (e.g. `EMP-101`)
* **Testing Command**:
```bash
curl -X GET "https://hr-automation-work.onrender.com/api/employees/EMP-101"
```

---

### 3. `CREATE_EMPLOYEE`
* **Method**: `POST`
* **URL**: `https://hr-automation-work.onrender.com/api/employees`
* **Request Body**:
```json
{
  "name": "Alex Johnson",
  "email": "alex.johnson@example.com",
  "department": "Engineering",
  "position": "Software Engineer II",
  "salary": 105000,
  "status": "ACTIVE"
}
```
* **Testing Command**:
```bash
curl -X POST "https://hr-automation-work.onrender.com/api/employees" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex Johnson","email":"alex.johnson@example.com","department":"Engineering","position":"Software Engineer II","salary":105000,"status":"ACTIVE"}'
```

---

### 4. `UPDATE_EMPLOYEE`
* **Method**: `PATCH`
* **URL**: `https://hr-automation-work.onrender.com/api/employees/{id}`
* **Request Body**:
```json
{
  "position": "Lead Platform Engineer",
  "salary": 140000
}
```
* **Testing Command**:
```bash
curl -X PATCH "https://hr-automation-work.onrender.com/api/employees/EMP-101" \
  -H "Content-Type: application/json" \
  -d '{"position":"Lead Platform Engineer","salary":140000}'
```

---

### 5. `GET_ATTENDANCE`
* **Method**: `GET`
* **URL**: `https://hr-automation-work.onrender.com/api/attendance`
* **Query Parameters**:
  * `period` *(string, optional)*: e.g. `2026-09`
  * `belowThresholdOnly` *(boolean, optional)*: `true` to get employees with < 75% attendance
* **Testing Command**:
```bash
curl -X GET "https://hr-automation-work.onrender.com/api/attendance?belowThresholdOnly=true"
```
* **Sample Response**:
```json
[
  {
    "id": "ATT-001",
    "employeeId": "EMP-101",
    "employeeName": "Tusharkanta Behera",
    "employeeEmail": "beheratusharkanta27@gmail.com",
    "department": "Engineering",
    "period": "2026-09",
    "daysPresent": 15,
    "totalDays": 22,
    "attendanceRate": 68.18,
    "isBelowThreshold": true,
    "remarks": "Medical leaves and remote travel"
  }
]
```

---

### 6. `GET_MONTHLY_ATTENDANCE`
* **Method**: `GET`
* **URL**: `https://hr-automation-work.onrender.com/api/attendance/monthly`
* **Query Parameters**: `period` (e.g. `2026-09`)
* **Testing Command**:
```bash
curl -X GET "https://hr-automation-work.onrender.com/api/attendance/monthly?period=2026-09"
```

---

### 7. `GET_LEAVE_RECORDS`
* **Method**: `GET`
* **URL**: `https://hr-automation-work.onrender.com/api/leave`
* **Query Parameters**:
  * `status` *(string, optional)*: `APPROVED`, `PENDING`, `REJECTED`
  * `employeeId` *(string, optional)*: e.g. `EMP-101`
* **Testing Command**:
```bash
curl -X GET "https://hr-automation-work.onrender.com/api/leave?status=APPROVED"
```

---

### 8. `GET_CANDIDATES`
* **Method**: `GET`
* **URL**: `https://hr-automation-work.onrender.com/api/candidates`
* **Query Parameters**:
  * `stage` *(string, optional)*: `APPLIED`, `ASSESSMENT`, `INTERVIEW`, `OFFER`
  * `status` *(string, optional)*: `ACTIVE`, `HIRED`, `REJECTED`
* **Testing Command**:
```bash
curl -X GET "https://hr-automation-work.onrender.com/api/candidates?stage=INTERVIEW"
```

---

### 9. `GET_CANDIDATE`
* **Method**: `GET`
* **URL**: `https://hr-automation-work.onrender.com/api/candidates/{id}`
* **Path Parameter**: `id` (e.g. `CAND-201`)
* **Testing Command**:
```bash
curl -X GET "https://hr-automation-work.onrender.com/api/candidates/CAND-201"
```

---

### 10. `UPDATE_CANDIDATE_STATUS`
* **Method**: `PATCH`
* **URL**: `https://hr-automation-work.onrender.com/api/candidates/{id}/status`
* **Request Body**:
```json
{
  "stage": "OFFER",
  "status": "ACTIVE"
}
```
* **Testing Command**:
```bash
curl -X PATCH "https://hr-automation-work.onrender.com/api/candidates/CAND-201/status" \
  -H "Content-Type: application/json" \
  -d '{"stage":"OFFER","status":"ACTIVE"}'
```

---

### 11. `GET_ASSESSMENT_RESULT`
* **Method**: `GET`
* **URL**: `https://hr-automation-work.onrender.com/api/assessments/{id}`
* **Path Parameter**: `id` (e.g. `ASM-301` or by candidate ID)
* **Testing Command**:
```bash
curl -X GET "https://hr-automation-work.onrender.com/api/assessments/ASM-301"
```
* **Sample Response**:
```json
{
  "id": "ASM-301",
  "candidateId": "CAND-201",
  "candidateName": "Tusharkanta Behera",
  "candidateEmail": "beheratusharkanta27@gmail.com",
  "testName": "System Architecture & Automation Assessment",
  "score": 92,
  "totalScore": 100,
  "percentage": 92.0,
  "status": "PASSED",
  "feedback": "Strong architecture fundamentals and clean pipeline design.",
  "completedAt": "2026-10-02T14:30:00Z"
}
```

---

### 12. `GET_INTERVIEWERS`
* **Method**: `GET`
* **URL**: `https://hr-automation-work.onrender.com/api/interviewers`
* **Testing Command**:
```bash
curl -X GET "https://hr-automation-work.onrender.com/api/interviewers"
```

---

### 13. `GET_INTERVIEWER_AVAILABILITY`
* **Method**: `GET`
* **URL**: `https://hr-automation-work.onrender.com/api/interviewers/availability`
* **Query Parameters**:
  * `interviewerId` *(string, required)*: e.g. `INTV-401`
  * `date` *(string, optional)*: e.g. `2026-10-05`
* **Testing Command**:
```bash
curl -X GET "https://hr-automation-work.onrender.com/api/interviewers/availability?interviewerId=INTV-401"
```

---

### 14. `SCHEDULE_INTERVIEW`
* **Method**: `POST`
* **URL**: `https://hr-automation-work.onrender.com/api/interviews`
* **Request Body**:
```json
{
  "candidateId": "CAND-201",
  "interviewerId": "INTV-401",
  "scheduledAt": "2026-10-06T14:00:00Z",
  "durationMinutes": 45
}
```
* **Testing Command**:
```bash
curl -X POST "https://hr-automation-work.onrender.com/api/interviews" \
  -H "Content-Type: application/json" \
  -d '{"candidateId":"CAND-201","interviewerId":"INTV-401","scheduledAt":"2026-10-06T14:00:00Z","durationMinutes":45}'
```

---

### 15. `ASSIGN_INTERVIEWER`
* **Method**: `POST`
* **URL**: `https://hr-automation-work.onrender.com/api/interviews/assign`
* **Request Body**:
```json
{
  "candidateId": "CAND-202",
  "interviewerId": "INTV-402",
  "date": "2026-10-07T10:00:00Z"
}
```
* **Testing Command**:
```bash
curl -X POST "https://hr-automation-work.onrender.com/api/interviews/assign" \
  -H "Content-Type: application/json" \
  -d '{"candidateId":"CAND-202","interviewerId":"INTV-402","date":"2026-10-07T10:00:00Z"}'
```

---

### 16. `CREATE_ONBOARDING_TASK`
* **Method**: `POST`
* **URL**: `https://hr-automation-work.onrender.com/api/onboarding/tasks`
* **Request Body**:
```json
{
  "employeeId": "EMP-101",
  "title": "Set up Production AWS IAM Credentials",
  "description": "Configure MFA and workstation CLI keys.",
  "dueDate": "2026-10-10T18:00:00Z"
}
```
* **Testing Command**:
```bash
curl -X POST "https://hr-automation-work.onrender.com/api/onboarding/tasks" \
  -H "Content-Type: application/json" \
  -d '{"employeeId":"EMP-101","title":"Set up Production AWS IAM Credentials","description":"Configure MFA and workstation CLI keys.","dueDate":"2026-10-10T18:00:00Z"}'
```

---

### 17. `HTTP_REQUEST` (Universal Echo Endpoint)
* **Method**: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
* **URL**: `https://hr-automation-work.onrender.com/api/http-request`
* **Purpose**: Allows testing custom HTTP webhooks from the workflow engine and inspects headers, query params, and body in return.
* **Testing Command**:
```bash
curl -X POST "https://hr-automation-work.onrender.com/api/http-request" \
  -H "Content-Type: application/json" \
  -H "X-Custom-Header: HR-Engine-Run" \
  -d '{"event":"candidate_signed_offer","salary":120000}'
```
