using System;
using System.Collections.Generic;

namespace Dormitory.DormitoryModels;

public partial class Contract
{
    public uint Id { get; set; }

    public uint RoomId { get; set; }

    public uint? TenantId { get; set; }

    public string Status { get; set; } = null!;

    public DateOnly? StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public decimal MonthlyRent { get; set; }

    public decimal? Deposit { get; set; }

    public uint? InitialElectricUnit { get; set; }

    public uint? InitialWaterUnit { get; set; }

    /// <summary>
    /// save a name of file
    /// </summary>
    public string? AttachedFile { get; set; }

    public virtual ICollection<Payment> Payment { get; set; } = new List<Payment>();

    public virtual Room Room { get; set; } = null!;

    public virtual Tenant? Tenant { get; set; }
}
