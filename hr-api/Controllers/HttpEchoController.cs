using Microsoft.AspNetCore.Mvc;

namespace HrApi.Controllers;

[ApiController]
public class HttpEchoController : ControllerBase
{
    /// <summary>
    /// GET /health or /api/health - Health check
    /// </summary>
    [HttpGet("/health")]
    [HttpGet("/api/health")]
    public ActionResult Health()
    {
        return Ok(new
        {
            service = "HR Mock Domain REST API",
            status = "HEALTHY",
            version = "1.0.0",
            timestamp = DateTime.UtcNow,
            endpoints = new[]
            {
                "GET /api/employees",
                "GET /api/employees/{id}",
                "POST /api/employees",
                "PATCH /api/employees/{id}",
                "GET /api/attendance",
                "GET /api/attendance/monthly",
                "GET /api/leave",
                "GET /api/candidates",
                "GET /api/candidates/{id}",
                "PATCH /api/candidates/{id}/status",
                "GET /api/assessments/{id}",
                "GET /api/interviewers",
                "GET /api/interviewers/availability",
                "POST /api/interviews/assign",
                "POST /api/interviews",
                "POST /api/onboarding/tasks",
                "ALL /api/http-request"
            }
        });
    }

    /// <summary>
    /// ANY /api/http-request - Universal test endpoint for HTTP_REQUEST workflow node
    /// </summary>
    [Route("api/http-request")]
    [Route("api/echo")]
    [HttpGet, HttpPost, HttpPut, HttpPatch, HttpDelete]
    public async Task<ActionResult> Echo([FromBody] object? body = null)
    {
        var headers = Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString());
        var query = Request.Query.ToDictionary(q => q.Key, q => q.Value.ToString());

        return Ok(new
        {
            success = true,
            method = Request.Method,
            path = Request.Path.Value,
            query,
            headers,
            body,
            receivedAt = DateTime.UtcNow
        });
    }
}
