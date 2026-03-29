using Dormitory.DormitoryModels;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// ✅ 1. ตั้งค่า CORS (รองรับทั้งตอน Dev ในเครื่อง และตอนออนไลน์บน Render)
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

builder.Services.AddControllers();

builder.Services.AddDbContext<DormitoryDbContext>(options =>
    options.UseMySql(
        connectionString,
        ServerVersion.AutoDetect(connectionString)
    )
);

builder.Services.AddOpenApi();

// ✅ 2. อ่านค่า Port จาก Render
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://*:{port}");

// ✅ 3. ลงทะเบียน HttpClient สำหรับใช้ส่งข้อความ LINE
builder.Services.AddHttpClient<Dormitory.Services.LineMessageService>();

var app = builder.Build();

// ─────────────────────────────────────────────────────────────
// ✅ 4. ลำดับของ Middleware (Pipeline) ตรงนี้สำคัญมาก ห้ามสลับที่กันนะคะ!
// ─────────────────────────────────────────────────────────────

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// ⚠️ คอมเมนต์ HttpsRedirection ไว้ก่อน เพราะบน Render ตัว Render จะจัดการแปลง HTTP เป็น HTTPS ให้เราเอง 
// การเปิดไว้บางครั้งจะทำให้เกิดการชนกันของ Port (Redirect Loop) จน CORS พังค่ะ
// app.UseHttpsRedirection(); 

app.UseRouting(); // ต้องเรียก Routing ก่อน

app.UseCors("AllowAll"); // ต้องเรียก Cors ตรงนี้ (หลัง Routing แต่ก่อน Auth และ Controllers)

app.UseAuthorization(); // ระบบ Login/Token (ใส่ไว้เป็นมาตรฐานเผื่อพลอยมีระบบ JWT Token)

app.MapControllers(); // ท้ายสุดคือ Map เส้นทาง API

app.Run();