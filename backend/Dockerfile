# Stage 1: Build ขั้นตอนการนำโค้ดมาคอมไพล์
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# ก๊อปปี้ไฟล์ .csproj และ Restore packages
COPY ["Dormitory.csproj", "./"]
RUN dotnet restore "./Dormitory.csproj"

# ก๊อปปี้โค้ดทั้งหมดและ Publish
COPY . .
RUN dotnet publish "Dormitory.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Run ขั้นตอนการนำไฟล์ที่คอมไพล์แล้วไปรันบนเซิร์ฟเวอร์
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

# ดึงไฟล์ที่ Publish แล้วจาก Stage 1 มาใช้
COPY --from=build /app/publish .

# สั่งรันโปรแกรม
ENTRYPOINT ["dotnet", "Dormitory.dll"]