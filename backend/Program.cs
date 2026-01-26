using Dormitory.DormitoryModels;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

//ลงทะเบียน CORS Service มาแก้ตรงนี้หลัง dev เสร็จ
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()   // อนุญาตทุก Domain (สะดวกตอนพัฒนา)
              .AllowAnyMethod()   // อนุญาตทุก HTTP Method (GET, POST, PUT, DELETE)
              .AllowAnyHeader();  // อนุญาตทุก Header
    });
});

builder.Services.AddControllers();

builder.Services.AddDbContext<DormitoryDbContext>(options =>
    options.UseMySql(
        connectionString,
        ServerVersion.AutoDetect(connectionString)
    )
);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll"); //เรียกใช้งาน Middleware
app.MapControllers();

app.Run();

