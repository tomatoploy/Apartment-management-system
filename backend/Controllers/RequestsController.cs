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

                // 🌟 แก้ไข: ตรวจสอบและดึงข้อมูลจาก Tenant.Note แทน LineId
                if (contract != null && contract.Tenant != null && !string.IsNullOrEmpty(contract.Tenant.Note))
                {
                    // ดักจับค่า Null เผื่อกรณีแอดมินไม่ได้พิมพ์รายละเอียดมา
                    string safeSubject = string.IsNullOrEmpty(p.Subject) ? "-" : p.Subject;
                    string safeBody = string.IsNullOrEmpty(p.Body) ? "-" : p.Body;

                    // 1. เตรียม JSON ส่วนของ "ค่าใช้จ่าย" (จะเพิ่มเข้าไปในการ์ดก็ต่อเมื่อมีค่าใช้จ่ายจริง)
                    string costRowJson = "";
                    if (p.IsTenantCost == true && p.Cost > 0)
                    {
                        // สังเกตเครื่องหมายจุลภาค (,) ข้างหน้า เพื่อใช้ต่อกับ Array ใน JSON ตัวหลัก
                        costRowJson = $$"""
                        ,{
                          "type": "box",
                          "layout": "horizontal",
                          "margin": "md",
                          "contents": [
                            { "type": "text", "text": "ค่าใช้จ่าย", "size": "sm", "color": "#888888", "flex": 1 },
                            { "type": "text", "text": "{{p.Cost?.ToString("N2")}} ฿", "size": "sm", "color": "#e74c3c", "align": "end", "flex": 2, "weight": "bold" }
                          ]
                        }
                        """;
                    }

                    // 2. ประกอบร่าง JSON การ์ดทั้งหมด (สไตล์ Minimal แบบไม่มี Header/Footer กวนใจ)
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
                            "text": "● แจ้งดำเนินการเสร็จสิ้น",
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
                                  { "type": "text", "text": "รายการ", "size": "sm", "color": "#888888", "flex": 1 },
                                  { "type": "text", "text": "{{safeSubject}}", "size": "sm", "color": "#111111", "align": "end", "flex": 2, "wrap": true }
                                ]
                              },
                              {
                                "type": "box", "layout": "horizontal", "margin": "md",
                                "contents": [
                                  { "type": "text", "text": "รายละเอียด", "size": "sm", "color": "#888888", "flex": 1 },
                                  { "type": "text", "text": "{{safeBody}}", "size": "sm", "color": "#111111", "align": "end", "flex": 2, "wrap": true }
                                ]
                              }
                              {{costRowJson}}
                            ]
                          }
                        ]
                      }
                    }
                    """;

                    // ข้อความแจ้งเตือน (AltText) ที่แสดงบน Notification มือถือ
                    string altText = $"🛠️ อัปเดต: รายการ {safeSubject} ของห้อง {p.RoomNumber} ดำเนินการเสร็จสิ้นแล้วค่ะ";

                    // 🌟 ส่งข้อมูลโดยใช้ UID จาก contract.Tenant.Note
                    await _lineService.SendFlexMessageAsync(contract.Tenant.Note, altText, flexCardJson);
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