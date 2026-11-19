using LibreHardwareMonitor.Hardware;

namespace NaprawaPCFanControlPro.Models;

public sealed class SensorReading
{
    public string HardwareName { get; init; } = "";
    public string HardwareType { get; init; } = "";
    public string Name { get; init; } = "";
    public string Type { get; init; } = "";
    public float Value { get; init; }
    public string Unit { get; init; } = "";
    public string ValueText => $"{Value:0.0} {Unit}".Trim();
    public DateTimeOffset CapturedAt { get; init; }
}

public sealed class FanChannel
{
    public string HardwareName { get; init; } = "";
    public string Name { get; init; } = "";
    public string Identifier { get; init; } = "";
    public float Rpm { get; init; }
    public string RpmText => $"{Rpm:0} RPM";
    public IControl? Control { get; init; }
    public bool CanControl => Control is not null &&
        Control.MaxSoftwareValue > Control.MinSoftwareValue;
    public string ControlText => !CanControl ? "Tylko odczyt" :
        Control!.ControlMode == ControlMode.Software ? $"Programowe: {Control.SoftwareValue:0}%" :
        "Sterowanie BIOS / domyślne";
    public float Minimum => Control?.MinSoftwareValue ?? 0;
    public float Maximum => Control?.MaxSoftwareValue ?? 100;
    public float SoftwareValue => Control?.SoftwareValue ?? 0;
}

public sealed class InventoryRow
{
    public string Category { get; init; } = "";
    public string Component { get; init; } = "";
    public string Details { get; init; } = "";
    public string Source { get; init; } = "";
}

public sealed class SensorSnapshot
{
    public DateTimeOffset CapturedAt { get; init; } = DateTimeOffset.Now;
    public List<SensorReading> Readings { get; init; } = [];
    public List<FanChannel> Fans { get; init; } = [];
    public string? Error { get; init; }
    public int DiskCount { get; init; }
    public bool IsAdministrator { get; init; }
}

public sealed class InventorySnapshot
{
    public string ComputerName { get; init; } = Environment.MachineName;
    public string Summary { get; init; } = "";
    public List<InventoryRow> Rows { get; init; } = [];
}
