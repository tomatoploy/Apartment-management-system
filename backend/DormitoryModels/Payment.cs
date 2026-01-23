using System;
using System.Collections.Generic;

namespace Dormitory.DormitoryModels;

public partial class Payment
{
    public uint Id { get; set; }

    public uint ContractId { get; set; }

    public DateOnly RecordDate { get; set; }

    public string Status { get; set; } = null!;

    public decimal? RoomRate { get; set; }

    public decimal? ElectricalPricePerUnit { get; set; }

    public decimal? WaterPricePerUnit { get; set; }

    public decimal? FurnitureCost { get; set; }

    public decimal? InternetCost { get; set; }

    public decimal? LaundryCost { get; set; }

    public decimal? DiscountCost { get; set; }

    public string? DiscountDetail { get; set; }

    public decimal? AdditionalCost { get; set; }

    public string? AdditionalDetail { get; set; }

    public decimal? TotalAmount { get; set; }

    public decimal? PaidAmount { get; set; }

    public uint AdminId { get; set; }

    public string? Note { get; set; }

    public virtual Admin Admin { get; set; } = null!;

    public virtual Contract Contract { get; set; } = null!;
}
