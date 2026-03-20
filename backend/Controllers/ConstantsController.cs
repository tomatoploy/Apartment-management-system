using Microsoft.AspNetCore.Mvc;
using Dormitory.DormitoryModels;
using Microsoft.EntityFrameworkCore;
using Dormitory.DTOs;

namespace Dormitory.Controllers;

[ApiController]
[Route("[controller]")]
public class ConstantsController : ControllerBase
{
    private readonly ILogger<ConstantsController> _logger;
    private readonly DormitoryDbContext _db;

    public ConstantsController(
        ILogger<ConstantsController> logger,
        DormitoryDbContext db)
    {
        _logger = logger;
        _db = db;
    }

    // 1. Get by ID
    [HttpGet("{id}")]
    public async Task<ActionResult<Constant>> GetId(uint id)
    {
        var constant = await _db.Constant.FindAsync(id);
        if (constant == null)
        {
            return NotFound($"Constant id {id} is not found.");
        }

        return Ok(constant);
    }

    // 2. Get All
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Constant>>> GetAll()
    {
        var constants = await _db.Constant.ToListAsync();
        if (!constants.Any())
        {
            return NoContent();
        }

        return Ok(constants);
    }

    // 3. Search by Category or Subject
    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<Constant>>> Search([FromQuery] string? keyword)
    {
        var query = _db.Constant.AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(c => 
                (c.Category.Contains(keyword)) || 
                (c.Subject != null && c.Subject.Contains(keyword))
            );
        }

        return await query.ToListAsync();
    }

    // 4. Create (Post)
    [HttpPost]
    public async Task<ActionResult<Constant>> ConstantCreate([FromBody] ConstantPost dto)
    {
        var constant = new Constant
        {
            Category = dto.Category,
            Subject = dto.Subject,
            Cost = dto.Cost,
            Note = dto.Note
        };

        _db.Constant.Add(constant);
        await _db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetId),
            new { id = constant.Id },
            constant);
    }

    // 5. Update (Put)
    [HttpPut("{id}")]
    public async Task<ActionResult<Constant>> Put(uint id, [FromBody] ConstantPut dto)
    {
        var constant = await _db.Constant.FindAsync(id);
        if (constant == null)
            return NotFound($"Constant id {id} not found.");

        constant.Category = dto.Category;
        constant.Subject = dto.Subject;
        constant.Cost = dto.Cost;
        constant.Note = dto.Note;

        await _db.SaveChangesAsync();

        return Ok(constant);
    }

    // 6. Delete
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(uint id)
    {
        var constant = await _db.Constant.FindAsync(id);
        if (constant == null)
            return NotFound(new { message = $"Constant id {id} not found" });

        _db.Constant.Remove(constant);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Delete successfully", id });
    }
}