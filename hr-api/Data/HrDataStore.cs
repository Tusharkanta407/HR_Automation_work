using System.Collections.Concurrent;
using HrApi.Models;
using Npgsql;

namespace HrApi.Data;

public class HrDataStore
{
    private readonly string? _connectionString;
    private readonly ILogger<HrDataStore> _logger;

    public ConcurrentDictionary<string, Employee> Employees { get; } = new();
    public ConcurrentDictionary<string, AttendanceRecord> Attendance { get; } = new();
    public ConcurrentDictionary<string, LeaveRecord> Leaves { get; } = new();
    public ConcurrentDictionary<string, Candidate> Candidates { get; } = new();
    public ConcurrentDictionary<string, AssessmentResult> Assessments { get; } = new();
    public ConcurrentDictionary<string, Interviewer> Interviewers { get; } = new();
    public ConcurrentDictionary<string, InterviewSchedule> Interviews { get; } = new();
    public ConcurrentDictionary<string, OnboardingTask> OnboardingTasks { get; } = new();

    public HrDataStore(IConfiguration configuration, ILogger<HrDataStore> logger)
    {
        _logger = logger;
        var rawUrl = configuration["DATABASE_URL"] 
            ?? Environment.GetEnvironmentVariable("DATABASE_URL")
            ?? configuration.GetConnectionString("DefaultConnection");

        _connectionString = ConvertPostgresUriToConnectionString(rawUrl);

        // Seed default in-memory dataset
        SeedDefaultData();

        // Initialize Postgres schema and sync
        if (!string.IsNullOrWhiteSpace(_connectionString))
        {
            Task.Run(InitializeDatabaseAsync);
        }
    }

    private static string? ConvertPostgresUriToConnectionString(string? uriString)
    {
        if (string.IsNullOrWhiteSpace(uriString)) return null;
        if (!uriString.StartsWith("postgresql://") && !uriString.StartsWith("postgres://"))
        {
            return uriString;
        }

        try
        {
            var uri = new Uri(uriString);
            var userInfo = uri.UserInfo.Split(':');
            var user = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : "";
            var pass = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
            var host = uri.Host;
            var port = uri.Port > 0 ? uri.Port : 5432;
            var db = uri.AbsolutePath.TrimStart('/');

            var builder = new NpgsqlConnectionStringBuilder
            {
                Host = host,
                Port = port,
                Database = db,
                Username = user,
                Password = pass,
                SslMode = SslMode.Require
            };
            return builder.ConnectionString;
        }
        catch
        {
            return uriString;
        }
    }

