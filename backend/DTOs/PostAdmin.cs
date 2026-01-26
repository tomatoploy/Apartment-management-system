using System.ComponentModel.DataAnnotations;

namespace Dormitory.DTOs
{
    public class PostAdmin
    {
        public byte IsDisabled { get; set; } = 0;
        [Required]
        public string Title { get; set; } = null!;
        [Required]
        public string FirstName { get; set; } = null!;
        [Required]
        public string LastName { get; set; } = null!;
        [Required]
        [RegularExpression(@"^0\d{9}$", ErrorMessage = "รูปแบบเบอร์โทรไม่ถูกต้อง")]
        public string Phone { get; set; } = null!;
        [EmailAddress(ErrorMessage = "รูปแบบอีเมลไม่ถูกต้อง")]
        public string? Email { get; set; }
        public string? Signature { get; set; }
        [Required]
        [MinLength(8, ErrorMessage = "รหัสผ่านต้องอย่างน้อย 8 ตัวอักษร")]
        public string Password { get; set; } = null!;
    }
}