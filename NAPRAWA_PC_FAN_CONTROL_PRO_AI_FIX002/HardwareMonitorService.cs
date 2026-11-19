using LibreHardwareMonitor.Hardware;

namespace NaprawaPCFanControl;

public sealed class HardwareMonitorService : IDisposable
{
    private readonly Computer _computer = new()
    {
        IsCpuEnabled = true, IsGpuEnabled = true, IsMemoryEnabled = true,
        IsMotherboardEnabled = true, IsStorageEnabled = true, IsControllerEnabled = true
    };
    public HardwareMonitorService() => _computer.Open();

    public MonitorSnapshot Read()
    {
        var snapshot = new MonitorSnapshot();
        foreach (var hardware in _computer.Hardware) ReadHardware(hardware, snapshot);
        return snapshot;
    }

    private static void ReadHardware(IHardware hardware, MonitorSnapshot snapshot)
    {
        try { hardware.Update(); } catch { return; }
        foreach (var sensor in hardware.Sensors)
        {
            if (sensor.Value is not float value || !float.IsFinite(value)) continue;
            var unit = sensor.SensorType switch
            {
                SensorType.Temperature => "°C", SensorType.Fan => "RPM", SensorType.Load => "%",
                SensorType.Clock => "MHz", SensorType.Power => "W", SensorType.Voltage => "V",
                SensorType.Data => "GB", SensorType.SmallData => "MB", _ => ""
            };
            snapshot.Sensors.Add(new SensorRow
            {
                Category = sensor.SensorType.ToString(), Name = sensor.Name, Hardware = hardware.Name,
                Value = $"{value:0.##} {unit}".Trim(),
                Status = sensor.SensorType == SensorType.Temperature && value >= 90 ? "WYSOKA TEMPERATURA" : "OK"
            });

            if (sensor.SensorType == SensorType.Temperature)
            {
                if (hardware.HardwareType == HardwareType.Cpu) snapshot.CpuMaxC = Math.Max(snapshot.CpuMaxC ?? float.MinValue, value);
                if (hardware.HardwareType is HardwareType.GpuNvidia or HardwareType.GpuAmd or HardwareType.GpuIntel)
                    snapshot.GpuMaxC = Math.Max(snapshot.GpuMaxC ?? float.MinValue, value);
            }
            if (sensor.SensorType == SensorType.Load)
            {
                if (hardware.HardwareType == HardwareType.Cpu && (snapshot.CpuLoad is null || value > snapshot.CpuLoad)) snapshot.CpuLoad = value;
                if ((hardware.HardwareType is HardwareType.GpuNvidia or HardwareType.GpuAmd or HardwareType.GpuIntel) &&
                    (snapshot.GpuLoad is null || value > snapshot.GpuLoad)) snapshot.GpuLoad = value;
            }
            if (hardware.HardwareType == HardwareType.Cpu && sensor.SensorType == SensorType.Clock && sensor.Name.Contains("Core", StringComparison.OrdinalIgnoreCase))
                snapshot.CpuClock = Math.Max(snapshot.CpuClock ?? 0, value);
            if (hardware.HardwareType == HardwareType.Cpu && sensor.SensorType == SensorType.Power)
                snapshot.CpuPower = Math.Max(snapshot.CpuPower ?? 0, value);

            if (sensor.Control is not null && !snapshot.FanChannels.Any(x => ReferenceEquals(x.Control, sensor.Control)))
                snapshot.FanChannels.Add((hardware.Name, sensor.Name, sensor.Control));
        }
        foreach (var child in hardware.SubHardware) ReadHardware(child, snapshot);
    }

    public void Dispose()
    {
        try { foreach (var h in _computer.Hardware) RestoreHardware(h); } catch { }
        try { _computer.Close(); } catch { }
    }
    private static void RestoreHardware(IHardware hardware)
    {
        foreach (var sensor in hardware.Sensors) { try { sensor.Control?.SetDefault(); } catch { } }
        foreach (var child in hardware.SubHardware) RestoreHardware(child);
    }
}