using System.ComponentModel.DataAnnotations;

namespace Dormitory.DTOs;

public class DocumentPost
{
    [Required(ErrorMessage = "กรุณาระบุรหัสผู้ดูแลระบบที่สร้างเอกสาร (AdminId)")]
    public uint? AdminId { get; set; }

    [Required(ErrorMessage = "กรุณาระบุชื่อเอกสาร (Name)")]
    [StringLength(100, ErrorMessage = "ชื่อเอกสารต้องมีความยาวไม่เกิน 100 ตัวอักษร")]
    public string Name { get; set; } = null!;

    public string? Content { get; set; }
}

public class DocumentPut
{
    [Required(ErrorMessage = "กรุณาระบุรหัสผู้ดูแลระบบที่แก้ไขเอกสาร (AdminId)")]
    public uint? AdminId { get; set; }

    [Required(ErrorMessage = "กรุณาระบุชื่อเอกสาร (Name)")]
    [StringLength(100, ErrorMessage = "ชื่อเอกสารต้องมีความยาวไม่เกิน 100 ตัวอักษร")]
    public string Name { get; set; } = null!;

    public string? Content { get; set; }
}