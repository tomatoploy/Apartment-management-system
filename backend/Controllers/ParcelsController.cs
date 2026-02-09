using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Dormitory.DormitoryModels;
using Dormitory.DTOs;

namespace Dormitory.Controllers;

[ApiController]
[Route("[controller]")]
public class ParcelsController : ControllerBase
{
    private readonly ILogger<ParcelsController> _logger;
    private readonly DormitoryDbContext _db;

    public ParcelsController(
        ILogger<ParcelsController> logger,
        DormitoryDbContext db)
    {
        _logger = logger;
        _db = db;
    }

    // GET /parcels
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ParcelResponseDto>>> GetParcelsAll()
    {
        var parcels = await _db.Parcel
            .Include(p => p.Room)
            .Select(p => new ParcelResponseDto
            {
                Id = p.Id,
                RoomId = p.RoomId,
                RoomNumber = p.Room.Number,
                Recipient = p.Recipient,
                TrackingNumber = p.TrackingNumber,
                ShippingCompany = p.ShippingCompany,
                Type = p.Type,
                ArrivalDate = p.ArrivalDate,
                PickupDate = p.PickupDate
            })
            .ToListAsync();

        return Ok(parcels);
    }

    // GET /parcels/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<ParcelResponseDto>> GetParcel(uint id)
    {
        var parcel = await _db.Parcel
            .Include(p => p.Room)
            .Where(p => p.Id == id)
            .Select(p => new ParcelResponseDto
            {
                Id = p.Id,
                RoomId = p.RoomId,
                RoomNumber = p.Room.Number,
                Recipient = p.Recipient,
                TrackingNumber = p.TrackingNumber,
                ShippingCompany = p.ShippingCompany,
                Type = p.Type,
                ArrivalDate = p.ArrivalDate,
                PickupDate = p.PickupDate
            })
            .FirstOrDefaultAsync();

        if (parcel == null)
            return NotFound(new { message = "Parcel not found" });

        return Ok(parcel);
    }

    // POST /parcels
    [HttpPost]
    public async Task<IActionResult> Post([FromBody] PostParcel p)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var room = await _db.Room
            .FirstOrDefaultAsync(r => r.Number == p.RoomNumber);

        if (room == null)
            return BadRequest(new { message = "Room not found" });

        var parcel = new Parcel
        {
            RoomId = room.Id,
            Recipient = p.Recipient,
            TrackingNumber = p.TrackingNumber,
            ShippingCompany = p.ShippingCompany,
            Type = p.Type,
            ArrivalDate = p.ArrivalDate,
            PickupDate = p.PickupDate
        };

        await _db.Parcel.AddAsync(parcel);
        await _db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetParcel),
            new { id = parcel.Id },
            new { id = parcel.Id }
        );
    }

    // PUT /parcels/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Put(uint id, [FromBody] PutParcel p)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var parcel = await _db.Parcel.FindAsync(id);
        if (parcel == null)
            return NotFound(new { message = "Parcel not found" });

        var room = await _db.Room
            .FirstOrDefaultAsync(r => r.Number == p.RoomNumber);

        if (room == null)
            return BadRequest(new { message = "Room not found" });

        parcel.RoomId = room.Id;
        parcel.Recipient = p.Recipient;
        parcel.TrackingNumber = p.TrackingNumber;
        parcel.ShippingCompany = p.ShippingCompany;
        parcel.Type = p.Type;
        parcel.ArrivalDate = p.ArrivalDate;
        parcel.PickupDate = p.PickupDate;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Updated successfully", id = parcel.Id });
    }

    // DELETE /parcels/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(uint id)
    {
        var parcel = await _db.Parcel.FindAsync(id);

        if (parcel == null)
            return NotFound(new { message = "Parcel not found" });

        _db.Parcel.Remove(parcel);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Deleted successfully", id });
    }
}