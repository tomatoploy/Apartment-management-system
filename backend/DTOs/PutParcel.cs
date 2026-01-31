using System.ComponentModel.DataAnnotations;

namespace Dormitory.DTOs;

public class PutParcel
{
    [Required]
    public string RoomNumber { get; set; } = null!;

    public string? Recipient { get; set; }
    public string? TrackingNumber { get; set; }
    public string? ShippingCompany { get; set; }
    public string? Type { get; set; }

    [Required]
    public DateOnly ArrivalDate { get; set; }

    public DateOnly? PickupDate { get; set; }
}
