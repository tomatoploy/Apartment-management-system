using System.ComponentModel.DataAnnotations;

namespace Dormitory.DTOs
{
    public class PutAdmin
    {
        [Required]
        public string? Title { get; set; }
        [Required]
        public string FirstName { get; set; } = null!;
        [Required]
        public string? LastName { get; set; }
        [Required]
        public string Phone { get; set; } = null!;
        public string? Email { get; set; }
        public string? Signature { get; set; }
        [Required]
        public string Password { get; set; } = null!;
    }
}