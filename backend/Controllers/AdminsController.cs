using Microsoft.AspNetCore.Mvc;
using Dormitory.DormitoryModels;
using Microsoft.EntityFrameworkCore;
using Dormitory.DTOs;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Dormitory.Controllers;

[ApiController]
[Route("[controller]")]
public class AdminsController : ControllerBase
{
    private readonly ILogger<AdminsController> _logger;
    private readonly DormitoryDbContext _db;

    public AdminsController(
        ILogger<AdminsController> logger,
        DormitoryDbContext db)
    {
        _logger = logger;
        _db = db;
    }

    private (string hash, string salt) HashPassword(string password)
    {
        byte[] saltBytes = RandomNumberGenerator.GetBytes(16);
        string salt = Convert.ToBase64String(saltBytes);

        byte[] hashBytes = SHA256.HashData(
            Encoding.UTF8.GetBytes(password + salt)
        );

        return (Convert.ToBase64String(hashBytes), salt);
    }

    [HttpGet]
    [Route("{Id}")]
    public async Task<ActionResult<Admin>> GetAdmin(uint id)
    {
        var admin = await _db.Admin.FirstOrDefaultAsync(a => a.Id == id && a.IsDisabled == 0);
        
        if (admin == null)
            return NotFound(new { message = "Admin not found" });
        
        return Ok(new {admin.Id, admin.Title, admin.FirstName, admin.LastName, admin.Phone, admin.Email, admin.Signature});
    }

    [HttpPost]
    [Route("")]
    public async Task<IActionResult> Post([FromBody] DTOs.PostAdmin p)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        //เช็ก Email / Phone ซ้ำ
        var existingAdmin = await _db.Admin
            .FirstOrDefaultAsync(a => a.Phone == p.Phone || a.Email == p.Email);

        if (existingAdmin != null)
        {
            //ซ้ำ = เปิดใช้งาน account เดิม
            existingAdmin.IsDisabled = 0;

            await _db.SaveChangesAsync();
            return Ok(new {message = "Admin already exists, account re-activated",id = existingAdmin.Id});
        }

        var (hash, salt) = HashPassword(p.Password);

        var newAdmin = new Admin
        {
            IsDisabled = 0,
            Title = p.Title,
            FirstName = p.FirstName,
            LastName = p.LastName,
            Phone = p.Phone,
            Email = p.Email,
            Signature = p.Signature,
            Password = hash,
            Salt = salt
        };

        await _db.Admin.AddAsync(newAdmin);
        await _db.SaveChangesAsync();
        
        return Ok(new { id = newAdmin.Id });
    }

    [HttpPost("login")]
    public IActionResult Login(LoginDto dto)
    {
        var admin = _db.Admin
            .FirstOrDefault(x => x.Phone == dto.Phone && x.IsDisabled == 0);

        if (admin == null)
            return Unauthorized("ไม่พบผู้ใช้");

        // hash รหัสที่ผู้ใช้กรอก + salt เดิม
        byte[] hashBytes = SHA256.HashData(
            Encoding.UTF8.GetBytes(dto.Password + admin.Salt)
        );
        string inputHash = Convert.ToBase64String(hashBytes);

        if (inputHash != admin.Password)
            return Unauthorized("รหัสผ่านไม่ถูกต้อง");

        return Ok(new
        {
            message = "Login success",
            adminId = admin.Id
        });
    }

    [HttpPut]
    [Route("{Id}")]
    public async Task<IActionResult> Put(uint id, [FromBody] DTOs.PutAdmin p)
    {
        var admin = await _db.Admin.FirstOrDefaultAsync(a => a.Id == id && a.IsDisabled == 0);

        if (admin == null)
            return NotFound(new { message = "Admin not found" });
        
        var duplicate = await _db.Admin.AnyAsync(a =>
            a.Id != id &&
            (a.Email == p.Email || a.Phone == p.Phone) &&
            a.IsDisabled == 0
        );

        if (duplicate)
            return BadRequest(new { message = "Email or phone already in use" });
        
        admin.Title = p.Title;
        admin.FirstName = p.FirstName;
        admin.LastName = p.LastName;
        admin.Phone = p.Phone;
        admin.Email = p.Email;
        admin.Signature = p.Signature;
        
        //เปลี่ยนรหัสผ่านเฉพาะตอนที่ส่งมา
        if (!string.IsNullOrWhiteSpace(p.Password))
        {
            var (hash, salt) = HashPassword(p.Password);
            admin.Password = hash;
            admin.Salt = salt;
        }

        await _db.SaveChangesAsync();

        return Ok(new { message = "Updated successfully", id = admin.Id });
    }

    [HttpDelete]
    [Route("{Id}")]
    public async Task<IActionResult> DeleteAdmin(uint id)
    {
        var admin = await _db.Admin.FindAsync(id);

        if (admin == null)
            return NotFound(new { message = "Admin not found" });

        //ลบ permission ของ admin คนนี้ทั้งหมด
        var permissions = await _db.Permission
            .Where(p => p.AdminId == id)
            .ToListAsync();

        if (permissions.Any())
        {
            _db.Permission.RemoveRange(permissions);
        }
        
        admin.IsDisabled = 1;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Admin deleted successfully", id = admin.Id });
    }
}