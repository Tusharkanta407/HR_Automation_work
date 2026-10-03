using Microsoft.AspNetCore.Mvc;
using HrApi.Data;
using HrApi.Models;

namespace HrApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InterviewersController : ControllerBase
{
    private readonly HrDataStore _store;

    public InterviewersController(HrDataStore store)
    {
        _store = store;
    }

    /// <summary>
    /// GET /api/interviewers - List all interviewers (GET_INTERVIEWERS node)
    /// </summary>
    [HttpGet]
    public ActionResult<IEnumerable<Interviewer>> GetInterviewers([FromQuery] string? department, [FromQuery] bool? availableOnly)
    {
        var query = _store.Interviewers.Values.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(department))
        {
            query = query.Where(i => i.Department.Equals(department, StringComparison.OrdinalIgnoreCase));
        }

        if (availableOnly == true)
        {
            query = query.Where(i => i.IsAvailable);
        }

        return Ok(query);
    }

    /// <summary>
    /// GET /api/interviewers/availability - Check interviewer availability (GET_INTERVIEWER_AVAILABILITY node)
    /// </summary>
    [HttpGet("availability")]
    public ActionResult GetAvailability([FromQuery] string? interviewerId)
    {
        if (string.IsNullOrWhiteSpace(interviewerId))
        {
            // Return availability for all interviewers
            var all = _store.Interviewers.Values.Select(i => new
            {
                interviewerId = i.Id,
                name = i.Name,
                email = i.Email,
                isAvailable = i.IsAvailable,
                availableSlots = i.AvailableSlots
            });
            return Ok(all);
        }

        Interviewer? interviewer = null;
        if (!_store.Interviewers.TryGetValue(interviewerId, out interviewer))
        {
            interviewer = _store.Interviewers.Values.FirstOrDefault(i => 
                i.Email.Equals(interviewerId, StringComparison.OrdinalIgnoreCase));
        }

        if (interviewer == null)
        {
            return NotFound(new { error = $"Interviewer '{interviewerId}' not found" });
        }

        return Ok(new
        {
            interviewerId = interviewer.Id,
            name = interviewer.Name,
            email = interviewer.Email,
            isAvailable = interviewer.IsAvailable,
            availableSlots = interviewer.AvailableSlots,
            nextAvailableSlot = interviewer.AvailableSlots.FirstOrDefault()
        });
    }

    [HttpGet("{id}")]
    public ActionResult<Interviewer> GetById(string id)
    {
        if (_store.Interviewers.TryGetValue(id, out var interviewer))
        {
            return Ok(interviewer);
        }
        return NotFound(new { error = $"Interviewer '{id}' not found" });
    }
}
