using Microsoft.AspNetCore.Mvc;
using Dormitory.DormitoryModels;
using Microsoft.EntityFrameworkCore;
using Dormitory.DTOs;

namespace Dormitory.Controllers;

[ApiController]
[Route("[controller]")]
public class DocumentsController : ControllerBase
{
    private readonly ILogger<DocumentsController> _logger;
    private readonly DormitoryDbContext _db;

    public DocumentsController(
        ILogger<DocumentsController> logger,
        DormitoryDbContext db)
    {
        _logger = logger;
        _db = db;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Document>> GetId(uint id)
    {
        var document = await _db.Document.FindAsync(id);
        if (document == null)
            return NotFound($"Document id {id} is not found.");
        
        return Ok(document);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Document>>> GetAll()
    {
        var documents = await _db.Document.ToListAsync();
        if (!documents.Any())
            return NoContent();
        
        return Ok(documents);
    }

    [HttpPost]
    public async Task<ActionResult<Document>> Post([FromBody] DocumentPost dto)
    {
        var document = new Document
        {
            // เติม .Value
            AdminId = dto.AdminId!.Value,
            Name = dto.Name,
            // ป้องกัน Warning CS8601 กรณี Model สร้างมาเป็น Non-nullable
            Content = dto.Content ?? string.Empty 
        };

        _db.Document.Add(document);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetId), new { id = document.Id }, document);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Document>> Put(uint id, [FromBody] DocumentPut dto)
    {
        var document = await _db.Document.FindAsync(id);
        if (document == null)
            return NotFound($"Document id {id} not found.");

        // เติม .Value
        document.AdminId = dto.AdminId!.Value;
        document.Name = dto.Name;
        document.Content = dto.Content ?? string.Empty;

        await _db.SaveChangesAsync();

        return Ok(document);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(uint id)
    {
        var document = await _db.Document.FindAsync(id);
        if (document == null)
            return NotFound(new { message = $"Document id {id} not found" });
        
        _db.Document.Remove(document);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Delete successfully", id });
    }
}