using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text;
using Dormitory.DormitoryModels;
using Microsoft.EntityFrameworkCore;

namespace Dormitory.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LineWebhookController : ControllerBase
    {
        private readonly DormitoryDbContext _context;
        private readonly HttpClient _httpClient;
        
        // ดึง Token จาก Environment Variable ของ Render (ถ้าไม่มีจะใช้ค่าสำรอง)
        private readonly string _channelAccessToken = Environment.GetEnvironmentVariable("Line__ChannelAccessToken") ?? "YOUR_CHANNEL_ACCESS_TOKEN";

        public LineWebhookController(DormitoryDbContext context, HttpClient httpClient)
        {
            _context = context;
            _httpClient = httpClient;
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
                                
                                // 🎯 นี่คือเป้าหมายหลักของเรา! ดึง UID ของคนที่ทักมา
                                var userId = ev.GetProperty("source").GetProperty("userId").GetString() ?? ""; 

                                // 2. ดักจับคีย์เวิร์ดคำว่า "ผูกบัญชี"
                                if (text.StartsWith("ผูกบัญชี"))
                                {
                                    // ตัดคำว่า "ผูกบัญชี" ออก เพื่อเอาแค่เบอร์โทร (เช่น "ผูกบัญชี 0891234567" -> "0891234567")
                                    var phone = text.Replace("ผูกบัญชี", "").Trim();
                                    
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
                Console.WriteLine($"Webhook Error: {ex.Message}");
                return StatusCode(500);
            }
        }

        // ฟังก์ชันสำหรับค้นหาลูกบ้านและบันทึก UID ลง Database
        private async Task HandleLinkAccount(string userId, string phone, string replyToken)
        {
            string replyMessage;

            // 3. ค้นหาลูกบ้านจากเบอร์โทรที่พิมพ์เข้ามา (ใช้ _context.Tenant ตามชื่อตารางใน DbContext ของพลอย)
            var tenant = await _context.Tenant.FirstOrDefaultAsync(t => t.Phone == phone);

            if (tenant != null)
            {
                // 4. ถ้าเจอตัว ให้เอา UID ไปใส่ในคอลัมน์ LineId
                tenant.LineId = userId;
                await _context.SaveChangesAsync();

                // ข้อความตอบกลับเมื่อสำเร็จ
                replyMessage = $"🎉 ผูกบัญชีสำเร็จเรียบร้อยค่ะ!\nสวัสดีคุณ {tenant.FirstName} {tenant.LastName}\n\nต่อไปนี้ระบบจะส่งการแจ้งเตือนบิลค่าเช่าและพัสดุมาที่นี่นะคะ 😊";
            }
            else
            {
                // ข้อความตอบกลับเมื่อหาเบอร์ไม่เจอ
                replyMessage = "❌ ไม่พบเบอร์โทรนี้ในระบบค่ะ\nกรุณาตรวจสอบเบอร์โทรที่ลงทะเบียนไว้กับทางหอพัก หรือพิมพ์ 'ผูกบัญชี ตามด้วยเบอร์โทร' อีกครั้งค่ะ (เช่น ผูกบัญชี 0891234567)";
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