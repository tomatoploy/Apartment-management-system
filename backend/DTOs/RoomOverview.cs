namespace Dormitory.DTOs
{
    public class RoomOverviewDto
    {
        public uint RoomId { get; set; }
        public string? RoomBuilding { get; set; }
        public string? RoomFloor { get; set; }
        public string RoomNumber { get; set; } = null!;
        public string RoomStatus { get; set; } = null!;
        public string? RoomNote { get; set; }

        // table Tenant
        public string? TenantFirstName { get; set; }

        // table Contract
        public DateOnly? ContractStartDate { get; set; }
        public DateOnly? ContractEndDate { get; set; }

        // table Payment
        public bool IsOverdue { get; set; }

        // icon (frontend ใช้ตรง ๆ)
        public List<string> Icons { get; set; } = new();
    }
}