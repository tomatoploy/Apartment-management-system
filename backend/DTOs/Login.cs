using System.ComponentModel.DataAnnotations;

namespace Dormitory.DTOs
{
    public class LoginDto
    {
        [Required]
        public string Phone { get; set; } = null!;

        [Required]
        public string Password { get; set; } = null!;
    }
}