using System.ComponentModel.DataAnnotations;

namespace Dormitory.DTOs
{
    public class PostRoom
    {
        [Required]
        public string? Building { get; set; }
        [Required]
        public string? Floor { get; set; }
        [Required]
        public string Number { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string? Note { get; set; }
    }
}