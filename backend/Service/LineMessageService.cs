using System.Text;
using System.Text.Json;

namespace Dormitory.Services
{
    public class LineMessageService
    {
        private readonly HttpClient _httpClient;
        
        // ⚠️ อย่าลืมใช้แบบดึงค่า Environment นะคะ จะได้ปลอดภัยตอนขึ้น Render
        private readonly string _channelAccessToken = Environment.GetEnvironmentVariable("Line__ChannelAccessToken") ?? "YOUR_CHANNEL_ACCESS_TOKEN";

        public LineMessageService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        // 1. ฟังก์ชันส่งข้อความธรรมดา (Push Message)
        public async Task SendPushMessageAsync(string targetLineId, string messageText)
        {
            if (string.IsNullOrEmpty(targetLineId)) return;

            var url = "https://api.line.me/v2/bot/message/push";
            var payload = new
            {
                to = targetLineId,
                messages = new[] { new { type = "text", text = messageText } }
            };

            var jsonPayload = JsonSerializer.Serialize(payload);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_channelAccessToken}");

            await _httpClient.PostAsync(url, content);
        }

        // 2. ฟังก์ชันส่ง Flex Message
        public async Task SendFlexMessageAsync(string targetLineId, string altText, string flexJsonString)
        {
            if (string.IsNullOrEmpty(targetLineId)) return;

            var url = "https://api.line.me/v2/bot/message/push";

            using var flexDoc = JsonDocument.Parse(flexJsonString);

            var payload = new
            {
                to = targetLineId,
                messages = new[]
                {
                    new
                    {
                        type = "flex",
                        altText = altText,
                        contents = flexDoc.RootElement
                    }
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