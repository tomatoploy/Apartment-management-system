using Dormitory.DormitoryModels;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// ตั้งค่า CORS (รองรับทั้งตอน Dev ในเครื่อง และตอนออนไลน์บน Render)
// อนุญาตให้ URL เหล่านี้เข้ามาดึงข้อมูลได้ (ห้ามมี / ต่อท้าย URL)
var allowedOrigins = new[] 
{ 
    "https://apartment-management-system-webapp.onrender.com", // ของจริงบน Render
    "http://localhost:3000",                                   // สำหรับเทส React ปกติ
    "http://localhost:5173"                                    // สำหรับเทส Vite
};

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // จำเป็นสำหรับการใช้งาน Token / ระบบ Login
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// ✅ ส่วนที่แก้ที่ 1: เพิ่มการตั้งค่าให้พยายามเชื่อมต่อ Database ใหม่ถ้า TiDB หลับ (Retry)
builder.Services.AddDbContext<DormitoryDbContext>(options =>
    options.UseMySql(
        connectionString,
        ServerVersion.AutoDetect(connectionString),
        mySqlOptions => 
        {
            // ให้พยายามต่อใหม่ 5 ครั้ง เว้นระยะครั้งละ 10 วินาที
            mySqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5, 
                maxRetryDelay: TimeSpan.FromSeconds(10), 
                errorNumbersToAdd: null
            );
        }
    )
);

builder.Services.AddOpenApi();

//อ่านค่า Port จาก Render
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://*:{port}");

//ลงทะเบียน HttpClient สำหรับใช้ส่งข้อความ LINE
builder.Services.AddHttpClient<Dormitory.Services.LineMessageService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// app.UseHttpsRedirection(); 

app.UseRouting();

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers(); // Map เส้นทาง API

app.Run();