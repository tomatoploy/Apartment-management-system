using System.Text;
using System.Text.Json;

namespace Dormitory.Services
{
    public class LineMessageService
    {
        private readonly HttpClient _httpClient;
        // เอา Channel Access Token จากหน้า LINE Developers มาใส่ตรงนี้ค่ะ
        private readonly string _channelAccessToken = "YOUR_CHANNEL_ACCESS_TOKEN"; 

        public LineMessageService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        // ฟังก์ชันสำหรับส่งข้อความ
        public async Task SendPushMessageAsync(string targetLineId, string messageText)
        {
            // ถ้าลูกค้าไม่มี LineId ให้ข้ามไปเลย
            if (string.IsNullOrEmpty(targetLineId)) return;

            var url = "https://api.line.me/v2/bot/message/push";
            
            // จัดรูปแบบข้อมูลตามที่ LINE ต้องการ
            var payload = new
            {
                to = targetLineId,
                messages = new[]
                {
                    new { type = "text", text = messageText }
                }
            };

            var jsonPayload = JsonSerializer.Serialize(payload);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            // ใส่ Token เพื่อยืนยันตัวตน
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_channelAccessToken}");

            // ยิงข้อมูลไปหา LINE
            var response = await _httpClient.PostAsync(url, content);
            
            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"เกิดข้อผิดพลาดในการส่ง LINE: {await response.Content.ReadAsStringAsync()}");
            }
        }
    }
}