using Microsoft.AspNetCore.Mvc;
using HrApi.Data;
using HrApi.Models;

namespace HrApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OnboardingController : ControllerBase
{
    private readonly HrDataStore _store;

    public OnboardingController(HrDataStore store)
    {
        _store = store;
    }

    /// <summary>
    /// GET /api/onboarding/tasks - List all onboarding tasks
    /// </summary>
    [HttpGet("tasks")]
    public ActionResult<IEnumerable<OnboardingTask>> GetTasks([FromQuery] string? employeeId)
    {
        var query = _store.OnboardingTasks.Values.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(employeeId))
        {
            query = query.Where(t => t.EmployeeId.Equals(employeeId, StringComparison.OrdinalIgnoreCase));
        }
        return Ok(query.OrderBy(t => t.DueDate));
    }

    /// <summary>
    /// POST /api/onboarding/tasks - Create onboarding task (CREATE_ONBOARDING_TASK node)
    /// </summary>
    [HttpPost("tasks")]
    public ActionResult<OnboardingTask> CreateTask([FromBody] OnboardingTask input)
    {
        var id = string.IsNullOrWhiteSpace(input.Id) ? $"TSK-{_store.OnboardingTasks.Count + 601}" : input.Id;
        input.Id = id;
        input.DueDate = input.DueDate == default ? DateTime.UtcNow.AddDays(7) : input.DueDate;
        input.Status = string.IsNullOrWhiteSpace(input.Status) ? "PENDING" : input.Status;

        // Populate employee name/email if employeeId was passed
        if (!string.IsNullOrWhiteSpace(input.EmployeeId) && _store.Employees.TryGetValue(input.EmployeeId, out var emp))
        {
            input.EmployeeName = emp.Name;
            input.EmployeeEmail = emp.Email;
        }

        _store.OnboardingTasks[id] = input;
        return Created($"/api/onboarding/tasks/{id}", input);
    }
}
