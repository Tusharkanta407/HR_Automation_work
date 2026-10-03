using Microsoft.AspNetCore.Mvc;
using HrApi.Data;
using HrApi.Models;

namespace HrApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaveController : ControllerBase
{
    private readonly HrDataStore _store;

    public LeaveController(HrDataStore store)
    {
        _store = store;
    }

    /// <summary>
    /// GET /api/leave - List leave records (GET_LEAVE_RECORDS node)
    /// </summary>
    [HttpGet]
    public ActionResult<IEnumerable<LeaveRecord>> GetLeaves([FromQuery] string? status, [FromQuery] string? employeeId)
    {
        var query = _store.Leaves.Values.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(l => l.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(employeeId))
        {
            query = query.Where(l => l.EmployeeId.Equals(employeeId, StringComparison.OrdinalIgnoreCase));
        }

        return Ok(query.OrderByDescending(l => l.StartDate));
    }

    [HttpGet("{id}")]
    public ActionResult<LeaveRecord> GetById(string id)
    {
        if (_store.Leaves.TryGetValue(id, out var record))
        {
            return Ok(record);
        }
        return NotFound(new { error = $"Leave record '{id}' not found" });
    }

    [HttpPost]
    public ActionResult<LeaveRecord> CreateLeave([FromBody] LeaveRecord input)
    {
        var id = string.IsNullOrWhiteSpace(input.Id) ? $"LEV-{_store.Leaves.Count + 1:D3}" : input.Id;
        input.Id = id;
        input.Status = string.IsNullOrWhiteSpace(input.Status) ? "APPROVED" : input.Status;
        _store.Leaves[id] = input;
        return CreatedAtAction(nameof(GetById), new { id }, input);
    }
}
