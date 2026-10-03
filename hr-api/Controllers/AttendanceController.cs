using Microsoft.AspNetCore.Mvc;
using HrApi.Data;
using HrApi.Models;

namespace HrApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AttendanceController : ControllerBase
{
    private readonly HrDataStore _store;

    public AttendanceController(HrDataStore store)
    {
        _store = store;
    }

    /// <summary>
    /// GET /api/attendance - List attendance records (filter by ?period=2026-09)
    /// </summary>
    [HttpGet]
    public ActionResult<IEnumerable<AttendanceRecord>> GetAttendance([FromQuery] string? period, [FromQuery] bool? belowThreshold)
    {
        var query = _store.Attendance.Values.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(period))
        {
            query = query.Where(a => a.Period.Equals(period, StringComparison.OrdinalIgnoreCase));
        }

        if (belowThreshold.HasValue)
        {
            query = query.Where(a => a.IsBelowThreshold == belowThreshold.Value);
        }

        return Ok(query.OrderBy(a => a.EmployeeId));
    }

    /// <summary>
    /// GET /api/attendance/monthly - Monthly attendance summary list (GET_MONTHLY_ATTENDANCE node)
    /// </summary>
    [HttpGet("monthly")]
    public ActionResult<IEnumerable<AttendanceRecord>> GetMonthlyAttendance([FromQuery] string? period)
    {
        var targetPeriod = string.IsNullOrWhiteSpace(period) ? "2026-09" : period;
        var records = _store.Attendance.Values
            .Where(a => a.Period.Equals(targetPeriod, StringComparison.OrdinalIgnoreCase))
            .ToList();

        // If no records for this period, return all records
        if (records.Count == 0)
        {
            records = _store.Attendance.Values.ToList();
        }

        return Ok(records);
    }

    /// <summary>
    /// GET /api/attendance/{id}
    /// </summary>
    [HttpGet("{id}")]
    public ActionResult<AttendanceRecord> GetById(string id)
    {
        if (_store.Attendance.TryGetValue(id, out var record))
        {
            return Ok(record);
        }

        var byEmp = _store.Attendance.Values.FirstOrDefault(a => a.EmployeeId.Equals(id, StringComparison.OrdinalIgnoreCase));
        if (byEmp != null) return Ok(byEmp);

        return NotFound(new { error = $"Attendance record '{id}' not found" });
    }

    /// <summary>
    /// POST /api/attendance - Record attendance entry
    /// </summary>
    [HttpPost]
    public ActionResult<AttendanceRecord> RecordAttendance([FromBody] AttendanceRecord input)
    {
        var id = string.IsNullOrWhiteSpace(input.Id) ? $"ATT-{_store.Attendance.Count + 1:D3}" : input.Id;
        input.Id = id;
        if (input.TotalDays > 0)
        {
            input.AttendanceRate = Math.Round((double)input.DaysPresent / input.TotalDays * 100, 2);
            input.IsBelowThreshold = input.AttendanceRate < 75.0;
        }

        _store.Attendance[id] = input;
        return CreatedAtAction(nameof(GetById), new { id }, input);
    }
}
