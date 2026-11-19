using Microsoft.Win32;
using System.Management;
using System.Text;

namespace NaprawaPCFanControl;

public static class HardwareInventoryService
{
    public static List<InventoryRow> Scan()
    {
        var rows = new List<InventoryRow>();
        AddWmi(rows, "Procesor", "Win32_Processor", "Name", "CPU");
        AddWmi(rows, "Płyta główna", "Win32_BaseBoard", "Product", "Model");
        AddWmi(rows, "Płyta główna", "Win32_BaseBoard", "Manufacturer", "Producent");
        AddWmi(rows, "BIOS", "Win32_BIOS", "SMBIOSBIOSVersion", "Wersja");
        AddWmi(rows, "BIOS", "Win32_BIOS", "ReleaseDate", "Data");
        AddMemory(rows); AddGraphics(rows); AddDisks(rows); AddMonitors(rows);
        AddWmi(rows, "System", "Win32_OperatingSystem", "Caption", "Windows");
        AddWmi(rows, "System", "Win32_OperatingSystem", "OSArchitecture", "Architektura");
        AddWmi(rows, "System", "Win32_ComputerSystem", "Manufacturer", "Producent komputera");
        AddWmi(rows, "System", "Win32_ComputerSystem", "Model", "Model komputera");
        return rows;
    }
    private static void AddWmi(List<InventoryRow> rows, string section, string table, string field, string label)
    {
        try
        {
            using var searcher = new ManagementObjectSearcher($"SELECT {field} FROM {table}");
            foreach (ManagementObject item in searcher.Get())
            {
                var value = Convert.ToString(item[field])?.Trim();
                if (!string.IsNullOrWhiteSpace(value)) rows.Add(new InventoryRow { Section = section, Component = label, Value = value });
            }
        }
        catch (Exception ex) { rows.Add(new InventoryRow { Section = section, Component = label, Value = "Brak danych", Details = ex.Message }); }
    }
    private static void AddMemory(List<InventoryRow> rows)
    {
        try
        {
            ulong total = 0; var modules = new List<string>();
            using (var searcher = new ManagementObjectSearcher("SELECT Capacity, Speed, Manufacturer, PartNumber, DeviceLocator FROM Win32_PhysicalMemory"))
            foreach (ManagementObject m in searcher.Get())
            {
                var capacity = ToUlong(m["Capacity"]); total += capacity;
                var size = capacity > 0 ? $"{capacity / 1073741824d:0.##} GB" : "Nieznany rozmiar";
                modules.Add($"{Convert.ToString(m["DeviceLocator"])}: {size}, {Convert.ToString(m["Speed"])} MHz, {Convert.ToString(m["Manufacturer"])} {Convert.ToString(m["PartNumber"])}");
            }
            var slots = 0;
            using (var searcher = new ManagementObjectSearcher("SELECT MemoryDevices FROM Win32_PhysicalMemoryArray"))
                foreach (ManagementObject m in searcher.Get()) slots += Convert.ToInt32(m["MemoryDevices"] ?? 0);
            rows.Add(new InventoryRow { Section = "Pamięć RAM", Component = "Łącznie", Value = $"{total / 1073741824d:0.##} GB" });
            rows.Add(new InventoryRow { Section = "Pamięć RAM", Component = "Obsadzenie slotów", Value = $"{modules.Count} / {(slots > 0 ? slots : modules.Count)}", Details = "Dane SMBIOS/WMI" });
            foreach (var module in modules) rows.Add(new InventoryRow { Section = "Pamięć RAM", Component = "Moduł", Value = module });
        }
        catch (Exception ex) { rows.Add(new InventoryRow { Section = "Pamięć RAM", Component = "Skanowanie", Value = "Błąd", Details = ex.Message }); }
    }
    private static void AddGraphics(List<InventoryRow> rows)
    {
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT Name, AdapterRAM, DriverVersion FROM Win32_VideoController");
            foreach (ManagementObject m in searcher.Get())
            {
                rows.Add(new InventoryRow { Section = "Karta graficzna", Component = "Model", Value = Convert.ToString(m["Name"]) ?? "Nieznany" });
                var ram = ToUlong(m["AdapterRAM"]);
                if (ram > 0) rows.Add(new InventoryRow { Section = "Karta graficzna", Component = "Pamięć raportowana przez sterownik", Value = $"{ram / 1073741824d:0.##} GB" });
                rows.Add(new InventoryRow { Section = "Karta graficzna", Component = "Sterownik", Value = Convert.ToString(m["DriverVersion"]) ?? "" });
            }
        }
        catch (Exception ex) { rows.Add(new InventoryRow { Section = "Karta graficzna", Component = "Skanowanie", Value = "Błąd", Details = ex.Message }); }
    }
    private static void AddDisks(List<InventoryRow> rows)
    {
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT Model, Size, InterfaceType, MediaType, SerialNumber FROM Win32_DiskDrive");
            foreach (ManagementObject d in searcher.Get())
            {
                var size = ToUlong(d["Size"]);
                rows.Add(new InventoryRow { Section = "Dyski", Component = "Model", Value = Convert.ToString(d["Model"]) ?? "Nieznany", Details = $"{Convert.ToString(d["InterfaceType"])} / {Convert.ToString(d["MediaType"])}" });
                rows.Add(new InventoryRow { Section = "Dyski", Component = "Pojemność", Value = size > 0 ? $"{size / 1e9:0.##} GB ({size / 1073741824d:0.##} GiB)" : "Nieznana" });
                rows.Add(new InventoryRow { Section = "Dyski", Component = "Numer seryjny", Value = Convert.ToString(d["SerialNumber"])?.Trim() ?? "" });
            }
        }
        catch (Exception ex) { rows.Add(new InventoryRow { Section = "Dyski", Component = "Skanowanie", Value = "Błąd", Details = ex.Message }); }
    }
    private static void AddMonitors(List<InventoryRow> rows)
    {
        var found = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        try
        {
            using var displayRoot = Registry.LocalMachine.OpenSubKey(@"SYSTEM\CurrentControlSet\Enum\DISPLAY");
            if (displayRoot is not null)
            foreach (var vendor in displayRoot.GetSubKeyNames())
            using (var vendorKey = displayRoot.OpenSubKey(vendor))
            {
                if (vendorKey is null) continue;
                foreach (var instance in vendorKey.GetSubKeyNames())
                using (var instanceKey = vendorKey.OpenSubKey(instance))
                using (var parameters = instanceKey?.OpenSubKey("Device Parameters"))
                {
                    if (parameters?.GetValue("EDID") is not byte[] edid || edid.Length < 128) continue;
                    var maker = DecodeManufacturer(edid); var product = edid[10] | (edid[11] << 8);
                    var name = DecodeEdidName(edid); var id = $"{vendor}\\{instance}";
                    var label = !string.IsNullOrWhiteSpace(name) ? name : $"{maker} (ID {product:X4})";
                    if (found.Add(id)) rows.Add(new InventoryRow { Section = "Monitor / matryca", Component = "Model z EDID", Value = label, Details = $"Producent: {maker}; EDID: {id}; rok produkcji: {1990 + edid[17]}" });
                }
            }
        }
        catch (Exception ex) { rows.Add(new InventoryRow { Section = "Monitor / matryca", Component = "EDID", Value = "Nie udało się odczytać", Details = ex.Message }); }
        if (found.Count == 0) rows.Add(new InventoryRow { Section = "Monitor / matryca", Component = "EDID", Value = "Brak dostępnego identyfikatora EDID", Details = "Adapter, stacja dokująca lub sterownik może ukrywać dane monitora." });
    }
    private static ulong ToUlong(object? value) { try { return value is null ? 0 : Convert.ToUInt64(value); } catch { return 0; } }
    private static string DecodeManufacturer(byte[] edid)
    {
        var code = (edid[8] << 8) | edid[9];
        return new string(new[] { (char)(((code >> 10) & 31) + 64), (char)(((code >> 5) & 31) + 64), (char)((code & 31) + 64) });
    }
    private static string DecodeEdidName(byte[] edid)
    {
        for (var offset = 54; offset + 18 <= 126; offset += 18)
            if (edid[offset] == 0 && edid[offset + 1] == 0 && edid[offset + 2] == 0 && edid[offset + 3] == 0xFC)
            {
                var name = Encoding.ASCII.GetString(edid, offset + 5, 13).Trim();
                if (!string.IsNullOrWhiteSpace(name)) return name;
            }
        return "";
    }
}