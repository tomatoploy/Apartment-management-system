using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Dormitory.DormitoryModels;
using Dormitory.DTOs;

namespace Dormitory.Controllers;


[ApiController]
[Route("[controller]")]
public class UtilityMetersController : ControllerBase
{
    private static uint CalculateUsedUnit(uint? previous, uint? current)
    {
        if (!previous.HasValue || !current.HasValue)
            return 0;

        if (current.Value >= previous.Value)
            return current.Value - previous.Value;

        var length = previous.Value.ToString().Length;
        var maxMeter = uint.Parse(new string('9', length));

        return (maxMeter - previous.Value) + current.Value + 1;
    }

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

                // current month
                Current = _db.UtilityMeter
                    .Where(m =>
                        m.RoomId == r.Id &&
                        m.RecordDate >= firstDay &&
                        m.RecordDate <= lastDay
                    )
                    .OrderByDescending(m => m.RecordDate)
                    .FirstOrDefault(),

                // previous (ล่าสุดก่อนเดือนนี้)
                Previous = _db.UtilityMeter
                    .Where(m =>
                        m.RoomId == r.Id &&
                        m.RecordDate < firstDay
                    )
                    .OrderByDescending(m => m.RecordDate)
                    .FirstOrDefault()
            })
            .Select(x => new UtilityMeterMonthlyDto
            {
                RoomId = x.Id,
                RoomNumber = x.Number,
                Floor = x.Floor,

                ElectricityUnit = x.Current != null
                    ? x.Current.ElectricityUnit
                    : null,

                WaterUnit = x.Current != null
                    ? x.Current.WaterUnit
                    : null,

                PrevElectricityUnit = x.Previous != null
                    ? x.Previous.ElectricityUnit
                    : null,

                PrevWaterUnit = x.Previous != null
                    ? x.Previous.WaterUnit
                    : null,

                ElectricityUsed = CalculateUsedUnit(
                    x.Previous != null ? x.Previous.ElectricityUnit : null,
                    x.Current != null ? x.Current.ElectricityUnit : null
                ),

                WaterUsed = CalculateUsedUnit(
                    x.Previous != null ? x.Previous.WaterUnit : null,
                    x.Current != null ? x.Current.WaterUnit : null
                )
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

        // 👉 กรองเฉพาะอันที่มีการกรอกค่า
        var validDtos = dtos
            .Where(HasAnyInput)
            .ToList();

        if (!validDtos.Any())
            return Ok("No data to update or insert");

        // ---------------- UPDATE ----------------
        var updateIds = validDtos
            .Where(d => d.Id.HasValue)
            .Select(d => d.Id!.Value)
            .ToList();

        var existingMeters = await _db.UtilityMeter
            .Where(m => updateIds.Contains(m.Id))
            .ToListAsync();

        foreach (var meter in existingMeters)
        {
            var dto = validDtos.First(d => d.Id == meter.Id);

            if (dto.ElectricityUnit.HasValue)
                meter.ElectricityUnit = dto.ElectricityUnit;

            if (dto.WaterUnit.HasValue)
                meter.WaterUnit = dto.WaterUnit;

            if (dto.ChangeElectricityMeterStart.HasValue)
                meter.ChangeElectricityMeterStart = dto.ChangeElectricityMeterStart;

            if (dto.ChangeElectricityMeterEnd.HasValue)
                meter.ChangeElectricityMeterEnd = dto.ChangeElectricityMeterEnd;

            if (dto.ChangeWaterMeterStart.HasValue)
                meter.ChangeWaterMeterStart = dto.ChangeWaterMeterStart;

            if (dto.ChangeWaterMeterEnd.HasValue)
                meter.ChangeWaterMeterEnd = dto.ChangeWaterMeterEnd;

            if (!string.IsNullOrWhiteSpace(dto.Note))
                meter.Note = dto.Note;
        }

        // ---------------- INSERT ----------------
        var newMeters = validDtos
            .Where(d => !d.Id.HasValue)
            .Select(d => new UtilityMeter
            {
                RoomId = d.RoomId,
                ElectricityUnit = d.ElectricityUnit ?? 0,
                WaterUnit = d.WaterUnit ?? 0,
                ChangeElectricityMeterStart = d.ChangeElectricityMeterStart,
                ChangeElectricityMeterEnd = d.ChangeElectricityMeterEnd,
                ChangeWaterMeterStart = d.ChangeWaterMeterStart,
                ChangeWaterMeterEnd = d.ChangeWaterMeterEnd,
                Note = d.Note
            })
            .ToList();

        if (newMeters.Any())
            await _db.UtilityMeter.AddRangeAsync(newMeters);

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

    [HttpPut("bulk")]
    public async Task<IActionResult> UpdateBulk(
        [FromBody] List<UtilityMeterBulkDto> dtos)
    {
        if (dtos == null || !dtos.Any())
            return BadRequest("Empty payload");

        // 👉 เอาเฉพาะ dto ที่มี input จริง
        var validDtos = dtos
            .Where(d => d.Id.HasValue)
            .Where(HasAnyInput)
            .ToList();

        if (!validDtos.Any())
            return Ok("No data to update");

        var ids = validDtos
            .Select(d => d.Id!.Value)
            .ToList();

        var meters = await _db.UtilityMeter
            .Where(m => ids.Contains(m.Id))
            .ToListAsync();

        foreach (var meter in meters)
        {
            var dto = validDtos.First(d => d.Id == meter.Id);

            if (dto.ElectricityUnit.HasValue)
                meter.ElectricityUnit = dto.ElectricityUnit;

            if (dto.WaterUnit.HasValue)
                meter.WaterUnit = dto.WaterUnit;

            if (dto.ChangeElectricityMeterStart.HasValue)
                meter.ChangeElectricityMeterStart = dto.ChangeElectricityMeterStart;

            if (dto.ChangeElectricityMeterEnd.HasValue)
                meter.ChangeElectricityMeterEnd = dto.ChangeElectricityMeterEnd;

            if (dto.ChangeWaterMeterStart.HasValue)
                meter.ChangeWaterMeterStart = dto.ChangeWaterMeterStart;

            if (dto.ChangeWaterMeterEnd.HasValue)
                meter.ChangeWaterMeterEnd = dto.ChangeWaterMeterEnd;

            if (!string.IsNullOrWhiteSpace(dto.Note))
                meter.Note = dto.Note;
        }

        await _db.SaveChangesAsync();
        return Ok();
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