    private void SeedDefaultData()
    {
        // ── 1. Employees (including the 3 required emails) ──
        var emp1 = new Employee
        {
            Id = "EMP-101",
            Name = "Tusharkanta Behera",
            Email = "beheratusharkanta27@gmail.com",
            Department = "Engineering",
            Position = "Senior Full Stack Engineer",
            Salary = 125000,
            Status = "ACTIVE",
            JoinedAt = DateTime.UtcNow.AddMonths(-18)
        };
        var emp2 = new Employee
        {
            Id = "EMP-102",
            Name = "Tushar B",
            Email = "t98531818@gmail.com",
            Department = "DevOps & Cloud",
            Position = "Staff Platform Specialist",
            Salary = 135000,
            Status = "ACTIVE",
            JoinedAt = DateTime.UtcNow.AddMonths(-12)
        };
        var emp3 = new Employee
        {
            Id = "EMP-103",
            Name = "Tusharkanta (CGU)",
            Email = "2301020601@cgu-odisha.ac.in",
            Department = "AI Research",
            Position = "AI Solutions Developer",
            Salary = 110000,
            Status = "ACTIVE",
            JoinedAt = DateTime.UtcNow.AddMonths(-6)
        };
        var emp4 = new Employee
        {
            Id = "EMP-104",
            Name = "Priya Sharma",
            Email = "priya.sharma@example.com",
            Department = "Product",
            Position = "Senior Product Manager",
            Salary = 120000,
            Status = "ACTIVE",
            JoinedAt = DateTime.UtcNow.AddMonths(-24)
        };
        var emp5 = new Employee
        {
            Id = "EMP-105",
            Name = "Amit Patel",
            Email = "amit.patel@example.com",
            Department = "Engineering",
            Position = "Backend Developer",
            Salary = 95000,
            Status = "ACTIVE",
            JoinedAt = DateTime.UtcNow.AddMonths(-9)
        };

        Employees[emp1.Id] = emp1;
        Employees[emp2.Id] = emp2;
        Employees[emp3.Id] = emp3;
        Employees[emp4.Id] = emp4;
        Employees[emp5.Id] = emp5;

        // ── 2. Attendance Records (emp1 & emp3 have <75% to trigger workflow conditions!) ──
        var att1 = new AttendanceRecord
        {
            Id = "ATT-001",
            EmployeeId = emp1.Id,
            EmployeeName = emp1.Name,
            EmployeeEmail = emp1.Email,
            Department = emp1.Department,
            Period = "2026-09",
            DaysPresent = 15,
            TotalDays = 22,
            AttendanceRate = 68.18, // < 75% -> triggers low attendance alert
            IsBelowThreshold = true,
            Remarks = "Medical leaves and remote travel"
        };
        var att2 = new AttendanceRecord
        {
            Id = "ATT-002",
            EmployeeId = emp2.Id,
            EmployeeName = emp2.Name,
            EmployeeEmail = emp2.Email,
            Department = emp2.Department,
            Period = "2026-09",
            DaysPresent = 21,
            TotalDays = 22,
            AttendanceRate = 95.45,
            IsBelowThreshold = false,
            Remarks = "Excellent consistency"
        };
        var att3 = new AttendanceRecord
        {
            Id = "ATT-003",
            EmployeeId = emp3.Id,
            EmployeeName = emp3.Name,
            EmployeeEmail = emp3.Email,
            Department = emp3.Department,
            Period = "2026-09",
            DaysPresent = 16,
            TotalDays = 22,
            AttendanceRate = 72.72, // < 75% -> triggers low attendance alert
            IsBelowThreshold = true,
            Remarks = "Exam session participation"
        };
        var att4 = new AttendanceRecord
        {
            Id = "ATT-004",
            EmployeeId = emp4.Id,
            EmployeeName = emp4.Name,
            EmployeeEmail = emp4.Email,
            Department = emp4.Department,
            Period = "2026-09",
            DaysPresent = 20,
            TotalDays = 22,
            AttendanceRate = 90.91,
            IsBelowThreshold = false,
            Remarks = "On track"
        };

        Attendance[att1.Id] = att1;
        Attendance[att2.Id] = att2;
        Attendance[att3.Id] = att3;
        Attendance[att4.Id] = att4;

        // ── 3. Leave Records ──
        var l1 = new LeaveRecord
        {
            Id = "LEV-001",
            EmployeeId = emp1.Id,
            EmployeeName = emp1.Name,
            EmployeeEmail = emp1.Email,
            LeaveType = "SICK",
            StartDate = DateTime.UtcNow.AddDays(-14),
            EndDate = DateTime.UtcNow.AddDays(-11),
            Days = 3,
            Status = "APPROVED",
            Reason = "Viral recovery"
        };
        var l2 = new LeaveRecord
        {
            Id = "LEV-002",
            EmployeeId = emp3.Id,
            EmployeeName = emp3.Name,
            EmployeeEmail = emp3.Email,
            LeaveType = "CASUAL",
            StartDate = DateTime.UtcNow.AddDays(-5),
            EndDate = DateTime.UtcNow.AddDays(-3),
            Days = 2,
            Status = "APPROVED",
            Reason = "Academic seminar"
        };
        Leaves[l1.Id] = l1;
        Leaves[l2.Id] = l2;

        // ── 4. Candidates ──
        var cand1 = new Candidate
        {
            Id = "CAND-201",
            Name = "Tusharkanta Behera",
            Email = "beheratusharkanta27@gmail.com",
            Role = "Lead Automation Architect",
            Department = "Engineering",
            Stage = "INTERVIEW",
            Status = "ACTIVE",
            ResumeUrl = "https://drive.google.com/file/d/demo-resume-1",
            AppliedAt = DateTime.UtcNow.AddDays(-20)
        };
        var cand2 = new Candidate
        {
            Id = "CAND-202",
            Name = "Tushar B",
            Email = "t98531818@gmail.com",
            Role = "Senior Cloud Architect",
            Department = "Cloud Operations",
            Stage = "ASSESSMENT",
            Status = "ACTIVE",
            ResumeUrl = "https://drive.google.com/file/d/demo-resume-2",
            AppliedAt = DateTime.UtcNow.AddDays(-15)
        };
        var cand3 = new Candidate
        {
            Id = "CAND-203",
            Name = "Tusharkanta (CGU)",
            Email = "2301020601@cgu-odisha.ac.in",
            Role = "AI Engineer",
            Department = "AI Research",
            Stage = "OFFER",
            Status = "ACTIVE",
            ResumeUrl = "https://drive.google.com/file/d/demo-resume-3",
            AppliedAt = DateTime.UtcNow.AddDays(-25)
        };
        var cand4 = new Candidate
        {
            Id = "CAND-204",
            Name = "Sneha Roy",
            Email = "sneha.roy@example.com",
            Role = "Frontend Developer",
            Department = "Engineering",
            Stage = "APPLIED",
            Status = "PENDING",
            ResumeUrl = "https://drive.google.com/file/d/demo-resume-4",
            AppliedAt = DateTime.UtcNow.AddDays(-2)
        };

        Candidates[cand1.Id] = cand1;
        Candidates[cand2.Id] = cand2;
        Candidates[cand3.Id] = cand3;
        Candidates[cand4.Id] = cand4;

        // ── 5. Assessment Results ──
        var ass1 = new AssessmentResult
        {
            Id = "ASS-301",
            CandidateId = cand1.Id,
            CandidateName = cand1.Name,
            CandidateEmail = cand1.Email,
            TestName = "Full Stack Architecture & Workflow Engineering",
            Score = 96,
            TotalScore = 100,
            Percentage = 96.0,
            Status = "PASSED",
            Feedback = "Exceptional system design and async orchestration skills",
            CompletedAt = DateTime.UtcNow.AddDays(-10)
        };
        var ass2 = new AssessmentResult
        {
            Id = "ASS-302",
            CandidateId = cand2.Id,
            CandidateName = cand2.Name,
            CandidateEmail = cand2.Email,
            TestName = "Cloud Infrastructure & High Availability",
            Score = 92,
            TotalScore = 100,
            Percentage = 92.0,
            Status = "PASSED",
            Feedback = "Strong knowledge of Kubernetes, Redis and distributed workers",
            CompletedAt = DateTime.UtcNow.AddDays(-8)
        };
        var ass3 = new AssessmentResult
        {
            Id = "ASS-303",
            CandidateId = cand3.Id,
            CandidateName = cand3.Name,
            CandidateEmail = cand3.Email,
            TestName = "LLM Integration & Agentic Systems",
            Score = 94,
            TotalScore = 100,
            Percentage = 94.0,
            Status = "PASSED",
            Feedback = "Mastery in tool calling, OAuth scopes, and prompt safety",
            CompletedAt = DateTime.UtcNow.AddDays(-12)
        };

        Assessments[ass1.Id] = ass1;
        Assessments[ass2.Id] = ass2;
        Assessments[ass3.Id] = ass3;

        // ── 6. Interviewers ──
        var intv1 = new Interviewer
        {
            Id = "INTV-401",
            Name = "Tusharkanta Behera",
            Email = "beheratusharkanta27@gmail.com",
            Department = "Engineering",
            Role = "Lead Tech Interviewer",
            IsAvailable = true,
            AvailableSlots = new() { "2026-10-05T10:00:00Z", "2026-10-05T14:00:00Z", "2026-10-06T11:00:00Z" }
        };
        var intv2 = new Interviewer
        {
            Id = "INTV-402",
            Name = "Tushar B",
            Email = "t98531818@gmail.com",
            Department = "Architecture",
            Role = "System Design Interviewer",
            IsAvailable = true,
            AvailableSlots = new() { "2026-10-05T15:00:00Z", "2026-10-06T16:00:00Z" }
        };
        var intv3 = new Interviewer
        {
            Id = "INTV-403",
            Name = "Tusharkanta (CGU)",
            Email = "2301020601@cgu-odisha.ac.in",
            Department = "AI Research",
            Role = "AI & ML Interviewer",
            IsAvailable = true,
            AvailableSlots = new() { "2026-10-06T09:00:00Z", "2026-10-07T14:00:00Z" }
        };

        Interviewers[intv1.Id] = intv1;
        Interviewers[intv2.Id] = intv2;
        Interviewers[intv3.Id] = intv3;

        // ── 7. Scheduled Interviews ──
        var sch1 = new InterviewSchedule
        {
            Id = "INT-501",
            CandidateId = cand1.Id,
            CandidateName = cand1.Name,
            CandidateEmail = cand1.Email,
            InterviewerId = intv2.Id,
            InterviewerName = intv2.Name,
            InterviewerEmail = intv2.Email,
            ScheduledAt = DateTime.UtcNow.AddDays(2),
            DurationMinutes = 45,
            MeetLink = "https://meet.google.com/abc-defg-hij",
            Status = "SCHEDULED"
        };
        Interviews[sch1.Id] = sch1;

        // ── 8. Onboarding Tasks ──
        var onb1 = new OnboardingTask
        {
            Id = "TSK-601",
            EmployeeId = emp1.Id,
            EmployeeName = emp1.Name,
            EmployeeEmail = emp1.Email,
            Title = "Complete Security & Compliance Training",
            Description = "Review company security handbook and complete 2FA setup.",
            DueDate = DateTime.UtcNow.AddDays(5),
            Status = "COMPLETED"
        };
        var onb2 = new OnboardingTask
        {
            Id = "TSK-602",
            EmployeeId = emp2.Id,
            EmployeeName = emp2.Name,
            EmployeeEmail = emp2.Email,
            Title = "Set up Production Cloud Access Keys",
            Description = "Configure IAM credentials and workstation VPN.",
            DueDate = DateTime.UtcNow.AddDays(3),
            Status = "IN_PROGRESS"
        };
        var onb3 = new OnboardingTask
        {
            Id = "TSK-603",
            EmployeeId = emp3.Id,
            EmployeeName = emp3.Name,
            EmployeeEmail = emp3.Email,
            Title = "Submit Academic Degree Verification",
            Description = "Upload official transcript to HR portal.",
            DueDate = DateTime.UtcNow.AddDays(7),
            Status = "PENDING"
        };

        OnboardingTasks[onb1.Id] = onb1;
        OnboardingTasks[onb2.Id] = onb2;
        OnboardingTasks[onb3.Id] = onb3;
    }

