using LibreHardwareMonitor.Hardware;
using NaprawaPCFanControlPro.Models;
using NaprawaPCFanControlPro.Services;
using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Threading;

namespace NaprawaPCFanControlPro;

public partial class MainWindow : Window
{
    public ObservableCollection<SensorReading> Sensors { get; } = [];
    public ObservableCollection<FanChannel> Fans { get; } = [];
    public ObservableCollection<InventoryRow> Inventory { get; } = [];

    private readonly SensorService _sensorService = new();
    private readonly DispatcherTimer _timer = new() { Interval = TimeSpan.FromSeconds(2) };
    private InventorySnapshot _inventorySnapshot = new();
    private FanChannel? _selectedFan;
    private bool _refreshing;
    private bool _autoEnabled;
    private bool _closing;
    private readonly Dictionary<string, float> _lastAutoValues = new(StringComparer.Ordinal);

    public MainWindow()
    {
        InitializeComponent();
        DataContext = this;
        _timer.Tick += async (_, _) => await RefreshSensorsAsync();
        FanSlider.ValueChanged += (_, _) => FanSliderValue.Text = $"{FanSlider.Value:0}%";
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        await RefreshInventoryAsync();
        await RefreshSensorsAsync();
        _timer.Start();
    }

    private async void OnRefreshClick(object sender, RoutedEventArgs e)
    {
        await RefreshInventoryAsync();
        await RefreshSensorsAsync();
    }

    private async Task RefreshInventoryAsync()
    {
        StatusText.Text = "Skanowanie komputera, pamięci, dysków i EDID…";
        try
        {
            _inventorySnapshot = await Task.Run(HardwareInventoryService.Scan);
            Inventory.Clear();
            foreach (var row in _inventorySnapshot.Rows)
                Inventory.Add(row);

            MachineNameText.Text = $"{_inventorySnapshot.ComputerName}  |  {Inventory.Count} pozycji inwentaryzacji";
            RamValue.Text = _inventorySnapshot.Rows.FirstOrDefault(x => x.Category == "RAM" && x.Component == "Pamięć całkowita")?.Details ?? "Niedostępne";
            RamDetail.Text = _inventorySnapshot.Rows.FirstOrDefault(x => x.Category == "RAM" && x.Component == "Gniazda pamięci")?.Details ?? "Sloty RAM niezgłoszone przez SMBIOS";
            DiskValue.Text = _inventorySnapshot.Rows.Count(x => x.Category == "DYSK").ToString();
            StatusText.Text = "Inwentaryzacja zakończona.";
        }
        catch (Exception ex)
        {
            StatusText.Text = "Błąd inwentaryzacji: " + ex.Message;
        }
    }

    private async Task RefreshSensorsAsync()
    {
        if (_refreshing || _closing) return;
        _refreshing = true;
        RefreshButton.IsEnabled = false;

        try
        {
            var selectedId = _selectedFan?.Identifier;
            var snapshot = await Task.Run(_sensorService.ReadSnapshot);

            Sensors.Clear();
            foreach (var item in snapshot.Readings.OrderBy(x => x.HardwareType).ThenBy(x => x.Type).ThenBy(x => x.Name))
                Sensors.Add(item);

            Fans.Clear();
            foreach (var fan in snapshot.Fans.OrderBy(x => x.HardwareName).ThenBy(x => x.Name))
                Fans.Add(fan);

            if (!string.IsNullOrWhiteSpace(selectedId))
            {
                var selected = Fans.FirstOrDefault(x => x.Identifier == selectedId);
                if (selected is not null)
                    FansGrid.SelectedItem = selected;
            }

            var cpu = BestTemperature(snapshot.Readings, "Cpu");
            var gpu = BestTemperature(snapshot.Readings, "Gpu");
            CpuValue.Text = cpu is null ? "N/D" : $"{cpu.Value:0.0} °C";
            CpuDetail.Text = cpu is null ? "Czujnik CPU niedostępny" : "Aktualna temperatura procesora";
            GpuValue.Text = gpu is null ? "N/D" : $"{gpu.Value:0.0} °C";
            GpuDetail.Text = gpu is null ? "Czujnik GPU niedostępny" : "Aktualna temperatura karty graficznej";
            FanValue.Text = snapshot.Fans.Count.ToString();
            FanDetail.Text = $"{snapshot.Fans.Count(x => x.CanControl)} kanałów z obsługą sterowania";
            SensorValue.Text = snapshot.Readings.Count.ToString();
            SensorDetail.Text = snapshot.IsAdministrator ? "Uruchomiono jako administrator" : "Brak uprawnień administratora";

            var alarms = snapshot.Readings
                .Where(x => x.Type == "Temperature" && x.Value >= 90)
                .Select(x => $"{x.HardwareName}: {x.Name} {x.Value:0}°C")
                .Distinct()
                .ToList();

            DashboardStatus.Text = alarms.Count > 0
                ? "UWAGA — wysoka temperatura: " + string.Join("; ", alarms)
                : snapshot.Error is not null
                    ? "Problem odczytu czujników: " + snapshot.Error
                    : "Brak alarmu temperatury. Odczyt czujników jest aktualizowany co 2 sekundy.";

            if (_autoEnabled)
                ApplyAutomaticCurve(snapshot);

            if (snapshot.Error is not null)
                StatusText.Text = "Częściowy odczyt czujników: " + snapshot.Error;
            else
                StatusText.Text = $"{DateTime.Now:HH:mm:ss}  |  Czujniki: {Sensors.Count}  |  Kanały wentylatorów: {Fans.Count}";
        }
        catch (Exception ex)
        {
            StatusText.Text = "Błąd monitoringu: " + ex.Message;
        }
        finally
        {
            RefreshButton.IsEnabled = true;
            _refreshing = false;
        }
    }

