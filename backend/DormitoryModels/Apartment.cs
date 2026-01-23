using System;
using System.Collections.Generic;

namespace Dormitory.DormitoryModels;

/// <summary>
/// Collect general information about the dormitory.
/// </summary>
public partial class Apartment
{
    public uint Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Address { get; set; }

    public string? Phone { get; set; }

    public string? LineId { get; set; }

    public string? Email { get; set; }

    /// <summary>
    /// Payment start date.
    /// </summary>
    public byte PaymentDueStart { get; set; }

    /// <summary>
    /// Payment end date.
    /// </summary>
    public byte PaymentDueEnd { get; set; }

    public virtual ICollection<Permission> Permission { get; set; } = new List<Permission>();
}
