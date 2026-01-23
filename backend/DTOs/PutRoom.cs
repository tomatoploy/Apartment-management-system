namespace Dormitory.DTOs
{
    public class PutRoom
    {
        public string? Building { get; set; }
        public string? Floor { get; set; }
        public string Number { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string? Note { get; set; }
    }
}