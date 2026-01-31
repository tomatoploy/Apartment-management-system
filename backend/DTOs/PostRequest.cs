using System.ComponentModel.DataAnnotations;

namespace Dormitory.DTOs
{
    public class PostRequest
    {
        [Required]
        public string RoomNumber { get; set; } = null!;
        [Required]
        public DateOnly RequestDate { get; set; }
        [Required]
        public string Subject { get; set; } = null!;
        public string? Body { get; set; }
        [Required]
        public string Status { get; set; } = null!;
        public DateOnly? AppointmentDate { get; set; }
        public bool? IsTenantCost { get; set; }
        public decimal? Cost { get; set; }
        public string? Note { get; set; }
    }
}