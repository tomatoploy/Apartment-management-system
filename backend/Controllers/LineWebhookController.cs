using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text;
using Dormitory.DormitoryModels;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging; // เพิ่มสำหรับเก็บ Log

namespace Dormitory.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LineWebhookController : ControllerBase
    {
        private readonly DormitoryDbContext _context;
        private readonly HttpClient _httpClient;
        private readonly ILogger<LineWebhookController> _logger; // เปลี่ยนมาใช้ Logger แทน Console
        
        // ดึง Token จาก Environment Variable ของ Render (ถ้าไม่มีจะใช้ค่าสำรอง)
        private readonly string _channelAccessToken = Environment.GetEnvironmentVariable("Line__ChannelAccessToken") ?? "YOUR_CHANNEL_ACCESS_TOKEN";

        public LineWebhookController(DormitoryDbContext context, HttpClient httpClient, ILogger<LineWebhookController> logger)
        {
            _context = context;
            _httpClient = httpClient;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> ReceiveWebhook([FromBody] JsonElement payload)
        {
            try
            {
                // 1. ตรวจสอบว่ามี Event ส่งมาจาก LINE หรือไม่
                if (payload.TryGetProperty("events", out JsonElement events) && events.GetArrayLength() > 0)
                {
                    foreach (var ev in events.EnumerateArray())
                    {
                        var eventType = ev.GetProperty("type").GetString();
                        
                        // สนใจเฉพาะ Event ที่เป็นการ "ส่งข้อความ"
                        if (eventType == "message")
                        {
                            var messageType = ev.GetProperty("message").GetProperty("type").GetString();
                            
                            // สนใจเฉพาะข้อความประเภท "ตัวอักษร"
                            if (messageType == "text")
                            {
                                var text = ev.GetProperty("message").GetProperty("text").GetString()?.Trim() ?? "";
                                var replyToken = ev.GetProperty("replyToken").GetString() ?? "";
                                
                                // 🎯 ดึง UID ของคนที่ทักมา
                                var userId = ev.GetProperty("source").GetProperty("userId").GetString() ?? ""; 

                                // 2. ดักจับคีย์เวิร์ดคำว่า "ผูกบัญชี"
                                if (text.StartsWith("ผูกบัญชี"))
                                {
                                    // 🌟 ทำความสะอาดข้อมูล: ลบคำว่า "ผูกบัญชี", ลบขีด (-), ลบช่องว่างออก ให้เหลือแค่ตัวเลข
                                    var phone = text.Replace("ผูกบัญชี", "")
                                                    .Replace("-", "")
                                                    .Replace(" ", "")
                                                    .Trim();
                                    
                                    // เรียกฟังก์ชันไปบันทึกลง Database
                                    await HandleLinkAccount(userId, phone, replyToken);
                                }
                            }
                        }
                    }
                }
                
                // บอก LINE ว่าได้รับข้อความเรียบร้อยแล้ว (สำคัญมาก ห้ามเอาออก)
                return Ok(); 
            }
            catch (Exception ex)
            {
                _logger.LogError($"Webhook Error: {ex.Message}");
                return StatusCode(500);
            }
        }

        // ฟังก์ชันสำหรับค้นหาลูกบ้านและบันทึก UID ลง Database
        private async Task HandleLinkAccount(string userId, string phone, string replyToken)
        {
            string replyMessage;

            // 3. ค้นหาลูกบ้านจากเบอร์โทรที่พิมพ์เข้ามา
            var tenant = await _context.Tenant.FirstOrDefaultAsync(t => t.Phone == phone);

            if (tenant != null)
            {
                // 🌟 4. ถ้าเจอตัว ให้เอา UID ไปใส่ในคอลัมน์ Note (แทน LineId)
                tenant.Note = userId;
                await _context.SaveChangesAsync();

                // ข้อความตอบกลับเมื่อสำเร็จ (จัดหน้าชิดขอบซ้ายเพื่อให้แสดงผลใน LINE สวยงาม)
                replyMessage = $"""
✨ ผูกบัญชีเรียบร้อยแล้ว

สวัสดีคุณ {tenant.FirstName} {tenant.LastName}
ระบบได้เชื่อมต่อบัญชี LINE ของท่านเข้ากับฐานข้อมูลหอพักแล้วค่ะ

ท่านจะได้รับการแจ้งเตือนบิลค่าเช่า และข่าวสารสำคัญผ่านช่องทางนี้ตั้งแต่นี้เป็นต้นไปค่ะ 🙏
""";
            }
            else
            {
                // ข้อความตอบกลับเมื่อหาเบอร์ไม่เจอ
                replyMessage = $"""
⚠️ ขออภัยค่ะ ระบบไม่พบข้อมูลเบอร์โทรศัพท์นี้

ไม่พบเบอร์ {phone} ในฐานข้อมูลผู้เช่าค่ะ
รบกวนตรวจสอบเบอร์โทรศัพท์ที่ระบุในสัญญาเช่า หรือพิมพ์ 'ผูกบัญชี ตามด้วยเบอร์โทร' อีกครั้งนะคะ

หากข้อมูลถูกต้องแต่ยังพบปัญหา กรุณาติดต่อเจ้าหน้าที่ดูแลหอพักค่ะ
""";
            }

            // 5. ส่งข้อความตอบกลับไปหาลูกบ้าน
            await ReplyMessageAsync(replyToken, replyMessage);
        }

        // ฟังก์ชันสำหรับยิง API ของ LINE เพื่อตอบกลับ (Reply)
        private async Task ReplyMessageAsync(string replyToken, string message)
        {
            var url = "https://api.line.me/v2/bot/message/reply";
            
            // จัดรูปแบบ JSON ตามที่ LINE ต้องการ
            var payload = new
            {
                replyToken = replyToken,
                messages = new[] 
                { 
                    new { type = "text", text = message } 
                }
            };

            var jsonPayload = JsonSerializer.Serialize(payload);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_channelAccessToken}");

            await _httpClient.PostAsync(url, content);
        }
    }
}