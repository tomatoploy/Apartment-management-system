using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Dormitory.DormitoryModels;
using Dormitory.DTOs;
using Dormitory.Services; // 👈 1. เพิ่ม using สำหรับ Service

namespace Dormitory.Controllers;

[ApiController]
[Route("[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly ILogger<PaymentsController> _logger;
    private readonly DormitoryDbContext _db;
    private readonly LineMessageService _lineService; // 👈 2. ประกาศตัวแปร

    // 👈 3. รับ LineMessageService เข้ามา
    public PaymentsController(
        ILogger<PaymentsController> logger, 
        DormitoryDbContext db,
        LineMessageService lineService) 
    {
        _logger = logger;
        _db = db;
        _lineService = lineService;
    }

    // ─────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────

    private static uint? CalculateUsedUnit(uint? previous, uint? current)
    {
        if (!previous.HasValue || !current.HasValue) return null;
        if (current.Value >= previous.Value)
            return current.Value - previous.Value;
        var maxMeter = uint.Parse(new string('9', previous.Value.ToString().Length));
        return (maxMeter - previous.Value) + current.Value + 1;
    }

    private static uint? CalculateUsedWithMeterChange(
        uint? prevMonthUnit, uint? changeEnd,
        uint? changeStart,   uint? currentNewUnit)
    {
        if (!prevMonthUnit.HasValue) return null;
        if (!changeEnd.HasValue && !currentNewUnit.HasValue) return null;
        if (changeEnd.HasValue && !currentNewUnit.HasValue)
            return CalculateUsedUnit(prevMonthUnit, changeEnd);
        if (changeEnd.HasValue && changeStart.HasValue && currentNewUnit.HasValue)
            return CalculateUsedUnit(prevMonthUnit, changeEnd)
                 + CalculateUsedUnit(changeStart, currentNewUnit);
        if (currentNewUnit.HasValue)
            return CalculateUsedUnit(prevMonthUnit, currentNewUnit);
        return null;
    }

    private static string BuildCalculationNote(
        uint? prevElec,       uint? currElec,
        uint? changeElecEnd,  uint? changeElecStart, decimal electricRate,
        uint? prevWater,      uint? currWater,
        uint? changeWaterEnd, uint? changeWaterStart, decimal waterRate)
    {
        var parts = new List<string>();

        if (prevElec.HasValue && (currElec.HasValue || changeElecEnd.HasValue))
        {
            if (changeElecEnd.HasValue && changeElecStart.HasValue && currElec.HasValue)
                parts.Add($"ไฟ: ({changeElecEnd.Value}-{prevElec.Value})*{electricRate}" +
                          $" + ({currElec.Value}-{changeElecStart.Value})*{electricRate}");
            else if (changeElecEnd.HasValue)
                parts.Add($"ไฟ: ({changeElecEnd.Value}-{prevElec.Value})*{electricRate}");
            else if (currElec.HasValue)
                parts.Add($"ไฟ: ({currElec.Value}-{prevElec.Value})*{electricRate}");
        }

        if (prevWater.HasValue && (currWater.HasValue || changeWaterEnd.HasValue))
        {
            if (changeWaterEnd.HasValue && changeWaterStart.HasValue && currWater.HasValue)
                parts.Add($"น้ำ: ({changeWaterEnd.Value}-{prevWater.Value})*{waterRate}" +
                          $" + ({currWater.Value}-{changeWaterStart.Value})*{waterRate}");
            else if (changeWaterEnd.HasValue)
                parts.Add($"น้ำ: ({changeWaterEnd.Value}-{prevWater.Value})*{waterRate}");
            else if (currWater.HasValue)
                parts.Add($"น้ำ: ({currWater.Value}-{prevWater.Value})*{waterRate}");
        }

        return parts.Count > 0 ? string.Join(" | ", parts) : string.Empty;
    }

    // ─────────────────────────────────────────────────────────────
    // CORE: คำนวณบิล
    // ─────────────────────────────────────────────────────────────
    private async Task<PaymentCalculationResult?> CalculateBillAsync(
        uint contractId, int year, int month)
    {
        var contract = await _db.Contract
            .Include(c => c.Tenant)
            .FirstOrDefaultAsync(c => c.Id == contractId);

        if (contract == null) return null;

        var constants = await _db.Constant.ToListAsync();

        decimal electricityRate = constants.FirstOrDefault(c =>
            c.Category.Equals("utility",         StringComparison.OrdinalIgnoreCase) &&
            c.Subject != null &&
            c.Subject .Equals("ElectricityBill", StringComparison.OrdinalIgnoreCase))
            ?.Cost ?? 0m;

        decimal waterRate = constants.FirstOrDefault(c =>
            c.Category.Equals("utility",   StringComparison.OrdinalIgnoreCase) &&
            c.Subject != null &&
            c.Subject .Equals("WaterBill", StringComparison.OrdinalIgnoreCase))
            ?.Cost ?? 0m;

        decimal internetRate = constants.FirstOrDefault(c =>
            c.Category.Equals("service",  StringComparison.OrdinalIgnoreCase) &&
            c.Subject != null &&
            c.Subject .Equals("Internet", StringComparison.OrdinalIgnoreCase))
            ?.Cost ?? 0m;

        decimal laundryRate = constants.FirstOrDefault(c =>
            c.Category.Equals("service", StringComparison.OrdinalIgnoreCase) &&
            c.Subject != null &&
            c.Subject .Equals("Laundry", StringComparison.OrdinalIgnoreCase))
            ?.Cost ?? 0m;

        var firstDay = new DateOnly(year, month, 1);
        var lastDay  = firstDay.AddMonths(1).AddDays(-1);

        var currentMeter = await _db.UtilityMeter
            .Where(m => m.RoomId == contract.RoomId
                     && m.RecordDate >= firstDay
                     && m.RecordDate <= lastDay)
            .OrderByDescending(m => m.RecordDate)
            .FirstOrDefaultAsync();

        var previousMeter = await _db.UtilityMeter
            .Where(m => m.RoomId == contract.RoomId
                     && m.RecordDate < firstDay)
            .OrderByDescending(m => m.RecordDate)
            .FirstOrDefaultAsync();

        // 🌟 1. ตรวจสอบเงื่อนไขการย้ายเข้า-ย้ายออก
        bool isFirstMonth = contract.StartDate.HasValue && 
                            contract.StartDate.Value.Year == year && 
                            contract.StartDate.Value.Month == month;

        // ถ้ายกเลิกสัญญาแล้ว หรือ EndDate อยู่ในเดือนนี้ ให้ถือเป็นเดือนสุดท้าย
        bool isLastMonth = contract.Status == "Terminated" || contract.Status == "Expired" ||
                           (contract.EndDate.HasValue && contract.EndDate.Value.Year == year && contract.EndDate.Value.Month == month);

        // 🌟 2. เลือกตัวเลขมิเตอร์ตั้งต้นให้ถูกต้อง (ดึงจากสัญญาถ้าเป็นเดือนแรก/เดือนสุดท้าย)
        uint? resolvedPrevElec = (isFirstMonth && contract.InitialElectricUnit.HasValue) 
            ? contract.InitialElectricUnit 
            : previousMeter?.ElectricityUnit;

        uint? resolvedPrevWater = (isFirstMonth && contract.InitialWaterUnit.HasValue) 
            ? contract.InitialWaterUnit 
            : previousMeter?.WaterUnit;

        uint? resolvedCurrElec = (isLastMonth && contract.FinalElectricUnit.HasValue) 
            ? contract.FinalElectricUnit 
            : currentMeter?.ElectricityUnit;

        uint? resolvedCurrWater = (isLastMonth && contract.FinalWaterUnit.HasValue) 
            ? contract.FinalWaterUnit 
            : currentMeter?.WaterUnit;

        // 🌟 3. โยนค่า Resolved ที่ถูกต้องเข้าฟังก์ชันคำนวณ
        uint? electricUsed = CalculateUsedWithMeterChange(
            resolvedPrevElec,
            currentMeter?.ChangeElectricityMeterEnd,
            currentMeter?.ChangeElectricityMeterStart,
            resolvedCurrElec);

        uint? waterUsed = CalculateUsedWithMeterChange(
            resolvedPrevWater,
            currentMeter?.ChangeWaterMeterEnd,
            currentMeter?.ChangeWaterMeterStart,
            resolvedCurrWater);

        decimal roomRate = contract.MonthlyRent;

        decimal electricCost = electricUsed.HasValue
            ? (decimal)electricUsed.Value * electricityRate : 0m;

        decimal waterCost = waterUsed.HasValue
            ? (decimal)waterUsed.Value * waterRate : 0m;

        uint deviceCount  = contract.Tenant?.InternetDeviceCount ?? 0u;
        decimal internetCost = deviceCount > 0
            ? (decimal)deviceCount * internetRate : 0m;

        decimal laundryCost = contract.Tenant?.IsLaundryService == true
            ? laundryRate : 0m;

        decimal totalAmount = roomRate + electricCost + waterCost
                            + internetCost + laundryCost;

        string calcNote = BuildCalculationNote(
            resolvedPrevElec, resolvedCurrElec,
            currentMeter?.ChangeElectricityMeterEnd,
            currentMeter?.ChangeElectricityMeterStart, electricityRate,
            resolvedPrevWater, resolvedCurrWater,
            currentMeter?.ChangeWaterMeterEnd,
            currentMeter?.ChangeWaterMeterStart, waterRate);

        return new PaymentCalculationResult
        {
            ContractId = contractId,
            RoomId     = contract.RoomId,
            TenantId   = contract.TenantId ?? 0u,
            Year       = year,
            Month      = month,
            RoomRate = roomRate,
            ElectricityUsedUnit    = electricUsed,
            ElectricityRatePerUnit = electricityRate,
            ElectricalCost         = electricCost,
            WaterUsedUnit    = waterUsed,
            WaterRatePerUnit = waterRate,
            WaterCost        = waterCost,
            InternetDeviceCount   = deviceCount,
            InternetRatePerDevice = internetRate,
            InternetCost          = internetCost,
            IsLaundryService = contract.Tenant?.IsLaundryService == true,
            LaundryRate      = laundryRate,
            LaundryCost      = laundryCost,
            TotalAmount     = totalAmount,
            CalculationNote = calcNote,
            CurrentElectricUnit  = resolvedCurrElec,
            PreviousElectricUnit = resolvedPrevElec,
            CurrentWaterUnit     = resolvedCurrWater,
            PreviousWaterUnit    = resolvedPrevWater,
        };
    }

    // ─────────────────────────────────────────────────────────────
    // GET /payments
    // ─────────────────────────────────────────────────────────────
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PaymentDetailDto>>> GetAll()
    {
        var payments = await _db.Payment
            .AsNoTracking()
            .OrderByDescending(p => p.RecordDate)
            .ToListAsync();

        return Ok(payments.Select(ToDetailDto));
    }

    // ─────────────────────────────────────────────────────────────
    // GET /payments/{id}
    // ─────────────────────────────────────────────────────────────
    [HttpGet("{id}")]
    public async Task<ActionResult<PaymentDetailDto>> Get(uint id)
    {
        var payment = await _db.Payment.AsNoTracking()
                                       .FirstOrDefaultAsync(p => p.Id == id);
        if (payment == null)
            return NotFound(new { message = "Payment not found" });

        return Ok(ToDetailDto(payment));
    }

    // ─────────────────────────────────────────────────────────────
    // GET /payments/by-contract/{contractId}
    // ─────────────────────────────────────────────────────────────
    [HttpGet("by-contract/{contractId}")]
    public async Task<ActionResult<IEnumerable<PaymentDetailDto>>> GetByContract(uint contractId)
    {
        var payments = await _db.Payment
            .AsNoTracking()
            .Where(p => p.ContractId == contractId)
            .OrderByDescending(p => p.RecordDate)
            .ToListAsync();

        return Ok(payments.Select(ToDetailDto));
    }

    // ─────────────────────────────────────────────────────────────
    // GET /payments/by-month?year=2025&month=6
    // ─────────────────────────────────────────────────────────────
    [HttpGet("by-month")]
    public async Task<ActionResult<IEnumerable<PaymentDetailDto>>> GetByMonth(
        [FromQuery] int year, [FromQuery] int month)
    {
        var firstDay = new DateOnly(year, month, 1);
        var lastDay  = firstDay.AddMonths(1).AddDays(-1);

        var payments = await _db.Payment
            .AsNoTracking()
            .Where(p => p.RecordDate >= firstDay && p.RecordDate <= lastDay)
            .OrderBy(p => p.ContractId)
            .ToListAsync();

        return Ok(payments.Select(ToDetailDto));
    }

    // ─────────────────────────────────────────────────────────────
    // GET /payments/generate?contractId=1&year=2025&month=6
    // ─────────────────────────────────────────────────────────────
    [HttpGet("generate")]
    public async Task<ActionResult<PaymentCalculationResult>> Generate(
        [FromQuery] uint contractId,
        [FromQuery] int  year,
        [FromQuery] int  month)
    {
        var result = await CalculateBillAsync(contractId, year, month);
        if (result == null)
            return NotFound(new { message = $"Contract id {contractId} not found" });

        var firstDay = new DateOnly(year, month, 1);
        var lastDay  = firstDay.AddMonths(1).AddDays(-1);

        result.AlreadyExists = await _db.Payment.AnyAsync(p =>
            p.ContractId == contractId &&
            p.RecordDate >= firstDay   &&
            p.RecordDate <= lastDay);

        return Ok(result);
    }

    // ─────────────────────────────────────────────────────────────
    // POST /payments
    // ─────────────────────────────────────────────────────────────
    [HttpPost]
    public async Task<IActionResult> Post([FromBody] PostPaymentDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var contractExists = await _db.Contract.AnyAsync(c => c.Id == dto.ContractId);
        if (!contractExists)
            return BadRequest(new { message = $"Contract id {dto.ContractId} not found" });

        var recordDate = dto.RecordDate ?? DateOnly.FromDateTime(DateTime.Today);
        var firstDay   = new DateOnly(recordDate.Year, recordDate.Month, 1);
        var lastDay    = firstDay.AddMonths(1).AddDays(-1);

        bool duplicate = await _db.Payment.AnyAsync(p =>
            p.ContractId == dto.ContractId &&
            p.RecordDate >= firstDay       &&
            p.RecordDate <= lastDay);

        if (duplicate)
            return Conflict(new
            {
                message = $"บิลเดือน {recordDate.Month}/{recordDate.Year} มีอยู่แล้ว " +
                          "ใช้ PUT /payments/{id} เพื่อแก้ไข"
            });

        var noteParts = new List<string>();
        if (!string.IsNullOrWhiteSpace(dto.Note))
            noteParts.Add(dto.Note.Trim());
        if (!string.IsNullOrWhiteSpace(dto.CalculationNote))
            noteParts.Add(dto.CalculationNote.Trim());

        var payment = new Payment
        {
            ContractId             = dto.ContractId,
            RecordDate             = recordDate,
            Status                 = "unpaid",
            AdminId                = dto.AdminId,
            RoomRate               = dto.RoomRate,
            ElectricalPricePerUnit = dto.ElectricalCost,
            WaterPricePerUnit      = dto.WaterCost,
            InternetCost           = dto.InternetCost,
            LaundryCost            = dto.LaundryCost,
            FurnitureCost          = dto.FurnitureCost,
            DiscountCost           = dto.DiscountCost,
            DiscountDetail         = dto.DiscountDetail,
            AdditionalCost         = dto.AdditionalCost,
            AdditionalDetail       = dto.AdditionalDetail,
            Note                   = noteParts.Count > 0
                                         ? string.Join(" | ", noteParts) : null,
        };

        payment.TotalAmount =
            (payment.RoomRate               ?? 0m) +
            (payment.ElectricalPricePerUnit ?? 0m) +
            (payment.WaterPricePerUnit      ?? 0m) +
            (payment.InternetCost           ?? 0m) +
            (payment.LaundryCost            ?? 0m) +
            (payment.FurnitureCost          ?? 0m) +
            (payment.AdditionalCost         ?? 0m) -
            (payment.DiscountCost           ?? 0m);

        _db.Payment.Add(payment);

        try 
        {
            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            var innerMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
            return StatusCode(500, new { message = $"DB Error: {innerMsg}" });
        }

        return CreatedAtAction(nameof(Get), new { id = payment.Id }, new
        {
            message = "สร้างบิลสำเร็จ",
            id      = payment.Id,
            total   = payment.TotalAmount
        });
    }

    // ─────────────────────────────────────────────────────────────
    // PUT /payments/{id}
    // ─────────────────────────────────────────────────────────────
    [HttpPut("{id}")]
    public async Task<IActionResult> Put(uint id, [FromBody] PutPaymentDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var payment = await _db.Payment.FindAsync(id);
        if (payment == null)
            return NotFound(new { message = "Payment not found" });

        if (payment.Status == "paid")
            return BadRequest(new
            {
                message = "ไม่สามารถแก้ไขบิลที่ชำระแล้วได้ " +
                          "ใช้ PATCH /payments/{id}/status แทน"
            });

        payment.RoomRate               = dto.RoomRate               ?? payment.RoomRate;
        payment.ElectricalPricePerUnit = dto.ElectricalCost         ?? payment.ElectricalPricePerUnit;
        payment.WaterPricePerUnit      = dto.WaterCost               ?? payment.WaterPricePerUnit;
        payment.InternetCost           = dto.InternetCost            ?? payment.InternetCost;
        payment.LaundryCost            = dto.LaundryCost             ?? payment.LaundryCost;
        payment.FurnitureCost          = dto.FurnitureCost           ?? payment.FurnitureCost;
        payment.DiscountCost           = dto.DiscountCost            ?? payment.DiscountCost;
        payment.DiscountDetail         = dto.DiscountDetail          ?? payment.DiscountDetail;
        payment.AdditionalCost         = dto.AdditionalCost          ?? payment.AdditionalCost;
        payment.AdditionalDetail       = dto.AdditionalDetail        ?? payment.AdditionalDetail;

        if (dto.Note != null)
        {
            var noteParts = new List<string>();
            if (!string.IsNullOrWhiteSpace(dto.Note))
                noteParts.Add(dto.Note.Trim());
            if (!string.IsNullOrWhiteSpace(dto.CalculationNote))
                noteParts.Add(dto.CalculationNote.Trim());
            payment.Note = noteParts.Count > 0 ? string.Join(" | ", noteParts) : null;
        }

        payment.TotalAmount =
            (payment.RoomRate               ?? 0m) +
            (payment.ElectricalPricePerUnit ?? 0m) +
            (payment.WaterPricePerUnit      ?? 0m) +
            (payment.InternetCost           ?? 0m) +
            (payment.LaundryCost            ?? 0m) +
            (payment.FurnitureCost          ?? 0m) +
            (payment.AdditionalCost         ?? 0m) -
            (payment.DiscountCost           ?? 0m);

        try 
        {
            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            var innerMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
            return StatusCode(500, new { message = $"DB Error: {innerMsg}" });
        }

        return Ok(new { message = "อัปเดตบิลสำเร็จ", id = payment.Id, total = payment.TotalAmount });
    }

    // ─────────────────────────────────────────────────────────────
    // PATCH /payments/{id}/status
    // ─────────────────────────────────────────────────────────────
    [HttpPatch("{id}/status")]
    public async Task<IActionResult> PatchStatus(uint id, [FromBody] PatchPaymentStatusDto dto)
    {
        var payment = await _db.Payment.FindAsync(id);
        if (payment == null)
            return NotFound(new { message = "Payment not found" });

        var allowed = new[] { "paid", "unpaid", "overdue", "longoverdue" };
        if (!allowed.Contains(dto.Status?.ToLower()))
            return BadRequest(new
            {
                message = $"Status ต้องเป็นหนึ่งใน: paid, unpaid, overdue, longOverdue"
            });

        payment.Status = dto.Status!;

        if (payment.Status == "paid" && dto.PaidAmount.HasValue)
            payment.PaidAmount = dto.PaidAmount;

        await _db.SaveChangesAsync();

        return Ok(new { message = $"เปลี่ยนสถานะเป็น '{payment.Status}' สำเร็จ", id });
    }

    // ─────────────────────────────────────────────────────────────
    // DELETE /payments/{id}
    // ─────────────────────────────────────────────────────────────
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(uint id)
    {
        var payment = await _db.Payment.FindAsync(id);
        if (payment == null)
            return NotFound(new { message = "Payment not found" });

        if (payment.Status == "paid")
            return BadRequest(new { message = "ไม่สามารถลบบิลที่ชำระแล้วได้" });

        _db.Payment.Remove(payment);
        await _db.SaveChangesAsync();

        return Ok(new { message = "ลบบิลสำเร็จ", id });
    }

    // 🚀 POST /payments/{id}/notify (ส่ง LINE แจ้งหนี้ / ใบเสร็จ)
    [HttpPost("{id}/notify")]
    public async Task<IActionResult> NotifyPayment(uint id)
    {
        var payment = await _db.Payment
            .Include(p => p.Contract).ThenInclude(c => c.Tenant)
            .Include(p => p.Contract).ThenInclude(c => c.Room)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment == null) return NotFound(new { message = "ไม่พบบิลนี้ในระบบ" });
        
        // 🌟 1. เปลี่ยนการตรวจ LineId เป็น Note แทน
        if (string.IsNullOrEmpty(payment.Contract?.Tenant?.Note))
            return BadRequest(new { message = $"ห้อง {payment.Contract?.Room?.Number} ยังไม่ได้ผูก LINE" });

        var roomNumber = payment.Contract.Room?.Number ?? "-";
        var monthYear = payment.RecordDate.ToString("MM/yyyy");

        // 🟢 1. เช็คสถานะบิล (สไตล์ Minimal จะใช้สีตัวอักษรแทนสีพื้นหลัง)
        bool isPaid = payment.Status?.ToLower() == "paid";
        string headerText = isPaid ? "ใบเสร็จรับเงิน" : "ใบแจ้งยอดชำระเงิน";
        string statusColor = isPaid ? "#27ae60" : "#f39c12"; // สีเขียว = จ่ายแล้ว, สีส้ม = ยังไม่จ่าย
        string footerText = isPaid ? "ได้รับชำระเงินเรียบร้อย ขอบคุณค่ะ" : "กรุณาชำระเงินภายในวันที่กำหนด";
        string altTextStatus = isPaid ? "ใบเสร็จรับเงิน" : "ใบแจ้งยอดชำระเงิน";

        // 2. เตรียมรายการค่าใช้จ่าย
        var rows = new List<string>();
        void AddRow(string title, decimal? amount, bool isDiscount = false)
        {
            if (amount.HasValue && amount.Value > 0)
            {
                string color = isDiscount ? "#27ae60" : "#888888"; // สีเทาละมุนๆ
                string sign = isDiscount ? "-" : "";
                rows.Add($$"""
                {
                "type": "box", "layout": "horizontal", "margin": "md",
                "contents": [
                    { "type": "text", "text": "{{title}}", "size": "sm", "color": "#888888", "flex": 2 },
                    { "type": "text", "text": "{{sign}}{{amount.Value:N2}} ฿", "size": "sm", "color": "{{color}}", "align": "end", "weight": "regular", "flex": 1 }
                ]
                }
                """);
            }
        }

        AddRow("ค่าเช่าห้อง", payment.RoomRate);
        AddRow("ค่าไฟฟ้า", payment.ElectricalPricePerUnit);
        AddRow("ค่าน้ำประปา", payment.WaterPricePerUnit);
        AddRow("ค่าอินเทอร์เน็ต", payment.InternetCost);
        AddRow("ค่าส่วนกลาง/ซักรีด", payment.LaundryCost);
        AddRow("ค่าทรัพย์สิน/เฟอร์นิเจอร์", payment.FurnitureCost);
        AddRow($"ค่าใช้จ่ายเพิ่มเติม", payment.AdditionalCost);
        AddRow($"ส่วนลด", payment.DiscountCost, true);

        string itemsJson = string.Join(",", rows);

        // 🌟 2. URL หน้าบ้าน
        string frontendBaseUrl = "https://apartment-management-system-webapp.onrender.com";
        string billLink = $"{frontendBaseUrl}/view-bill/{payment.Id}"; 

        // 4. ประกอบร่าง Flex Message สไตล์ Minimal
        string flexCardJson = $$"""
        {
        "type": "bubble",
        "size": "mega",
        "body": {
            "type": "box",
            "layout": "vertical",
            "paddingAll": "10%",
            "contents": [
            {
                "type": "text",
                "text": "● {{headerText}}",
                "color": "{{statusColor}}",
                "weight": "bold",
                "size": "xs"
            },
            {
                "type": "box",
                "layout": "horizontal",
                "margin": "lg",
                "contents": [
                { "type": "text", "text": "ห้อง", "size": "xl", "color": "#111111", "weight": "bold" },
                { "type": "text", "text": "{{roomNumber}}", "size": "xl", "color": "{{statusColor}}", "align": "end", "weight": "bold" }
                ]
            },
            {
                "type": "text",
                "text": "รอบบิล: {{monthYear}}",
                "color": "#aaaaaa",
                "size": "xs",
                "margin": "xs"
            },
            { "type": "separator", "margin": "xl", "color": "#f0f0f0" },
            {
                "type": "box",
                "layout": "vertical",
                "margin": "xl",
                "contents": [
                {{itemsJson}}
                ]
            },
            { "type": "separator", "margin": "xl", "color": "#f0f0f0" },
            {
                "type": "box",
                "layout": "horizontal",
                "margin": "xl",
                "contents": [
                { "type": "text", "text": "ยอดสุทธิ", "size": "sm", "color": "#111111" },
                { "type": "text", "text": "{{payment.TotalAmount?.ToString("N2")}} ฿", "size": "lg", "color": "#111111", "align": "end", "weight": "bold" }
                ]
            }
            ]
        },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "paddingAll": "10%",
            "paddingTop": "0px",
            "contents": [
            {
                "type": "button",
                "style": "secondary",
                "color": "#f4f4f4",
                "height": "sm",
                "action": {
                "type": "uri",
                "label": "ดูรายละเอียด",
                "uri": "{{billLink}}"
                }
            },
            {
                "type": "text",
                "text": "{{footerText}}",
                "size": "xxs",
                "color": "#cccccc",
                "align": "center",
                "margin": "lg"
            }
            ]
        }
        }
        """;

        try
        {
            string altText = $"{altTextStatus} ห้อง {roomNumber} ยอดสุทธิ {payment.TotalAmount?.ToString("N2")} บาท";
            
            // 🌟 3. ส่งไปหา payment.Contract.Tenant.Note
            await _lineService.SendFlexMessageAsync(payment.Contract.Tenant.Note, altText, flexCardJson);
            
            return Ok(new { message = "ส่ง LINE สำเร็จ" });
        }
        catch (Exception ex)
        {
            _logger.LogError($"Send LINE Bill Error: {ex.Message}");
            return StatusCode(500, new { message = "เกิดข้อผิดพลาดในการส่ง LINE" });
        }
    }

    // ─────────────────────────────────────────────────────────────
    // HELPER: Payment → DTO
    // ─────────────────────────────────────────────────────────────
    private static PaymentDetailDto ToDetailDto(Payment p) => new()
    {
        Id               = p.Id,
        ContractId       = p.ContractId,
        RecordDate       = p.RecordDate,
        Status           = p.Status,
        RoomRate         = p.RoomRate,
        ElectricalCost   = p.ElectricalPricePerUnit,
        WaterCost        = p.WaterPricePerUnit,
        FurnitureCost    = p.FurnitureCost,
        InternetCost     = p.InternetCost,
        LaundryCost      = p.LaundryCost,
        DiscountCost     = p.DiscountCost,
        DiscountDetail   = p.DiscountDetail,
        AdditionalCost   = p.AdditionalCost,
        AdditionalDetail = p.AdditionalDetail,
        TotalAmount      = p.TotalAmount,
        PaidAmount       = p.PaidAmount,
        AdminId          = p.AdminId,
        Note             = p.Note,
    };
}