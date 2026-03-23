using System.ComponentModel.DataAnnotations;

namespace Dormitory.DTOs;

public class PermissionPost
{
    [Required(ErrorMessage = "กรุณาระบุรหัสผู้ดูแลระบบ (AdminId)")]
    public uint? AdminId { get; set; }

    [Required(ErrorMessage = "กรุณาระบุรหัสหอพัก (ApartmentId)")]
    public uint? ApartmentId { get; set; }
}

public class PermissionPut
{
    [Required(ErrorMessage = "กรุณาระบุรหัสผู้ดูแลระบบ (AdminId)")]
    public uint? AdminId { get; set; }

    [Required(ErrorMessage = "กรุณาระบุรหัสหอพัก (ApartmentId)")]
    public uint? ApartmentId { get; set; }
}