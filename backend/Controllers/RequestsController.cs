using Microsoft.AspNetCore.Mvc;
using Dormitory.DormitoryModels;
using Microsoft.EntityFrameworkCore;
using Dormitory.DTOs;
using Dormitory.Services;

namespace Dormitory.Controllers;

[ApiController]
[Route("[controller]")]
public class RequestsController : ControllerBase
{
    private readonly ILogger<RequestsController> _logger;
    private readonly DormitoryDbContext _db;
    private readonly LineMessageService _lineService;

    public RequestsController(
        ILogger<RequestsController> logger,
        DormitoryDbContext db,
        LineMessageService lineService)
    {
        _logger = logger;
        _db = db;
        _lineService = lineService;
    }

    [HttpGet]
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

        // --- เช็คว่าสถานะเดิมไม่ใช่ finish และกำลังถูกเปลี่ยนเป็น finish ใช่หรือไม่
        bool isNewlyFinished = request.Status != "finish" && p.Status == "finish";

        request.RoomId = room.Id;
        request.RequestDate = p.RequestDate;
        request.Subject = p.Subject;
        request.Body = p.Body;
        request.Status = p.Status;
        request.AppointmentDate = p.AppointmentDate;
        request.IsTenantCost = p.IsTenantCost;
        request.Cost = p.Cost;
        request.Note = p.Note;

        await _db.SaveChangesAsync(); // บันทึกข้อมูลลงฐานข้อมูลก่อน

        // --- ส่งแจ้งเตือนถ้าเพิ่งเปลี่ยนสถานะเป็น finish
        if (isNewlyFinished)
        {
            try
            {
                // หาผู้เช่าที่ทำสัญญาอยู่ (Status = Active) ในห้องนี้
                var contract = await _db.Contract
                    .Include(c => c.Tenant)
                    .FirstOrDefaultAsync(c => c.RoomId == room.Id && c.Status == "Active");

                if (contract != null && contract.Tenant != null && !string.IsNullOrEmpty(contract.Tenant.LineId))
                {
                    // 1. เตรียม JSON ส่วนของ "ค่าใช้จ่าย" (จะเพิ่มเข้าไปในการ์ดก็ต่อเมื่อมีค่าใช้จ่ายจริง)
                    string costRowJson = "";
                    if (p.IsTenantCost == true && p.Cost > 0)
                    {
                        costRowJson = $$"""
                        ,{
                          "type": "box",
                          "layout": "horizontal",
                          "contents": [
                            { "type": "text", "text": "ค่าใช้จ่าย", "size": "sm", "color": "#e74c3c", "flex": 1, "weight": "bold" },
                            { "type": "text", "text": "{{p.Cost}} บาท", "size": "sm", "color": "#e74c3c", "flex": 2, "weight": "bold" }
                          ],
                          "margin": "md"
                        }
                        """;
                    }

                    // 2. ประกอบร่าง JSON การ์ดทั้งหมด (ใช้ธีมสีฟ้า #2980b9)
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
                            "text": "🛠️ ดำเนินการเสร็จสิ้น",
                            "color": "#ffffff",
                            "weight": "bold",
                            "size": "lg"
                          }
                        ],
                        "backgroundColor": "#2980b9"
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
                              { "type": "text", "text": "รายการ", "size": "sm", "color": "#8c8c8c", "flex": 1 },
                              { "type": "text", "text": "{{p.Subject}}", "size": "sm", "color": "#111111", "flex": 2 }
                            ],
                            "margin": "md"
                          },
                          {
                            "type": "box",
                            "layout": "horizontal",
                            "contents": [
                              { "type": "text", "text": "รายละเอียด", "size": "sm", "color": "#8c8c8c", "flex": 1 },
                              { "type": "text", "text": "{{p.Body}}", "size": "sm", "color": "#111111", "flex": 2, "wrap": true }
                            ],
                            "margin": "md"
                          }
                          {{costRowJson}}
                        ]
                      },
                      "footer": {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                          {
                            "type": "text",
                            "text": "ขอบคุณที่ใช้บริการค่ะ",
                            "size": "xs",
                            "color": "#b2b2b2",
                            "align": "center"
                          }
                        ]
                      }
                    }
                    """;

                    // ข้อความแจ้งเตือน (AltText)
                    string altText = $"อัปเดตสถานะ: รายการ {p.Subject} ดำเนินการเสร็จสิ้นแล้วค่ะ";

                    // เรียกใช้ฟังก์ชันส่งการ์ด
                    await _lineService.SendFlexMessageAsync(contract.Tenant.LineId, altText, flexCardJson);
                    _logger.LogInformation($"ส่ง LINE การ์ดแจ้งสถานะ finish ไปที่ห้อง {p.RoomNumber} สำเร็จ");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"เกิดข้อผิดพลาดในการส่ง LINE Flex แจ้งสถานะ finish: {ex.Message}");
            }
        }
        // -----------------------------------------------------------------

        return Ok(new { message = "Updated successfully", id = request.Id });
    }

    [HttpDelete("{id}")]
    // ... โค้ด Delete() เหมือนเดิม ...
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