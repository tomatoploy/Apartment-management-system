using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Dormitory.DormitoryModels;
using Dormitory.DTOs;
using Dormitory.Services; // --- ส่วนที่เพิ่มใหม่: อย่าลืม using Services นะคะ ---

namespace Dormitory.Controllers;

[ApiController]
[Route("[controller]")]
public class ParcelsController : ControllerBase
{
    private readonly ILogger<ParcelsController> _logger;
    private readonly DormitoryDbContext _db;
    private readonly LineMessageService _lineService; // --- ส่วนที่เพิ่มใหม่ ---

    // --- ส่วนที่เพิ่มใหม่: นำ LineMessageService เข้ามาใน Constructor ---
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
        // (โค้ดเดิม) ...
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
        // (โค้ดเดิม) ...
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
        await _db.SaveChangesAsync(); // เซฟพัสดุลง Database ก่อน

        // --- ค้นหาผู้เช่าและส่ง LINE ---
        try
        {
            var contract = await _db.Contract
                .Include(c => c.Tenant)
                .FirstOrDefaultAsync(c => c.RoomId == room.Id && c.Status == "Active");

            if (contract != null && contract.Tenant != null && !string.IsNullOrEmpty(contract.Tenant.LineId))
            {
                // ใช้ """ (Raw String Literals) เพื่อให้เขียน JSON ง่ายๆ และเอาตัวแปรไปแทรกด้วยปีกกาคู่ {{...}}
                string flexCardJson = $$"""
                {
                  "type": "bubble",
                  "size": "mega",
                  "header": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                      {
                        "type": "text",
                        "text": "📦 แจ้งเตือนพัสดุใหม่",
                        "color": "#ffffff",
                        "weight": "bold",
                        "size": "lg"
                      }
                    ],
                    "backgroundColor": "#27ae60"
                  },
                  "body": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                      {
                        "type": "box",
                        "layout": "horizontal",
                        "contents": [
                          { "type": "text", "text": "ห้องพัก", "size": "sm", "color": "#8c8c8c", "flex": 1 },
                          { "type": "text", "text": "{{p.RoomNumber}}", "size": "sm", "color": "#111111", "flex": 2, "weight": "bold" }
                        ],
                        "margin": "md"
                      },
                      {
                        "type": "box",
                        "layout": "horizontal",
                        "contents": [
                          { "type": "text", "text": "ผู้รับ", "size": "sm", "color": "#8c8c8c", "flex": 1 },
                          { "type": "text", "text": "{{p.Recipient}}", "size": "sm", "color": "#111111", "flex": 2 }
                        ],
                        "margin": "md"
                      },
                      {
                        "type": "box",
                        "layout": "horizontal",
                        "contents": [
                          { "type": "text", "text": "ขนส่ง", "size": "sm", "color": "#8c8c8c", "flex": 1 },
                          { "type": "text", "text": "{{p.ShippingCompany}}", "size": "sm", "color": "#111111", "flex": 2 }
                        ],
                        "margin": "md"
                      },
                      {
                        "type": "box",
                        "layout": "horizontal",
                        "contents": [
                          { "type": "text", "text": "เลขพัสดุ", "size": "sm", "color": "#8c8c8c", "flex": 1 },
                          { "type": "text", "text": "{{p.TrackingNumber}}", "size": "sm", "color": "#e67e22", "flex": 2, "weight": "bold" }
                        ],
                        "margin": "md"
                      }
                    ]
                  },
                  "footer": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                      {
                        "type": "text",
                        "text": "สามารถติดต่อรับได้ที่นิติบุคคลค่ะ",
                        "size": "xs",
                        "color": "#b2b2b2",
                        "align": "center"
                      }
                    ]
                  }
                }
                """;

                // ข้อความแจ้งเตือน (AltText) ที่จะโชว์บน Notification มือถือก่อนกดเข้าแชท
                string altText = $"มีพัสดุมาส่งถึงห้อง {p.RoomNumber} ค่ะ";

                // สั่งส่งการ์ด!
                await _lineService.SendFlexMessageAsync(contract.Tenant.LineId, altText, flexCardJson);
                _logger.LogInformation($"ส่ง LINE การ์ดแจ้งพัสดุไปที่ห้อง {p.RoomNumber} สำเร็จ");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"เกิดข้อผิดพลาดในการส่ง LINE Flex พัสดุ: {ex.Message}");
        }
        // -----------------------------------------------------------------

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
        // (โค้ดเดิม) ...
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
        // (โค้ดเดิม) ...
        var parcel = await _db.Parcel.FindAsync(id);

        if (parcel == null)
            return NotFound(new { message = "Parcel not found" });

        _db.Parcel.Remove(parcel);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Deleted successfully", id });
    }
}