using System;
using System.Collections.Generic;

namespace Dormitory.DormitoryModels;

public partial class UtilityMeter
{
    public uint Id { get; set; }

    public uint RoomId { get; set; }

    public DateOnly RecordDate { get; set; }

    public uint ElectricityUnit { get; set; }

    public uint? ChangeElectricityMeterStart { get; set; }

    public uint? ChangeElectricityMeterEnd { get; set; }

    public uint WaterUnit { get; set; }

    public uint? ChangeWaterMeterStart { get; set; }

    public uint? ChangeWaterMeteEnd { get; set; }

    public string? Note { get; set; }

    public virtual Room Room { get; set; } = null!;
}
