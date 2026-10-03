using Microsoft.AspNetCore.Mvc;
using HrApi.Data;
using HrApi.Models;

namespace HrApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CandidatesController : ControllerBase
{
    private readonly HrDataStore _store;

    public CandidatesController(HrDataStore store)
    {
        _store = store;
    }

    /// <summary>
    /// GET /api/candidates - List all candidates (GET_CANDIDATES node)
    /// </summary>
    [HttpGet]
    public ActionResult<IEnumerable<Candidate>> GetCandidates([FromQuery] string? stage, [FromQuery] string? status)
    {
        var query = _store.Candidates.Values.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(stage))
        {
            query = query.Where(c => c.Stage.Equals(stage, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(c => c.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
        }

        return Ok(query.OrderBy(c => c.Id));
    }

    /// <summary>
    /// GET /api/candidates/{id} - Get single candidate (GET_CANDIDATE node)
    /// </summary>
    [HttpGet("{id}")]
    public ActionResult<Candidate> GetCandidate(string id)
    {
        if (_store.Candidates.TryGetValue(id, out var cand))
        {
            return Ok(cand);
        }

        var byEmail = _store.Candidates.Values.FirstOrDefault(c => 
            c.Email.Equals(id, StringComparison.OrdinalIgnoreCase));
        if (byEmail != null) return Ok(byEmail);

        return NotFound(new { error = $"Candidate '{id}' not found" });
    }

    /// <summary>
    /// PATCH /api/candidates/{id}/status - Update candidate status / stage (UPDATE_CANDIDATE_STATUS node)
    /// </summary>
    [HttpPatch("{id}/status")]
    public ActionResult<Candidate> UpdateStatus(string id, [FromBody] CandidateStatusUpdateDto body)
    {
        Candidate? cand = null;
        if (!_store.Candidates.TryGetValue(id, out cand))
        {
            cand = _store.Candidates.Values.FirstOrDefault(c => c.Email.Equals(id, StringComparison.OrdinalIgnoreCase));
        }

        if (cand == null)
        {
            return NotFound(new { error = $"Candidate '{id}' not found" });
        }

        if (!string.IsNullOrWhiteSpace(body.Status))
        {
            cand.Status = body.Status;
        }

        if (!string.IsNullOrWhiteSpace(body.Stage))
        {
            cand.Stage = body.Stage;
        }

        _store.Candidates[cand.Id] = cand;
        return Ok(cand);
    }

    [HttpPost]
    public ActionResult<Candidate> CreateCandidate([FromBody] Candidate input)
    {
        var id = string.IsNullOrWhiteSpace(input.Id) ? $"CAND-{_store.Candidates.Count + 201}" : input.Id;
        input.Id = id;
        input.AppliedAt = DateTime.UtcNow;
        _store.Candidates[id] = input;
        return CreatedAtAction(nameof(GetCandidate), new { id }, input);
    }
}
