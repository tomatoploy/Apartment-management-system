using System;
using System.Collections.Generic;

namespace Dormitory.DormitoryModels;

public partial class Request
{
    public uint Id { get; set; }

    public uint RoomId { get; set; }

    public DateOnly RequestDate { get; set; }

    public string Subject { get; set; } = null!;

    public string? Body { get; set; }

    public string Status { get; set; } = null!;

    public DateOnly? AppointmentDate { get; set; }

    /// <summary>
    /// in c# is boolean (0 = false, 1 = true)
    /// </summary>
    public bool? IsTenantCost { get; set; }

    public decimal? Cost { get; set; }

    public string? Note { get; set; }

    public virtual Room Room { get; set; } = null!;
}
