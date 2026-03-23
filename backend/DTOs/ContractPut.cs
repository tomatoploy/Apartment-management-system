using System.ComponentModel.DataAnnotations;

namespace Dormitory.DTOs
{
    public class ContractPut()
    {
        public uint RoomId { get; set; }

        public uint? TenantId { get; set; }

        public string Status { get; set; } = null!;

        public DateOnly? StartDate { get; set; }

        public DateOnly? EndDate { get; set; }

        public decimal MonthlyRent { get; set; }

        public decimal? Deposit { get; set; }

        public uint? InitialElectricUnit { get; set; }

        public uint? InitialWaterUnit { get; set; }

        public string? Note { get; set; }
    }
}