using Microsoft.Win32;
using System.Management;
using NaprawaPCFanControlPro.Models;

namespace NaprawaPCFanControlPro.Services;

public static class HardwareInventoryService
{
    public static InventorySnapshot Scan()
    {
        var rows = new List<InventoryRow>();
        var computer = First("SELECT Manufacturer, Model, SystemType, TotalPhysicalMemory FROM Win32_ComputerSystem");
        var os = First("SELECT Caption, Version, BuildNumber FROM Win32_OperatingSystem");
        var board = First("SELECT Manufacturer, Product, SerialNumber FROM Win32_BaseBoard");
        var bios = First("SELECT Manufacturer, SMBIOSBIOSVersion, ReleaseDate FROM Win32_BIOS");
        var cpu = Query("SELECT Name, NumberOfCores, NumberOfLogicalProcessors FROM Win32_Processor");
        var ram = Query("SELECT DeviceLocator, BankLabel, Manufacturer, PartNumber, SerialNumber, Capacity, Speed, ConfiguredClockSpeed, FormFactor, SMBIOSMemoryType FROM Win32_PhysicalMemory");
        var ramArrays = Query("SELECT MemoryDevices FROM Win32_PhysicalMemoryArray");
        var gpu = Query("SELECT Name, DriverVersion, VideoProcessor, PNPDeviceID FROM Win32_VideoController");
        var disks = Query("SELECT DeviceID, Model, Manufacturer, InterfaceType, MediaType, FirmwareRevision, SerialNumber, PNPDeviceID, Size, Partitions, Status FROM Win32_DiskDrive");
        var volumes = Query("SELECT DeviceID, VolumeName, FileSystem, Size, FreeSpace, DriveType FROM Win32_LogicalDisk");

        var computerName = Text(computer, "Model", Environment.MachineName);
        var cpuName = string.Join(" / ", cpu.Select(x => Text(x, "Name")).Where(x => x.Length > 0));
        var boardName = $"{Text(board, "Manufacturer")} {Text(board, "Product")}".Trim();

        Add(rows, "SYSTEM", "Komputer", $"{Text(computer, "Manufacturer")} {computerName}");
        Add(rows, "SYSTEM", "Windows", $"{Text(os, "Caption")} | wersja {Text(os, "Version")} | build {Text(os, "BuildNumber")}");
        Add(rows, "SYSTEM", "Architektura", Text(computer, "SystemType"));
        Add(rows, "CPU", "Procesor", cpuName);
        Add(rows, "CPU", "Rdzenie / wątki", string.Join(" | ", cpu.Select(x => $"{Text(x, "NumberOfCores")} rdzeni / {Text(x, "NumberOfLogicalProcessors")} wątków")));
        Add(rows, "PŁYTA", "Płyta główna", boardName);
        Add(rows, "PŁYTA", "Numer seryjny", Text(board, "SerialNumber", "Niedostępny"));
        Add(rows, "BIOS", "Producent / wersja", $"{Text(bios, "Manufacturer")} | {Text(bios, "SMBIOSBIOSVersion")}");
        Add(rows, "BIOS", "Data BIOS", Text(bios, "ReleaseDate"));
        Add(rows, "RAM", "Pamięć całkowita", FormatBytes(Number(computer, "TotalPhysicalMemory")));

        var slotCount = ramArrays.Sum(x => (int)Math.Min(Number(x, "MemoryDevices"), int.MaxValue));
        Add(rows, "RAM", "Gniazda pamięci", slotCount > 0
            ? $"{ram.Count} zajętych / {slotCount} zgłoszonych przez SMBIOS"
            : $"Wykryte moduły: {ram.Count}; BIOS nie podał liczby gniazd");

        foreach (var module in ram)
        {
            var slot = Text(module, "DeviceLocator", Text(module, "BankLabel", "Nieznany slot"));
            var type = MemoryType(Number(module, "SMBIOSMemoryType"));
            var form = MemoryForm(Number(module, "FormFactor"));
            var detail = $"{FormatBytes(Number(module, "Capacity"))} | {type} | {form} | {Text(module, "Manufacturer")} | PN: {Text(module, "PartNumber")} | SN: {Clean(Text(module, "SerialNumber"))} | {Text(module, "ConfiguredClockSpeed", "brak")} MHz";
            Add(rows, "RAM", slot, detail);
        }

        foreach (var adapter in gpu)
            Add(rows, "GPU", Text(adapter, "Name", "Nieznana karta"),
                $"Sterownik: {Text(adapter, "DriverVersion")} | {Text(adapter, "VideoProcessor")} | PnP: {Text(adapter, "PNPDeviceID")}");

        foreach (var disk in disks)
            Add(rows, "DYSK", Text(disk, "DeviceID"),
                $"{Text(disk, "Model")} | {Text(disk, "InterfaceType")} | {FormatBytes(Number(disk, "Size"))} | firmware: {Text(disk, "FirmwareRevision")} | stan WMI: {Text(disk, "Status")} | SN: {Clean(Text(disk, "SerialNumber"))}");

        foreach (var volume in volumes)
            Add(rows, "WOLUMIN", Text(volume, "DeviceID"),
                $"{Text(volume, "VolumeName")} | {Text(volume, "FileSystem")} | wolne {FormatBytes(Number(volume, "FreeSpace"))} / {FormatBytes(Number(volume, "Size"))}");

        foreach (var monitor in ReadMonitors())
            Add(rows, "MONITOR / EDID", monitor.Model, monitor.Details);

        if (!rows.Any(x => x.Category == "MONITOR / EDID"))
            Add(rows, "MONITOR / EDID", "Monitor", "Nie odczytano EDID z rejestru Windows.");

        var summary = $"Komputer: {Text(computer, "Manufacturer")} {computerName}\r\nCPU: {cpuName}\r\nPłyta: {boardName}\r\nRAM: {FormatBytes(Number(computer, "TotalPhysicalMemory"))}\r\nGPU: {gpu.Count} | Dyski: {disks.Count} | Moduły RAM: {ram.Count}\r\n";
        return new InventorySnapshot { ComputerName = computerName, Summary = summary, Rows = rows };
    }

