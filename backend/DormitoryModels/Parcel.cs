using System;
using System.Collections.Generic;

namespace Dormitory.DormitoryModels;

public partial class Parcel
{
    public uint Id { get; set; }

    public uint RoomId { get; set; }

    public string? Recipient { get; set; }

    public string? TrackingNumber { get; set; }

    public string? ShippingCompany { get; set; }

    public string? Type { get; set; }

    public DateOnly ArrivalDate { get; set; }

    public DateOnly? PickupDate { get; set; }

    public virtual Room Room { get; set; } = null!;
}
