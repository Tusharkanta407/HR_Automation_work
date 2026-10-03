import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [k, ...v] = trimmed.split("=");
    if (k && v.length) process.env[k.trim()] = v.join("=").trim();
  }
}

const PORT = process.env.PORT || 5000;

// In-memory data store seeded with the 3 required emails
const employees = [
  {
    id: "EMP-101",
    name: "Tusharkanta Behera",
    email: "beheratusharkanta27@gmail.com",
    department: "Engineering",
    position: "Senior Full Stack Engineer",
    salary: 125000,
    status: "ACTIVE",
    joinedAt: "2025-04-01T00:00:00Z"
  },
  {
    id: "EMP-102",
    name: "Tushar B",
    email: "t98531818@gmail.com",
    department: "DevOps & Cloud",
    position: "Staff Platform Specialist",
    salary: 135000,
    status: "ACTIVE",
    joinedAt: "2025-09-15T00:00:00Z"
  },
  {
    id: "EMP-103",
    name: "Tusharkanta (CGU)",
    email: "2301020601@cgu-odisha.ac.in",
    department: "AI Research",
    position: "AI Solutions Developer",
    salary: 110000,
    status: "ACTIVE",
    joinedAt: "2026-03-01T00:00:00Z"
  },
  {
    id: "EMP-104",
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    department: "Product",
    position: "Senior Product Manager",
    salary: 120000,
    status: "ACTIVE",
    joinedAt: "2024-10-10T00:00:00Z"
  }
];

const attendance = [
  {
    id: "ATT-001",
    employeeId: "EMP-101",
    employeeName: "Tusharkanta Behera",
    employeeEmail: "beheratusharkanta27@gmail.com",
    department: "Engineering",
    period: "2026-09",
    daysPresent: 15,
    totalDays: 22,
    attendanceRate: 68.18,
    isBelowThreshold: true,
    remarks: "Medical leaves and travel"
  },
  {
    id: "ATT-002",
    employeeId: "EMP-102",
    employeeName: "Tushar B",
    employeeEmail: "t98531818@gmail.com",
    department: "DevOps & Cloud",
    period: "2026-09",
    daysPresent: 21,
    totalDays: 22,
    attendanceRate: 95.45,
    isBelowThreshold: false,
    remarks: "Excellent consistency"
  },
  {
    id: "ATT-003",
    employeeId: "EMP-103",
    employeeName: "Tusharkanta (CGU)",
    employeeEmail: "2301020601@cgu-odisha.ac.in",
    department: "AI Research",
    period: "2026-09",
    daysPresent: 16,
    totalDays: 22,
    attendanceRate: 72.72,
    isBelowThreshold: true,
    remarks: "Exam session participation"
  },
  {
    id: "ATT-004",
    employeeId: "EMP-104",
    employeeName: "Priya Sharma",
    employeeEmail: "priya.sharma@example.com",
    department: "Product",
    period: "2026-09",
    daysPresent: 20,
    totalDays: 22,
    attendanceRate: 90.91,
    isBelowThreshold: false,
    remarks: "On track"
  }
];

const leaves = [
  {
    id: "LEV-001",
    employeeId: "EMP-101",
    employeeName: "Tusharkanta Behera",
    employeeEmail: "beheratusharkanta27@gmail.com",
    leaveType: "SICK",
    startDate: "2026-09-18T00:00:00Z",
    endDate: "2026-09-21T00:00:00Z",
    days: 3,
    status: "APPROVED",
    reason: "Viral recovery"
  },
  {
    id: "LEV-002",
    employeeId: "EMP-103",
    employeeName: "Tusharkanta (CGU)",
    employeeEmail: "2301020601@cgu-odisha.ac.in",
    leaveType: "CASUAL",
    startDate: "2026-09-28T00:00:00Z",
    endDate: "2026-09-30T00:00:00Z",
    days: 2,
    status: "APPROVED",
    reason: "Academic seminar"
  }
];

