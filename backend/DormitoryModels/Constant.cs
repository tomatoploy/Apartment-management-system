using System;
using System.Collections.Generic;

namespace Dormitory.DormitoryModels;

public partial class Constant
{
    public uint Id { get; set; }

    public string Category { get; set; } = null!;

    public string? Subject { get; set; }

    public decimal? Cost { get; set; }

    public string? Note { get; set; }
}
