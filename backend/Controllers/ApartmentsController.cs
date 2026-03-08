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
public class ApartmentsController : ControllerBase
{
    private readonly ILogger<ApartmentsController> _logger;
    private readonly DormitoryDbContext _db;

    public ApartmentsController(
        ILogger<ApartmentsController> logger,
        DormitoryDbContext db)
    {
        _logger = logger;
        _db = db;
    }
    
    [HttpGet("{id}")]
    public async Task<ActionResult<Apartment>> GetId(uint id)
    {
        var apartment = await _db.Apartment.FindAsync(id);
        if (apartment == null)
        {
            return NotFound($"Apartment id {id} id not found.");
        }

        return Ok(apartment);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Apartment>>> GetAll()
    {
        var apartments = await _db.Apartment.ToListAsync();
        if (!apartments.Any())
        {
            return NoContent();
        }

        return Ok(apartments);
    }

    [HttpPost]
    public async Task<ActionResult<Apartment>> ApartmentCreate([FromBody] ApartmentPost dto)
    {
        var apartment = new Apartment
        {
          Name = dto.Name,
          Address = dto.Address,
          Phone = dto.Phone,
          LineId = dto.LineId,
          Email = dto.Email,
          PaymentDueStart = dto.PaymentDueStart,
          PaymentDueEnd = dto.PaymentDueEnd  
        };

        _db.Apartment.Add(apartment);
        await _db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetId),
            new {id = apartment.Id},
            apartment);
    }

    [HttpPut]
    public async Task<ActionResult<Apartment>> Edit([FromBody] ApartmentPut dto)
    {
        
    }

}