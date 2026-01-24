using System;
using System.Collections.Generic;

namespace Dormitory.DormitoryModels;

/// <summary>
/// Stores apartment room information including room number, floor, room type, and current room status.
/// </summary>
public partial class Room
{
    public uint Id { get; set; }

    public string? Building { get; set; }

    public string? Floor { get; set; }

    public string Number { get; set; } = null!;

    public string Status { get; set; } = null!;

    public string? Note { get; set; }

    public virtual ICollection<Contract> Contract { get; set; } = new List<Contract>();

    public virtual ICollection<Parcel> Parcel { get; set; } = new List<Parcel>();

    public virtual ICollection<Request> Request { get; set; } = new List<Request>();

    public virtual ICollection<UtilityMeter> UtilityMeter { get; set; } = new List<UtilityMeter>();
}