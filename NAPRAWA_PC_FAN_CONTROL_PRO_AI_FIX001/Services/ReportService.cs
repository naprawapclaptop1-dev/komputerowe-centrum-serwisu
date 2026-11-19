using System.IO;
using System.Text;
using NaprawaPCFanControlPro.Models;

namespace NaprawaPCFanControlPro.Services;

public static class ReportService
{
    public static string Export(InventorySnapshot inventory, IEnumerable<SensorReading> sensors, IEnumerable<FanChannel> fans)
    {
        var path = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory),
            $"NAPRAWA_PC_RAPORT_{DateTime.Now:yyyyMMdd_HHmmss}.txt");

        var text = new StringBuilder();
        text.AppendLine("NAPRAWA PC FAN CONTROL PRO AI");
        text.AppendLine($"Raport: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
        text.AppendLine(new string('=', 90));
        text.AppendLine(inventory.Summary);
        text.AppendLine();
        text.AppendLine("INWENTARYZACJA");
        foreach (var row in inventory.Rows)
            text.AppendLine($"{row.Category} | {row.Component} | {row.Details}");
        text.AppendLine();
        text.AppendLine("CZUJNIKI");
        foreach (var sensor in sensors)
            text.AppendLine($"{sensor.HardwareName} | {sensor.Name} | {sensor.Value:0.0} {sensor.Unit}");
        text.AppendLine();
        text.AppendLine("WENTYLATORY");
        foreach (var fan in fans)
            text.AppendLine($"{fan.HardwareName} | {fan.Name} | {fan.Rpm:0} RPM | {fan.ControlText}");

        File.WriteAllText(path, text.ToString(), Encoding.UTF8);
        return path;
    }
}
