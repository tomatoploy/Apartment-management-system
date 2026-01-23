using System;
using System.Collections.Generic;

namespace Dormitory.DormitoryModels;

/// <summary>
/// Stores dormitory-related documents such as rental contracts, invoices, and payment records.
/// 
/// </summary>
public partial class Document
{
    public uint Id { get; set; }

    public string Name { get; set; } = null!;

    public string Content { get; set; } = null!;

    public uint AdminId { get; set; }

    public virtual Admin Admin { get; set; } = null!;
}
