using System;
using System.Collections.Generic;

namespace Dormitory.DormitoryModels;

/// <summary>
/// Stores permission data that defines access rights (in the future : actions allowed for each role or user) in the system.
/// </summary>
public partial class Permission
{
    public uint Id { get; set; }

    public uint ApartmentId { get; set; }

    public uint AdminId { get; set; }

    public virtual Admin Admin { get; set; } = null!;

    public virtual Apartment Apartment { get; set; } = null!;
}
