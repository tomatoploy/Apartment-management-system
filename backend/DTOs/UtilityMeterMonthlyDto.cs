namespace Dormitory.DTOs;

public class UtilityMeterMonthlyDto
{
    public uint RoomId { get; set; }
    public string? RoomNumber { get; set; }
    public string? Floor { get; set; }

    // เดือนที่เลือก
    public uint? ElectricityUnit { get; set; }
    public uint? WaterUnit { get; set; }

    // เดือนก่อนหน้า
    public uint? PrevElectricityUnit { get; set; }
    public uint? PrevWaterUnit { get; set; }

    public uint ElectricityUsed { get; set; }
    public uint WaterUsed { get; set; }
}