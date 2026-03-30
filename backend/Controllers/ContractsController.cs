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

    public ContractsController(
        ILogger<ContractsController> logger,
        DormitoryDbContext db)
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
        if (!contracts.Any())
            return NoContent();
        
        return Ok(contracts);
    }

    [HttpPost]
    public async Task<ActionResult<Contract>> Post([FromBody] ContractPost dto)
    {
        // 🌟 ใช้ Transaction เพื่อผูกการทำงานของการสร้างสัญญาและการอัปเดตห้องเข้าด้วยกัน
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
            await _db.SaveChangesAsync(); // เซฟสัญญาเพื่อเอา Contract.Id ก่อน

            // 🌟 ลอจิกอัปเดตสถานะห้องอัตโนมัติ
            var room = await _db.Room.FindAsync(dto.RoomId);
            if (room != null)
            {
                if (contract.Status == "Active") 
                    room.Status = "occupied";
                else if (contract.Status == "Reserved") 
                    room.Status = "reserved";
                
                await _db.SaveChangesAsync(); // เซฟสถานะห้อง
            }

            await transaction.CommitAsync(); // ยืนยันการบันทึกข้อมูลทั้งหมด
            return CreatedAtAction(nameof(GetId), new {id = contract.Id}, contract);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(); // ถ้ายกเลิกหรือพัง จะย้อนกลับข้อมูลทั้งหมด
            _logger.LogError($"Error Post Contract: {ex.Message}");
            return StatusCode(500, "เกิดข้อผิดพลาดในการบันทึกสัญญาและห้อง");
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Contract>> Put(uint id, [FromBody] ContractPut dto)
    {
        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var contract = await _db.Contract.FindAsync(id);
            if (contract == null)
                return NotFound($"Contract id {id} not found.");

            // เก็บค่าสถานะเดิมไว้เทียบ
            string oldStatus = contract.Status;

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

            await _db.SaveChangesAsync();

            // 🌟 ลอจิกอัปเดตสถานะห้องเมื่อสถานะสัญญาเปลี่ยน
            if (oldStatus != contract.Status)
            {
                var room = await _db.Room.FindAsync(dto.RoomId);
                if (room != null)
                {
                    if (contract.Status == "Active") 
                        room.Status = "occupied";
                    else if (contract.Status == "Reserved") 
                        room.Status = "reserved";
                    else if (contract.Status == "Terminated" || contract.Status == "cancle") 
                        room.Status = "available";

                    await _db.SaveChangesAsync();
                }
            }

            await transaction.CommitAsync();
            return Ok(contract);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError($"Error Put Contract: {ex.Message}");
            return StatusCode(500, "เกิดข้อผิดพลาดในการอัปเดตสัญญาและห้อง");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(uint id)
    {
        // 🌟 ถ้าลบสัญญา อาจจะต้องคืนสถานะห้องให้เป็น available ด้วย
        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var contract = await _db.Contract.FindAsync(id);
            if (contract == null)
                return NotFound(new {message = $"Contract id {id} not found"});
            
            uint roomId = contract.RoomId; // เก็บไอดีห้องไว้ก่อนลบสัญญา

            _db.Contract.Remove(contract);
            await _db.SaveChangesAsync();

            // คืนสถานะห้องเป็นว่าง
            var room = await _db.Room.FindAsync(roomId);
            if (room != null)
            {
                room.Status = "available";
                await _db.SaveChangesAsync();
            }

            await transaction.CommitAsync();
            return Ok(new {message = "Delete successfully", id});
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError($"Error Delete Contract: {ex.Message}");
            return StatusCode(500, "เกิดข้อผิดพลาดในการลบสัญญา");
        }
    }
}