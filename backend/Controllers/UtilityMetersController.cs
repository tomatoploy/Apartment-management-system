using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Dormitory.DormitoryModels;
using Dormitory.DTOs;

namespace Dormitory.Controllers;


[ApiController]
[Route("[controller]")]
public class UtilityMetersController : ControllerBase
{
    private readonly ILogger<UtilityMetersController> _logger;
    private readonly DormitoryDbContext _db;

    public UtilityMetersController(
        ILogger<UtilityMetersController> logger,
        DormitoryDbContext db)
    {
        _logger = logger;
        _db = db;
    }

    private static bool HasAnyInput(UtilityMeterBulkDto d)
    {
        return
            d.ElectricityUnit.HasValue ||
            d.WaterUnit.HasValue ||
            d.ChangeElectricityMeterStart.HasValue ||
            d.ChangeElectricityMeterEnd.HasValue ||
            d.ChangeWaterMeterStart.HasValue ||
            d.ChangeWaterMeterEnd.HasValue;
    }

    private static uint? CalculateUsedUnit(uint? previous, uint? current)
    {
        if (!previous.HasValue || !current.HasValue)
            return null;

        if (current.Value >= previous.Value)
            return current.Value - previous.Value;

        var length = previous.Value.ToString().Length;
        var maxMeter = uint.Parse(new string('9', length));

        return (maxMeter - previous.Value) + current.Value + 1;
    }

    private static uint? CalculateUsedWithMeterChange(
        uint? prevMonthUnit,
        uint? changeEnd,
        uint? changeStart,
        uint? currentNewUnit)
    {
        // ❌ ยังไม่มีมิเตอร์เดือนก่อน → ไม่คำนวณ
        if (!prevMonthUnit.HasValue)
            return null;

        // ❌ ยังไม่กรอกอะไรเลย
        if (!changeEnd.HasValue && !currentNewUnit.HasValue)
            return null;

        // 🔵 เปลี่ยนมิเตอร์ แต่ยังไม่กรอกตัวใหม่
        if (changeEnd.HasValue && !currentNewUnit.HasValue)
        {
            return CalculateUsedUnit(prevMonthUnit, changeEnd);
        }

        // 🔵 เปลี่ยนมิเตอร์ครบ
        if (changeEnd.HasValue && changeStart.HasValue && currentNewUnit.HasValue)
        {
            var usedOld = CalculateUsedUnit(prevMonthUnit, changeEnd);
            var usedNew = CalculateUsedUnit(changeStart, currentNewUnit);
            return usedOld + usedNew;
        }

        // 🟢 ไม่เปลี่ยนมิเตอร์
        if (currentNewUnit.HasValue)
        {
            return CalculateUsedUnit(prevMonthUnit, currentNewUnit);
        }

        return null;
    }

    // GET /utilitymeters
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UtilityMeterDetailDto>>> GetAll()
    {
        var meters = await _db.UtilityMeter
            .Include(m => m.Room)
            .Select(m => new UtilityMeterDetailDto
            {
                Id = m.Id,
                RoomId = m.RoomId,
                RoomNumber = m.Room.Number,
                RecordDate = m.RecordDate,
                ElectricityUnit = m.ElectricityUnit,
                WaterUnit = m.WaterUnit,
                ChangeElectricityMeterStart = m.ChangeElectricityMeterStart,
                ChangeElectricityMeterEnd = m.ChangeElectricityMeterEnd,
                ChangeWaterMeterStart = m.ChangeWaterMeterStart,
                ChangeWaterMeterEnd = m.ChangeWaterMeterEnd,
                Note = m.Note
            })
            .ToListAsync();

        return Ok(meters);
    }

