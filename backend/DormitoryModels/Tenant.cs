using System;
using System.Collections.Generic;

namespace Dormitory.DormitoryModels;

public partial class Tenant
{
    public uint Id { get; set; }

    public string? Nin { get; set; }

    public string? Title { get; set; }

    public string FirstName { get; set; } = null!;

    public string? LastName { get; set; }

    public string? NickName { get; set; }

    public string Phone { get; set; } = null!;

    public string? Address { get; set; }

    public DateOnly? BirthDate { get; set; }

    public string? LineId { get; set; }

    public string? Email { get; set; }

    /// <summary>
    /// save a name of file
    /// </summary>
    public string? Photo { get; set; }

    public string? AltName { get; set; }

    public string? AltPhone { get; set; }

    public string? AltRelationship { get; set; }

    public string? VehicleNum1 { get; set; }

    public string? VehicleDetail1 { get; set; }

    public string? VehicleNum2 { get; set; }

    public string? VehicleDetail2 { get; set; }

    public string? KeyCard1 { get; set; }

    public string? KeyCard2 { get; set; }

    public string? KeyCard3 { get; set; }

    /// <summary>
    /// in c# = boolean (0 = false, 1 = true)
    /// </summary>
    public bool? IsLaundryService { get; set; }

    public uint? InternetDeviceCount { get; set; }

    public string? Note { get; set; }

    public virtual ICollection<Contract> Contract { get; set; } = new List<Contract>();
}