using System.Text.Json.Serialization;

namespace HrApi.Models;

public class Employee
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("department")]
    public string Department { get; set; } = string.Empty;

    [JsonPropertyName("position")]
    public string Position { get; set; } = string.Empty;

    [JsonPropertyName("salary")]
    public decimal Salary { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "ACTIVE";

    [JsonPropertyName("joinedAt")]
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}

public class AttendanceRecord
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("employeeId")]
    public string EmployeeId { get; set; } = string.Empty;

    [JsonPropertyName("employeeName")]
    public string EmployeeName { get; set; } = string.Empty;

    [JsonPropertyName("employeeEmail")]
    public string EmployeeEmail { get; set; } = string.Empty;

    [JsonPropertyName("department")]
    public string Department { get; set; } = string.Empty;

    [JsonPropertyName("period")]
    public string Period { get; set; } = string.Empty;

    [JsonPropertyName("daysPresent")]
    public int DaysPresent { get; set; }

    [JsonPropertyName("totalDays")]
    public int TotalDays { get; set; }

    [JsonPropertyName("attendanceRate")]
    public double AttendanceRate { get; set; }

    [JsonPropertyName("isBelowThreshold")]
    public bool IsBelowThreshold { get; set; }

    [JsonPropertyName("remarks")]
    public string Remarks { get; set; } = string.Empty;
}

public class LeaveRecord
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("employeeId")]
    public string EmployeeId { get; set; } = string.Empty;

    [JsonPropertyName("employeeName")]
    public string EmployeeName { get; set; } = string.Empty;

    [JsonPropertyName("employeeEmail")]
    public string EmployeeEmail { get; set; } = string.Empty;

    [JsonPropertyName("leaveType")]
    public string LeaveType { get; set; } = "ANNUAL";

    [JsonPropertyName("startDate")]
    public DateTime StartDate { get; set; }

    [JsonPropertyName("endDate")]
    public DateTime EndDate { get; set; }

    [JsonPropertyName("days")]
    public int Days { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "APPROVED";

    [JsonPropertyName("reason")]
    public string Reason { get; set; } = string.Empty;
}

public class Candidate
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("role")]
    public string Role { get; set; } = string.Empty;

    [JsonPropertyName("department")]
    public string Department { get; set; } = string.Empty;

    [JsonPropertyName("stage")]
    public string Stage { get; set; } = "APPLIED";

    [JsonPropertyName("status")]
    public string Status { get; set; } = "PENDING";

    [JsonPropertyName("resumeUrl")]
    public string ResumeUrl { get; set; } = string.Empty;

    [JsonPropertyName("appliedAt")]
    public DateTime AppliedAt { get; set; } = DateTime.UtcNow;
}

public class AssessmentResult
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("candidateId")]
    public string CandidateId { get; set; } = string.Empty;

    [JsonPropertyName("candidateName")]
    public string CandidateName { get; set; } = string.Empty;

    [JsonPropertyName("candidateEmail")]
    public string CandidateEmail { get; set; } = string.Empty;

    [JsonPropertyName("testName")]
    public string TestName { get; set; } = string.Empty;

    [JsonPropertyName("score")]
    public int Score { get; set; }

    [JsonPropertyName("totalScore")]
    public int TotalScore { get; set; }

    [JsonPropertyName("percentage")]
    public double Percentage { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "PASSED";

    [JsonPropertyName("feedback")]
    public string Feedback { get; set; } = string.Empty;

    [JsonPropertyName("completedAt")]
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
}

public class Interviewer
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("department")]
    public string Department { get; set; } = string.Empty;

    [JsonPropertyName("role")]
    public string Role { get; set; } = string.Empty;

    [JsonPropertyName("isAvailable")]
    public bool IsAvailable { get; set; } = true;

    [JsonPropertyName("availableSlots")]
    public List<string> AvailableSlots { get; set; } = new();
}

public class InterviewSchedule
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("candidateId")]
    public string CandidateId { get; set; } = string.Empty;

    [JsonPropertyName("candidateName")]
    public string CandidateName { get; set; } = string.Empty;

    [JsonPropertyName("candidateEmail")]
    public string CandidateEmail { get; set; } = string.Empty;

    [JsonPropertyName("interviewerId")]
    public string InterviewerId { get; set; } = string.Empty;

    [JsonPropertyName("interviewerName")]
    public string InterviewerName { get; set; } = string.Empty;

    [JsonPropertyName("interviewerEmail")]
    public string InterviewerEmail { get; set; } = string.Empty;

    [JsonPropertyName("scheduledAt")]
    public DateTime ScheduledAt { get; set; }

    [JsonPropertyName("durationMinutes")]
    public int DurationMinutes { get; set; } = 45;

    [JsonPropertyName("meetLink")]
    public string MeetLink { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = "SCHEDULED";
}

public class OnboardingTask
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("employeeId")]
    public string EmployeeId { get; set; } = string.Empty;

    [JsonPropertyName("employeeName")]
    public string EmployeeName { get; set; } = string.Empty;

    [JsonPropertyName("employeeEmail")]
    public string EmployeeEmail { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("dueDate")]
    public DateTime DueDate { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "PENDING";
}

public class CandidateStatusUpdateDto
{
    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("stage")]
    public string? Stage { get; set; }
}

public class EmployeeUpdateDto
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("department")]
    public string? Department { get; set; }

    [JsonPropertyName("position")]
    public string? Position { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("salary")]
    public decimal? Salary { get; set; }
}

public class AssignInterviewerDto
{
    [JsonPropertyName("candidateId")]
    public string? CandidateId { get; set; }

    [JsonPropertyName("interviewerId")]
    public string? InterviewerId { get; set; }
}

