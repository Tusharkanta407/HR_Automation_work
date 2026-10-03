using Microsoft.AspNetCore.Mvc;
using HrApi.Data;
using HrApi.Models;

namespace HrApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly HrDataStore _store;

    public EmployeesController(HrDataStore store)
    {
        _store = store;
    }

    /// <summary>
    /// GET /api/employees - List all employees
    /// </summary>
    [HttpGet]
    public ActionResult<IEnumerable<Employee>> GetEmployees([FromQuery] string? department)
    {
        var list = _store.Employees.Values.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(department))
        {
            list = list.Where(e => e.Department.Equals(department, StringComparison.OrdinalIgnoreCase));
        }
        return Ok(list.OrderBy(e => e.Id));
    }

    /// <summary>
    /// GET /api/employees/{id} - Get single employee by ID or email
    /// </summary>
    [HttpGet("{id}")]
    public ActionResult<Employee> GetEmployee(string id)
    {
        if (_store.Employees.TryGetValue(id, out var emp))
        {
            return Ok(emp);
        }

        // Also search by email
        var byEmail = _store.Employees.Values.FirstOrDefault(e => 
            e.Email.Equals(id, StringComparison.OrdinalIgnoreCase));
        if (byEmail != null)
        {
            return Ok(byEmail);
        }

        return NotFound(new { error = $"Employee '{id}' not found" });
    }

    /// <summary>
    /// POST /api/employees - Create new employee (CREATE_EMPLOYEE node)
    /// </summary>
    [HttpPost]
    public ActionResult<Employee> CreateEmployee([FromBody] Employee input)
    {
        if (string.IsNullOrWhiteSpace(input.Email))
        {
            return BadRequest(new { error = "Employee email is required" });
        }

        var id = string.IsNullOrWhiteSpace(input.Id) 
            ? $"EMP-{_store.Employees.Count + 101}" 
            : input.Id;

        var employee = new Employee
        {
            Id = id,
            Name = input.Name,
            Email = input.Email,
            Department = input.Department ?? "Engineering",
            Position = input.Position ?? "Software Engineer",
            Salary = input.Salary > 0 ? input.Salary : 85000,
            Status = "ACTIVE",
            JoinedAt = DateTime.UtcNow
        };

        _store.Employees[id] = employee;
        return CreatedAtAction(nameof(GetEmployee), new { id }, employee);
    }

    /// <summary>
    /// PATCH /api/employees/{id} - Update employee (UPDATE_EMPLOYEE node)
    /// </summary>
    [HttpPatch("{id}")]
    public ActionResult<Employee> UpdateEmployee(string id, [FromBody] EmployeeUpdateDto updates)
    {
        if (!_store.Employees.TryGetValue(id, out var emp))
        {
            return NotFound(new { error = $"Employee '{id}' not found" });
        }

        if (!string.IsNullOrWhiteSpace(updates.Name)) emp.Name = updates.Name;
        if (!string.IsNullOrWhiteSpace(updates.Email)) emp.Email = updates.Email;
        if (!string.IsNullOrWhiteSpace(updates.Department)) emp.Department = updates.Department;
        if (!string.IsNullOrWhiteSpace(updates.Position)) emp.Position = updates.Position;
        if (!string.IsNullOrWhiteSpace(updates.Status)) emp.Status = updates.Status;
        if (updates.Salary.HasValue) emp.Salary = updates.Salary.Value;

        _store.Employees[id] = emp;
        return Ok(emp);
    }

    [HttpPut("{id}")]
    public ActionResult<Employee> PutEmployee(string id, [FromBody] Employee input)
    {
        input.Id = id;
        _store.Employees[id] = input;
        return Ok(input);
    }
}
