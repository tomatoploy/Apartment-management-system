using Microsoft.AspNetCore.Mvc;
using Dormitory.DormitoryModels;
using Microsoft.EntityFrameworkCore;
using Dormitory.DTOs;

namespace Dormitory.Controllers;

[ApiController]
[Route("[controller]")]
public class RequestsController : ControllerBase
{
    private readonly ILogger<RoomsController> _logger;
    private readonly DormitoryDbContext _db;

    public RequestsController(
        ILogger<RoomsController> logger,
        DormitoryDbContext db)
    {
        _logger = logger;
        _db = db;
    }

    [HttpGet]
    [Route("")]
    public async Task<ActionResult<IEnumerable<Request>>> GetRequestsAll()
    {
        var requests = await _db.Request.ToListAsync();
        if (requests == null || requests.Count == 0)
            return NoContent();
        return Ok(requests);
    }

    // [HttpPost]
    // [Route("")]
    // public async Task<IActionResult> 
}