using Microsoft.AspNetCore.Mvc;
using HrApi.Data;
using HrApi.Models;

namespace HrApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InterviewsController : ControllerBase
{
    private readonly HrDataStore _store;

    public InterviewsController(HrDataStore store)
    {
        _store = store;
    }

    /// <summary>
    /// GET /api/interviews - List scheduled interviews
    /// </summary>
    [HttpGet]
    public ActionResult<IEnumerable<InterviewSchedule>> GetInterviews()
    {
        return Ok(_store.Interviews.Values.OrderBy(i => i.ScheduledAt));
    }

    /// <summary>
    /// POST /api/interviews/assign - Assign an interviewer to a candidate (ASSIGN_INTERVIEWER node)
    /// </summary>
    [HttpPost("assign")]
    public ActionResult AssignInterviewer([FromBody] AssignInterviewerDto body)
    {
        string candidateId = body.CandidateId ?? "";
        string interviewerId = body.InterviewerId ?? "";

        // Resolve candidate
        _store.Candidates.TryGetValue(candidateId, out var cand);
        cand ??= _store.Candidates.Values.FirstOrDefault(c => c.Email.Equals(candidateId, StringComparison.OrdinalIgnoreCase));

        // Resolve interviewer
        _store.Interviewers.TryGetValue(interviewerId, out var intv);
        intv ??= _store.Interviewers.Values.FirstOrDefault(i => i.Email.Equals(interviewerId, StringComparison.OrdinalIgnoreCase) || i.IsAvailable);

        var assignment = new
        {
            success = true,
            candidateId = cand?.Id ?? candidateId,
            candidateName = cand?.Name ?? "Candidate",
            candidateEmail = cand?.Email ?? "candidate@example.com",
            interviewerId = intv?.Id ?? interviewerId,
            interviewerName = intv?.Name ?? "Interviewer",
            interviewerEmail = intv?.Email ?? "interviewer@example.com",
            status = "ASSIGNED",
            assignedAt = DateTime.UtcNow
        };

        return Ok(assignment);
    }

    /// <summary>
    /// POST /api/interviews - Schedule interview (SCHEDULE_INTERVIEW node)
    /// </summary>
    [HttpPost]
    public ActionResult<InterviewSchedule> ScheduleInterview([FromBody] InterviewSchedule input)
    {
        var id = string.IsNullOrWhiteSpace(input.Id) ? $"INT-{_store.Interviews.Count + 501}" : input.Id;
        input.Id = id;
        input.ScheduledAt = input.ScheduledAt == default ? DateTime.UtcNow.AddDays(2) : input.ScheduledAt;
        input.MeetLink = string.IsNullOrWhiteSpace(input.MeetLink) 
            ? $"https://meet.google.com/{Guid.NewGuid().ToString("N")[..10]}" 
            : input.MeetLink;
        input.Status = "SCHEDULED";

        _store.Interviews[id] = input;
        return Created($"/api/interviews/{id}", input);
    }
}