const candidates = [
  {
    id: "CAND-201",
    name: "Tusharkanta Behera",
    email: "beheratusharkanta27@gmail.com",
    role: "Lead Automation Architect",
    department: "Engineering",
    stage: "INTERVIEW",
    status: "ACTIVE",
    resumeUrl: "https://drive.google.com/file/d/demo-resume-1",
    appliedAt: "2026-09-10T00:00:00Z"
  },
  {
    id: "CAND-202",
    name: "Tushar B",
    email: "t98531818@gmail.com",
    role: "Senior Cloud Architect",
    department: "Cloud Operations",
    stage: "ASSESSMENT",
    status: "ACTIVE",
    resumeUrl: "https://drive.google.com/file/d/demo-resume-2",
    appliedAt: "2026-09-15T00:00:00Z"
  },
  {
    id: "CAND-203",
    name: "Tusharkanta (CGU)",
    email: "2301020601@cgu-odisha.ac.in",
    role: "AI Engineer",
    department: "AI Research",
    stage: "OFFER",
    status: "ACTIVE",
    resumeUrl: "https://drive.google.com/file/d/demo-resume-3",
    appliedAt: "2026-09-05T00:00:00Z"
  }
];

const assessments = [
  {
    id: "ASS-301",
    candidateId: "CAND-201",
    candidateName: "Tusharkanta Behera",
    candidateEmail: "beheratusharkanta27@gmail.com",
    testName: "Full Stack Architecture & Workflow Engineering",
    score: 96,
    totalScore: 100,
    percentage: 96.0,
    status: "PASSED",
    feedback: "Exceptional system design and async orchestration skills",
    completedAt: "2026-09-20T00:00:00Z"
  },
  {
    id: "ASS-302",
    candidateId: "CAND-202",
    candidateName: "Tushar B",
    candidateEmail: "t98531818@gmail.com",
    testName: "Cloud Infrastructure & High Availability",
    score: 92,
    totalScore: 100,
    percentage: 92.0,
    status: "PASSED",
    feedback: "Strong knowledge of Kubernetes, Redis and distributed workers",
    completedAt: "2026-09-22T00:00:00Z"
  },
  {
    id: "ASS-303",
    candidateId: "CAND-203",
    candidateName: "Tusharkanta (CGU)",
    candidateEmail: "2301020601@cgu-odisha.ac.in",
    testName: "LLM Integration & Agentic Systems",
    score: 94,
    totalScore: 100,
    percentage: 94.0,
    status: "PASSED",
    feedback: "Mastery in tool calling, OAuth scopes, and prompt safety",
    completedAt: "2026-09-18T00:00:00Z"
  }
];

const interviewers = [
  {
    id: "INTV-401",
    name: "Tusharkanta Behera",
    email: "beheratusharkanta27@gmail.com",
    department: "Engineering",
    role: "Lead Tech Interviewer",
    isAvailable: true,
    availableSlots: ["2026-10-05T10:00:00Z", "2026-10-05T14:00:00Z", "2026-10-06T11:00:00Z"]
  },
  {
    id: "INTV-402",
    name: "Tushar B",
    email: "t98531818@gmail.com",
    department: "Architecture",
    role: "System Design Interviewer",
    isAvailable: true,
    availableSlots: ["2026-10-05T15:00:00Z", "2026-10-06T16:00:00Z"]
  },
  {
    id: "INTV-403",
    name: "Tusharkanta (CGU)",
    email: "2301020601@cgu-odisha.ac.in",
    department: "AI Research",
    role: "AI & ML Interviewer",
    isAvailable: true,
    availableSlots: ["2026-10-06T09:00:00Z", "2026-10-07T14:00:00Z"]
  }
];

const interviews = [
  {
    id: "INT-501",
    candidateId: "CAND-201",
    candidateName: "Tusharkanta Behera",
    candidateEmail: "beheratusharkanta27@gmail.com",
    interviewerId: "INTV-402",
    interviewerName: "Tushar B",
    interviewerEmail: "t98531818@gmail.com",
    scheduledAt: "2026-10-05T15:00:00Z",
    durationMinutes: 45,
    meetLink: "https://meet.google.com/abc-defg-hij",
    status: "SCHEDULED"
  }
];

