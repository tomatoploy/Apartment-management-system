// DTOs/PaymentDto.cs
namespace Dormitory.DTOs
{
// DTOs/PaymentDtos.cs

public class PaymentDetailDto
{
    public uint     Id               { get; set; }
    public uint     ContractId       { get; set; }
    public DateOnly RecordDate       { get; set; }
    public string   Status           { get; set; } = null!;
    public decimal? RoomRate         { get; set; }
    public decimal? ElectricalCost   { get; set; }
    public decimal? WaterCost        { get; set; }
    public decimal? InternetCost     { get; set; }
    public decimal? LaundryCost      { get; set; }
    public decimal? FurnitureCost    { get; set; }
    public decimal? DiscountCost     { get; set; }
    public string?  DiscountDetail   { get; set; }
    public decimal? AdditionalCost   { get; set; }
    public string?  AdditionalDetail { get; set; }
    public decimal? TotalAmount      { get; set; }
    public decimal? PaidAmount       { get; set; }
    public uint     AdminId          { get; set; }
    public string?  Note             { get; set; }
}

public class PaymentCalculationResult
{
    public uint    ContractId    { get; set; }
    public uint    RoomId        { get; set; }
    public uint    TenantId      { get; set; }
    public int     Year          { get; set; }
    public int     Month         { get; set; }
    public bool    AlreadyExists { get; set; }

    public decimal RoomRate      { get; set; }

    public uint?   ElectricityUsedUnit    { get; set; }
    public decimal ElectricityRatePerUnit { get; set; }
    public decimal ElectricalCost         { get; set; }

    public uint?   WaterUsedUnit          { get; set; }
    public decimal WaterRatePerUnit       { get; set; }
    public decimal WaterCost              { get; set; }

    // ✅ แก้: uint? → uint เพื่อรับค่า ?? 0 ได้ตรง ๆ
    public uint    InternetDeviceCount    { get; set; }
    public decimal InternetRatePerDevice  { get; set; }
    public decimal InternetCost           { get; set; }

    public bool    IsLaundryService       { get; set; }
    public decimal LaundryRate            { get; set; }
    public decimal LaundryCost            { get; set; }

    public decimal TotalAmount            { get; set; }
    public string  CalculationNote        { get; set; } = string.Empty;

    public uint?   CurrentElectricUnit    { get; set; }
    public uint?   PreviousElectricUnit   { get; set; }
    public uint?   CurrentWaterUnit       { get; set; }
    public uint?   PreviousWaterUnit      { get; set; }
}

public class PostPaymentDto
{
    public uint      ContractId       { get; set; }
    public DateOnly? RecordDate       { get; set; }
    public uint      AdminId          { get; set; }
    public decimal?  RoomRate         { get; set; }
    public decimal?  ElectricalCost   { get; set; }
    public decimal?  WaterCost        { get; set; }
    public decimal?  InternetCost     { get; set; }
    public decimal?  LaundryCost      { get; set; }
    public decimal?  FurnitureCost    { get; set; }
    public decimal?  DiscountCost     { get; set; }
    public string?   DiscountDetail   { get; set; }
    public decimal?  AdditionalCost   { get; set; }
    public string?   AdditionalDetail { get; set; }
    public string?   Note             { get; set; }
    public string?   CalculationNote  { get; set; }
}

public class PutPaymentDto
{
    public decimal? RoomRate         { get; set; }
    public decimal? ElectricalCost   { get; set; }
    public decimal? WaterCost        { get; set; }
    public decimal? InternetCost     { get; set; }
    public decimal? LaundryCost      { get; set; }
    public decimal? FurnitureCost    { get; set; }
    public decimal? DiscountCost     { get; set; }
    public string?  DiscountDetail   { get; set; }
    public decimal? AdditionalCost   { get; set; }
    public string?  AdditionalDetail { get; set; }
    public string?  Note             { get; set; }
    public string?  CalculationNote  { get; set; }
}

public class PatchPaymentStatusDto
{
    public string?  Status     { get; set; }
    public decimal? PaidAmount { get; set; }
}
}