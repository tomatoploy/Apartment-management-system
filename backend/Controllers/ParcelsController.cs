using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Dormitory.DormitoryModels;
using Dormitory.DTOs;
using Dormitory.Services;

namespace Dormitory.Controllers;

[ApiController]
[Route("[controller]")]
public class ParcelsController : ControllerBase
{
    private readonly ILogger<ParcelsController> _logger;
    private readonly DormitoryDbContext _db;
    private readonly LineMessageService _lineService;

    public ParcelsController(
        ILogger<ParcelsController> logger,
        DormitoryDbContext db,
        LineMessageService lineService) 
    {
        _logger = logger;
        _db = db;
        _lineService = lineService;
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

        // --- ค้นหาผู้เช่าและส่ง LINE ---
        try
        {
            var contract = await _db.Contract
                .Include(c => c.Tenant)
                .FirstOrDefaultAsync(c => c.RoomId == room.Id && c.Status == "Active");

            // 🌟 แก้ไขบัค: เปลี่ยนมาเช็คและส่งไปที่ Note แทน LineId
            if (contract != null && contract.Tenant != null && !string.IsNullOrEmpty(contract.Tenant.Note))
            {
                // ดักจับค่า Null ป้องกัน Error ใน JSON
                string safeRecipient = string.IsNullOrEmpty(p.Recipient) ? "-" : p.Recipient;
                string safeCompany = string.IsNullOrEmpty(p.ShippingCompany) ? "-" : p.ShippingCompany;
                string safeTracking = string.IsNullOrEmpty(p.TrackingNumber) ? "-" : p.TrackingNumber;

                // 🌟 เปลี่ยนดีไซน์ Flex Message ให้ Minimal และดูเป็นมืออาชีพ
                string flexCardJson = $$"""
                {
                  "type": "bubble",
                  "size": "mega",
                  "body": {
                    "type": "box",
                    "layout": "vertical",
                    "paddingAll": "10%",
                    "contents": [
                      {
                        "type": "text",
                        "text": "● แจ้งเตือนพัสดุมาถึง",
                        "color": "#5fbc78",
                        "weight": "bold",
                        "size": "xs"
                      },
                      {
                        "type": "box",
                        "layout": "horizontal",
                        "margin": "lg",
                        "contents": [
                          { "type": "text", "text": "ห้อง", "size": "xl", "color": "#111111", "weight": "bold" },
                          { "type": "text", "text": "{{p.RoomNumber}}", "size": "xl", "color": "#111111", "align": "end", "weight": "bold" }
                        ]
                      },
                      { "type": "separator", "margin": "xl", "color": "#f0f0f0" },
                      {
                        "type": "box",
                        "layout": "vertical",
                        "margin": "xl",
                        "contents": [
                          {
                            "type": "box", "layout": "horizontal", "margin": "md",
                            "contents": [
                              { "type": "text", "text": "ชื่อผู้รับ", "size": "sm", "color": "#888888", "flex": 1 },
                              { "type": "text", "text": "{{safeRecipient}}", "size": "sm", "color": "#111111", "align": "end", "flex": 2 }
                            ]
                          },
                          {
                            "type": "box", "layout": "horizontal", "margin": "md",
                            "contents": [
                              { "type": "text", "text": "ขนส่ง", "size": "sm", "color": "#888888", "flex": 1 },
                              { "type": "text", "text": "{{safeCompany}}", "size": "sm", "color": "#111111", "align": "end", "flex": 2 }
                            ]
                          },
                          {
                            "type": "box", "layout": "horizontal", "margin": "md",
                            "contents": [
                              { "type": "text", "text": "เลขพัสดุ", "size": "sm", "color": "#888888", "flex": 1 },
                              { "type": "text", "text": "{{safeTracking}}", "size": "sm", "color": "#111111", "align": "end", "flex": 2 }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                }
                """;

                string altText = $"📦 มีพัสดุมาส่งถึงห้อง {p.RoomNumber} ค่ะ";

                // 🌟 ส่งไปที่ Note
                await _lineService.SendFlexMessageAsync(contract.Tenant.Note, altText, flexCardJson);
                _logger.LogInformation($"ส่ง LINE การ์ดแจ้งพัสดุไปที่ห้อง {p.RoomNumber} สำเร็จ");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"เกิดข้อผิดพลาดในการส่ง LINE Flex พัสดุ: {ex.Message}");
        }

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