const onboardingTasks = [
  {
    id: "TSK-601",
    employeeId: "EMP-101",
    employeeName: "Tusharkanta Behera",
    employeeEmail: "beheratusharkanta27@gmail.com",
    title: "Complete Security & Compliance Training",
    description: "Review company security handbook and complete 2FA setup.",
    dueDate: "2026-10-08T00:00:00Z",
    status: "COMPLETED"
  },
  {
    id: "TSK-602",
    employeeId: "EMP-102",
    employeeName: "Tushar B",
    employeeEmail: "t98531818@gmail.com",
    title: "Set up Production Cloud Access Keys",
    description: "Configure IAM credentials and workstation VPN.",
    dueDate: "2026-10-06T00:00:00Z",
    status: "IN_PROGRESS"
  },
  {
    id: "TSK-603",
    employeeId: "EMP-103",
    employeeName: "Tusharkanta (CGU)",
    employeeEmail: "2301020601@cgu-odisha.ac.in",
    title: "Submit Academic Degree Verification",
    description: "Upload official transcript to HR portal.",
    dueDate: "2026-10-10T00:00:00Z",
    status: "PENDING"
  }
];

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key"
  });
  res.end(JSON.stringify(data, null, 2));
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key"
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname.replace(/\/$/, "");
  const method = req.method;

  let body = {};
  if (method === "POST" || method === "PATCH" || method === "PUT") {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString();
      if (raw.trim()) body = JSON.parse(raw);
    } catch {
      body = {};
    }
  }

  // 1. Health & Echo
  if (pathname === "" || pathname === "/health" || pathname === "/api/health") {
    return sendJson(res, 200, {
      service: "HR Mock Domain REST API",
      status: "HEALTHY",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      activeEmails: [
        "beheratusharkanta27@gmail.com",
        "t98531818@gmail.com",
        "2301020601@cgu-odisha.ac.in"
      ]
    });
  }

  if (pathname === "/api/http-request" || pathname === "/api/echo") {
    return sendJson(res, 200, {
      success: true,
      method,
      pathname,
      query: Object.fromEntries(parsedUrl.searchParams),
      headers: req.headers,
      body,
      timestamp: new Date().toISOString()
    });
  }

  // 2. Employees (GET_EMPLOYEES, GET_EMPLOYEE, CREATE_EMPLOYEE, UPDATE_EMPLOYEE)
  if (pathname === "/api/employees") {
    if (method === "GET") {
      const dept = parsedUrl.searchParams.get("department");
      let list = employees;
      if (dept) list = list.filter(e => e.department.toLowerCase() === dept.toLowerCase());
      return sendJson(res, 200, list);
    }
    if (method === "POST") {
      const id = body.id || `EMP-${employees.length + 101}`;
      const newEmp = {
        id,
        name: body.name || "New Employee",
        email: body.email,
        department: body.department || "Engineering",
        position: body.position || "Developer",
        salary: body.salary || 90000,
        status: "ACTIVE",
        joinedAt: new Date().toISOString()
      };
      employees.push(newEmp);
      return sendJson(res, 201, newEmp);
    }
  }

  const empMatch = pathname.match(/^\/api\/employees\/([^\/]+)$/);
  if (empMatch) {
    const id = decodeURIComponent(empMatch[1]);
    const empIndex = employees.findIndex(e => e.id.toLowerCase() === id.toLowerCase() || e.email.toLowerCase() === id.toLowerCase());
    if (empIndex === -1) return sendJson(res, 404, { error: `Employee ${id} not found` });

    if (method === "GET") return sendJson(res, 200, employees[empIndex]);
    if (method === "PATCH" || method === "PUT") {
      Object.assign(employees[empIndex], body);
      return sendJson(res, 200, employees[empIndex]);
    }
  }

  // 3. Attendance (GET_ATTENDANCE, GET_MONTHLY_ATTENDANCE)
  if (pathname === "/api/attendance") {
    if (method === "GET") {
      const period = parsedUrl.searchParams.get("period");
      let list = attendance;
      if (period) list = list.filter(a => a.period === period);
      return sendJson(res, 200, list);
    }
  }

  if (pathname === "/api/attendance/monthly") {
    return sendJson(res, 200, attendance);
  }

  // 4. Leave (GET_LEAVE_RECORDS)
  if (pathname === "/api/leave") {
    return sendJson(res, 200, leaves);
  }

  // 5. Candidates (GET_CANDIDATES, GET_CANDIDATE, UPDATE_CANDIDATE_STATUS)
  if (pathname === "/api/candidates") {
    return sendJson(res, 200, candidates);
  }

  const candStatusMatch = pathname.match(/^\/api\/candidates\/([^\/]+)\/status$/);
  if (candStatusMatch && (method === "PATCH" || method === "POST")) {
    const id = decodeURIComponent(candStatusMatch[1]);
    const cand = candidates.find(c => c.id.toLowerCase() === id.toLowerCase() || c.email.toLowerCase() === id.toLowerCase());
    if (!cand) return sendJson(res, 404, { error: `Candidate ${id} not found` });
    if (body.status) cand.status = body.status;
    if (body.stage) cand.stage = body.stage;
    return sendJson(res, 200, cand);
  }

  const candMatch = pathname.match(/^\/api\/candidates\/([^\/]+)$/);
  if (candMatch) {
    const id = decodeURIComponent(candMatch[1]);
    const cand = candidates.find(c => c.id.toLowerCase() === id.toLowerCase() || c.email.toLowerCase() === id.toLowerCase());
    if (!cand) return sendJson(res, 404, { error: `Candidate ${id} not found` });
    return sendJson(res, 200, cand);
  }

  // 6. Assessments (GET_ASSESSMENT_RESULT)
  const assMatch = pathname.match(/^\/api\/assessments\/([^\/]+)$/);
  if (assMatch && method === "GET") {
    const id = decodeURIComponent(assMatch[1]);
    const ass = assessments.find(a => a.id.toLowerCase() === id.toLowerCase() || a.candidateId.toLowerCase() === id.toLowerCase() || a.candidateEmail.toLowerCase() === id.toLowerCase());
    if (!ass) return sendJson(res, 404, { error: `Assessment ${id} not found` });
    return sendJson(res, 200, ass);
  }
  if (pathname === "/api/assessments") {
    return sendJson(res, 200, assessments);
  }

  // 7. Interviewers (GET_INTERVIEWERS, GET_INTERVIEWER_AVAILABILITY)
  if (pathname === "/api/interviewers") {
    return sendJson(res, 200, interviewers);
  }
  if (pathname === "/api/interviewers/availability") {
    const interviewerId = parsedUrl.searchParams.get("interviewerId");
    if (!interviewerId) return sendJson(res, 200, interviewers);
    const intv = interviewers.find(i => i.id.toLowerCase() === interviewerId.toLowerCase() || i.email.toLowerCase() === interviewerId.toLowerCase());
    if (!intv) return sendJson(res, 404, { error: `Interviewer ${interviewerId} not found` });
    return sendJson(res, 200, {
      interviewerId: intv.id,
      name: intv.name,
      email: intv.email,
      isAvailable: intv.isAvailable,
      availableSlots: intv.availableSlots,
      nextAvailableSlot: intv.availableSlots[0]
    });
  }

  // 8. Interviews (ASSIGN_INTERVIEWER, SCHEDULE_INTERVIEW)
  if (pathname === "/api/interviews/assign" && method === "POST") {
    return sendJson(res, 200, {
      success: true,
      candidateId: body.candidateId || "CAND-201",
      interviewerId: body.interviewerId || "INTV-401",
      status: "ASSIGNED",
      assignedAt: new Date().toISOString()
    });
  }
  if (pathname === "/api/interviews") {
    if (method === "GET") return sendJson(res, 200, interviews);
    if (method === "POST") {
      const id = body.id || `INT-${interviews.length + 501}`;
      const newInt = {
        id,
        ...body,
        scheduledAt: body.scheduledAt || new Date(Date.now() + 86400000 * 2).toISOString(),
        meetLink: body.meetLink || `https://meet.google.com/abc-defg-hij`,
        status: "SCHEDULED"
      };
      interviews.push(newInt);
      return sendJson(res, 201, newInt);
    }
  }

  // 9. Onboarding tasks (CREATE_ONBOARDING_TASK)
  if (pathname === "/api/onboarding/tasks") {
    if (method === "GET") return sendJson(res, 200, onboardingTasks);
    if (method === "POST") {
      const id = body.id || `TSK-${onboardingTasks.length + 601}`;
      const newTask = {
        id,
        ...body,
        dueDate: body.dueDate || new Date(Date.now() + 86400000 * 7).toISOString(),
        status: "PENDING"
      };
      onboardingTasks.push(newTask);
      return sendJson(res, 201, newTask);
    }
  }

  return sendJson(res, 404, { error: `Endpoint ${method} ${pathname} not found` });
});

server.listen(PORT, () => {
  console.log(`HR Mock Domain API running on http://localhost:${PORT}`);
  console.log(`Active emails: beheratusharkanta27@gmail.com, t98531818@gmail.com, 2301020601@cgu-odisha.ac.in`);
});
