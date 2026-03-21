using Microsoft.AspNetCore.Mvc;
using Dormitory.DormitoryModels;
using Microsoft.EntityFrameworkCore;
using Dormitory.DTOs;
 
namespace Dormitory.Controllers;
 
[ApiController]
[Route("[controller]")]
public class TenantsController : ControllerBase
{
    private readonly ILogger<TenantsController> _logger;
    private readonly DormitoryDbContext _db;
 
    public TenantsController(
        ILogger<TenantsController> logger,
        DormitoryDbContext db)
    {
        _logger = logger;
        _db = db;
    }
    
    [HttpGet("{id}")]
    public async Task<ActionResult<Tenant>> GetId(uint id)
    {
        var tenant = await _db.Tenant.FindAsync(id);
        if (tenant == null)
        {
            return NotFound($"Tenant id {id} is not found.");
        }
 
        return Ok(tenant);
    }
 
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Tenant>>> GetAll()
    {
        var tenants = await _db.Tenant.ToListAsync();
        if (!tenants.Any())
        {
            return NoContent();
        }
 
        return Ok(tenants);
    }

    //for search firstname & lastname
    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<Tenant>>> Search([FromQuery] string? name)
    {
        var query = _db.Tenant.AsQueryable();

        if (!string.IsNullOrWhiteSpace(name))
        {
            query = query.Where(t => 
                (t.FirstName != null && t.FirstName.Contains(name)) || 
                (t.LastName != null && t.LastName.Contains(name))
            );
        }

        return await query.ToListAsync();
    }
 
    [HttpPost]
    public async Task<ActionResult<Tenant>> TenantCreate([FromBody] TenantPost dto)
    {
        var duplicateNin = await _db.Tenant.AnyAsync(t => t.Nin == dto.Nin);
        if (duplicateNin) 
            return BadRequest(new { message = "เลขบัตรประชาชนนี้มีในระบบแล้ว" });

        var tenant = new Tenant
        {
          Nin = dto.Nin,
          Title = dto.Title,
          FirstName = dto.FirstName,
          LastName = dto.LastName,
          NickName = dto.NickName,
          Phone = dto.Phone,
          Address = dto.Address,
          BirthDate = dto.BirthDate,
          LineId = dto.LineId,
          Email = dto.Email,
          Photo = dto.Photo,
          AltName = dto.AltName,
          AltPhone = dto.AltPhone,
          AltRelationship = dto.AltRelationship,
          VehicleNum1 = dto.VehicleNum1,
          VehicleDetail1 = dto.VehicleDetail1,
          VehicleNum2 = dto.VehicleNum2,
          VehicleDetail2 = dto.VehicleDetail2,
          KeyCard1 = dto.KeyCard1,
          KeyCard2 = dto.KeyCard2,
          KeyCard3 = dto.KeyCard3,
          IsLaundryService = dto.IsLaundryService,
          InternetDeviceCount = dto.InternetDeviceCount,
          Note = dto.Note
        };
 
        _db.Tenant.Add(tenant);
        await _db.SaveChangesAsync();
 
        return CreatedAtAction(
            nameof(GetId),
            new {id = tenant.Id},
            tenant);
    }
 
    [HttpPut("{id}")]
    public async Task<ActionResult<Tenant>> Put(uint id, [FromBody] TenantPut dto)
    {
        var tenant = await _db.Tenant.FindAsync(id);
        if (tenant == null)
            return NotFound($"Tenant id {id} not found.");
 
        tenant.Nin = dto.Nin;
        tenant.Title = dto.Title;
        tenant.FirstName = dto.FirstName;
        tenant.LastName = dto.LastName;
        tenant.NickName = dto.NickName;
        tenant.Phone = dto.Phone;
        tenant.Address = dto.Address;
        tenant.BirthDate = dto.BirthDate;
        tenant.LineId = dto.LineId;
        tenant.Email = dto.Email;
        tenant.Photo = dto.Photo;
        tenant.AltName = dto.AltName;
        tenant.AltPhone = dto.AltPhone;
        tenant.AltRelationship = dto.AltRelationship;
        tenant.VehicleNum1 = dto.VehicleNum1;
        tenant.VehicleDetail1 = dto.VehicleDetail1;
        tenant.VehicleNum2 = dto.VehicleNum2;
        tenant.VehicleDetail2 = dto.VehicleDetail2;
        tenant.KeyCard1 = dto.KeyCard1;
        tenant.KeyCard2 = dto.KeyCard2;
        tenant.KeyCard3 = dto.KeyCard3;
        tenant.IsLaundryService = dto.IsLaundryService;
        tenant.InternetDeviceCount = dto.InternetDeviceCount;
        tenant.Note = dto.Note;
 
        await _db.SaveChangesAsync();
 
        return Ok(tenant);
    }
 
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(uint id)
    {
        var tenant = await _db.Tenant.FindAsync(id);
        if (tenant == null)
            return NotFound(new {message = $"Tenant id {id} not found"});
        _db.Tenant.Remove(tenant);
        await _db.SaveChangesAsync();
 
        return Ok(new {message = "Delete successfully", id});
    }
}