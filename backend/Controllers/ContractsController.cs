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
            AttachedFile = dto.AttachedFile
        };

        _db.Contract.Add(contract);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetId), new {id = contract.Id}, contract);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Contract>> Put(uint id, [FromBody] ContractPut dto)
    {
        var contract = await _db.Contract.FindAsync(id);
        if (contract == null)
            return NotFound($"Contract id {id} not found.");

        contract.RoomId = dto.RoomId;
        contract.TenantId = dto.TenantId;
        contract.Status = dto.Status;
        contract.StartDate = dto.StartDate;
        contract.EndDate = dto.EndDate;
        contract.MonthlyRent = dto.MonthlyRent;
        contract.Deposit = dto.Deposit;
        contract.InitialElectricUnit = dto.InitialElectricUnit;
        contract.InitialWaterUnit = dto.InitialWaterUnit;
        contract.AttachedFile = dto.AttachedFile;
 
        await _db.SaveChangesAsync();
 
        return Ok(contract);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(uint id)
    {
        var contract = await _db.Contract.FindAsync(id);
        if (contract == null)
            return NotFound(new {message = $"Contract id {id} not found"});
        _db.Contract.Remove(contract);
        await _db.SaveChangesAsync();
 
        return Ok(new {message = "Delete successfully", id});
    }
}