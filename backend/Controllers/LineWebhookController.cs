using System.Text;
using System.Text.Json;

namespace Dormitory.Services
{
    public class LineMessageService
    {
        private readonly HttpClient _httpClient;
        private readonly string _channelAccessToken = "YOUR_CHANNEL_ACCESS_TOKEN";

        public LineMessageService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        // 1. ฟังก์ชันเดิม (ส่งข้อความธรรมดา)
        public async Task SendPushMessageAsync(string targetLineId, string messageText)
        {
            // ... (โค้ดเดิม) ...
        }

        // 2. ฟังก์ชันใหม่ (ส่งเป็น Flex Message Card สวยๆ)
        public async Task SendFlexMessageAsync(string targetLineId, string altText, string flexJsonString)
        {
            if (string.IsNullOrEmpty(targetLineId)) return;

            var url = "https://api.line.me/v2/bot/message/push";

            // แปลง String JSON ที่เราออกแบบการ์ดไว้ ให้กลายเป็น Object
            using var flexDoc = JsonDocument.Parse(flexJsonString);

            var payload = new
            {
                to = targetLineId,
                messages = new[]
                {
                    new
                    {
                        type = "flex",
                        altText = altText, // ข้อความที่จะขึ้นแจ้งเตือนบนหน้าจอมือถือ (ก่อนกดเข้าไปดู)
                        contents = flexDoc.RootElement
                    }
                }
            };

            var jsonPayload = JsonSerializer.Serialize(payload);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_channelAccessToken}");

            var response = await _httpClient.PostAsync(url, content);
            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"เกิดข้อผิดพลาดในการส่ง LINE Flex: {await response.Content.ReadAsStringAsync()}");
            }
        }
    }
}