    private static float? BestTemperature(IEnumerable<SensorReading> readings, string category)
    {
        var matches = readings.Where(x =>
            x.Type == "Temperature" &&
            (x.HardwareType.Contains(category, StringComparison.OrdinalIgnoreCase) ||
             x.HardwareName.Contains(category, StringComparison.OrdinalIgnoreCase)))
            .Select(x => (float?)x.Value)
            .ToList();
        return matches.Count == 0 ? null : matches.Max();
    }

    private void OnFanSelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        _selectedFan = FansGrid.SelectedItem as FanChannel;
        SelectedFanText.Text = _selectedFan is null
            ? "Nie wybrano"
            : $"{_selectedFan.HardwareName} / {_selectedFan.Name}";

        FanSlider.IsEnabled = _selectedFan?.CanControl == true;
        if (_selectedFan?.CanControl == true)
        {
            FanSlider.Minimum = _selectedFan.Minimum;
            FanSlider.Maximum = _selectedFan.Maximum;
            FanSlider.Value = Math.Clamp(_selectedFan.SoftwareValue, FanSlider.Minimum, FanSlider.Maximum);
            FanSliderValue.Text = $"{FanSlider.Value:0}%";
        }
        else
        {
            FanSliderValue.Text = "Tylko odczyt";
        }
    }

    private void OnApplyFanClick(object sender, RoutedEventArgs e)
    {
        if (_selectedFan?.CanControl != true)
        {
            MessageBox.Show("Wybrany kanał nie udostępnia sterowania programowego.", "Fan Control",
                MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }

        if (MessageBox.Show(
            $"Ustawić wentylator „{_selectedFan.Name}” na {FanSlider.Value:0}%?\n\nPrzy nieprawidłowym sterowaniu może wzrosnąć temperatura podzespołów.",
            "Potwierdź zmianę", MessageBoxButton.YesNo, MessageBoxImage.Warning) != MessageBoxResult.Yes)
            return;

        try
        {
            _sensorService.SetFan(_selectedFan, (float)FanSlider.Value);
            StatusText.Text = $"Zastosowano {FanSlider.Value:0}% dla {_selectedFan.Name}.";
            _lastAutoValues.Remove(_selectedFan.Identifier);
        }
        catch (Exception ex)
        {
            MessageBox.Show(ex.Message, "Nie udało się zmienić obrotów",
                MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    private void OnDefaultFanClick(object sender, RoutedEventArgs e)
    {
        if (_selectedFan?.CanControl != true) return;
        if (MessageBox.Show("Przywrócić sterowanie domyślne BIOS/EC dla tego kanału?",
            "Potwierdź", MessageBoxButton.YesNo, MessageBoxImage.Question) != MessageBoxResult.Yes)
            return;

        try
        {
            _sensorService.RestoreDefault(_selectedFan);
            _lastAutoValues.Remove(_selectedFan.Identifier);
            StatusText.Text = $"Przywrócono domyślne sterowanie: {_selectedFan.Name}.";
        }
        catch (Exception ex)
        {
            StatusText.Text = "Błąd przywracania sterowania: " + ex.Message;
        }
    }

    private void OnAutoClick(object sender, RoutedEventArgs e)
    {
        if (!_autoEnabled)
        {
            if (!Fans.Any(x => x.CanControl))
            {
                MessageBox.Show("Nie wykryto kanału wentylatora z obsługą sterowania programowego. Odczyt RPM pozostaje dostępny.",
                    "Brak obsługi kontrolera", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }

            if (MessageBox.Show(
                "Włączyć automatyczną regulację wyłącznie na wykrytych kanałach sterowalnych?\n\nProfil będzie dobierał prędkość według najwyższej dostępnej temperatury CPU/GPU. Nie zmienia ustawień nieobsługiwanych wentylatorów.",
                "Automatyczna regulacja wentylatorów",
                MessageBoxButton.YesNo,
                MessageBoxImage.Warning) != MessageBoxResult.Yes)
                return;

            _autoEnabled = true;
            AutoButton.Content = "WYŁĄCZ AUTO";
            AutoStatus.Text = "Automatyka aktywna";
            AutoStatus.Foreground = System.Windows.Media.Brushes.LightGreen;
        }
        else
        {
            _autoEnabled = false;
            AutoButton.Content = "WŁĄCZ AUTO";
            AutoStatus.Text = "Automatyka wyłączona";
            AutoStatus.Foreground = System.Windows.Media.Brushes.LightGray;
            RestoreAllDefaults();
        }
    }

    private void ApplyAutomaticCurve(SensorSnapshot snapshot)
    {
        var temperatures = snapshot.Readings
            .Where(x => x.Type == "Temperature" &&
                        (x.HardwareType.Contains("Cpu", StringComparison.OrdinalIgnoreCase) ||
                         x.HardwareType.Contains("Gpu", StringComparison.OrdinalIgnoreCase) ||
                         x.HardwareName.Contains("CPU", StringComparison.OrdinalIgnoreCase) ||
                         x.HardwareName.Contains("GPU", StringComparison.OrdinalIgnoreCase)))
            .Select(x => x.Value)
            .Where(float.IsFinite)
            .ToList();

        if (temperatures.Count == 0)
        {
            _autoEnabled = false;
            AutoButton.Content = "WŁĄCZ AUTO";
            RestoreAllDefaults();
            AutoStatus.Text = "AUTO wyłączone — utracono temperatury CPU/GPU";
            AutoStatus.Foreground = System.Windows.Media.Brushes.Orange;
            return;
        }

        var hottest = temperatures.Max();
        var profile = (ProfileCombo.SelectedItem as ComboBoxItem)?.Content?.ToString() ?? "Zrównoważony";
        var requested = FanCurve.GetTargetPercent(profile, hottest);
        var applied = 0;

        foreach (var fan in snapshot.Fans.Where(x => x.CanControl))
        {
            try
            {
                var clamped = Math.Clamp(requested, fan.Minimum, fan.Maximum);
                if (!_lastAutoValues.TryGetValue(fan.Identifier, out var previous) ||
                    Math.Abs(previous - clamped) >= 2 ||
                    fan.Control!.ControlMode != ControlMode.Software)
                {
                    _sensorService.SetFan(fan, clamped);
                    _lastAutoValues[fan.Identifier] = clamped;
                }
                applied++;
            }
            catch { }
        }

        AutoStatus.Text = $"AUTO: {profile} | {hottest:0}°C | cel {requested:0}% | kanały {applied}";
    }

    private void RestoreAllDefaults()
    {
        foreach (var fan in Fans.Where(x => x.CanControl))
        {
            try { _sensorService.RestoreDefault(fan); }
            catch { }
        }
        _lastAutoValues.Clear();
    }

    private void OnExportClick(object sender, RoutedEventArgs e)
    {
        try
        {
            var path = ReportService.Export(_inventorySnapshot, Sensors, Fans);
            MessageBox.Show($"Raport zapisano na pulpicie:\n{path}", "Raport gotowy",
                MessageBoxButton.OK, MessageBoxImage.Information);
        }
        catch (Exception ex)
        {
            MessageBox.Show("Nie udało się zapisać raportu: " + ex.Message,
                "Raport", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    private void OnClosing(object? sender, System.ComponentModel.CancelEventArgs e)
    {
        _closing = true;
        _timer.Stop();
        RestoreAllDefaults();
        _sensorService.Dispose();
    }
}
