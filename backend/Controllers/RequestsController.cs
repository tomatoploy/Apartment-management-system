using Microsoft.AspNetCore.Mvc;
using Dormitory.DormitoryModels;
using Microsoft.EntityFrameworkCore;
using Dormitory.DTOs;

namespace Dormitory.Controllers;

[ApiController]
[Route("[controller]")]
public class RequestsController : ControllerBase
{
    private readonly ILogger<RequestsController> _logger;
    private readonly DormitoryDbContext _db;

    public RequestsController(
        ILogger<RequestsController> logger,
        DormitoryDbContext db)
    {
        _logger = logger;
        _db = db;
    }

    [HttpGet]
    [Route("")]
    public async Task<ActionResult<IEnumerable<RequestResponseDto>>> GetRequestsAll()
    {
        var requests = await _db.Request
        .Include(r => r.Room)
        .Select(r => new RequestResponseDto
        {
            Id = r.Id,
            RoomId = r.RoomId,
            RoomNumber = r.Room.Number,
            RequestDate = r.RequestDate,
            Subject = r.Subject,
            Body = r.Body,
            Status = r.Status,
            AppointmentDate = r.AppointmentDate,
            IsTenantCost = r.IsTenantCost,
            Cost = r.Cost,
            Note = r.Note
        })
        .ToListAsync();

        return Ok(requests);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RequestResponseDto>> GetRequest(uint id)
    {
        var request = await _db.Request
            .Include(r => r.Room)
            .Where(r => r.Id == id)
            .Select(r => new RequestResponseDto
            {
                Id = r.Id,
                RoomId = r.RoomId,
                RoomNumber = r.Room.Number,
                RequestDate = r.RequestDate,
                Subject = r.Subject,
                Body = r.Body,
                Status = r.Status,
                AppointmentDate = r.AppointmentDate,
                IsTenantCost = r.IsTenantCost,
                Cost = r.Cost,
                Note = r.Note
            })
            .FirstOrDefaultAsync();

        if (request == null)
            return NotFound(new { message = "Request not found" });

        return Ok(request);
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] PostRequest p)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var room = await _db.Room
            .FirstOrDefaultAsync(r => r.Number == p.RoomNumber);

        if (room == null)
            return BadRequest(new { message = "Room not found" });

        var request = new Request
        {
            RoomId = room.Id,
            RequestDate = p.RequestDate,
            Subject = p.Subject,
            Body = p.Body,
            Status = "pending",
            AppointmentDate = p.AppointmentDate,
            IsTenantCost = p.IsTenantCost,
            Cost = p.Cost,
            Note = p.Note
        };

        await _db.Request.AddAsync(request);
        await _db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetRequest),
            new { id = request.Id },
            new { id = request.Id }
        );
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Put(uint id, [FromBody] PutRequest p)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var request = await _db.Request.FindAsync(id);
        if (request == null)
            return NotFound(new { message = "Request not found" });

        var room = await _db.Room
            .FirstOrDefaultAsync(r => r.Number == p.RoomNumber);

        if (room == null)
            return BadRequest(new { message = "Room not found" });

        request.RoomId = room.Id;     // 👈 map ตรงนี้
        request.RequestDate = p.RequestDate;
        request.Subject = p.Subject;
        request.Body = p.Body;
        request.Status = p.Status;
        request.AppointmentDate = p.AppointmentDate;
        request.IsTenantCost = p.IsTenantCost;
        request.Cost = p.Cost;
        request.Note = p.Note;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Updated successfully", id = request.Id });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(uint id)
    {
        var request = await _db.Request.FindAsync(id);

        if (request == null)
            return NotFound(new { message = "Request not found" });

        _db.Request.Remove(request);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Deleted successfully", id = id });
    }
}