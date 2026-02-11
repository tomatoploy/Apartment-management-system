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
    
    // [HttpGet("{id}")]
    // public async Task<ActionResult<GetApartment>> Get(uint id)
    // {
        
    // }
}