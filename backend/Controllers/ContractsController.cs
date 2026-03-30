using Microsoft.AspNetCore.Mvc;
using Dormitory.DormitoryModels;
using Microsoft.EntityFrameworkCore;
using Dormitory.DTOs;

namespace Dormitory.Controllers;

[ApiController]
[Route("[controller]")]
public class ContractsController : ControllerBase
{
    private readonly ILogger<ContractsController> _logger;
    private readonly DormitoryDbContext _db;

    public ContractsController(ILogger<ContractsController> logger, DormitoryDbContext db)
    {
        _logger = logger;
        _db = db;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Contract>> GetId(uint id)
    {
        // ตรวจสอบวันหมดอายุก่อนดึงข้อมูล
        await CheckAndUpdateExpiredContracts();

        var contract = await _db.Contract.FindAsync(id);
        if (contract == null)
            return NotFound($"Contract id {id} is not found.");
        return Ok(contract);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Contract>>> GetAll()
    {
        // ✅ เพิ่มการตรวจเช็ควันหมดอายุทุกครั้งที่มีการเรียกดูรายการทั้งหมด
        await CheckAndUpdateExpiredContracts();

        var contracts = await _db.Contract.ToListAsync();
        if (!contracts.Any()) return NoContent();
        return Ok(contracts);
    }

    [HttpPost]
    public async Task<ActionResult<Contract>> Post([FromBody] ContractPost dto)
    {
        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var contract = new Contract
            {
                RoomId = dto.RoomId,
                TenantId = dto.TenantId,
                Status = dto.Status,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                MonthlyRent = dto.MonthlyRent,
                Deposit = dto.Deposit,
                InitialElectricUnit = dto.InitialElectricUnit,
                InitialWaterUnit = dto.InitialWaterUnit,
                Note = dto.Note
            };

            _db.Contract.Add(contract);

            // อัปเดตสถานะห้องที่เกี่ยวข้อง
            await UpdateRoomStatus(dto.RoomId, dto.Status);

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return CreatedAtAction(nameof(GetId), new { id = contract.Id }, contract);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return BadRequest(new { message = "เกิดข้อผิดพลาดในการสร้างสัญญา", detail = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Contract>> Put(uint id, [FromBody] ContractPut dto)
    {
        var contract = await _db.Contract.FindAsync(id);
        if (contract == null)
            return NotFound($"Contract id {id} not found.");

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var oldRoomId = contract.RoomId;

            contract.RoomId = dto.RoomId;
            contract.TenantId = dto.TenantId;
            contract.Status = dto.Status;
            contract.StartDate = dto.StartDate;
            contract.EndDate = dto.EndDate;
            contract.MonthlyRent = dto.MonthlyRent;
            contract.Deposit = dto.Deposit;
            contract.InitialElectricUnit = dto.InitialElectricUnit;
            contract.InitialWaterUnit = dto.InitialWaterUnit;
            contract.Note = dto.Note;

            await UpdateRoomStatus(dto.RoomId, dto.Status);

            if (oldRoomId != dto.RoomId)
            {
                await UpdateRoomStatus(oldRoomId, "available");
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(contract);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return BadRequest(new { message = "เกิดข้อผิดพลาดในการอัปเดตสัญญา", detail = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(uint id)
    {
        var contract = await _db.Contract.FindAsync(id);
        if (contract == null)
            return NotFound(new { message = $"Contract id {id} not found" });

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            await UpdateRoomStatus(contract.RoomId, "available");

            _db.Contract.Remove(contract);
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { message = "Delete successfully", id });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return BadRequest(new { message = "เกิดข้อผิดพลาดในการลบสัญญา", detail = ex.Message });
        }
    }

    // --- Private Helper Methods ---

    // ✅ ฟังก์ชันใหม่: ตรวจสอบสัญญาที่ 'Active' แต่เลยวันที่ 'EndDate' แล้ว ให้เปลี่ยนเป็น 'Expired'
    private async Task CheckAndUpdateExpiredContracts()
    {
        var today = DateOnly.FromDateTime(DateTime.Today);

        // หาเฉพาะสัญญาที่ยังเป็น Active แต่หมดเวลาแล้ว
        var expiredContracts = await _db.Contract
            .Where(c => c.Status == "Active" && c.EndDate < today)
            .ToListAsync();

        if (expiredContracts.Any())
        {
            foreach (var contract in expiredContracts)
            {
                contract.Status = "Expired";
                // หมายเหตุ: ไม่ต้องอัปเดตสถานะห้อง เพราะ 'Expired' ใน MapContractStatusToRoomStatus คือ 'occupied' อยู่แล้ว
            }
            await _db.SaveChangesAsync();
        }
    }

    private async Task UpdateRoomStatus(uint roomId, string contractStatus)
    {
        var room = await _db.Room.FindAsync(roomId);
        if (room != null)
        {
            room.Status = MapContractStatusToRoomStatus(contractStatus);
        }
    }

    private string MapContractStatusToRoomStatus(string contractStatus)
    {
        if (string.IsNullOrWhiteSpace(contractStatus)) return "available";

        return contractStatus.ToLower() switch
        {
            "reserved"   => "reserved",
            "active"     => "occupied",
            "expired"    => "occupied",  // สัญญาหมดอายุ แต่ถือว่ายังมีคนอยู่
            "terminated" => "available", // สิ้นสุดสัญญา/ย้ายออก
            "cancle"     => "available", // ยกเลิกสัญญา
            "cancel"     => "available",
            _            => "available"
        };
    }
}