    private async Task InitializeDatabaseAsync()
    {
        try
        {
            _logger.LogInformation("Initializing Neon PostgreSQL HR mock tables...");
            await using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            var ddl = @"
                CREATE TABLE IF NOT EXISTS hr_employees (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    department TEXT,
                    position TEXT,
                    salary NUMERIC,
                    status TEXT DEFAULT 'ACTIVE',
                    joined_at TIMESTAMPTZ DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS hr_attendance (
                    id TEXT PRIMARY KEY,
                    employee_id TEXT NOT NULL,
                    employee_name TEXT,
                    employee_email TEXT,
                    department TEXT,
                    period TEXT NOT NULL,
                    days_present INT,
                    total_days INT,
                    attendance_rate NUMERIC,
                    is_below_threshold BOOLEAN,
                    remarks TEXT
                );

                CREATE TABLE IF NOT EXISTS hr_leaves (
                    id TEXT PRIMARY KEY,
                    employee_id TEXT NOT NULL,
                    employee_name TEXT,
                    employee_email TEXT,
                    leave_type TEXT,
                    start_date TIMESTAMPTZ,
                    end_date TIMESTAMPTZ,
                    days INT,
                    status TEXT,
                    reason TEXT
                );

                CREATE TABLE IF NOT EXISTS hr_candidates (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    role TEXT,
                    department TEXT,
                    stage TEXT,
                    status TEXT,
                    resume_url TEXT,
                    applied_at TIMESTAMPTZ DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS hr_assessments (
                    id TEXT PRIMARY KEY,
                    candidate_id TEXT,
                    candidate_name TEXT,
                    candidate_email TEXT,
                    test_name TEXT,
                    score INT,
                    total_score INT,
                    percentage NUMERIC,
                    status TEXT,
                    feedback TEXT,
                    completed_at TIMESTAMPTZ DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS hr_interviewers (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    department TEXT,
                    role TEXT,
                    is_available BOOLEAN,
                    available_slots TEXT
                );

                CREATE TABLE IF NOT EXISTS hr_interviews (
                    id TEXT PRIMARY KEY,
                    candidate_id TEXT,
                    candidate_name TEXT,
                    candidate_email TEXT,
                    interviewer_id TEXT,
                    interviewer_name TEXT,
                    interviewer_email TEXT,
                    scheduled_at TIMESTAMPTZ,
                    duration_minutes INT,
                    meet_link TEXT,
                    status TEXT
                );

                CREATE TABLE IF NOT EXISTS hr_onboarding_tasks (
                    id TEXT PRIMARY KEY,
                    employee_id TEXT,
                    employee_name TEXT,
                    employee_email TEXT,
                    title TEXT,
                    description TEXT,
                    due_date TIMESTAMPTZ,
                    status TEXT
                );
            ";

            await using (var cmd = new NpgsqlCommand(ddl, conn))
            {
                await cmd.ExecuteNonQueryAsync();
            }

            _logger.LogInformation("Neon PostgreSQL tables initialized successfully. Checking seed data...");

            // 1. Seed or Load Employees
            await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM hr_employees", conn))
            {
                var count = Convert.ToInt64(await cmd.ExecuteScalarAsync());
                if (count == 0)
                {
                    foreach (var emp in Employees.Values)
                    {
                        var insertSql = @"INSERT INTO hr_employees (id, name, email, department, position, salary, status, joined_at)
                                          VALUES (@id, @name, @email, @department, @position, @salary, @status, @joined_at)
                                          ON CONFLICT (id) DO NOTHING;";
                        await using var insCmd = new NpgsqlCommand(insertSql, conn);
                        insCmd.Parameters.AddWithValue("id", emp.Id);
                        insCmd.Parameters.AddWithValue("name", emp.Name);
                        insCmd.Parameters.AddWithValue("email", emp.Email);
                        insCmd.Parameters.AddWithValue("department", (object?)emp.Department ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("position", (object?)emp.Position ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("salary", emp.Salary);
                        insCmd.Parameters.AddWithValue("status", emp.Status);
                        insCmd.Parameters.AddWithValue("joined_at", emp.JoinedAt);
                        await insCmd.ExecuteNonQueryAsync();
                    }
                }
                else
                {
                    await using var loadCmd = new NpgsqlCommand("SELECT id, name, email, department, position, salary, status, joined_at FROM hr_employees", conn);
                    await using var reader = await loadCmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        var emp = new Employee
                        {
                            Id = reader.GetString(0),
                            Name = reader.GetString(1),
                            Email = reader.GetString(2),
                            Department = reader.IsDBNull(3) ? "" : reader.GetString(3),
                            Position = reader.IsDBNull(4) ? "" : reader.GetString(4),
                            Salary = reader.IsDBNull(5) ? 0 : reader.GetDecimal(5),
                            Status = reader.IsDBNull(6) ? "ACTIVE" : reader.GetString(6),
                            JoinedAt = reader.IsDBNull(7) ? DateTime.UtcNow : reader.GetDateTime(7)
                        };
                        Employees[emp.Id] = emp;
                    }
                }
            }

            // 2. Seed or Load Attendance
            await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM hr_attendance", conn))
            {
                var count = Convert.ToInt64(await cmd.ExecuteScalarAsync());
                if (count == 0)
                {
                    foreach (var att in Attendance.Values)
                    {
                        var insertSql = @"INSERT INTO hr_attendance (id, employee_id, employee_name, employee_email, department, period, days_present, total_days, attendance_rate, is_below_threshold, remarks)
                                          VALUES (@id, @employee_id, @employee_name, @employee_email, @department, @period, @days_present, @total_days, @attendance_rate, @is_below_threshold, @remarks)
                                          ON CONFLICT (id) DO NOTHING;";
                        await using var insCmd = new NpgsqlCommand(insertSql, conn);
                        insCmd.Parameters.AddWithValue("id", att.Id);
                        insCmd.Parameters.AddWithValue("employee_id", att.EmployeeId);
                        insCmd.Parameters.AddWithValue("employee_name", (object?)att.EmployeeName ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("employee_email", (object?)att.EmployeeEmail ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("department", (object?)att.Department ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("period", att.Period);
                        insCmd.Parameters.AddWithValue("days_present", att.DaysPresent);
                        insCmd.Parameters.AddWithValue("total_days", att.TotalDays);
                        insCmd.Parameters.AddWithValue("attendance_rate", (decimal)att.AttendanceRate);
                        insCmd.Parameters.AddWithValue("is_below_threshold", att.IsBelowThreshold);
                        insCmd.Parameters.AddWithValue("remarks", (object?)att.Remarks ?? DBNull.Value);
                        await insCmd.ExecuteNonQueryAsync();
                    }
                }
                else
                {
                    await using var loadCmd = new NpgsqlCommand("SELECT id, employee_id, employee_name, employee_email, department, period, days_present, total_days, attendance_rate, is_below_threshold, remarks FROM hr_attendance", conn);
                    await using var reader = await loadCmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        var att = new AttendanceRecord
                        {
                            Id = reader.GetString(0),
                            EmployeeId = reader.GetString(1),
                            EmployeeName = reader.IsDBNull(2) ? "" : reader.GetString(2),
                            EmployeeEmail = reader.IsDBNull(3) ? "" : reader.GetString(3),
                            Department = reader.IsDBNull(4) ? "" : reader.GetString(4),
                            Period = reader.GetString(5),
                            DaysPresent = reader.IsDBNull(6) ? 0 : reader.GetInt32(6),
                            TotalDays = reader.IsDBNull(7) ? 0 : reader.GetInt32(7),
                            AttendanceRate = reader.IsDBNull(8) ? 0 : Convert.ToDouble(reader.GetDecimal(8)),
                            IsBelowThreshold = !reader.IsDBNull(9) && reader.GetBoolean(9),
                            Remarks = reader.IsDBNull(10) ? "" : reader.GetString(10)
                        };
                        Attendance[att.Id] = att;
                    }
                }
            }

            // 3. Seed or Load Leaves
            await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM hr_leaves", conn))
            {
                var count = Convert.ToInt64(await cmd.ExecuteScalarAsync());
                if (count == 0)
                {
                    foreach (var l in Leaves.Values)
                    {
                        var insertSql = @"INSERT INTO hr_leaves (id, employee_id, employee_name, employee_email, leave_type, start_date, end_date, days, status, reason)
                                          VALUES (@id, @employee_id, @employee_name, @employee_email, @leave_type, @start_date, @end_date, @days, @status, @reason)
                                          ON CONFLICT (id) DO NOTHING;";
                        await using var insCmd = new NpgsqlCommand(insertSql, conn);
                        insCmd.Parameters.AddWithValue("id", l.Id);
                        insCmd.Parameters.AddWithValue("employee_id", l.EmployeeId);
                        insCmd.Parameters.AddWithValue("employee_name", (object?)l.EmployeeName ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("employee_email", (object?)l.EmployeeEmail ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("leave_type", (object?)l.LeaveType ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("start_date", l.StartDate);
                        insCmd.Parameters.AddWithValue("end_date", l.EndDate);
                        insCmd.Parameters.AddWithValue("days", l.Days);
                        insCmd.Parameters.AddWithValue("status", (object?)l.Status ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("reason", (object?)l.Reason ?? DBNull.Value);
                        await insCmd.ExecuteNonQueryAsync();
                    }
                }
                else
                {
                    await using var loadCmd = new NpgsqlCommand("SELECT id, employee_id, employee_name, employee_email, leave_type, start_date, end_date, days, status, reason FROM hr_leaves", conn);
                    await using var reader = await loadCmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        var l = new LeaveRecord
                        {
                            Id = reader.GetString(0),
                            EmployeeId = reader.GetString(1),
                            EmployeeName = reader.IsDBNull(2) ? "" : reader.GetString(2),
                            EmployeeEmail = reader.IsDBNull(3) ? "" : reader.GetString(3),
                            LeaveType = reader.IsDBNull(4) ? "ANNUAL" : reader.GetString(4),
                            StartDate = reader.IsDBNull(5) ? DateTime.UtcNow : reader.GetDateTime(5),
                            EndDate = reader.IsDBNull(6) ? DateTime.UtcNow : reader.GetDateTime(6),
                            Days = reader.IsDBNull(7) ? 0 : reader.GetInt32(7),
                            Status = reader.IsDBNull(8) ? "APPROVED" : reader.GetString(8),
                            Reason = reader.IsDBNull(9) ? "" : reader.GetString(9)
                        };
                        Leaves[l.Id] = l;
                    }
                }
            }

            // 4. Seed or Load Candidates
            await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM hr_candidates", conn))
            {
                var count = Convert.ToInt64(await cmd.ExecuteScalarAsync());
                if (count == 0)
                {
                    foreach (var c in Candidates.Values)
                    {
                        var insertSql = @"INSERT INTO hr_candidates (id, name, email, role, department, stage, status, resume_url, applied_at)
                                          VALUES (@id, @name, @email, @role, @department, @stage, @status, @resume_url, @applied_at)
                                          ON CONFLICT (id) DO NOTHING;";
                        await using var insCmd = new NpgsqlCommand(insertSql, conn);
                        insCmd.Parameters.AddWithValue("id", c.Id);
                        insCmd.Parameters.AddWithValue("name", c.Name);
                        insCmd.Parameters.AddWithValue("email", c.Email);
                        insCmd.Parameters.AddWithValue("role", (object?)c.Role ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("department", (object?)c.Department ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("stage", (object?)c.Stage ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("status", (object?)c.Status ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("resume_url", (object?)c.ResumeUrl ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("applied_at", c.AppliedAt);
                        await insCmd.ExecuteNonQueryAsync();
                    }
                }
                else
                {
                    await using var loadCmd = new NpgsqlCommand("SELECT id, name, email, role, department, stage, status, resume_url, applied_at FROM hr_candidates", conn);
                    await using var reader = await loadCmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        var c = new Candidate
                        {
                            Id = reader.GetString(0),
                            Name = reader.GetString(1),
                            Email = reader.GetString(2),
                            Role = reader.IsDBNull(3) ? "" : reader.GetString(3),
                            Department = reader.IsDBNull(4) ? "" : reader.GetString(4),
                            Stage = reader.IsDBNull(5) ? "APPLIED" : reader.GetString(5),
                            Status = reader.IsDBNull(6) ? "ACTIVE" : reader.GetString(6),
                            ResumeUrl = reader.IsDBNull(7) ? "" : reader.GetString(7),
                            AppliedAt = reader.IsDBNull(8) ? DateTime.UtcNow : reader.GetDateTime(8)
                        };
                        Candidates[c.Id] = c;
                    }
                }
            }

            // 5. Seed or Load Assessments
            await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM hr_assessments", conn))
            {
                var count = Convert.ToInt64(await cmd.ExecuteScalarAsync());
                if (count == 0)
                {
                    foreach (var a in Assessments.Values)
                    {
                        var insertSql = @"INSERT INTO hr_assessments (id, candidate_id, candidate_name, candidate_email, test_name, score, total_score, percentage, status, feedback, completed_at)
                                          VALUES (@id, @candidate_id, @candidate_name, @candidate_email, @test_name, @score, @total_score, @percentage, @status, @feedback, @completed_at)
                                          ON CONFLICT (id) DO NOTHING;";
                        await using var insCmd = new NpgsqlCommand(insertSql, conn);
                        insCmd.Parameters.AddWithValue("id", a.Id);
                        insCmd.Parameters.AddWithValue("candidate_id", (object?)a.CandidateId ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("candidate_name", (object?)a.CandidateName ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("candidate_email", (object?)a.CandidateEmail ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("test_name", (object?)a.TestName ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("score", a.Score);
                        insCmd.Parameters.AddWithValue("total_score", a.TotalScore);
                        insCmd.Parameters.AddWithValue("percentage", (decimal)a.Percentage);
                        insCmd.Parameters.AddWithValue("status", (object?)a.Status ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("feedback", (object?)a.Feedback ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("completed_at", a.CompletedAt);
                        await insCmd.ExecuteNonQueryAsync();
                    }
                }
                else
                {
                    await using var loadCmd = new NpgsqlCommand("SELECT id, candidate_id, candidate_name, candidate_email, test_name, score, total_score, percentage, status, feedback, completed_at FROM hr_assessments", conn);
                    await using var reader = await loadCmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        var a = new AssessmentResult
                        {
                            Id = reader.GetString(0),
                            CandidateId = reader.IsDBNull(1) ? "" : reader.GetString(1),
                            CandidateName = reader.IsDBNull(2) ? "" : reader.GetString(2),
                            CandidateEmail = reader.IsDBNull(3) ? "" : reader.GetString(3),
                            TestName = reader.IsDBNull(4) ? "" : reader.GetString(4),
                            Score = reader.IsDBNull(5) ? 0 : reader.GetInt32(5),
                            TotalScore = reader.IsDBNull(6) ? 0 : reader.GetInt32(6),
                            Percentage = reader.IsDBNull(7) ? 0 : Convert.ToDouble(reader.GetDecimal(7)),
                            Status = reader.IsDBNull(8) ? "PASSED" : reader.GetString(8),
                            Feedback = reader.IsDBNull(9) ? "" : reader.GetString(9),
                            CompletedAt = reader.IsDBNull(10) ? DateTime.UtcNow : reader.GetDateTime(10)
                        };
                        Assessments[a.Id] = a;
                    }
                }
            }

            // 6. Seed or Load Interviewers
            await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM hr_interviewers", conn))
            {
                var count = Convert.ToInt64(await cmd.ExecuteScalarAsync());
                if (count == 0)
                {
                    foreach (var i in Interviewers.Values)
                    {
                        var insertSql = @"INSERT INTO hr_interviewers (id, name, email, department, role, is_available, available_slots)
                                          VALUES (@id, @name, @email, @department, @role, @is_available, @available_slots)
                                          ON CONFLICT (id) DO NOTHING;";
                        await using var insCmd = new NpgsqlCommand(insertSql, conn);
                        insCmd.Parameters.AddWithValue("id", i.Id);
                        insCmd.Parameters.AddWithValue("name", i.Name);
                        insCmd.Parameters.AddWithValue("email", i.Email);
                        insCmd.Parameters.AddWithValue("department", (object?)i.Department ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("role", (object?)i.Role ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("is_available", i.IsAvailable);
                        insCmd.Parameters.AddWithValue("available_slots", string.Join(";", i.AvailableSlots));
                        await insCmd.ExecuteNonQueryAsync();
                    }
                }
                else
                {
                    await using var loadCmd = new NpgsqlCommand("SELECT id, name, email, department, role, is_available, available_slots FROM hr_interviewers", conn);
                    await using var reader = await loadCmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        var slots = reader.IsDBNull(6) ? "" : reader.GetString(6);
                        var i = new Interviewer
                        {
                            Id = reader.GetString(0),
                            Name = reader.GetString(1),
                            Email = reader.GetString(2),
                            Department = reader.IsDBNull(3) ? "" : reader.GetString(3),
                            Role = reader.IsDBNull(4) ? "" : reader.GetString(4),
                            IsAvailable = !reader.IsDBNull(5) && reader.GetBoolean(5),
                            AvailableSlots = slots.Split(';', StringSplitOptions.RemoveEmptyEntries).ToList()
                        };
                        Interviewers[i.Id] = i;
                    }
                }
            }

            // 7. Seed or Load Interviews
            await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM hr_interviews", conn))
            {
                var count = Convert.ToInt64(await cmd.ExecuteScalarAsync());
                if (count == 0)
                {
                    foreach (var sch in Interviews.Values)
                    {
                        var insertSql = @"INSERT INTO hr_interviews (id, candidate_id, candidate_name, candidate_email, interviewer_id, interviewer_name, interviewer_email, scheduled_at, duration_minutes, meet_link, status)
                                          VALUES (@id, @candidate_id, @candidate_name, @candidate_email, @interviewer_id, @interviewer_name, @interviewer_email, @scheduled_at, @duration_minutes, @meet_link, @status)
                                          ON CONFLICT (id) DO NOTHING;";
                        await using var insCmd = new NpgsqlCommand(insertSql, conn);
                        insCmd.Parameters.AddWithValue("id", sch.Id);
                        insCmd.Parameters.AddWithValue("candidate_id", (object?)sch.CandidateId ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("candidate_name", (object?)sch.CandidateName ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("candidate_email", (object?)sch.CandidateEmail ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("interviewer_id", (object?)sch.InterviewerId ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("interviewer_name", (object?)sch.InterviewerName ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("interviewer_email", (object?)sch.InterviewerEmail ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("scheduled_at", sch.ScheduledAt);
                        insCmd.Parameters.AddWithValue("duration_minutes", sch.DurationMinutes);
                        insCmd.Parameters.AddWithValue("meet_link", (object?)sch.MeetLink ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("status", (object?)sch.Status ?? DBNull.Value);
                        await insCmd.ExecuteNonQueryAsync();
                    }
                }
                else
                {
                    await using var loadCmd = new NpgsqlCommand("SELECT id, candidate_id, candidate_name, candidate_email, interviewer_id, interviewer_name, interviewer_email, scheduled_at, duration_minutes, meet_link, status FROM hr_interviews", conn);
                    await using var reader = await loadCmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        var sch = new InterviewSchedule
                        {
                            Id = reader.GetString(0),
                            CandidateId = reader.IsDBNull(1) ? "" : reader.GetString(1),
                            CandidateName = reader.IsDBNull(2) ? "" : reader.GetString(2),
                            CandidateEmail = reader.IsDBNull(3) ? "" : reader.GetString(3),
                            InterviewerId = reader.IsDBNull(4) ? "" : reader.GetString(4),
                            InterviewerName = reader.IsDBNull(5) ? "" : reader.GetString(5),
                            InterviewerEmail = reader.IsDBNull(6) ? "" : reader.GetString(6),
                            ScheduledAt = reader.IsDBNull(7) ? DateTime.UtcNow : reader.GetDateTime(7),
                            DurationMinutes = reader.IsDBNull(8) ? 45 : reader.GetInt32(8),
                            MeetLink = reader.IsDBNull(9) ? "" : reader.GetString(9),
                            Status = reader.IsDBNull(10) ? "SCHEDULED" : reader.GetString(10)
                        };
                        Interviews[sch.Id] = sch;
                    }
                }
            }

            // 8. Seed or Load Onboarding Tasks
            await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM hr_onboarding_tasks", conn))
            {
                var count = Convert.ToInt64(await cmd.ExecuteScalarAsync());
                if (count == 0)
                {
                    foreach (var tsk in OnboardingTasks.Values)
                    {
                        var insertSql = @"INSERT INTO hr_onboarding_tasks (id, employee_id, employee_name, employee_email, title, description, due_date, status)
                                          VALUES (@id, @employee_id, @employee_name, @employee_email, @title, @description, @due_date, @status)
                                          ON CONFLICT (id) DO NOTHING;";
                        await using var insCmd = new NpgsqlCommand(insertSql, conn);
                        insCmd.Parameters.AddWithValue("id", tsk.Id);
                        insCmd.Parameters.AddWithValue("employee_id", (object?)tsk.EmployeeId ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("employee_name", (object?)tsk.EmployeeName ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("employee_email", (object?)tsk.EmployeeEmail ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("title", (object?)tsk.Title ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("description", (object?)tsk.Description ?? DBNull.Value);
                        insCmd.Parameters.AddWithValue("due_date", tsk.DueDate);
                        insCmd.Parameters.AddWithValue("status", (object?)tsk.Status ?? DBNull.Value);
                        await insCmd.ExecuteNonQueryAsync();
                    }
                }
                else
                {
                    await using var loadCmd = new NpgsqlCommand("SELECT id, employee_id, employee_name, employee_email, title, description, due_date, status FROM hr_onboarding_tasks", conn);
                    await using var reader = await loadCmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        var tsk = new OnboardingTask
                        {
                            Id = reader.GetString(0),
                            EmployeeId = reader.IsDBNull(1) ? "" : reader.GetString(1),
                            EmployeeName = reader.IsDBNull(2) ? "" : reader.GetString(2),
                            EmployeeEmail = reader.IsDBNull(3) ? "" : reader.GetString(3),
                            Title = reader.IsDBNull(4) ? "" : reader.GetString(4),
                            Description = reader.IsDBNull(5) ? "" : reader.GetString(5),
                            DueDate = reader.IsDBNull(6) ? DateTime.UtcNow : reader.GetDateTime(6),
                            Status = reader.IsDBNull(7) ? "PENDING" : reader.GetString(7)
                        };
                        OnboardingTasks[tsk.Id] = tsk;
                    }
                }
            }

            _logger.LogInformation("Neon PostgreSQL sync complete: Loaded {EmpCount} employees, {LeaveCount} leaves, {CandCount} candidates.",
                Employees.Count, Leaves.Count, Candidates.Count);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("PostgreSQL table init skipped: {Message}. Running with robust in-memory data store.", ex.Message);
        }
    }
}
