using System.ComponentModel.DataAnnotations;

namespace Dormitory.DTOs
{
    public class ApartmentPut()
    {
        public string Name { get; set; } = null!;

        public string? Address { get; set; }
        public string? Phone { get; set; }
        public string? LineId { get; set; }
        public string? Email { get; set; }
        public byte PaymentDueStart { get; set; }
        public byte PaymentDueEnd { get; set; }
    }
}