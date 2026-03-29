using Dormitory.DormitoryModels;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// ✅ แก้ไขส่วนการลงทะเบียน CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        // ใช้ WithOrigins และเปลี่ยนเป็น " (Double Quote) ค่ะ
        policy.WithOrigins("https://apartment-management-system-webapp.onrender.com") 
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // เพิ่มไว้เพื่อให้รองรับการส่ง Cookie/Auth ถ้ามีในอนาคต
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

// อ่านค่า Port จาก Render
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://*:{port}");

// ลงทะเบียน HttpClient สำหรับใช้ส่งข้อความ LINE
builder.Services.AddHttpClient<Dormitory.Services.LineMessageService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// ✅ เรียกใช้งาน Middleware (ต้องวางไว้ก่อน MapControllers)
app.UseCors("AllowAll"); 

app.MapControllers();

app.Run();