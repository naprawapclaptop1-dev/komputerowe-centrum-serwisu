using System.ComponentModel;
using System.Runtime.CompilerServices;
using LibreHardwareMonitor.Hardware;

namespace NaprawaPCFanControl;

public sealed class SensorRow
{
    public string Category { get; init; } = "";
    public string Name { get; init; } = "";
    public string Value { get; init; } = "";
    public string Hardware { get; init; } = "";
    public string Status { get; init; } = "";
}
public sealed class InventoryRow
{
    public string Section { get; init; } = "";
    public string Component { get; init; } = "";
    public string Value { get; init; } = "";
    public string Details { get; init; } = "";
}
public sealed class FanControlRow : INotifyPropertyChanged
{
    private readonly IControl _control;
    private double _percent;
    private bool _canControl;
    public FanControlRow(string hardware, string name, IControl control, bool canControl)
    { Hardware = hardware; Name = name; _control = control; _percent = Math.Clamp(control.SoftwareValue, 20, 100); _canControl = canControl; }
    public string Hardware { get; }
    public string Name { get; }
    public double Percent
    {
        get => _percent;
        set { var next = Math.Clamp(value, 20, 100); if (Math.Abs(next - _percent) < 0.4) return; _percent = next; OnPropertyChanged(); try { if (_canControl) _control.SetSoftware((float)next); } catch { } }
    }
    public bool CanControl
    {
        get => _canControl;
        set { _canControl = value; OnPropertyChanged(); }
    }
    public void Apply(double value)
    { _percent = Math.Clamp(value, 0, 100); try { _control.SetSoftware((float)_percent); } catch { } OnPropertyChanged(nameof(Percent)); }
    public void Restore()
    { try { _control.SetDefault(); } catch { } _canControl = false; OnPropertyChanged(nameof(CanControl)); }
    public event PropertyChangedEventHandler? PropertyChanged;
    private void OnPropertyChanged([CallerMemberName] string? name = null) => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}
public sealed class MonitorSnapshot
{
    public List<SensorRow> Sensors { get; } = new();
    public List<(string Hardware, string Name, IControl Control)> FanChannels { get; } = new();
    public float? CpuMaxC { get; set; }
    public float? GpuMaxC { get; set; }
    public float? CpuLoad { get; set; }
    public float? GpuLoad { get; set; }
    public float? CpuClock { get; set; }
    public float? CpuPower { get; set; }
}