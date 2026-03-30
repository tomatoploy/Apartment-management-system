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
        var contract = await _db.Contract.FindAsync(id);
        if (contract == null)
            return NotFound($"Contract id {id} is not found.");
        return Ok(contract);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Contract>>> GetAll()
    {
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
            // เก็บ RoomId เดิมไว้เผื่อกรณีมีการเปลี่ยนห้องในสัญญา
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

            // 1. อัปเดตสถานะห้องปัจจุบัน (ตาม Status ใหม่)
            await UpdateRoomStatus(dto.RoomId, dto.Status);

            // 2. ถ้ามีการเปลี่ยน RoomId ในสัญญา ต้องคืนค่าห้องเก่าให้เป็นว่าง (available)
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
            // เมื่อลบสัญญา ให้คืนสถานะห้องเป็นว่าง
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
            "expired"    => "occupied",  // สัญญาหมดอายุ แต่ถือว่ายังมีคนอยู่ (ตามโจทย์)
            "terminated" => "available", // สิ้นสุดสัญญา/ย้ายออก
            "cancle"     => "available", // ยกเลิกสัญญา
            "cancel"     => "available",
            _            => "available"
        };
    }
}