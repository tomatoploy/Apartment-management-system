using System;
using System.Collections.Generic;

namespace Dormitory.DormitoryModels;

/// <summary>
/// Stores administrator account information for managing and maintaining the system.
/// </summary>
public partial class Admin
{
    public uint Id { get; set; }

    /// <summary>
    /// type in c# is boolean (0 = active, 1 = disabled)
    /// </summary>
    public byte IsDisabled { get; set; }

    public string? Title { get; set; }

    public string FirstName { get; set; } = null!;

    public string? LastName { get; set; }

    public string Phone { get; set; } = null!;

    public string? Email { get; set; }

    public string? Signature { get; set; }

    public string Salt { get; set; } = null!;

    /// <summary>
    /// hashed password
    /// </summary>
    public string Password { get; set; } = null!;

    public virtual ICollection<Document> Document { get; set; } = new List<Document>();

    public virtual ICollection<Payment> Payment { get; set; } = new List<Payment>();

    public virtual ICollection<Permission> Permission { get; set; } = new List<Permission>();
}
