using Microsoft.AspNetCore.Mvc;
using Dormitory.DormitoryModels;
using Microsoft.EntityFrameworkCore;
using Dormitory.DTOs;

namespace Dormitory.Controllers;

[ApiController]
[Route("[controller]")]
public class PermissionsController : ControllerBase
{
    private readonly ILogger<PermissionsController> _logger;
    private readonly DormitoryDbContext _db;

    public PermissionsController(
        ILogger<PermissionsController> logger,
        DormitoryDbContext db)
    {
        _logger = logger;
        _db = db;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Permission>> GetId(uint id)
    {
        var permission = await _db.Permission.FindAsync(id);
        if (permission == null)
            return NotFound($"Permission id {id} is not found.");
        
        return Ok(permission);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Permission>>> GetAll()
    {
        var permissions = await _db.Permission.ToListAsync();
        if (!permissions.Any())
            return NoContent();
        
        return Ok(permissions);
    }

    // Endpoint เพิ่มเติมสำหรับเช็คสิทธิ์ตอน Login ตามที่ระบุใน Business Logic
    [HttpGet("admin/{adminId}")]
    public async Task<ActionResult<IEnumerable<Permission>>> GetByAdminId(uint adminId)
    {
        var permissions = await _db.Permission.Where(p => p.AdminId == adminId).ToListAsync();
        if (!permissions.Any())
            return NoContent();
        
        return Ok(permissions);
    }

    [HttpPost]
    public async Task<ActionResult<Permission>> Post([FromBody] PermissionPost dto)
    {
        var permission = new Permission
        {
            // เติม .Value เพื่อยืนยันว่ามีค่าแน่นอน
            AdminId = dto.AdminId!.Value,
            ApartmentId = dto.ApartmentId!.Value
        };

        _db.Permission.Add(permission);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetId), new { id = permission.Id }, permission);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Permission>> Put(uint id, [FromBody] PermissionPut dto)
    {
        var permission = await _db.Permission.FindAsync(id);
        if (permission == null)
            return NotFound($"Permission id {id} not found.");

        // เติม .Value
        permission.AdminId = dto.AdminId!.Value;
        permission.ApartmentId = dto.ApartmentId!.Value;

        await _db.SaveChangesAsync();
        
        return Ok(permission);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(uint id)
    {
        var permission = await _db.Permission.FindAsync(id);
        if (permission == null)
            return NotFound(new { message = $"Permission id {id} not found" });
        
        _db.Permission.Remove(permission);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Delete successfully", id });
    }
}