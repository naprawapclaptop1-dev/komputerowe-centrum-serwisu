using System.Security.Principal;
using LibreHardwareMonitor.Hardware;
using NaprawaPCFanControlPro.Models;

namespace NaprawaPCFanControlPro.Services;

/// <summary>
/// Odczyt czujników i sterowanie wyłącznie kanałami zgłoszonymi przez bibliotekę sprzętową.
/// </summary>
public sealed class SensorService : IDisposable
{
    private readonly object _sync = new();
    private readonly Computer _computer = new()
    {
        IsCpuEnabled = true,
        IsGpuEnabled = true,
        IsMemoryEnabled = true,
        IsMotherboardEnabled = true,
        IsControllerEnabled = true,
        IsStorageEnabled = true,
        IsPowerMonitorEnabled = true,
        IsBatteryEnabled = true
    };

    private bool _opened;
    private bool _disposed;

    public SensorSnapshot ReadSnapshot()
    {
        lock (_sync)
        {
            ObjectDisposedException.ThrowIf(_disposed, this);
            var readings = new List<SensorReading>();
            var fans = new List<FanChannel>();

            try
            {
                if (!_opened)
                {
                    _computer.Open();
                    _opened = true;
                }

                var hardware = _computer.Hardware;
                foreach (var item in hardware)
                    UpdateRecursive(item);

                foreach (var item in hardware)
                    CollectRecursive(item, readings, fans);

                return new SensorSnapshot
                {
                    CapturedAt = DateTimeOffset.Now,
                    Readings = readings,
                    Fans = fans,
                    DiskCount = hardware.Count(x => x.HardwareType == HardwareType.Storage),
                    IsAdministrator = IsAdmin()
                };
            }
            catch (Exception ex)
            {
                return new SensorSnapshot
                {
                    CapturedAt = DateTimeOffset.Now,
                    Readings = readings,
                    Fans = fans,
                    Error = ex.Message,
                    IsAdministrator = IsAdmin()
                };
            }
        }
    }

    private static void UpdateRecursive(IHardware hardware)
    {
        hardware.Update();
        foreach (var child in hardware.SubHardware)
            UpdateRecursive(child);
    }

    private static void CollectRecursive(
        IHardware hardware,
        List<SensorReading> readings,
        List<FanChannel> fans)
    {
        foreach (var sensor in hardware.Sensors)
        {
            try
            {
                if (!sensor.Value.HasValue)
                    continue;

                var value = sensor.Value.Value;
                if (!float.IsFinite(value))
                    continue;

                var type = sensor.SensorType.ToString();
                if (type == "Temperature" && (value < -20 || value > 150))
                    continue;

                readings.Add(new SensorReading
                {
                    HardwareName = hardware.Name,
                    HardwareType = hardware.HardwareType.ToString(),
                    Name = sensor.Name,
                    Type = type,
                    Value = value,
                    Unit = UnitFor(type),
                    CapturedAt = DateTimeOffset.Now
                });

                if (sensor.SensorType == SensorType.Fan)
                {
                    var control = sensor.Control;
                    fans.Add(new FanChannel
                    {
                        HardwareName = hardware.Name,
                        Name = sensor.Name,
                        Identifier = sensor.Identifier.ToString(),
                        Rpm = value,
                        Control = control
                    });
                }
            }
            catch
            {
                // Awaria pojedynczego czujnika nie zatrzymuje pozostałych odczytów.
            }
        }

        foreach (var child in hardware.SubHardware)
            CollectRecursive(child, readings, fans);
    }

    private static string UnitFor(string type) => type switch
    {
        "Temperature" => "°C",
        "Fan" => "RPM",
        "Voltage" => "V",
        "Current" => "A",
        "Power" => "W",
        "Clock" => "MHz",
        "Load" or "Control" or "Level" or "Humidity" => "%",
        "Frequency" => "Hz",
        "Flow" => "L/h",
        "Data" => "B",
        "Throughput" => "B/s",
        "TimeSpan" => "s",
        "Timing" => "ns",
        "Energy" => "mWh",
        "Noise" => "dBA",
        "Conductivity" => "µS/cm",
        _ => ""
    };

    public void SetFan(FanChannel fan, float percent)
    {
        lock (_sync)
        {
            ObjectDisposedException.ThrowIf(_disposed, this);
            var control = fan.Control;
            if (!fan.CanControl || control is null)
                throw new InvalidOperationException("Ten kanał nie obsługuje sterowania programowego.");

            if (!float.IsFinite(percent) ||
                percent < control.MinSoftwareValue ||
                percent > control.MaxSoftwareValue)
                throw new ArgumentOutOfRangeException(nameof(percent), "Wartość poza zakresem kontrolera.");

            control.SetSoftware(percent);
        }
    }

    public void RestoreDefault(FanChannel fan)
    {
        lock (_sync)
        {
            ObjectDisposedException.ThrowIf(_disposed, this);
            var control = fan.Control;
            if (!fan.CanControl || control is null)
                throw new InvalidOperationException("Ten kanał nie obsługuje sterowania programowego.");

            control.SetDefault();
        }
    }

    private static bool IsAdmin()
    {
        try
        {
            using var identity = WindowsIdentity.GetCurrent();
            return new WindowsPrincipal(identity).IsInRole(WindowsBuiltInRole.Administrator);
        }
        catch { return false; }
    }

    public void Dispose()
    {
        lock (_sync)
        {
            if (_disposed) return;
            if (_opened)
            {
                try { _computer.Close(); }
                catch { }
                _opened = false;
            }
            _disposed = true;
        }
        GC.SuppressFinalize(this);
    }
}