    // GET /utilitymeters/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<UtilityMeterDetailDto>> Get(uint id)
    {
        var meter = await _db.UtilityMeter
            .Include(m => m.Room)
            .Where(m => m.Id == id)
            .Select(m => new UtilityMeterDetailDto
            {
                Id = m.Id,
                RoomId = m.RoomId,
                RoomNumber = m.Room.Number,
                RecordDate = m.RecordDate,
                ElectricityUnit = m.ElectricityUnit,
                WaterUnit = m.WaterUnit,
                ChangeElectricityMeterStart = m.ChangeElectricityMeterStart,
                ChangeElectricityMeterEnd = m.ChangeElectricityMeterEnd,
                ChangeWaterMeterStart = m.ChangeWaterMeterStart,
                ChangeWaterMeterEnd = m.ChangeWaterMeterEnd,
                Note = m.Note
            })
            .FirstOrDefaultAsync();

        if (meter == null)
            return NotFound();

        return Ok(meter);
    }

[HttpGet("by-month")]
    public async Task<ActionResult<IEnumerable<UtilityMeterMonthlyDto>>> GetByMonth(
        [FromQuery] int year,
        [FromQuery] int month)
    {
        var firstDay = new DateOnly(year, month, 1);
        var lastDay = firstDay.AddMonths(1).AddDays(-1);

        var result = await _db.Room
            .Where(r => r.Status != "delete")
            .Select(r => new
            {
                r.Id,
                r.Number,
                r.Floor,
                Current = _db.UtilityMeter
                    .Where(m => m.RoomId == r.Id && m.RecordDate >= firstDay && m.RecordDate <= lastDay)
                    .OrderByDescending(m => m.RecordDate)
                    .FirstOrDefault(),
                Previous = _db.UtilityMeter
                    .Where(m => m.RoomId == r.Id && m.RecordDate < firstDay)
                    .OrderByDescending(m => m.RecordDate)
                    .FirstOrDefault()
            })
            .Select(x => new UtilityMeterMonthlyDto
            {
                RoomId = x.Id,
                RoomNumber = x.Number,
                Floor = x.Floor,

                // ข้อมูลเดือนปัจจุบัน
                ElectricityUnit = x.Current != null && x.Current.RecordDate >= firstDay ? x.Current.ElectricityUnit : null,
                WaterUnit = x.Current != null && x.Current.RecordDate >= firstDay ? x.Current.WaterUnit : null,

                // ข้อมูลเดือนก่อน
                PrevElectricityUnit = x.Previous != null ? x.Previous.ElectricityUnit : null,
                PrevWaterUnit = x.Previous != null ? x.Previous.WaterUnit : null,

                // ✅ เพิ่มส่วนนี้: ส่งค่าเปลี่ยนมิเตอร์กลับไปด้วย
                ChangeElectricityMeterStart = x.Current != null ? x.Current.ChangeElectricityMeterStart : null,
                ChangeElectricityMeterEnd = x.Current != null ? x.Current.ChangeElectricityMeterEnd : null,
                ChangeWaterMeterStart = x.Current != null ? x.Current.ChangeWaterMeterStart : null,
                ChangeWaterMeterEnd = x.Current != null ? x.Current.ChangeWaterMeterEnd : null,

                // คำนวณหน่วยที่ใช้
                ElectricityUsed = CalculateUsedWithMeterChange(
                    x.Previous != null ? x.Previous.ElectricityUnit : null,
                    x.Current != null ? x.Current.ChangeElectricityMeterEnd : null,
                    x.Current != null ? x.Current.ChangeElectricityMeterStart : null,
                    x.Current != null && x.Current.RecordDate >= firstDay ? x.Current.ElectricityUnit : null
                ),

                WaterUsed = CalculateUsedWithMeterChange(
                    x.Previous != null ? x.Previous.WaterUnit : null,
                    x.Current != null ? x.Current.ChangeWaterMeterEnd : null,
                    x.Current != null ? x.Current.ChangeWaterMeterStart : null,
                    x.Current != null && x.Current.RecordDate >= firstDay ? x.Current.WaterUnit : null
                ),
            })
            .OrderBy(x => x.RoomNumber)
            .ToListAsync();

        return Ok(result);
    }

    // POST /utilitymeters
    [HttpPost]
    public async Task<IActionResult> Post([FromBody] PostUtilityMeter p)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var existing = await _db.UtilityMeter
            .FirstOrDefaultAsync(m =>
                m.RoomId == p.RoomId &&
                m.RecordDate.Year == p.RecordDate.Year &&
                m.RecordDate.Month == p.RecordDate.Month
            );

