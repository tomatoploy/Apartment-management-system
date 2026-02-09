using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Pomelo.EntityFrameworkCore.MySql.Scaffolding.Internal;

namespace Dormitory.DormitoryModels;

public partial class DormitoryDbContext : DbContext
{
    public DormitoryDbContext()
    {
    }

    public DormitoryDbContext(DbContextOptions<DormitoryDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Admin> Admin { get; set; }

    public virtual DbSet<Apartment> Apartment { get; set; }

    public virtual DbSet<Constant> Constant { get; set; }

    public virtual DbSet<Contract> Contract { get; set; }

    public virtual DbSet<Document> Document { get; set; }

    public virtual DbSet<Parcel> Parcel { get; set; }

    public virtual DbSet<Payment> Payment { get; set; }

    public virtual DbSet<Permission> Permission { get; set; }

    public virtual DbSet<Request> Request { get; set; }

    public virtual DbSet<Room> Room { get; set; }

    public virtual DbSet<Tenant> Tenant { get; set; }

    public virtual DbSet<UtilityMeter> UtilityMeter { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
//#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        //ploy
        // => optionsBuilder.UseMySql("server=localhost;port=3306;user=root;password=Surawee2545;database=Dormitory", Microsoft.EntityFrameworkCore.ServerVersion.Parse("11.8.2-mariadb"));
        //nn
        => optionsBuilder.UseMySql("server=100.71.138.33;port=3306;user=nongnut;password=Password123!;database=Dormitory", Microsoft.EntityFrameworkCore.ServerVersion.Parse("11.8.2-mariadb"));
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .UseCollation("utf8mb4_0900_ai_ci")
            .HasCharSet("utf8mb4");

        modelBuilder.Entity<Admin>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable(tb => tb.HasComment("Stores administrator account information for managing and maintaining the system."));

            entity.HasIndex(e => e.Email, "Email").IsUnique();

            entity.HasIndex(e => e.Phone, "Phone").IsUnique();

            entity.Property(e => e.Id).HasColumnType("int(10) unsigned");
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.FirstName).HasMaxLength(50);
            entity.Property(e => e.IsDisabled)
                .HasDefaultValueSql("'1'")
                .HasComment("type in c# is boolean (1 = active, 0 = disabled)")
                .HasColumnType("tinyint(1) unsigned");
            entity.Property(e => e.LastName).HasMaxLength(50);
            entity.Property(e => e.Password)
                .HasMaxLength(255)
                .HasComment("hashed password");
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.Salt).HasMaxLength(255);
            entity.Property(e => e.Signature).HasMaxLength(100);
            entity.Property(e => e.Title).HasColumnType("enum('นาย','นางสาว','นาง')");
        });

        modelBuilder.Entity<Apartment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable(tb => tb.HasComment("Collect general information about the dormitory."));

            entity.HasIndex(e => e.Email, "Email").IsUnique();

            entity.HasIndex(e => e.LineId, "LineID").IsUnique();

            entity.HasIndex(e => e.Phone, "Phone").IsUnique();

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnType("int(10) unsigned");
            entity.Property(e => e.Address).HasMaxLength(255);
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.LineId)
                .HasMaxLength(30)
                .HasColumnName("LineID");
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.PaymentDueEnd)
                .HasComment("Payment end date.")
                .HasColumnType("tinyint(3) unsigned");
            entity.Property(e => e.PaymentDueStart)
                .HasComment("Payment start date.")
                .HasColumnType("tinyint(3) unsigned");
            entity.Property(e => e.Phone).HasMaxLength(20);
        });

        modelBuilder.Entity<Constant>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.Property(e => e.Id).HasColumnType("int(10) unsigned");
            entity.Property(e => e.Category).HasColumnType("enum('service','utility','facility','maintenance','penalty','other')");
            entity.Property(e => e.Cost).HasPrecision(20, 3);
            entity.Property(e => e.Note).HasColumnType("text");
            entity.Property(e => e.Subject).HasMaxLength(50);
        });

        modelBuilder.Entity<Contract>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.HasIndex(e => e.RoomId, "RoomIdTContract");

            entity.HasIndex(e => e.TenantId, "TenantIdTContract");

            entity.Property(e => e.Id).HasColumnType("int(10) unsigned");
            entity.Property(e => e.AttachedFile)
                .HasMaxLength(50)
                .HasComment("save a name of file");
            entity.Property(e => e.Deposit).HasColumnType("decimal(20,3) unsigned");
            entity.Property(e => e.InitialElectricUnit).HasColumnType("int(10) unsigned");
            entity.Property(e => e.InitialWaterUnit).HasColumnType("int(10) unsigned");
            entity.Property(e => e.MonthlyRent).HasColumnType("decimal(20,3) unsigned");
            entity.Property(e => e.RoomId).HasColumnType("int(10) unsigned");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'Pending'")
                .HasColumnType("enum('Reserved','Pending','Active','Terminated','Expired')");
            entity.Property(e => e.TenantId).HasColumnType("int(10) unsigned");

            entity.HasOne(d => d.Room).WithMany(p => p.Contract)
                .HasForeignKey(d => d.RoomId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("RoomIdTContract");

            entity.HasOne(d => d.Tenant).WithMany(p => p.Contract)
                .HasForeignKey(d => d.TenantId)
                .HasConstraintName("TenantIdTContract");
        });

        modelBuilder.Entity<Document>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable(tb => tb.HasComment("Stores dormitory-related documents such as rental contracts, invoices, and payment records.\r\n"));

            entity.HasIndex(e => e.AdminId, "AdminIdTDocument");

            entity.Property(e => e.Id).HasColumnType("int(10) unsigned");
            entity.Property(e => e.AdminId).HasColumnType("int(10) unsigned");
            entity.Property(e => e.Content).HasColumnType("text");
            entity.Property(e => e.Name).HasMaxLength(100);

            entity.HasOne(d => d.Admin).WithMany(p => p.Document)
                .HasForeignKey(d => d.AdminId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("AdminIdTDocument");
        });

        modelBuilder.Entity<Parcel>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.HasIndex(e => e.RoomId, "RoomIdTParcel");

            entity.Property(e => e.Id).HasColumnType("int(10) unsigned");
            entity.Property(e => e.Recipient).HasMaxLength(255);
            entity.Property(e => e.RoomId).HasColumnType("int(10) unsigned");
            entity.Property(e => e.ShippingCompany).HasColumnType("enum('thaipost','kerry','j&t','shopee','lazada','dhl','other')");
            entity.Property(e => e.TrackingNumber).HasMaxLength(30);
            entity.Property(e => e.Type).HasColumnType("enum('box','pack','other')");

            entity.HasOne(d => d.Room).WithMany(p => p.Parcel)
                .HasForeignKey(d => d.RoomId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("RoomIdTParcel");
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.HasIndex(e => e.AdminId, "AdminIdTPayment");

            entity.HasIndex(e => e.ContractId, "ContractIdTPayment");

            entity.Property(e => e.Id).HasColumnType("int(10) unsigned");
            entity.Property(e => e.AdditionalCost).HasPrecision(20, 3);
            entity.Property(e => e.AdditionalDetail).HasMaxLength(50);
            entity.Property(e => e.AdminId).HasColumnType("int(10) unsigned");
            entity.Property(e => e.ContractId).HasColumnType("int(10) unsigned");
            entity.Property(e => e.DiscountCost).HasPrecision(20, 3);
            entity.Property(e => e.DiscountDetail).HasMaxLength(500);
            entity.Property(e => e.ElectricalPricePerUnit).HasPrecision(20, 3);
            entity.Property(e => e.FurnitureCost).HasPrecision(20, 3);
            entity.Property(e => e.InternetCost).HasPrecision(20, 3);
            entity.Property(e => e.LaundryCost).HasPrecision(20, 3);
            entity.Property(e => e.Note).HasColumnType("text");
            entity.Property(e => e.PaidAmount).HasPrecision(20, 3);
            entity.Property(e => e.RoomRate).HasPrecision(20, 3);
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'unpaid'")
                .HasColumnType("enum('paid','unpaid','overdue','longOverdue')");
            entity.Property(e => e.TotalAmount).HasPrecision(20, 3);
            entity.Property(e => e.WaterPricePerUnit).HasPrecision(20, 3);

            entity.HasOne(d => d.Admin).WithMany(p => p.Payment)
                .HasForeignKey(d => d.AdminId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("AdminIdTPayment");

            entity.HasOne(d => d.Contract).WithMany(p => p.Payment)
                .HasForeignKey(d => d.ContractId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("ContractIdTPayment");
        });

        modelBuilder.Entity<Permission>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable(tb => tb.HasComment("Stores permission data that defines access rights (in the future : actions allowed for each role or user) in the system."));

            entity.HasIndex(e => e.AdminId, "AdminIdTPermission");

            entity.HasIndex(e => e.ApartmentId, "ApartmentIdTPermission");

            entity.Property(e => e.Id).HasColumnType("int(10) unsigned");
            entity.Property(e => e.AdminId).HasColumnType("int(10) unsigned");
            entity.Property(e => e.ApartmentId).HasColumnType("int(10) unsigned");

            entity.HasOne(d => d.Admin).WithMany(p => p.Permission)
                .HasForeignKey(d => d.AdminId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("AdminIdTPermission");

            entity.HasOne(d => d.Apartment).WithMany(p => p.Permission)
                .HasForeignKey(d => d.ApartmentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("ApartmentIdTPermission");
        });

        modelBuilder.Entity<Request>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.HasIndex(e => e.RoomId, "RoomIdTRequest");

            entity.Property(e => e.Id).HasColumnType("int(10) unsigned");
            entity.Property(e => e.Body).HasColumnType("text");
            entity.Property(e => e.Cost).HasPrecision(20, 3);
            entity.Property(e => e.IsTenantCost).HasComment("in c# is boolean (0 = false, 1 = true)");
            entity.Property(e => e.Note).HasColumnType("text");
            entity.Property(e => e.RoomId).HasColumnType("int(10) unsigned");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'pending'")
                .HasColumnType("enum('pending','finish','cancel')");
            entity.Property(e => e.Subject).HasColumnType("enum('fix','clean','leave','other')");

            entity.HasOne(d => d.Room).WithMany(p => p.Request)
                .HasForeignKey(d => d.RoomId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("RoomIdTRequest");
        });

        modelBuilder.Entity<Room>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable(tb => tb.HasComment("Stores apartment room information including room number, floor, room type, and current room status."));

            entity.Property(e => e.Id).HasColumnType("int(10) unsigned");
            entity.Property(e => e.Building).HasMaxLength(10);
            entity.Property(e => e.Floor).HasColumnType("enum('1','2','3','4','5')");
            entity.Property(e => e.Note).HasColumnType("text");
            entity.Property(e => e.Number).HasMaxLength(10);
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'available'")
                .HasColumnType("enum('available','occupied','reserved','close','delete')");
        });

        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.HasIndex(e => e.AltPhone, "AltPhone").IsUnique();

            entity.HasIndex(e => e.Nin, "Nin").IsUnique();

            entity.HasIndex(e => e.Phone, "Phone").IsUnique();

            entity.Property(e => e.Id).HasColumnType("int(10) unsigned");
            entity.Property(e => e.Address).HasMaxLength(255);
            entity.Property(e => e.AltName).HasMaxLength(100);
            entity.Property(e => e.AltPhone).HasMaxLength(10);
            entity.Property(e => e.AltRelationship).HasMaxLength(50);
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.FirstName).HasMaxLength(50);
            entity.Property(e => e.InternetDeviceCount)
                .HasDefaultValueSql("'0'")
                .HasColumnType("int(10) unsigned");
            entity.Property(e => e.IsLaundryService).HasComment("in c# = boolean (0 = false, 1 = true)");
            entity.Property(e => e.KeyCard1).HasMaxLength(10);
            entity.Property(e => e.KeyCard2).HasMaxLength(10);
            entity.Property(e => e.KeyCard3).HasMaxLength(10);
            entity.Property(e => e.LastName).HasMaxLength(50);
            entity.Property(e => e.LineId).HasMaxLength(30);
            entity.Property(e => e.NickName).HasMaxLength(25);
            entity.Property(e => e.Nin).HasMaxLength(13);
            entity.Property(e => e.Note).HasColumnType("text");
            entity.Property(e => e.Phone).HasMaxLength(10);
            entity.Property(e => e.Photo)
                .HasMaxLength(100)
                .HasComment("save a name of file");
            entity.Property(e => e.Title).HasColumnType("enum('นาย','นาง','นางสาว','เด็กชาย','เด็กหญิง')");
            entity.Property(e => e.VehicleDetail1).HasMaxLength(50);
            entity.Property(e => e.VehicleDetail2).HasMaxLength(50);
            entity.Property(e => e.VehicleNum1).HasMaxLength(8);
            entity.Property(e => e.VehicleNum2).HasMaxLength(8);
        });

        modelBuilder.Entity<UtilityMeter>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.HasIndex(e => e.RoomId, "RoomIdTUtilityMeter");

            entity.Property(e => e.Id).HasColumnType("int(10) unsigned");
            entity.Property(e => e.RoomId).HasColumnType("int(10) unsigned");

            entity.Property(e => e.ElectricityUnit)
                .HasColumnType("int(10) unsigned")
                .IsRequired(false);

            entity.Property(e => e.WaterUnit)
                .HasColumnType("int(10) unsigned")
                .IsRequired(false);

            entity.Property(e => e.ChangeElectricityMeterStart)
                .HasColumnType("int(10) unsigned")
                .IsRequired(false);

            entity.Property(e => e.ChangeElectricityMeterEnd)
                .HasColumnType("int(10) unsigned")
                .IsRequired(false);

            entity.Property(e => e.ChangeWaterMeterStart)
                .HasColumnType("int(10) unsigned")
                .IsRequired(false);

            entity.Property(e => e.ChangeWaterMeterEnd)
                .HasColumnType("int(10) unsigned")
                .IsRequired(false);

            entity.Property(e => e.Note).HasColumnType("text");

            entity.HasOne(d => d.Room)
                .WithMany(p => p.UtilityMeter)
                .HasForeignKey(d => d.RoomId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("RoomIdTUtilityMeter");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
