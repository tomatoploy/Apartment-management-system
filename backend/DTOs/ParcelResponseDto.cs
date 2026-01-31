using System.ComponentModel.DataAnnotations;

namespace Dormitory.DTOs;

public class ParcelResponseDto
{
    public uint Id { get; set; }
    public uint RoomId { get; set; }
    public string RoomNumber { get; set; } = null!;
    public string? Recipient { get; set; }
    public string? TrackingNumber { get; set; }
    public string? ShippingCompany { get; set; }
    public string? Type { get; set; }
    public DateOnly ArrivalDate { get; set; }
    public DateOnly? PickupDate { get; set; }
}
