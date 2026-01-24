namespace Dormitory.DTOs
{
    public class RoomDto
    {
        public uint Id { get; set; }
        public string Number { get; set; } = null!;
        public string? Building { get; set; }
        public string? Floor { get; set; }
        public string Status { get; set; } = null!;
        public string? Note { get; set; }
    }
}