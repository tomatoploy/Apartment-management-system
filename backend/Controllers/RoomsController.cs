using Microsoft.AspNetCore.Mvc;
using Dormitory.DormitoryModels;
using Microsoft.EntityFrameworkCore;
using Dormitory.DTOs;

namespace Dormitory.Controllers;

[ApiController]
[Route("[controller]")]
public class RoomsController : ControllerBase
{
    private readonly ILogger<RoomsController> _logger;
    private readonly DormitoryDbContext _db;

    public RoomsController(
        ILogger<RoomsController> logger,
        DormitoryDbContext db)
    {
        _logger = logger;
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Room>>> GetRoomsAll()
    {
        var rooms = await _db.Room.Where(r => r.Status != "delete").ToListAsync();
        if (rooms == null || rooms.Count == 0)
        {
            return NoContent();
        }
        return Ok(rooms);
    }

    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<Room>>> SearchRooms(
        [FromQuery] string? keyword,
        [FromQuery] string? roomNumber,
        [FromQuery] string? building,
        [FromQuery] string? floor,
        [FromQuery] string? status)
    {
        var query = _db.Room.Where(r => r.Status != "delete").AsQueryable();

        //keyword search (ค้นหลาย field)
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(r =>
                r.Number.Contains(keyword) ||
                (r.Building != null && r.Building.Contains(keyword)) ||
                (r.Floor != null && r.Floor.Contains(keyword)) ||
                r.Status.Contains(keyword) ||
                (r.Note != null && r.Note.Contains(keyword))
            );
        }

        //ค้นหาแบบเจาะจงทีละ field
        if (!string.IsNullOrWhiteSpace(roomNumber))
        {
            query = query.Where(r => r.Number == roomNumber);
        }

        if (!string.IsNullOrWhiteSpace(building))
        {
            query = query.Where(r => r.Building == building);
        }

        if (!string.IsNullOrWhiteSpace(floor))
        {
            query = query.Where(r => r.Floor == floor);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(r => r.Status == status);
        }

        var rooms = await query.ToListAsync();

        if (rooms.Count == 0)
        {
            return NoContent();
        }

        return Ok(rooms);
    }

    [HttpGet("overview")]
    public async Task<ActionResult<List<RoomOverviewDto>>> GetRoomOverview()
    {
        var today = DateOnly.FromDateTime(DateTime.Today);

        var rooms = await _db.Room
            .Include(r => r.Contract)
                .ThenInclude(c => c.Tenant)
            .Include(r => r.Contract)
                .ThenInclude(c => c.Payment)
            .Select(r => new RoomOverviewDto
            {
                RoomId = r.Id,
                RoomBuilding = r.Building,
                RoomFloor = r.Floor,
                RoomNumber = r.Number,
                RoomStatus = r.Status,
                RoomNote = r.Note,

                TenantFirstName = r.Contract
                    .Where(c => c.Status != "Terminated" && c.Status != "Expired")
                    .Select(c => c.Tenant != null ? c.Tenant.FirstName : null)
                    .FirstOrDefault(),

                ContractStartDate = r.Contract
                    .Where(c => c.Status != "Terminated" && c.Status != "Expired")
                    .Select(c => c.StartDate)
                    .FirstOrDefault(),

                ContractEndDate = r.Contract
                    .Where(c => c.Status != "Terminated" && c.Status != "Expired")
                    .Select(c => c.EndDate)
                    .FirstOrDefault(),

                IsOverdue = r.Contract
                    .Where(c => c.Status != "Terminated" && c.Status != "Expired")
                    .SelectMany(c => c.Payment)
                    .Any(p => p.Status != "paid"),
                
                Icons = new List<string>()
            })
            .ToListAsync();

        return Ok(rooms);
    }

    //create
    [HttpPost]
    [Route("")]
    public async Task<IActionResult> Post([FromBody] DTOs.PostRoom p) 
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);        
        
        var newRoom = new Room
        {
            Building = p.Building,
            Floor = p.Floor,
            Number = p.Number,
            Status = p.Status,
            Note = p.Note
        };

        await _db.Room.AddAsync(newRoom);
        await _db.SaveChangesAsync();
        
        return Ok(new { id = newRoom.Id });
    }

    [HttpPut]
    [Route("{Id}")]
    public async Task<IActionResult> Put(uint id, [FromBody] DTOs.PutRoom p) 
    {
        var room = await _db.Room.FindAsync(id);

        if (room == null)
            return NotFound(new { message = "Room not found" });
        
        room.Building = p.Building;
        room.Floor = p.Floor;
        room.Number = p.Number;
        room.Status = p.Status;
        room.Note = p.Note;

        await _db.SaveChangesAsync();
        
        return Ok(new { message = "Updated successfully", id = room.Id });
    }

    [HttpDelete]
    [Route("{Id}")]
    public async Task<IActionResult> Delete(uint id)
    {
        var room = await _db.Room.FindAsync(id);

        if (room == null)
            return NotFound(new {message = "Room not found"});

        // _db.Room.Remove(room);
        room.Status = "delete";
        await _db.SaveChangesAsync();

        return Ok(new { message = "Room deleted successfully", id = room.Id });
    }
}