    private static List<(string Model, string Details)> ReadMonitors()
    {
        var result = new List<(string, string)>();
        try
        {
            using var root = Registry.LocalMachine.OpenSubKey(@"SYSTEM\CurrentControlSet\Enum\DISPLAY");
            if (root is null) return result;

            foreach (var maker in root.GetSubKeyNames())
            {
                using var vendor = root.OpenSubKey(maker);
                if (vendor is null) continue;

                foreach (var instanceName in vendor.GetSubKeyNames())
                {
                    using var instance = vendor.OpenSubKey(instanceName);
                    using var parameters = instance?.OpenSubKey("Device Parameters");
                    if (parameters?.GetValue("EDID") is not byte[] edid || edid.Length < 128)
                        continue;

                    var manufacturer = DecodeManufacturer(edid);
                    var product = BitConverter.ToUInt16(edid, 10).ToString("X4");
                    var serial = BitConverter.ToUInt32(edid, 12);
                    var model = DecodeMonitorName(edid);
                    if (string.IsNullOrWhiteSpace(model)) model = $"{manufacturer} {product}";
                    var resolution = DecodePreferredResolution(edid);
                    var date = edid[17] == 0 ? "nieznana" : $"{edid[16]:00}/{1990 + edid[17]}";
                    var detail = $"EDID {maker}\\{instanceName} | producent {manufacturer} | kod {product} | SN {serial} | data {date} | rozdzielczość {resolution}";
                    if (!result.Any(x => x.Item1 == model && x.Item2 == detail))
                        result.Add((model, detail));
                }
            }
        }
        catch { }
        return result;
    }

