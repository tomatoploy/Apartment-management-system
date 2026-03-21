using System.ComponentModel.DataAnnotations;

namespace Dormitory.DTOs; // ใช้ semicolon จบตรงนี้ (File-scoped namespace)

public class ConstantPost
{
    [Required(ErrorMessage = "กรุณาระบุหมวดหมู่ (Category)")]
    public string Category { get; set; } = null!;

    public string? Subject { get; set; }

    public decimal? Cost { get; set; }

    public string? Note { get; set; }
}

public class ConstantPut
{
    // ปกติ Put อาจจะเหมือน Post หรือเพิ่ม Id เข้ามาตรวจสอบได้
    // แต่ใน Controller ที่เราเขียน เราใช้ Id จาก URL parameter อยู่แล้ว 
    // โครงสร้างนี้จึงใช้งานได้เลยค่ะ
    
    [Required(ErrorMessage = "กรุณาระบุหมวดหมู่ (Category)")]
    public string Category { get; set; } = null!;

    public string? Subject { get; set; }

    public decimal? Cost { get; set; }

    public string? Note { get; set; }
}