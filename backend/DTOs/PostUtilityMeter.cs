using System.ComponentModel.DataAnnotations;

namespace Dormitory.DTOs;

public class PostUtilityMeter
{
    [Required]
    public uint RoomId { get; set; }

    [Required]
    public DateOnly RecordDate { get; set; }

    [Required]
    public uint ElectricityUnit { get; set; }

    [Required]
    public uint WaterUnit { get; set; }

    public uint? ChangeElectricityMeterStart { get; set; }
    public uint? ChangeElectricityMeterEnd { get; set; }
    public uint? ChangeWaterMeterStart { get; set; }
    public uint? ChangeWaterMeterEnd { get; set; }

    public string? Note { get; set; }
}