    private static string DecodeManufacturer(byte[] edid)
    {
        var code = (edid[8] << 8) | edid[9];
        return new string([
            (char)('A' + ((code >> 10) & 31) - 1),
            (char)('A' + ((code >> 5) & 31) - 1),
            (char)('A' + (code & 31) - 1)
        ]);
    }

    private static string DecodeMonitorName(byte[] edid)
    {
        for (var offset = 54; offset + 18 <= Math.Min(edid.Length, 126); offset += 18)
        {
            if (edid[offset] == 0 && edid[offset + 1] == 0 && edid[offset + 2] == 0 && edid[offset + 3] == 0xFC)
                return System.Text.Encoding.ASCII.GetString(edid, offset + 5, 13).Replace("\0", "").Replace("\n", "").Trim();
        }
        return "";
    }

    private static string DecodePreferredResolution(byte[] edid)
    {
        if (edid.Length < 72) return "nieznana";
        for (var offset = 54; offset + 18 <= 126; offset += 18)
        {
            var pixelClock = edid[offset] | (edid[offset + 1] << 8);
            if (pixelClock == 0) continue;
            var h = edid[offset + 2] | ((edid[offset + 4] & 0xF0) << 4);
            var v = edid[offset + 5] | ((edid[offset + 7] & 0xF0) << 4);
            if (h > 0 && v > 0) return $"{h} × {v}";
        }
        return "nieznana";
    }

    private static List<Dictionary<string, object?>> Query(string query, string scopePath = @"\\.\root\cimv2")
    {
        var result = new List<Dictionary<string, object?>>();
        try
        {
            var scope = new ManagementScope(scopePath);
            scope.Connect();
            using var searcher = new ManagementObjectSearcher(scope, new ObjectQuery(query));
            using var collection = searcher.Get();

            foreach (ManagementObject item in collection)
            {
                using (item)
                {
                    var row = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
                    foreach (PropertyData property in item.Properties)
                        row[property.Name] = property.Value;
                    result.Add(row);
                }
            }
        }
        catch { }
        return result;
    }

    private static Dictionary<string, object?> First(string query)
        => Query(query).FirstOrDefault() ?? [];

    private static string Text(IReadOnlyDictionary<string, object?> row, string name, string fallback = "")
    {
        if (!row.TryGetValue(name, out var value) || value is null) return fallback;
        var text = Convert.ToString(value)?.Trim();
        return string.IsNullOrWhiteSpace(text) ? fallback : text;
    }

    private static ulong Number(IReadOnlyDictionary<string, object?> row, string name)
    {
        try { return row.TryGetValue(name, out var value) && value is not null ? Convert.ToUInt64(value) : 0; }
        catch { return 0; }
    }

    private static void Add(List<InventoryRow> rows, string category, string component, string details)
    {
        if (string.IsNullOrWhiteSpace(component) && string.IsNullOrWhiteSpace(details)) return;
        rows.Add(new InventoryRow { Category = category, Component = component, Details = details, Source = "WMI / SMBIOS / EDID" });
    }

    private static string FormatBytes(ulong bytes)
    {
        if (bytes == 0) return "Niedostępne";
        string[] units = ["B", "KB", "MB", "GB", "TB"];
        double value = bytes;
        var index = 0;
        while (value >= 1024 && index < units.Length - 1) { value /= 1024; index++; }
        return $"{value:0.##} {units[index]}";
    }

    private static string Clean(string value)
        => value is "0" or "To Be Filled By O.E.M." or "Default string" ? "" : value;

    private static string MemoryType(ulong value) => value switch
    {
        20 => "DDR", 21 => "DDR2", 24 => "DDR3", 26 => "DDR4", 34 => "DDR5",
        30 => "LPDDR4", 35 => "LPDDR5", 0 => "nieznany", _ => $"SMBIOS {value}"
    };

    private static string MemoryForm(ulong value) => value switch
    {
        8 => "DIMM", 12 => "SO-DIMM", 13 => "Micro-DIMM", 14 => "Mini-DIMM",
        0 => "nieznany", _ => $"format {value}"
    };
}
