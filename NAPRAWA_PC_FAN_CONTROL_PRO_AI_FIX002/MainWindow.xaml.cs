using Microsoft.Win32;
using System.Collections.ObjectModel;
using System.IO;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Threading;

namespace NaprawaPCFanControl;

public partial class MainWindow : Window
{
    private readonly HardwareMonitorService _monitor;
    private readonly DispatcherTimer _timer;
    private MonitorSnapshot? _snapshot;
    private bool _fanRowsCreated;
    private bool _changingMode;
    private string _mode = "Automatyczny • Zrównoważony";

    public ObservableCollection<SensorRow> Sensors { get; } = new();
    public ObservableCollection<FanControlRow> Fans { get; } = new();
    public ObservableCollection<InventoryRow> Inventory { get; } = new();

    public MainWindow()
    {
        InitializeComponent();
        DataContext = this;
        _monitor = new HardwareMonitorService();
        StatusText.Text = "MONITORING AKTYWNY";
        _timer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(2) };
        _timer.Tick += (_, _) => RefreshSensors();
        Loaded += (_, _) => { RefreshSensors(); ScanInventory(); _timer.Start(); };
    }

    private void RefreshSensors()
    {
        try
        {
            _snapshot = _monitor.Read();
            Sensors.Clear();
            foreach (var row in _snapshot.Sensors.OrderBy(x => x.Category).ThenBy(x => x.Hardware).ThenBy(x => x.Name)) Sensors.Add(row);
            CpuTempText.Text = Format(_snapshot.CpuMaxC, "°C");
            GpuTempText.Text = Format(_snapshot.GpuMaxC, "°C");
            CpuLoadText.Text = "Obciążenie: " + Format(_snapshot.CpuLoad, "%");
            GpuLoadText.Text = "Obciążenie: " + Format(_snapshot.GpuLoad, "%");
            CpuClockText.Text = Format(_snapshot.CpuClock, "MHz");
            CpuPowerText.Text = "Moc: " + Format(_snapshot.CpuPower, "W");
            FanCountText.Text = _snapshot.FanChannels.Count.ToString();
            LastUpdateText.Text = "Ostatni odczyt: " + DateTime.Now.ToString("HH:mm:ss");
            if (!_fanRowsCreated)
            {
                foreach (var channel in _snapshot.FanChannels)
                    Fans.Add(new FanControlRow(channel.Hardware, channel.Name, channel.Control, _mode == "Ręczny"));
                _fanRowsCreated = true;
                FanModeText.Text = Fans.Count > 0 ? "Kanały sterowania wykryte" : "Brak kanałów sterowania";
            }
            var hottest = Math.Max(_snapshot.CpuMaxC ?? 0, _snapshot.GpuMaxC ?? 0);
            WarningText.Text = hottest >= 90 ? $"UWAGA: wykryto temperaturę {hottest:0}°C. Sprawdź chłodzenie." : "Temperatury nie przekraczają progu alarmowego 90°C.";
            WarningText.Foreground = hottest >= 90 ? System.Windows.Media.Brushes.OrangeRed : System.Windows.Media.Brushes.LightGreen;
            if (_mode.StartsWith("Automatyczny", StringComparison.Ordinal) || _mode is "Cichy" or "Wydajny") ApplyAutomaticCurve(hottest);
            FooterText.Text = Sensors.Count + " odczytów • " + Fans.Count + " kanałów sterowania";
        }
        catch (Exception ex) { StatusText.Text = "BŁĄD ODCZYTU"; FooterText.Text = ex.Message; }
    }

    private static string Format(float? value, string unit) => value.HasValue ? value.Value.ToString("0.#") + " " + unit : "-- " + unit;

    private void ApplyAutomaticCurve(float t)
    {
        if (Fans.Count == 0) return;
        double p;
        if (_mode == "Cichy") p = t < 45 ? 22 : t < 60 ? 35 : t < 75 ? 55 : 100;
        else if (_mode == "Wydajny") p = t < 35 ? 40 : t < 50 ? 60 : t < 65 ? 78 : 100;
        else p = t < 40 ? 25 : t < 55 ? 40 : t < 70 ? 62 : t < 82 ? 82 : 100;
        foreach (var fan in Fans) fan.Apply(p);
    }

    private void ModeCombo_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (!IsLoaded || _changingMode || ModeCombo.SelectedItem is not ComboBoxItem item) return;
        var selected = item.Content?.ToString() ?? "";
        _mode = selected.Contains("Automatyczny", StringComparison.Ordinal) ? "Automatyczny • Zrównoważony" : selected;
        if (selected == "Domyślne sterownika")
        {
            foreach (var fan in Fans) fan.Restore();
            FanModeText.Text = "Domyślne ustawienia kontrolera";
            return;
        }
        var manual = selected == "Ręczny";
        foreach (var fan in Fans) fan.CanControl = manual;
        FanModeText.Text = manual ? "Tryb ręczny" : "Profil: " + _mode;
        if (!manual && _snapshot is not null) ApplyAutomaticCurve(Math.Max(_snapshot.CpuMaxC ?? 0, _snapshot.GpuMaxC ?? 0));
    }

    private void Refresh_Click(object sender, RoutedEventArgs e) => RefreshSensors();
    private void Inventory_Click(object sender, RoutedEventArgs e) => ScanInventory();

    private void ScanInventory()
    {
        try
        {
            Inventory.Clear();
            foreach (var row in HardwareInventoryService.Scan()) Inventory.Add(row);
            FooterText.Text = "Inwentaryzacja zakończona • " + Inventory.Count + " pozycji";
        }
        catch (Exception ex) { Inventory.Add(new InventoryRow { Section = "Skan", Component = "Błąd", Value = ex.Message }); }
    }

    private void Restore_Click(object sender, RoutedEventArgs e)
    {
        ModeCombo.SelectedIndex = 4;
        FooterText.Text = "Przywrócono wartości domyślne kanałów kontrolera.";
    }

    private void Report_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new SaveFileDialog { Title = "Zapisz raport diagnostyczny", FileName = "NaprawaPC_FanControl_Raport_" + DateTime.Now.ToString("yyyyMMdd_HHmmss") + ".txt", Filter = "Raport tekstowy (*.txt)|*.txt" };
        if (dialog.ShowDialog(this) != true) return;
        var text = new StringBuilder();
        text.AppendLine("NAPRAWA PC FAN CONTROL PRO AI 2.0.2 FIX004");
        text.AppendLine("Data: " + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
        text.AppendLine(); text.AppendLine("=== CZUJNIKI ===");
        foreach (var s in Sensors) text.AppendLine($"{s.Category};{s.Hardware};{s.Name};{s.Value};{s.Status}");
        text.AppendLine(); text.AppendLine("=== INWENTARYZACJA ===");
        foreach (var i in Inventory) text.AppendLine($"{i.Section};{i.Component};{i.Value};{i.Details}");
        text.AppendLine(); text.AppendLine("=== KANAŁY WENTYLATORÓW ===");
        foreach (var f in Fans) text.AppendLine($"{f.Hardware};{f.Name};{f.Percent:0}%");
        File.WriteAllText(dialog.FileName, text.ToString(), Encoding.UTF8);
        FooterText.Text = "Raport zapisany.";
        MessageBox.Show(this, "Raport został zapisany.", "Raport serwisowy", MessageBoxButton.OK, MessageBoxImage.Information);
    }

    private void Window_Closing(object? sender, System.ComponentModel.CancelEventArgs e)
    {
        _timer.Stop();
        foreach (var fan in Fans) fan.Restore();
        _monitor.Dispose();
    }
}