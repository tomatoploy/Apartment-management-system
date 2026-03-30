CREATE TABLE IF NOT EXISTS `__EFMigrationsHistory` (
    `MigrationId` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `ProductVersion` varchar(32) CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK___EFMigrationsHistory` PRIMARY KEY (`MigrationId`)
) CHARACTER SET=utf8mb4;

START TRANSACTION;

ALTER DATABASE CHARACTER SET utf8mb4;

CREATE TABLE `Admin` (
    `Id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `IsDisabled` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT 'type in c# is boolean (1 = active, 0 = disabled)',
    `Title` enum('นาย','นางสาว','นาง') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `FirstName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
    `LastName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `Phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
    `Email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `Signature` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `Salt` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
    `Password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'hashed password',
    CONSTRAINT `PRIMARY` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores administrator account information for managing and maintaining the system.';

CREATE TABLE `Apartment` (
    `Id` int(10) unsigned NOT NULL,
    `Name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
    `Address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `Phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `LineID` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `Email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `PaymentDueStart` tinyint(3) unsigned NOT NULL COMMENT 'Payment start date.',
    `PaymentDueEnd` tinyint(3) unsigned NOT NULL COMMENT 'Payment end date.',
    CONSTRAINT `PRIMARY` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Collect general information about the dormitory.';

CREATE TABLE `Constant` (
    `Id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `Category` enum('service','utility','facility','maintenance','penalty','property','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
    `Subject` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `Cost` decimal(20,3) NULL,
    `Note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    CONSTRAINT `PRIMARY` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Room` (
    `Id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `Building` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `Floor` enum('1','2','3','4','5') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `Number` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
    `Status` enum('available','occupied','reserved','close','delete') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'available',
    `Note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    CONSTRAINT `PRIMARY` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores apartment room information including room number, floor, room type, and current room status.';

CREATE TABLE `Tenant` (
    `Id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `Nin` varchar(13) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `Title` enum('นาย','นาง','นางสาว','เด็กชาย','เด็กหญิง') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `FirstName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
    `LastName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `NickName` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `Phone` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
    `Address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `BirthDate` date NULL,
    `LineId` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `Email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `Photo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT 'save a name of file',
    `AltName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `AltPhone` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `AltRelationship` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `VehicleNum1` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `VehicleDetail1` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `VehicleNum2` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `VehicleDetail2` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `KeyCard1` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `KeyCard2` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `KeyCard3` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `IsLaundryService` tinyint(1) NULL COMMENT 'in c# = boolean (0 = false, 1 = true)',
    `InternetDeviceCount` int(10) unsigned NULL DEFAULT '0',
    `Note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    CONSTRAINT `PRIMARY` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Document` (
    `Id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `Name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
    `Content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
    `AdminId` int(10) unsigned NOT NULL,
    CONSTRAINT `PRIMARY` PRIMARY KEY (`Id`),
    CONSTRAINT `AdminIdTDocument` FOREIGN KEY (`AdminId`) REFERENCES `Admin` (`Id`)
) CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores dormitory-related documents such as rental contracts, invoices, and payment records.
';

CREATE TABLE `Permission` (
    `Id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `ApartmentId` int(10) unsigned NOT NULL,
    `AdminId` int(10) unsigned NOT NULL,
    CONSTRAINT `PRIMARY` PRIMARY KEY (`Id`),
    CONSTRAINT `AdminIdTPermission` FOREIGN KEY (`AdminId`) REFERENCES `Admin` (`Id`),
    CONSTRAINT `ApartmentIdTPermission` FOREIGN KEY (`ApartmentId`) REFERENCES `Apartment` (`Id`)
) CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores permission data that defines access rights (in the future : actions allowed for each role or user) in the system.';

CREATE TABLE `Parcel` (
    `Id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `RoomId` int(10) unsigned NOT NULL,
    `Recipient` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `TrackingNumber` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `ShippingCompany` enum('thaipost','kerry','j&t','shopee','lazada','dhl','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `Type` enum('box','pack','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `ArrivalDate` date NOT NULL,
    `PickupDate` date NULL,
    CONSTRAINT `PRIMARY` PRIMARY KEY (`Id`),
    CONSTRAINT `RoomIdTParcel` FOREIGN KEY (`RoomId`) REFERENCES `Room` (`Id`)
) CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Request` (
    `Id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `RoomId` int(10) unsigned NOT NULL,
    `RequestDate` date NOT NULL,
    `Subject` enum('fix','clean','leave','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
    `Body` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `Status` enum('pending','finish','cancel') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending',
    `AppointmentDate` date NULL,
    `IsTenantCost` tinyint(1) NULL COMMENT 'in c# is boolean (0 = false, 1 = true)',
    `Cost` decimal(20,3) NULL,
    `Note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    CONSTRAINT `PRIMARY` PRIMARY KEY (`Id`),
    CONSTRAINT `RoomIdTRequest` FOREIGN KEY (`RoomId`) REFERENCES `Room` (`Id`)
) CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `UtilityMeter` (
    `Id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `RoomId` int(10) unsigned NOT NULL,
    `RecordDate` date NOT NULL,
    `ElectricityUnit` int(10) unsigned NULL,
    `ChangeElectricityMeterStart` int(10) unsigned NULL,
    `ChangeElectricityMeterEnd` int(10) unsigned NULL,
    `WaterUnit` int(10) unsigned NULL,
    `ChangeWaterMeterStart` int(10) unsigned NULL,
    `ChangeWaterMeterEnd` int(10) unsigned NULL,
    `Note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    CONSTRAINT `PRIMARY` PRIMARY KEY (`Id`),
    CONSTRAINT `RoomIdTUtilityMeter` FOREIGN KEY (`RoomId`) REFERENCES `Room` (`Id`)
) CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Contract` (
    `Id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `RoomId` int(10) unsigned NOT NULL,
    `TenantId` int(10) unsigned NULL,
    `Status` enum('Reserved','cancle','Active','Terminated','Expired') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
    `StartDate` date NULL,
    `EndDate` date NULL,
    `MonthlyRent` decimal(20,3) NOT NULL,
    `Deposit` decimal(20,3) NULL,
    `InitialElectricUnit` int(10) unsigned NULL,
    `InitialWaterUnit` int(10) unsigned NULL,
    `Note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT 'save a name of file',
    CONSTRAINT `PRIMARY` PRIMARY KEY (`Id`),
    CONSTRAINT `RoomIdTContract` FOREIGN KEY (`RoomId`) REFERENCES `Room` (`Id`),
    CONSTRAINT `TenantIdTContract` FOREIGN KEY (`TenantId`) REFERENCES `Tenant` (`Id`)
) CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Payment` (
    `Id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `ContractId` int(10) unsigned NOT NULL,
    `RecordDate` date NOT NULL,
    `Status` enum('paid','unpaid') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'unpaid',
    `RoomRate` decimal(20,3) NULL,
    `ElectricalPricePerUnit` decimal(20,3) NULL,
    `WaterPricePerUnit` decimal(20,3) NULL,
    `FurnitureCost` decimal(20,3) NULL,
    `InternetCost` decimal(20,3) NULL,
    `LaundryCost` decimal(20,3) NULL,
    `DiscountCost` decimal(20,3) NULL,
    `DiscountDetail` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `AdditionalCost` decimal(20,3) NULL,
    `AdditionalDetail` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `TotalAmount` decimal(20,3) NULL,
    `PaidAmount` decimal(20,3) NULL,
    `AdminId` int(10) unsigned NOT NULL,
    `Note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    CONSTRAINT `PRIMARY` PRIMARY KEY (`Id`),
    CONSTRAINT `AdminIdTPayment` FOREIGN KEY (`AdminId`) REFERENCES `Admin` (`Id`),
    CONSTRAINT `ContractIdTPayment` FOREIGN KEY (`ContractId`) REFERENCES `Contract` (`Id`)
) CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `Email` ON `Admin` (`Email`);

CREATE UNIQUE INDEX `Phone` ON `Admin` (`Phone`);

CREATE UNIQUE INDEX `Email1` ON `Apartment` (`Email`);

CREATE UNIQUE INDEX `LineID` ON `Apartment` (`LineID`);

CREATE UNIQUE INDEX `Phone1` ON `Apartment` (`Phone`);

CREATE INDEX `RoomIdTContract` ON `Contract` (`RoomId`);

CREATE INDEX `TenantIdTContract` ON `Contract` (`TenantId`);

CREATE INDEX `AdminIdTDocument` ON `Document` (`AdminId`);

CREATE INDEX `RoomIdTParcel` ON `Parcel` (`RoomId`);

CREATE INDEX `AdminIdTPayment` ON `Payment` (`AdminId`);

CREATE INDEX `ContractIdTPayment` ON `Payment` (`ContractId`);

CREATE INDEX `AdminIdTPermission` ON `Permission` (`AdminId`);

CREATE INDEX `ApartmentIdTPermission` ON `Permission` (`ApartmentId`);

CREATE INDEX `RoomIdTRequest` ON `Request` (`RoomId`);

CREATE UNIQUE INDEX `AltPhone` ON `Tenant` (`AltPhone`);

CREATE UNIQUE INDEX `Nin` ON `Tenant` (`Nin`);

CREATE UNIQUE INDEX `Phone2` ON `Tenant` (`Phone`);

CREATE INDEX `RoomIdTUtilityMeter` ON `UtilityMeter` (`RoomId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260330093957_InitialCreate', '8.0.0');

COMMIT;