        if (existing != null)
        {
            // UPDATE
            existing.ElectricityUnit = p.ElectricityUnit;
            existing.WaterUnit = p.WaterUnit;
            existing.ChangeElectricityMeterStart = p.ChangeElectricityMeterStart;
            existing.ChangeElectricityMeterEnd = p.ChangeElectricityMeterEnd;
            existing.ChangeWaterMeterStart = p.ChangeWaterMeterStart;
            existing.ChangeWaterMeterEnd = p.ChangeWaterMeterEnd;
            existing.Note = p.Note;
        }
        else
        {
            // INSERT
            var meter = new UtilityMeter
            {
                RoomId = p.RoomId,
                RecordDate = p.RecordDate,
                ElectricityUnit = p.ElectricityUnit,
                WaterUnit = p.WaterUnit,
                ChangeElectricityMeterStart = p.ChangeElectricityMeterStart,
                ChangeElectricityMeterEnd = p.ChangeElectricityMeterEnd,
                ChangeWaterMeterStart = p.ChangeWaterMeterStart,
                ChangeWaterMeterEnd = p.ChangeWaterMeterEnd,
                Note = p.Note
            };
            _db.UtilityMeter.Add(meter);
        }

        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("bulk-upsert")]
    public async Task<IActionResult> BulkUpsert(
        [FromBody] List<UtilityMeterBulkDto> dtos)
    {
        if (dtos == null || !dtos.Any())
            return BadRequest("Empty payload");

        // ✅ เอาการกรอง Where(HasAnyInput) ออก เพื่อยอมรับ object ที่ส่งมาเป็น null ล้วนๆ (กรณีเคลียร์ค่า)
        var validDtos = dtos; 

        if (!validDtos.Any())
            return Ok("No data");

        foreach (var dto in validDtos)
        {
            var recordDate = dto.RecordDate ?? DateOnly.FromDateTime(DateTime.Today);

            var existing = await _db.UtilityMeter
                .Where(m =>
                    m.RoomId == dto.RoomId &&
                    m.RecordDate.Year == recordDate.Year &&
                    m.RecordDate.Month == recordDate.Month
                )
                .OrderByDescending(m => m.Id)
                .FirstOrDefaultAsync();

            bool isLocked = existing != null && !string.IsNullOrEmpty(existing.Note) && existing.Note.Trim().StartsWith("*");

            if (existing == null || isLocked)
            {
                // โค้ดส่วน INSERT ใช้ของเดิมได้เลย
                var newMeter = new UtilityMeter
                {
                    RoomId = dto.RoomId,
                    RecordDate = recordDate,
                    ElectricityUnit = dto.ElectricityUnit,
                    WaterUnit = dto.WaterUnit,
                    ChangeElectricityMeterStart = dto.ChangeElectricityMeterStart,
                    ChangeElectricityMeterEnd = dto.ChangeElectricityMeterEnd,
                    ChangeWaterMeterStart = dto.ChangeWaterMeterStart,
                    ChangeWaterMeterEnd = dto.ChangeWaterMeterEnd,
                    Note = dto.Note ?? ""
                };
                _db.UtilityMeter.Add(newMeter);
            }
            else
            {
                // 🟡 UPDATE
                // ✅ ลบ if (dto.xxx.HasValue) ออกให้หมด เพื่อให้ค่า null เซฟทับค่าเก่าได้
                existing.ElectricityUnit = dto.ElectricityUnit;
                existing.WaterUnit = dto.WaterUnit;
                
                existing.ChangeElectricityMeterStart = dto.ChangeElectricityMeterStart;
                existing.ChangeElectricityMeterEnd = dto.ChangeElectricityMeterEnd;
                existing.ChangeWaterMeterStart = dto.ChangeWaterMeterStart;
                existing.ChangeWaterMeterEnd = dto.ChangeWaterMeterEnd;

                if (dto.Note != null) 
                    existing.Note = dto.Note;

                existing.RecordDate = recordDate;
            }
        }

        await _db.SaveChangesAsync();
        return Ok();
    }

    // PUT /utilitymeters/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Put(uint id, [FromBody] PutUtilityMeter p)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var meter = await _db.UtilityMeter.FindAsync(id);
        if (meter == null)
            return NotFound(new { message = "Utility meter not found" });

        meter.RoomId = p.RoomId;
        meter.RecordDate = p.RecordDate;
        meter.ElectricityUnit = p.ElectricityUnit;
        meter.WaterUnit = p.WaterUnit;
        meter.ChangeElectricityMeterStart = p.ChangeElectricityMeterStart;
        meter.ChangeElectricityMeterEnd = p.ChangeElectricityMeterEnd;
        meter.ChangeWaterMeterStart = p.ChangeWaterMeterStart;
        meter.ChangeWaterMeterEnd = p.ChangeWaterMeterEnd;
        meter.Note = p.Note;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Updated successfully", id = meter.Id });
    }

    // DELETE /utilitymeters/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(uint id)
    {
        var meter = await _db.UtilityMeter.FindAsync(id);
        if (meter == null)
            return NotFound(new { message = "Utility meter not found" });

        _db.UtilityMeter.Remove(meter);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Deleted successfully", id });
    }
}