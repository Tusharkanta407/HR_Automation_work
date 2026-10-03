using Microsoft.AspNetCore.Mvc;
using HrApi.Data;
using HrApi.Models;

namespace HrApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AssessmentsController : ControllerBase
{
    private readonly HrDataStore _store;

    public AssessmentsController(HrDataStore store)
    {
        _store = store;
    }

    /// <summary>
    /// GET /api/assessments - List all assessments
    /// </summary>
    [HttpGet]
    public ActionResult<IEnumerable<AssessmentResult>> GetAssessments([FromQuery] string? status)
    {
        var query = _store.Assessments.Values.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(a => a.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
        }
        return Ok(query);
    }

    /// <summary>
    /// GET /api/assessments/{id} - Get assessment by ID or candidate ID (GET_ASSESSMENT_RESULT node)
    /// </summary>
    [HttpGet("{id}")]
    public ActionResult<AssessmentResult> GetAssessment(string id)
    {
        if (_store.Assessments.TryGetValue(id, out var result))
        {
            return Ok(result);
        }

        // Search by candidateId or candidate email
        var byCandidate = _store.Assessments.Values.FirstOrDefault(a => 
            a.CandidateId.Equals(id, StringComparison.OrdinalIgnoreCase) ||
            a.CandidateEmail.Equals(id, StringComparison.OrdinalIgnoreCase));

        if (byCandidate != null) return Ok(byCandidate);

        return NotFound(new { error = $"Assessment result '{id}' not found" });
    }

    [HttpPost]
    public ActionResult<AssessmentResult> RecordResult([FromBody] AssessmentResult input)
    {
        var id = string.IsNullOrWhiteSpace(input.Id) ? $"ASS-{_store.Assessments.Count + 301}" : input.Id;
        input.Id = id;
        if (input.TotalScore > 0)
        {
            input.Percentage = Math.Round((double)input.Score / input.TotalScore * 100, 2);
            input.Status = input.Percentage >= 70 ? "PASSED" : "FAILED";
        }
        _store.Assessments[id] = input;
        return CreatedAtAction(nameof(GetAssessment), new { id }, input);
    }
}
