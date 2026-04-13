using Microsoft.AspNetCore.Mvc;
using Dormitory.DormitoryModels;
using Microsoft.EntityFrameworkCore;

namespace Dormitory.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly ILogger<HealthController> _logger;
    private readonly DormitoryDbContext _db;

    // รับ DbContext เข้ามาเพื่อใช้ยิง Query เช็ค Database
    public HealthController(
        ILogger<HealthController> logger,
        DormitoryDbContext db)
    {
        _logger = logger;
        _db = db;
    }

    [HttpGet("ping")]
    public async Task<IActionResult> Ping()
    {
        try
        {
            // ยิง Query เปล่าๆ 1 คำสั่ง เพื่อกระตุ้นไม่ให้ TiDB หลับ
            await _db.Database.ExecuteSqlRawAsync("SELECT 1");
            
            _logger.LogInformation("Health check ping received. System is awake.");
            
            return Ok(new { 
                status = "Awake", 
                message = "Phet Ploy Place System is ready." 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed. Database might be sleeping or unreachable.");
            
            // ถ้าต่อ DB ไม่ติดจริงๆ ก็ return 500 กลับไปให้รู้ว่ามีปัญหา
            return StatusCode(500, new { 
                status = "Error", 
                message = "Database is waking up or connection failed: " + ex.Message 
            });
        }
    }
}