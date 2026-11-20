using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Collections;
using System.Drawing;
using System.IO;
using System.Globalization;
using System.Management;
using System.Net;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;
using System.Xml;
using System.Web.Script.Serialization;
using Microsoft.Win32;

namespace NaprawaPC.WindowsSwitcher
{
    internal partial class MainForm
    {
        private TextBox driverWimBox, driverFolderBox, bsodReportBox;
        private TextBox updaterResultBox;
        private Label updaterStatusLabel, updaterProgressLabel, updaterServerDiagLabel;
        private ProgressBar updaterProgressBar;
        private Button updaterPauseButton, updaterStopButton, updaterRollbackButton;
        private CheckBox updaterAutoCheckBox, updaterAutoDownloadBox, updaterAutoInstallBox;
        private NumericUpDown updaterSpeedLimitBox, updaterIntervalBox;
        private ListBox updaterReleaseCatalogList;
        private TextBox updaterReleaseDetailsBox;
        private List<ReleaseCatalogEntry> updaterReleaseCatalogEntries = new List<ReleaseCatalogEntry>();
        private Label updaterHttpsMetricLabel, updaterApiMetricLabel, updaterAssetsMetricLabel, updaterManifestMetricLabel, updaterSecurityMetricLabel;
        private string updaterLastSignatureStatus = "Nie sprawdzono";
        private string updaterLastGitHubResult = "Nie wykonano diagnostyki";
        private string lastRollbackSnapshotPath = "";
        private int updaterMaxSpeedKBps = 0;
        private int updaterCheckIntervalHours = 6;
        private BackgroundWorker updaterCatalogWorker;
        private ListBox updaterHistoryList;
        private System.Windows.Forms.Timer updaterAutoTimer;
        private bool updaterStartupCheckCompleted = false;
        private ManualResetEvent updaterPauseGate = new ManualResetEvent(true);
        private bool updaterDownloadPaused = false;
        private string pendingUpdatePackagePath = "";
        private string updaterHistoryPath = "";
        private ListBox bsodDumpList;
        private ComboBox repairVolumeSelector, driverWimIndexBox, updaterChannelBox;
        private BackgroundWorker updaterWorker, updaterDiagnosticsWorker;
        private TextBox integrityReportBox, migrationReadinessBox, partitionFirmwareBox, systemToolsBox;
        private Label integrityStateLabel;
        private ComboBox plannerTargetBox;
        private TextBox plannerReportBox, systemImageReportBox, bootManagerReportBox, driverCompatReportBox;
        private TextBox taskCenterReportBox, licenseReportBox, registryReportBox, networkReportBox, windowsUpdateReportBox, eventLogReportBox, offlineRepairReportBox;
        private TextBox offlineWindowsPathBox;
        private string lastRegistryBackupFolder = "";
        private string lastOfflineWindowsPath = "";


        private string pendingUpdateUrl = "";
        private string pendingUpdateSha = "";
        private string pendingUpdateVersion = "";
        private string pendingUpdateNotes = "";
        private List<string> pendingUpdateMirrors = new List<string>();
        private bool pendingUpdateAvailable = false;
        private string pendingUpdateChannel = "", pendingUpdateRegion = "", pendingUpdateLanguage = "", pendingUpdateFeed = "";
        private string pendingUpdateSignerThumbprint = "";
        private string updaterSettingsPath = "";
        private const string ProgramVersion = "1.0.0.72";
        // Jeden adres wbudowany w aplikację — użytkownicy nie wpisują manifestów ani serwerów.
        private string GitHubReleaseBaseUrl
        {
            get
            {
                string repoFile=Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"GITHUB_REPOSITORY.txt");
                string repo="";
                try{if(File.Exists(repoFile))repo=File.ReadAllText(repoFile).Trim();}catch{}
                if(!Regex.IsMatch(repo??"",@"^[A-Za-z0-9_.-]{1,39}/[A-Za-z0-9_.-]{1,100}$"))
                    return "https://github.com/REPOZYTORIUM_NIE_SKONFIGUROWANE/releases/download/v"+ProgramVersion+"/";
                return "https://github.com/"+repo+"/releases/download/v"+ProgramVersion+"/";
            }
        }
        private string OfficialUpdateBaseUrl { get { return GitHubReleaseBaseUrl; } }
        private bool IsTrustedGitHubAssetUrl(string value)
        {
            Uri u; if(!Uri.TryCreate(value,UriKind.Absolute,out u)||u.Scheme!=Uri.UriSchemeHttps)return false;
            return u.Host.Equals("github.com",StringComparison.OrdinalIgnoreCase) ||
                   u.Host.Equals("release-assets.githubusercontent.com",StringComparison.OrdinalIgnoreCase) ||
                   u.Host.EndsWith(".githubusercontent.com",StringComparison.OrdinalIgnoreCase);
        }
        private TextBox performanceReportBox, applicationInventoryBox, securityReportBox, rollbackReportBox, benchmarkReportBox;
        private CheckBox schedulerUiEnabled, schedulerUiPhysicalConfirm;
        private TextBox schedulerUiTarget;
        private ComboBox schedulerUiFrequency;
        private DateTimePicker schedulerUiTime;
        private Label schedulerUiStatus;
        private TextBox notificationUiReport, assistantUiReport;
        private ComboBox assistantUiSymptom;
        private Panel performanceUiGraph;
        private Label performanceUiStatus;
        private BackgroundWorker benchmarkWorker;
        private Button benchmarkRunButton;
        private TextBox nvmeReportBox, rescueReportBox, memoryTestReportBox, qualityReportBox;
        private TextBox driverRepoPathBox, driverRepoReportBox, wifiAnalyzerReportBox;
        private TextBox fileRecoveryDestinationBox, fileRecoveryPatternBox, fileRecoveryReportBox;
        private TextBox compatibilityReportBox;
        private ComboBox fileRecoverySourceBox, fileRecoveryModeBox;
        private CheckBox driverRepoPhysicalConfirmBox, fileRecoveryPhysicalConfirmBox;
        private Label buildManagerStatusLabel;
        private ComboBox migrationIntelTargetBox, migrationIntelEditionBox, migrationIntelArchBox;
        private ComboBox migrationIntelChannelBox, migrationIntelLanguageBox, migrationIntelModeBox;
        private TextBox migrationIntelReportBox;
        private TextBox backupRecoveryFolderBox, backupRecoveryReportBox;
        private BackgroundWorker backupIntegrityWorker;
        private TextBox hardwareIntelReportBox;
        private TextBox compatibilityDbNameBox, compatibilityDbVendorBox, compatibilityDbTargetBox, compatibilityDbNoteBox;
        private ComboBox compatibilityDbTypeBox;
        private TextBox compatibilityDbReportBox;
        private TextBox universalBootReportBox;
        private ComboBox driverVendorBox;
        private TextBox driverSearchBox, driverDownloadReportBox;
        private TextBox reportCustomerBox, reportDeviceBox, reportCaseBox, reportTechnicianBox, reportNotesBox;
        private TextBox reportPreviewBox;
        private TextBox operationRecoveryReportBox;
        private BackgroundWorker nvmeWorker, qualityRadioWorker;
        private Button memoryTestButton;

        // FIX053: new local service modules.
        private TextBox pcHealthReportBox, comparisonNameBox, comparisonReportBox, softwareSearchBox;
        private Label pcHealthScoreLabel, softwareCountLabel;
        private ListBox comparisonSnapshotList;
        private DataGridView softwareGrid;
        private List<InstalledProgramRecord> installedProgramRecords = new List<InstalledProgramRecord>();
        private string selectedServiceCaseId = "";
        private TextBox servicePhoneBox, serviceEmailBox;
        private ComboBox serviceStatusBox;

        private sealed class InstalledProgramRecord
        {
            public string Name;
            public string Version;
            public string Publisher;
            public string Scope;
        }


        // FIX053 — read-only PC health overview. The score is a heuristic, not a diagnostic certificate.
        private void BuildPcHealthCenterPage()
        {
            if(FindPage("Zdrowie PC")!=null)return;
            Panel p=NewPage("Zdrowie PC","Stan zdrowia komputera");
            Panel top=Card(p,"PODSUMOWANIE KONDYCJI KOMPUTERA",10,8,950,145);
            pcHealthScoreLabel=LabelAt(top,"— / 100",18,48,190,58);
            pcHealthScoreLabel.Font=new Font("Segoe UI",25F*layoutScaleY,FontStyle.Bold);
            pcHealthScoreLabel.ForeColor=Color.FromArgb(91,218,184);
            LabelAt(top,"Wskaźnik orientacyjny na podstawie dostępnych odczytów CPU, RAM, przestrzeni dyskowej i SMART.",220,48,650,38);
            ButtonAt(top,"ODŚWIEŻ POMIARY",220,94,190,delegate{RefreshPcHealthCenter();});
            ButtonAt(top,"ZAPISZ RAPORT",420,94,170,delegate{SaveTextReport(pcHealthReportBox,"StanZdrowiaKomputera");});
            ButtonAt(top,"DIAGNOSTYKA SPRZĘTU",600,94,260,delegate{ShowPage("Hardware Intelligence PRO");});

            Panel report=Card(p,"POMIARY, OSTRZEŻENIA I ZALECENIA",10,165,950,430);
            pcHealthReportBox=new TextBox();pcHealthReportBox.Multiline=true;pcHealthReportBox.ReadOnly=true;
            pcHealthReportBox.ScrollBars=ScrollBars.Both;pcHealthReportBox.WordWrap=false;pcHealthReportBox.Font=new Font("Consolas",9F);
            pcHealthReportBox.BackColor=Color.FromArgb(7,13,23);pcHealthReportBox.ForeColor=Color.FromArgb(205,235,245);
            pcHealthReportBox.Location=new Point(UX(18),UY(45));pcHealthReportBox.Size=new Size(UX(895),UY(380));report.Controls.Add(pcHealthReportBox);

            Panel note=Card(p,"WAŻNE OGRANICZENIA ODCZYTÓW",10,605,950,115);
            LabelAt(note,"Wynik jest orientacyjnym wskaźnikiem warunków pracy, a nie certyfikatem sprawności. Nie każdy kontroler udostępnia SMART, temperaturę lub pełne dane czujników. Brak danych nie jest traktowany jako wynik pozytywny.",18,43,900,58);
            RefreshPcHealthCenter();
        }

        private void RefreshPcHealthCenter()
        {
            if(pcHealthReportBox==null || pcHealthReportBox.IsDisposed)return;
            StringBuilder b=new StringBuilder();List<string> warnings=new List<string>();int score=100;int measured=0;
            b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — STAN ZDROWIA KOMPUTERA");
            b.AppendLine("Data pomiaru: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
            b.AppendLine("Komputer: "+Environment.MachineName+" | "+GetOsCaption()+" | kompilacja "+GetBuild());
            b.AppendLine();b.AppendLine("PROCESOR:");
            try {
                int cpuLoad=-1;
                using(ManagementObjectSearcher q=CreateTimedWmiSearcher("root\\cimv2","SELECT Name,LoadPercentage FROM Win32_Processor",5))
                    foreach(ManagementObject o in q.Get()) {
                        b.AppendLine("  "+Convert.ToString(o["Name"]));
                        try{cpuLoad=Convert.ToInt32(o["LoadPercentage"]);}catch{}
                        b.AppendLine("  Obciążenie w chwili odczytu: "+(cpuLoad<0?"niedostępne":cpuLoad+"%"));measured++;break;
                    }
                if(cpuLoad>=95)warnings.Add("Procesor jest mocno obciążony w chwili pomiaru — sprawdź procesy w Menedżerze zadań.");
            } catch(Exception ex){b.AppendLine("  Odczyt CPU niedostępny: "+ex.Message);}
            b.AppendLine();b.AppendLine("PAMIĘĆ RAM:");
            try {
                using(ManagementObjectSearcher q=CreateTimedWmiSearcher("root\\cimv2","SELECT TotalVisibleMemorySize,FreePhysicalMemory FROM Win32_OperatingSystem",5))
                    foreach(ManagementObject o in q.Get()) {
                        double total=Convert.ToDouble(o["TotalVisibleMemorySize"])/1048576.0;
                        double free=Convert.ToDouble(o["FreePhysicalMemory"])/1048576.0;
                        double freePct=total<=0?0:free/total*100.0;
                        b.AppendLine(String.Format(CultureInfo.InvariantCulture,"  Wolne: {0:0.0} GB / {1:0.0} GB ({2:0.0}%)",free,total,freePct));
                        measured++;
                        if(freePct<10){score-=20;warnings.Add("Bardzo mało wolnej pamięci RAM (<10%).");}
                        else if(freePct<20){score-=10;warnings.Add("Niewielki zapas wolnej pamięci RAM (<20%).");}
                        break;
                    }
            } catch(Exception ex){b.AppendLine("  Odczyt RAM niedostępny: "+ex.Message);}
            b.AppendLine();b.AppendLine("DYSK SYSTEMOWY:");
            try {
                string sys=Environment.GetEnvironmentVariable("SystemDrive");
                DriveInfo drive=new DriveInfo(String.IsNullOrEmpty(sys)?"C:\\":sys+"\\");
                if(drive.IsReady) {
                    double total=drive.TotalSize/1073741824.0,free=drive.AvailableFreeSpace/1073741824.0;
                    double freePct=total<=0?0:free/total*100.0;
                    b.AppendLine(String.Format(CultureInfo.InvariantCulture,"  {0} wolne: {1:0.0} GB / {2:0.0} GB ({3:0.0}%)",drive.Name,free,total,freePct));
                    measured++;
                    if(freePct<10){score-=20;warnings.Add("Na dysku systemowym pozostało mniej niż 10% wolnego miejsca.");}
                    else if(freePct<20){score-=10;warnings.Add("Na dysku systemowym jest mało wolnego miejsca (<20%).");}
                } else b.AppendLine("  Wolumin systemowy nie jest gotowy.");
            } catch(Exception ex){b.AppendLine("  Odczyt woluminu niedostępny: "+ex.Message);}
            b.AppendLine();b.AppendLine("PREDYKCYJNY STATUS SMART (WMI):");
            bool smartSeen=false;
            try {
                using(ManagementObjectSearcher q=CreateTimedWmiSearcher("root\\WMI","SELECT InstanceName,PredictFailure,Reason FROM MSStorageDriver_FailurePredictStatus",5))
                    foreach(ManagementObject o in q.Get()) {
                        smartSeen=true;bool failing=false;try{failing=Convert.ToBoolean(o["PredictFailure"]);}catch{}
                        b.AppendLine("  "+Convert.ToString(o["InstanceName"])+" | PredictFailure="+Convert.ToString(o["PredictFailure"])+" | Reason="+Convert.ToString(o["Reason"]));
                        if(failing){score-=45;warnings.Add("Kontroler zgłosił PredictFailure dla dysku — wykonaj kopię i dalszą diagnostykę.");}
                    }
                if(smartSeen)measured++;
            } catch(Exception ex){b.AppendLine("  SMART WMI niedostępny: "+ex.Message);}
            if(!smartSeen)b.AppendLine("  Brak danych PredictFailure. Nie oznacza to automatycznie, że dyski są sprawne.");
            b.AppendLine();b.AppendLine("PODSUMOWANIE:");
            score=Math.Max(0,Math.Min(100,score));
            b.AppendLine("  Wskaźnik orientacyjny: "+score+"/100");
            b.AppendLine("  Liczba obszarów z odczytem: "+measured);
            if(warnings.Count==0)b.AppendLine("  Nie wykryto ostrzeżeń w dostępnych pomiarach.");
            else foreach(string w in warnings)b.AppendLine("  UWAGA: "+w);
            b.AppendLine();b.AppendLine("ZALECENIA:");
            b.AppendLine("  1. Wykonaj kopię zapasową przed naprawami lub migracją.");
            b.AppendLine("  2. Dla pełnego SMART/NVMe użyj modułu Stan dysków i narzędzi producenta SSD.");
            b.AppendLine("  3. Temperatury porównuj z odczytami właściwego czujnika CPU/GPU; ACPI może wskazywać inną strefę.");
            b.AppendLine("  4. Brak odczytu nie jest interpretowany jako PASS.");
            pcHealthReportBox.Text=b.ToString();
            if(pcHealthScoreLabel!=null) {
                pcHealthScoreLabel.Text=score+"/100";
                pcHealthScoreLabel.ForeColor=score>=85?Color.FromArgb(91,218,184):(score>=65?Color.FromArgb(245,190,95):Color.FromArgb(245,112,112));
            }
            AppendLog("Odświeżono orientacyjny stan zdrowia komputera: "+score+"/100.");
        }

        // FIX053 — local snapshots for comparing a source PC with a target PC.
        private string GetComputerSnapshotsPath()
        {
            return Path.Combine(dataRoot,"ComputerComparisons","snapshots.xml");
        }

        private string ReadWmiValue(string query,string property)
        {
            try {
                using(ManagementObjectSearcher q=CreateTimedWmiSearcher("root\\cimv2",query,5))
                    foreach(ManagementObject o in q.Get()) {
                        object value=o[property];if(value!=null)return Convert.ToString(value);
                    }
            } catch {}
            return "Nieudostępnione";
        }

        private string ReadWmiJoinedValues(string query,string property)
        {
            List<string> values=new List<string>();
            try {
                using(ManagementObjectSearcher q=CreateTimedWmiSearcher("root\\cimv2",query,5))
                    foreach(ManagementObject o in q.Get()) {
                        object value=o[property];if(value!=null) {
                            string text=Convert.ToString(value).Trim();
                            if(!String.IsNullOrEmpty(text) && !values.Contains(text))values.Add(text);
                        }
                    }
            } catch {}
            return values.Count==0?"Nieudostępnione":String.Join(" | ",values.ToArray());
        }

        private string[] GetComputerSnapshotFields()
        {
            return new string[]{"Komputer","Producent i model","System Windows","Wersja systemu","Architektura","Procesor","Rdzenie / wątki","Pamięć RAM","Karta graficzna","Płyta główna","BIOS/UEFI","Dyski fizyczne","Woluminy i wolne miejsce","Tryb uruchamiania","Secure Boot"};
        }

        private Dictionary<string,string> CaptureComputerSnapshot()
        {
            Dictionary<string,string> values=new Dictionary<string,string>();
            values["Komputer"]=Environment.MachineName;
            values["Producent i model"]=ReadWmiValue("SELECT Manufacturer,Model FROM Win32_ComputerSystem","Model");
            string maker=ReadWmiValue("SELECT Manufacturer FROM Win32_ComputerSystem","Manufacturer");
            values["Producent i model"]=maker+" "+values["Producent i model"];
            values["System Windows"]=GetOsCaption();
            values["Wersja systemu"]=GetBuild()+" / "+ReadWmiValue("SELECT Version FROM Win32_OperatingSystem","Version");
            values["Architektura"]=GetArchitecture();
            values["Procesor"]=ReadWmiValue("SELECT Name FROM Win32_Processor","Name");
            values["Rdzenie / wątki"]=ReadWmiValue("SELECT NumberOfCores,NumberOfLogicalProcessors FROM Win32_Processor","NumberOfCores")+
                " / "+ReadWmiValue("SELECT NumberOfLogicalProcessors FROM Win32_Processor","NumberOfLogicalProcessors");
            string memory=ReadWmiValue("SELECT TotalPhysicalMemory FROM Win32_ComputerSystem","TotalPhysicalMemory");
            double ramBytes=0;double.TryParse(memory,NumberStyles.Any,CultureInfo.InvariantCulture,out ramBytes);
            values["Pamięć RAM"]=ramBytes>0?(ramBytes/1073741824.0).ToString("0.0",CultureInfo.InvariantCulture)+" GB":"Nieudostępniona";
            values["Karta graficzna"]=ReadWmiJoinedValues("SELECT Name FROM Win32_VideoController","Name");
            values["Płyta główna"]=ReadWmiValue("SELECT Manufacturer,Product FROM Win32_BaseBoard","Manufacturer")+" "+
                ReadWmiValue("SELECT Product FROM Win32_BaseBoard","Product");
            values["BIOS/UEFI"]=ReadWmiValue("SELECT SMBIOSBIOSVersion FROM Win32_BIOS","SMBIOSBIOSVersion");
            List<string> disks=new List<string>();
            try {
                using(ManagementObjectSearcher q=CreateTimedWmiSearcher("root\\cimv2","SELECT Model,Size,InterfaceType FROM Win32_DiskDrive",5))
                    foreach(ManagementObject o in q.Get()) {
                        double size=0;try{size=Convert.ToDouble(o["Size"])/1073741824.0;}catch{}
                        disks.Add(Convert.ToString(o["Model"])+" — "+size.ToString("0.0",CultureInfo.InvariantCulture)+" GB — "+Convert.ToString(o["InterfaceType"]));
                    }
            } catch {}
            values["Dyski fizyczne"]=disks.Count==0?"Nieudostępnione":String.Join("; ",disks.ToArray());
            List<string> drives=new List<string>();
            foreach(DriveInfo d in DriveInfo.GetDrives())try{
                if(d.IsReady && d.DriveType==DriveType.Fixed)
                    drives.Add(d.Name+" "+Math.Round(d.AvailableFreeSpace/1073741824.0,1)+"/"+Math.Round(d.TotalSize/1073741824.0,1)+" GB wolne");
            }catch{}
            values["Woluminy i wolne miejsce"]=drives.Count==0?"Nieudostępnione":String.Join("; ",drives.ToArray());
            values["Tryb uruchamiania"]=ReadFirmwareType();
            values["Secure Boot"]=ReadSecureBoot();
            return values;
        }

        private XmlDocument LoadComputerSnapshots()
        {
            string path=GetComputerSnapshotsPath();
            XmlDocument d=new XmlDocument();d.XmlResolver=null;
            if(File.Exists(path))d.Load(path);
            else {XmlElement r=d.CreateElement("ComputerSnapshots");d.AppendChild(r);}
            if(d.DocumentElement==null || d.DocumentElement.Name!="ComputerSnapshots")throw new InvalidDataException("Nieprawidłowy plik porównań komputerów.");
            return d;
        }

        private void BuildComputerComparisonPage()
        {
            if(FindPage("Porównanie PC")!=null)return;
            Panel p=NewPage("Porównanie PC","Porównanie komputerów");
            Panel capture=Card(p,"ZAPISZ KONFIGURACJĘ KOMPUTERA ŹRÓDŁOWEGO LUB DOCELOWEGO",10,8,950,150);
            LabelAt(capture,"Nazwa zapisu",18,48,125,24);
            comparisonNameBox=TextAt(capture,145,44,380,26,Environment.MachineName+" — "+DateTime.Now.ToString("yyyy-MM-dd"));
            ButtonAt(capture,"ZAPISZ BIEŻĄCY KOMPUTER",540,40,250,delegate{SaveComputerSnapshot();});
            ButtonAt(capture,"ODŚWIEŻ LISTĘ",800,40,115,delegate{RefreshComputerSnapshots();});
            ButtonAt(capture,"IMPORTUJ PROFIL Z DRUGIEGO PC",540,88,375,delegate{ImportComputerSnapshots();});
            LabelAt(capture,"Zapis lokalny XML. Na drugim komputerze wyeksportuj profil i przenieś plik snapshots.xml.",18,88,500,45);

            Panel saved=Card(p,"ZAPISANE KOMPUTERY — WYBIERZ PROFIL DO PORÓWNANIA",10,170,950,170);
            comparisonSnapshotList=new ListBox();comparisonSnapshotList.Location=new Point(UX(18),UY(45));comparisonSnapshotList.Size=new Size(UX(650),UY(110));
            comparisonSnapshotList.BackColor=Color.FromArgb(7,13,23);comparisonSnapshotList.ForeColor=Color.FromArgb(205,235,245);saved.Controls.Add(comparisonSnapshotList);
            ButtonAt(saved,"PORÓWNAJ Z BIEŻĄCYM PC",690,48,225,delegate{CompareSelectedComputerSnapshot();});
            ButtonAt(saved,"USUŃ ZAPIS",690,96,225,delegate{DeleteSelectedComputerSnapshot();});

            Panel report=Card(p,"RÓŻNICE SPRZĘTOWE I SYSTEMOWE",10,350,950,340);
            comparisonReportBox=new TextBox();comparisonReportBox.Multiline=true;comparisonReportBox.ReadOnly=true;
            comparisonReportBox.ScrollBars=ScrollBars.Both;comparisonReportBox.WordWrap=false;comparisonReportBox.Font=new Font("Consolas",8.5F);
            comparisonReportBox.BackColor=Color.FromArgb(7,13,23);comparisonReportBox.ForeColor=Color.FromArgb(205,235,245);
            comparisonReportBox.Location=new Point(UX(18),UY(45));comparisonReportBox.Size=new Size(UX(895),UY(285));report.Controls.Add(comparisonReportBox);
            ButtonAt(report,"ZAPISZ RAPORT PORÓWNANIA",18,300,250,delegate{SaveTextReport(comparisonReportBox,"PorownanieKomputerow");});
            p.AutoScrollMinSize=new Size(0,710);
            RefreshComputerSnapshots();
        }

        private void SaveComputerSnapshot()
        {
            if(comparisonNameBox==null)return;
            string name=comparisonNameBox.Text.Trim();
            if(String.IsNullOrEmpty(name)){MessageBox.Show("Podaj nazwę zapisu.");return;}
            try {
                Dictionary<string,string> values=CaptureComputerSnapshot();
                XmlDocument d=LoadComputerSnapshots();
                XmlElement snapshot=d.CreateElement("Snapshot");
                string id=Guid.NewGuid().ToString("N");snapshot.SetAttribute("id",id);
                snapshot.SetAttribute("name",name);snapshot.SetAttribute("date",DateTime.Now.ToString("o"));
                foreach(string key in GetComputerSnapshotFields()) {
                    XmlElement field=d.CreateElement("Field");field.SetAttribute("name",key);
                    field.InnerText=values.ContainsKey(key)?values[key]:"Nieudostępnione";snapshot.AppendChild(field);
                }
                d.DocumentElement.AppendChild(snapshot);
                string path=GetComputerSnapshotsPath();Directory.CreateDirectory(Path.GetDirectoryName(path));SaveXmlSafely(d,path,8);
                AppendLog("Zapisano profil komputera do porównania: "+name);
                RefreshComputerSnapshots();
                MessageBox.Show("Profil komputera zapisany lokalnie:\r\n"+path,"Porównanie komputerów");
            } catch(Exception ex){MessageBox.Show("Nie udało się zapisać profilu: "+ex.Message);}
        }

        private void RefreshComputerSnapshots()
        {
            if(comparisonSnapshotList==null)return;
            comparisonSnapshotList.Items.Clear();
            try {
                XmlDocument d=LoadComputerSnapshots();
                foreach(XmlNode node in d.SelectNodes("/ComputerSnapshots/Snapshot")) {
                    string id=node.Attributes["id"]==null?"":node.Attributes["id"].Value;
                    string name=node.Attributes["name"]==null?"Bez nazwy":node.Attributes["name"].Value;
                    string date=node.Attributes["date"]==null?"":node.Attributes["date"].Value;
                    comparisonSnapshotList.Items.Add(id+" | "+name+" | "+date);
                }
                if(comparisonSnapshotList.Items.Count==0)comparisonReportBox.Text="Brak zapisanych profili. Zapisz ten komputer lub zaimportuj plik snapshots.xml z drugiego urządzenia.";
            } catch(Exception ex){comparisonReportBox.Text="Błąd odczytu profili: "+ex.Message;}
        }


        private void ImportComputerSnapshots()
        {
            OpenFileDialog pick=new OpenFileDialog();
            pick.Title="Wybierz plik profili komputerów z drugiego urządzenia";
            pick.Filter="Profile komputerów XML (*.xml)|*.xml";
            pick.Multiselect=false;
            if(pick.ShowDialog()!=DialogResult.OK)return;
            try {
                XmlDocument incoming;string importError;
                if(!TryLoadXmlDocument(pick.FileName,out incoming,out importError))throw new InvalidDataException("Nie można bezpiecznie odczytać profili: "+importError);
                if(incoming.DocumentElement==null || incoming.DocumentElement.Name!="ComputerSnapshots")
                    throw new InvalidDataException("Wybrany plik nie jest prawidłowym zestawem profili komputerów.");
                XmlDocument local=LoadComputerSnapshots();
                HashSet<string> existing=new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                foreach(XmlNode node in local.SelectNodes("/ComputerSnapshots/Snapshot"))
                    if(node.Attributes["id"]!=null)existing.Add(node.Attributes["id"].Value);
                int imported=0;
                foreach(XmlNode node in incoming.SelectNodes("/ComputerSnapshots/Snapshot"))
                {
                    if(node.Attributes["id"]==null || String.IsNullOrWhiteSpace(node.Attributes["name"]==null?"":node.Attributes["name"].Value))
                        continue;
                    XmlElement copy=(XmlElement)local.ImportNode(node,true);
                    string id=copy.GetAttribute("id");
                    if(String.IsNullOrWhiteSpace(id) || existing.Contains(id))
                    {
                        id=Guid.NewGuid().ToString("N");copy.SetAttribute("id",id);
                    }
                    existing.Add(id);
                    local.DocumentElement.AppendChild(copy);imported++;
                }
                if(imported==0){MessageBox.Show("Plik nie zawiera nowych profili do zaimportowania.");return;}
                string path=GetComputerSnapshotsPath();Directory.CreateDirectory(Path.GetDirectoryName(path));SaveXmlSafely(local,path,8);
                RefreshComputerSnapshots();AppendLog("Zaimportowano profile z drugiego komputera: "+imported);
                MessageBox.Show("Zaimportowano profile: "+imported+"\r\nPlik danych: "+path,"Porównanie komputerów");
            } catch(Exception ex){MessageBox.Show("Nie udało się zaimportować profili: "+ex.Message);}
        }

        private void CompareSelectedComputerSnapshot()
        {
            if(comparisonSnapshotList==null || comparisonSnapshotList.SelectedItem==null){MessageBox.Show("Wybierz zapisany komputer.");return;}
            string id=Convert.ToString(comparisonSnapshotList.SelectedItem).Split('|')[0].Trim();
            try {
                XmlDocument d=LoadComputerSnapshots();XmlNode snapshot=null;
                foreach(XmlNode node in d.SelectNodes("/ComputerSnapshots/Snapshot"))
                    if(node.Attributes["id"]!=null && node.Attributes["id"].Value==id){snapshot=node;break;}
                if(snapshot==null){MessageBox.Show("Nie znaleziono zapisu. Odśwież listę.");return;}
                Dictionary<string,string> current=CaptureComputerSnapshot();
                StringBuilder b=new StringBuilder();
                b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — PORÓWNANIE KOMPUTERÓW");
                b.AppendLine("Zapis: "+(snapshot.Attributes["name"]==null?"":snapshot.Attributes["name"].Value));
                b.AppendLine("Data zapisu: "+(snapshot.Attributes["date"]==null?"":snapshot.Attributes["date"].Value));
                b.AppendLine("Bieżący komputer: "+Environment.MachineName);
                b.AppendLine("Porównanie wykonano: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));b.AppendLine();
                int same=0,different=0,unknown=0;
                foreach(string key in GetComputerSnapshotFields()) {
                    XmlNode field=null;
                    foreach(XmlNode f in snapshot.SelectNodes("Field"))
                        if(f.Attributes["name"]!=null && f.Attributes["name"].Value==key){field=f;break;}
                    string previous=field==null?"Nieudostępnione":field.InnerText;
                    string now=current.ContainsKey(key)?current[key]:"Nieudostępnione";
                    bool unavailable=previous.Contains("Nieudostępn")||now.Contains("Nieudostępn");
                    bool equal=String.Equals(previous,now,StringComparison.OrdinalIgnoreCase);
                    if(unavailable)unknown++;else if(equal)same++;else different++;
                    b.AppendLine((unavailable?"[BRAK DANYCH] ":equal?"[ZGODNE] ":"[RÓŻNICA] ")+key);
                    b.AppendLine("  Zapis: "+previous);
                    b.AppendLine("  Teraz: "+now);b.AppendLine();
                }
                b.AppendLine("PODSUMOWANIE: zgodne="+same+" | różnice="+different+" | brak danych="+unknown);
                b.AppendLine("Wskazówka: różnice parametrów nie oznaczają automatycznie niezgodności. Sprawdź sterowniki, firmware, licencje i wymagania aplikacji.");
                comparisonReportBox.Text=b.ToString();
                AppendLog("Porównano bieżący komputer z zapisanym profilem: "+id+"; różnice="+different);
            } catch(Exception ex){MessageBox.Show("Nie udało się porównać komputerów: "+ex.Message);}
        }

        private void DeleteSelectedComputerSnapshot()
        {
            if(comparisonSnapshotList==null || comparisonSnapshotList.SelectedItem==null)return;
            if(MessageBox.Show("Usunąć wybrany profil komputera?","Potwierdzenie",MessageBoxButtons.YesNo,MessageBoxIcon.Warning,MessageBoxDefaultButton.Button2)!=DialogResult.Yes)return;
            string id=Convert.ToString(comparisonSnapshotList.SelectedItem).Split('|')[0].Trim();
            try {
                XmlDocument d=LoadComputerSnapshots();XmlNode target=null;
                foreach(XmlNode node in d.SelectNodes("/ComputerSnapshots/Snapshot"))
                    if(node.Attributes["id"]!=null && node.Attributes["id"].Value==id){target=node;break;}
                if(target!=null){d.DocumentElement.RemoveChild(target);SaveXmlSafely(d,GetComputerSnapshotsPath(),8);}
                RefreshComputerSnapshots();AppendLog("Usunięto profil porównania komputera: "+id);
            } catch(Exception ex){MessageBox.Show("Nie udało się usunąć profilu: "+ex.Message);}
        }

        // FIX053 — inventory from uninstall registry keys. No product keys or secrets are read.
        private void BuildInstalledSoftwarePage()
        {
            if(FindPage("Spis programów")!=null)return;
            Panel p=NewPage("Spis programów","Spis programów i licencji");
            Panel top=Card(p,"LOKALNY SPIS ZAINSTALOWANYCH APLIKACJI",10,8,950,145);
            LabelAt(top,"Filtruj listę",18,48,100,24);
            softwareSearchBox=TextAt(top,120,44,360,26,"");
            softwareSearchBox.TextChanged+=delegate{FilterInstalledSoftware();};
            ButtonAt(top,"SKANUJ REJESTR",495,40,175,delegate{RefreshInstalledSoftware();});
            ButtonAt(top,"EKSPORTUJ CSV",682,40,145,delegate{ExportInstalledSoftwareCsv();});
            ButtonAt(top,"AKTYWACJA WINDOWS",18,90,220,delegate{ShowPage("Licencja Windows");});
            softwareCountLabel=LabelAt(top,"Nie wykonano skanu.",255,94,620,22);
            Panel table=Card(p,"NAZWY / WERSJE / WYDAWCY / ZAKRES INSTALACJI",10,165,950,480);
            softwareGrid=new DataGridView();softwareGrid.Location=new Point(UX(16),UY(43));softwareGrid.Size=new Size(UX(900),UY(420));
            softwareGrid.AllowUserToAddRows=false;softwareGrid.AllowUserToDeleteRows=false;softwareGrid.ReadOnly=true;
            softwareGrid.RowHeadersVisible=false;softwareGrid.MultiSelect=false;softwareGrid.SelectionMode=DataGridViewSelectionMode.FullRowSelect;
            softwareGrid.AutoSizeColumnsMode=DataGridViewAutoSizeColumnsMode.Fill;softwareGrid.BackgroundColor=Color.FromArgb(7,13,23);
            softwareGrid.GridColor=Color.FromArgb(43,66,84);softwareGrid.BorderStyle=BorderStyle.None;
            softwareGrid.EnableHeadersVisualStyles=false;softwareGrid.ColumnHeadersDefaultCellStyle.BackColor=Color.FromArgb(18,39,59);
            softwareGrid.ColumnHeadersDefaultCellStyle.ForeColor=Color.FromArgb(180,220,235);
            softwareGrid.DefaultCellStyle.BackColor=Color.FromArgb(7,13,23);softwareGrid.DefaultCellStyle.ForeColor=Color.FromArgb(224,239,246);
            softwareGrid.DefaultCellStyle.SelectionBackColor=Color.FromArgb(26,82,108);softwareGrid.DefaultCellStyle.SelectionForeColor=Color.White;
            softwareGrid.Columns.Add("Program","Program");softwareGrid.Columns.Add("Version","Wersja");
            softwareGrid.Columns.Add("Publisher","Wydawca");softwareGrid.Columns.Add("Scope","Miejsce instalacji");
            softwareGrid.Columns[0].FillWeight=42;softwareGrid.Columns[1].FillWeight=18;softwareGrid.Columns[2].FillWeight=27;softwareGrid.Columns[3].FillWeight=13;
            table.Controls.Add(softwareGrid);
            Panel note=Card(p,"INFORMACJE O LICENCJACH I PRYWATNOŚCI",10,655,950,120);
            LabelAt(note,"Spis odczytuje nazwy, wersje i wydawców z kluczy Odinstaluj w rejestrze Windows. Nie odczytuje kluczy produktu ani danych logowania i nie potwierdza ważności licencji aplikacji. Status aktywacji Windows sprawdzisz w osobnym module.",18,43,900,58);
            p.AutoScrollMinSize=new Size(0,790);
            RefreshInstalledSoftware();
        }

        private void ReadInstalledSoftwareFromRoot(RegistryKey root,string subPath,string scope,HashSet<string> seen)
        {
            if(root==null)return;
            using(RegistryKey uninstall=root.OpenSubKey(subPath,false))
            {
                if(uninstall==null)return;
                foreach(string subName in uninstall.GetSubKeyNames())
                {
                    try {
                        using(RegistryKey app=uninstall.OpenSubKey(subName,false))
                        {
                            if(app==null)continue;
                            object displayValue=app.GetValue("DisplayName");
                            string name=displayValue==null?"":Convert.ToString(displayValue).Trim();
                            if(String.IsNullOrEmpty(name))continue;
                            if(Convert.ToString(app.GetValue("SystemComponent","0"))=="1")continue;
                            if(app.GetValue("ParentKeyName")!=null)continue;
                            string version=Convert.ToString(app.GetValue("DisplayVersion",""));
                            string publisher=Convert.ToString(app.GetValue("Publisher",""));
                            string key=(name+"|"+version+"|"+publisher).ToLowerInvariant();
                            if(seen.Contains(key))continue;
                            seen.Add(key);
                            InstalledProgramRecord record=new InstalledProgramRecord();
                            record.Name=name;record.Version=version;record.Publisher=publisher;record.Scope=scope;
                            installedProgramRecords.Add(record);
                        }
                    } catch {}
                }
            }
        }

        private void RefreshInstalledSoftware()
        {
            if(softwareGrid==null || softwareGrid.IsDisposed)return;
            installedProgramRecords.Clear();HashSet<string> seen=new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            string uninstall="SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall";
            try {
                using(RegistryKey h64=RegistryKey.OpenBaseKey(RegistryHive.LocalMachine,RegistryView.Registry64))
                    ReadInstalledSoftwareFromRoot(h64,uninstall,"Komputer 64-bit",seen);
            } catch {}
            try {
                using(RegistryKey h32=RegistryKey.OpenBaseKey(RegistryHive.LocalMachine,RegistryView.Registry32))
                    ReadInstalledSoftwareFromRoot(h32,uninstall,"Komputer 32-bit",seen);
            } catch {}
            try {ReadInstalledSoftwareFromRoot(Registry.CurrentUser,uninstall,"Bieżący użytkownik",seen);}catch{}
            try {
                using(RegistryKey u64=RegistryKey.OpenBaseKey(RegistryHive.CurrentUser,RegistryView.Registry64))
                    ReadInstalledSoftwareFromRoot(u64,uninstall,"Użytkownik 64-bit",seen);
            } catch {}
            try {
                using(RegistryKey u32=RegistryKey.OpenBaseKey(RegistryHive.CurrentUser,RegistryView.Registry32))
                    ReadInstalledSoftwareFromRoot(u32,uninstall,"Użytkownik 32-bit",seen);
            } catch {}
            installedProgramRecords.Sort(delegate(InstalledProgramRecord a,InstalledProgramRecord b){return StringComparer.CurrentCultureIgnoreCase.Compare(a.Name,b.Name);});
            FilterInstalledSoftware();
            if(softwareCountLabel!=null)softwareCountLabel.Text="Wykryte wpisy aplikacji: "+installedProgramRecords.Count+" | dane lokalne";
            AppendLog("Zaktualizowano lokalny spis programów: "+installedProgramRecords.Count+" wpisów.");
        }

        private void FilterInstalledSoftware()
        {
            if(softwareGrid==null || softwareGrid.IsDisposed)return;
            string query=softwareSearchBox==null?"":softwareSearchBox.Text.Trim();
            softwareGrid.Rows.Clear();int shown=0;
            foreach(InstalledProgramRecord r in installedProgramRecords) {
                string combined=r.Name+" "+r.Version+" "+r.Publisher+" "+r.Scope;
                if(query.Length>0 && combined.IndexOf(query,StringComparison.CurrentCultureIgnoreCase)<0)continue;
                softwareGrid.Rows.Add(r.Name,r.Version,r.Publisher,r.Scope);shown++;
            }
            if(softwareCountLabel!=null)softwareCountLabel.Text="Wpisy: "+shown+" / "+installedProgramRecords.Count+" | aktywacje aplikacji nie są weryfikowane";
        }

        private string CsvField(string value)
        {
            string s=value??"";return "\""+s.Replace("\"","\"\"")+"\"";
        }

        private void ExportInstalledSoftwareCsv()
        {
            if(installedProgramRecords.Count==0){MessageBox.Show("Najpierw wykonaj skan spisu programów.");return;}
            SaveFileDialog d=new SaveFileDialog();d.Filter="Plik CSV (*.csv)|*.csv";d.FileName="Spis_programow_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".csv";
            if(d.ShowDialog()!=DialogResult.OK)return;
            try {
                StringBuilder b=new StringBuilder();
                b.AppendLine("Program;Wersja;Wydawca;Miejsce instalacji");
                foreach(InstalledProgramRecord r in installedProgramRecords)
                    b.AppendLine(CsvField(r.Name)+";"+CsvField(r.Version)+";"+CsvField(r.Publisher)+";"+CsvField(r.Scope));
                File.WriteAllText(d.FileName,b.ToString(),new UTF8Encoding(true));
                AppendLog("Wyeksportowano spis programów: "+d.FileName);
                MessageBox.Show("Zapisano spis programów:\r\n"+d.FileName);
            } catch(Exception ex){MessageBox.Show("Nie udało się wyeksportować spisu: "+ex.Message);}
        }

        private void BuildDriverCenterPage()
        {
            if(FindPage("Sterowniki PRO")!=null)return;
            Panel p=NewPage("Sterowniki PRO","Centrum sterowników PRO");
            Panel installed=Card(p,"STEROWNIKI ZAINSTALOWANE — DIAGNOSTYKA I EKSPORT",10,8,950,150);
            LabelAt(installed,"Wykrywanie problematycznych urządzeń przez PnPUtil oraz eksport sterowników do folderu kopii.",18,45,900,32);
            ButtonAt(installed,"Skanuj urządzenia z błędami",18,85,235,delegate{ScanProblemDevices();});
            ButtonAt(installed,"Eksportuj wszystkie sterowniki",265,85,250,delegate{ExportDrivers();});
            ButtonAt(installed,"Importuj folder INF",528,85,190,delegate{ImportDriversFromFolder();});
            ButtonAt(installed,"Menedżer urządzeń",730,85,185,delegate{RunCommand("mmc.exe","devmgmt.msc");});

            Panel offline=Card(p,"WSTRZYKIWANIE STEROWNIKÓW DO OBRAZU WINDOWS (WIM)",10,175,950,260);
            LabelAt(offline,"Wskaż rozpakowany plik install.wim oraz folder ze sterownikami INF. Oryginalny WIM zostanie skopiowany do backupu przed modyfikacją.",18,43,900,38);
            driverWimBox=TextAt(offline,18,88,700,26,"");
            ButtonAt(offline,"Wybierz install.wim",730,84,185,delegate{
                OpenFileDialog d=new OpenFileDialog();d.Filter="Windows Image (*.wim)|*.wim";d.Title="Wybierz install.wim (nie ISO ani ESD)";
                if(d.ShowDialog()==DialogResult.OK)driverWimBox.Text=d.FileName;
            });
            driverFolderBox=TextAt(offline,18,130,700,26,"");
            ButtonAt(offline,"Wybierz folder INF",730,126,185,delegate{
                FolderBrowserDialog d=new FolderBrowserDialog();d.Description="Folder zawierający pliki .INF";
                if(d.ShowDialog()==DialogResult.OK)driverFolderBox.Text=d.SelectedPath;
            });
            LabelAt(offline,"Indeks obrazu",18,174,110,24);
            driverWimIndexBox=ComboAt(offline,new string[]{"1","2","3","4","5","6","7","8","9","10"},135,170,90);
            ButtonAt(offline,"Pokaż indeksy DISM",245,168,205,delegate{ShowWimIndexes();});
            ButtonAt(offline,"BACKUP + WSTRZYKNIJ STEROWNIKI",465,168,350,delegate{InjectDriversIntoWim();});
            LabelAt(offline,"Działa na pliku WIM poza zamontowanym ISO. Nie modyfikuje oryginalnego obrazu ISO ani bieżącego systemu.",18,215,900,25);

            Panel sources=Card(p,"OFICJALNE ŹRÓDŁA PRODUCENTÓW",10,455,950,125);
            ButtonAt(sources,"Intel",18,48,130,delegate{OpenUrl("https://www.intel.com/content/www/us/en/download-center/home.html");});
            ButtonAt(sources,"AMD",160,48,130,delegate{OpenUrl("https://www.amd.com/en/support/download/drivers.html");});
            ButtonAt(sources,"NVIDIA",302,48,130,delegate{OpenUrl("https://www.nvidia.com/Download/index.aspx");});
            ButtonAt(sources,"Realtek",444,48,130,delegate{OpenUrl("https://www.realtek.com/Download/Index?cate_id=194");});
            ButtonAt(sources,"Microsoft Update Catalog",586,48,250,delegate{OpenUrl("https://www.catalog.update.microsoft.com/");});
            AppendLog("Otwarto Centrum sterowników PRO.");
        }

        private string CaptureOutput(string exe,string args,out int exitCode)
        {
            exitCode=-1;
            try {
                ProcessStartInfo pi=new ProcessStartInfo();pi.FileName=exe;pi.Arguments=args;
                pi.UseShellExecute=false;pi.CreateNoWindow=true;pi.RedirectStandardOutput=true;pi.RedirectStandardError=true;
                Process pr=Process.Start(pi);StringBuilder sb=new StringBuilder();
                pr.OutputDataReceived+=delegate(object s,DataReceivedEventArgs a){if(a.Data!=null)lock(sb)sb.AppendLine(a.Data);};
                pr.ErrorDataReceived+=delegate(object s,DataReceivedEventArgs a){if(a.Data!=null)lock(sb)sb.AppendLine(a.Data);};
                pr.BeginOutputReadLine();pr.BeginErrorReadLine();pr.WaitForExit();
                lock(sb){exitCode=pr.ExitCode;return sb.ToString();}
            } catch(Exception ex){exitCode=-1;return ex.ToString();}
        }

        private void ScanProblemDevices()
        {
            if(GetFamily()!="10" && GetFamily()!="11") {MessageBox.Show("Skan PnPUtil w tej wersji wymaga Windows 10/11.");return;}
            int code;string output=CaptureOutput("pnputil.exe","/enum-devices /problem",out code);
            if(String.IsNullOrWhiteSpace(output))output="PnPUtil nie zwrócił listy problematycznych urządzeń. Kod: "+code;
            string path=Path.Combine(dataRoot,"ProblemDevices_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".txt");
            File.WriteAllText(path,output,Encoding.UTF8);AppendLog("Skan PnPUtil zakończony, kod "+code+"; raport: "+path);
            ShowLargeText("Problematyczne urządzenia",output,path);
        }

        private void ShowLargeText(string title,string text,string savePath)
        {
            Form f=new Form();f.Text=title;f.Size=new Size(950,650);f.StartPosition=FormStartPosition.CenterParent;
            TextBox t=new TextBox();t.Multiline=true;t.ReadOnly=true;t.ScrollBars=ScrollBars.Both;t.WordWrap=false;
            t.Font=new Font("Consolas",9F);t.Dock=DockStyle.Fill;t.Text=text;f.Controls.Add(t);
            f.ShowDialog(this);
        }

        private void ShowWimIndexes()
        {
            string wim=driverWimBox==null?"":driverWimBox.Text.Trim();
            if(!File.Exists(wim)){MessageBox.Show("Wskaż istniejący plik install.wim.");return;}
            int code;string output=CaptureOutput("dism.exe","/Get-WimInfo /WimFile:\""+wim+"\"",out code);
            string path=Path.Combine(dataRoot,"WimInfo_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".txt");
            File.WriteAllText(path,output,Encoding.UTF8);AppendLog("Odczyt WIM zakończony kodem "+code+"; "+path);
            ShowLargeText("Indeksy i edycje install.wim",output,path);
        }

        private void InjectDriversIntoWim()
        {
            string wim=driverWimBox==null?"":driverWimBox.Text.Trim();
            string folder=driverFolderBox==null?"":driverFolderBox.Text.Trim();
            if(!IsAdmin()){MessageBox.Show("Uruchom program jako administrator.");return;}
            if(!File.Exists(wim)||!String.Equals(Path.GetExtension(wim),".wim",StringComparison.OrdinalIgnoreCase)) {MessageBox.Show("Wskaż istniejący plik .wim. Pliki ESD i ISO nie są tutaj modyfikowane.");return;}
            if(!Directory.Exists(folder)||Directory.GetFiles(folder,"*.inf",SearchOption.AllDirectories).Length==0){MessageBox.Show("W folderze nie znaleziono plików INF.");return;}
            int index=1;if(driverWimIndexBox!=null)Int32.TryParse(driverWimIndexBox.Text,out index);if(index<1)index=1;
            long size=new FileInfo(wim).Length;DriveInfo drive=new DriveInfo(Path.GetPathRoot(wim));
            if(drive.AvailableFreeSpace < size+1024L*1024L*1024L){MessageBox.Show("Za mało wolnego miejsca na backup WIM i katalog montowania.");return;}
            string backup=wim+".pre_FIX012.bak";
            if(File.Exists(backup)){backup=wim+".pre_FIX012_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".bak";}
            string warning="Zostanie wykonana kopia WIM:\r\n"+backup+"\r\n\r\nNastępnie DISM zamontuje obraz, doda sterowniki INF i zapisze zmiany w wybranym indeksie "+index+". Oryginalny ISO nie jest modyfikowany. Kontynuować?";
            if(MessageBox.Show(warning,"Wstrzykiwanie sterowników do WIM",MessageBoxButtons.YesNo,MessageBoxIcon.Warning)!=DialogResult.Yes)return;
            string log=Path.Combine(dataRoot,"WIM_DriverInject_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".log");
            string mount=Path.Combine(dataRoot,"Mount_WIM_"+DateTime.Now.ToString("yyyyMMdd_HHmmss"));
            Directory.CreateDirectory(mount);int code=-1;StringBuilder report=new StringBuilder();
            try {
                File.Copy(wim,backup,false);report.AppendLine("Backup WIM: "+backup);
                int c1;string r1=CaptureOutput("dism.exe","/Mount-Image /ImageFile:\""+wim+"\" /Index:"+index+" /MountDir:\""+mount+"\"",out c1);report.AppendLine("MOUNT code="+c1+"\r\n"+r1);
                if(c1!=0)throw new InvalidOperationException("DISM nie zamontował obrazu. Kod="+c1);
                int c2;string r2=CaptureOutput("dism.exe","/Image:\""+mount+"\" /Add-Driver /Driver:\""+folder+"\" /Recurse",out c2);report.AppendLine("ADD-DRIVER code="+c2+"\r\n"+r2);
                if(c2!=0) {
                    int discardCode;string discard=CaptureOutput("dism.exe","/Unmount-Image /MountDir:\""+mount+"\" /Discard",out discardCode);
                    report.AppendLine("DISCARD code="+discardCode+"\r\n"+discard);
                    throw new InvalidOperationException("DISM nie dodał sterowników. WIM nie został zatwierdzony. Kod="+c2);
                }
                int c3;string r3=CaptureOutput("dism.exe","/Unmount-Image /MountDir:\""+mount+"\" /Commit",out c3);report.AppendLine("COMMIT code="+c3+"\r\n"+r3);code=c3;
                if(c3!=0)throw new InvalidOperationException("Nie udało się zatwierdzić WIM. Kod="+c3+". Kopia bezpieczeństwa: "+backup);
                report.AppendLine("WYNIK: sterowniki zostały dodane do wskazanego indeksu WIM.");
            } catch(Exception ex) {report.AppendLine("BŁĄD: "+ex.Message);AppendLog("WIM driver injection: "+ex.Message);}
            finally {
                try {File.WriteAllText(log,report.ToString(),Encoding.UTF8);}catch{}
                AppendLog("WIM driver injection zakończony; log: "+log);
                try {if(Directory.Exists(mount))Directory.Delete(mount,true);}catch{}
            }
            MessageBox.Show(report.ToString().Length>3000?report.ToString().Substring(0,3000)+"\r\n...\r\nPełny raport: "+log:report.ToString(),"Wynik DISM");
        }

        private void BuildRepairCenterPage()
        {
            if(FindPage("Naprawa Windows")!=null)return;
            Panel p=NewPage("Naprawa Windows","Centrum naprawy Windows");
            Panel online=Card(p,"NAPRAWA SYSTEMU ONLINE",10,8,950,175);
            ButtonAt(online,"DISM CheckHealth",18,48,175,delegate{RunCommand("DISM.exe","/Online /Cleanup-Image /CheckHealth");});
            ButtonAt(online,"DISM ScanHealth",205,48,175,delegate{RunCommand("DISM.exe","/Online /Cleanup-Image /ScanHealth");});
            ButtonAt(online,"DISM RestoreHealth",392,48,190,delegate{RunCommand("DISM.exe","/Online /Cleanup-Image /RestoreHealth");});
            ButtonAt(online,"SFC /scannow",594,48,165,delegate{RunCommand("sfc.exe","/scannow");});
            ButtonAt(online,"CHKDSK /scan",770,48,145,delegate{RunCommand("chkdsk.exe",Environment.GetEnvironmentVariable("SystemDrive")+" /scan");});
            LabelAt(online,"DISM / SFC naprawiają pliki systemowe. CHKDSK /scan sprawdza wolumin online; nie wyłączaj komputera podczas pracy.",18,105,900,40);

            Panel volume=Card(p,"WYBRANY WOLUMIN I NARZĘDZIA",10,200,950,150);
            LabelAt(volume,"Wolumin",18,48,80,24);
            repairVolumeSelector=ComboAt(volume,GetDriveChoices(),105,44,170);
            ButtonAt(volume,"Sprawdź wolumin",290,42,180,delegate{
                string v=repairVolumeSelector==null?Environment.GetEnvironmentVariable("SystemDrive"):repairVolumeSelector.Text;
                if(String.IsNullOrEmpty(v))return;RunCommand("chkdsk.exe",v+" /scan");
            });
            ButtonAt(volume,"Otwórz monitor niezawodności",485,42,250,delegate{RunCommand("perfmon.exe","/rel");});
            ButtonAt(volume,"Podgląd zdarzeń",750,42,165,delegate{RunCommand("eventvwr.msc","");});
            LabelAt(volume,"Narzędzia wymagające Restart / WinRE są opisane niżej; program nie wykonuje bootrec na uruchomionym Windows.",18,98,900,30);

            Panel boot=Card(p,"NAPRAWA ROZRUCHU / BCD / WINRE",10,365,950,165);
            LabelAt(boot,"Automatyczna naprawa rozruchu i polecenia bootrec / bcdboot wykonuje się z WinRE lub WinPE. Wybierz właściwą instalację i partycję EFI — błędna litera lub dysk może uniemożliwić start.",18,45,900,50);
            ButtonAt(boot,"Instrukcja BCD / EFI",18,105,195,delegate{ShowBootRepairGuide();});
            ButtonAt(boot,"Uruchom opcje odzyskiwania",225,105,250,delegate{RequestWinRERestart();});
            ButtonAt(boot,"Reset Windows Update",490,105,215,delegate{ResetWindowsUpdate();});
            ButtonAt(boot,"Punkt przywracania",720,105,195,delegate{CreateRestorePoint();});

            Panel offline=Card(p,"NAPRAWA OBRAZU OFFLINE",10,545,950,125);
            LabelAt(offline,"Dla obrazu zamontowanego poza systemem uruchom DISM /Image:<folder> /Cleanup-Image /RestoreHealth. Wymaga poprawnego katalogu offline Windows i źródła naprawy.",18,45,900,38);
            ButtonAt(offline,"Otwórz dokumentację DISM",18,88,235,delegate{OpenUrl("https://learn.microsoft.com/windows-hardware/manufacture/desktop/repair-a-windows-image");});
        }

        private string[] GetDriveChoices()
        {
            List<string> list=new List<string>();
            foreach(DriveInfo d in DriveInfo.GetDrives())try{if(d.IsReady && d.DriveType==DriveType.Fixed)list.Add(d.Name.TrimEnd('\\'));}catch{}
            if(list.Count==0)list.Add(Environment.GetEnvironmentVariable("SystemDrive"));
            return list.ToArray();
        }

        private void ShowBootRepairGuide()
        {
            string msg="NAPRAWA ROZRUCHU — WINRE / WINPE\r\n\r\n"+
                "1. Uruchom komputer z nośnika instalacyjnego lub odzyskiwania Windows.\r\n"+
                "2. Wybierz Napraw komputer → Rozwiąż problemy → Opcje zaawansowane → Naprawa podczas uruchamiania.\r\n"+
                "3. Jeśli naprawa automatyczna nie działa, otwórz Wiersz polecenia w WinRE.\r\n"+
                "4. Ustal litery partycji przez diskpart → list vol. W WinRE litera Windows może być inna niż C:.\r\n"+
                "5. Dopiero po sprawdzeniu woluminów użyj właściwych poleceń bootrec / bcdboot zgodnych z trybem UEFI/GPT albo BIOS/MBR.\r\n\r\n"+
                "Nie wykonuj formatowania ani usuwania partycji EFI bez pełnej kopii i identyfikacji dysku. Program nie uruchamia tych poleceń automatycznie.";
            MessageBox.Show(msg,"Instrukcja naprawy rozruchu",MessageBoxButtons.OK,MessageBoxIcon.Warning);
        }

        private void RequestWinRERestart()
        {
            if(GetFamily()!="10" && GetFamily()!="11") {MessageBox.Show("Restart do nowoczesnych opcji WinRE z tego przycisku jest obsługiwany w Windows 10/11. Dla starszych systemów uruchom odpowiedni nośnik odzyskiwania.");return;}
            if(MessageBox.Show("Komputer zostanie uruchomiony ponownie do zaawansowanych opcji odzyskiwania. Zapisz otwarte dokumenty. Kontynuować?","Restart do WinRE",MessageBoxButtons.YesNo,MessageBoxIcon.Warning)!=DialogResult.Yes)return;
            try{Process.Start(new ProcessStartInfo("shutdown.exe","/r /o /t 5"){UseShellExecute=true});AppendLog("Zlecono restart do WinRE.");}
            catch(Exception ex){MessageBox.Show("Nie udało się zlecić restartu: "+ex.Message);}
        }

        private void BuildBsodAnalyzerPage()
        {
            if(FindPage("Analiza BSOD")!=null)return;
            Panel p=NewPage("Analiza BSOD","BSOD & Crash Analyzer");
            Panel actions=Card(p,"ANALIZA BŁĘDÓW KRYTYCZNYCH I MINIDUMP",10,8,950,135);
            LabelAt(actions,"Analizuje zdarzenia BugCheck / Kernel-Power / nieoczekiwane wyłączenia oraz pliki minidump. Bez narzędzi Debugging Tools nie wykonuje pełnej symbolicznej analizy stosu.",18,45,900,40);
            ButtonAt(actions,"ANALIZUJ BSOD",18,92,190,delegate{AnalyzeBsod();});
            ButtonAt(actions,"Otwórz Minidump",220,92,180,delegate{OpenMinidumpFolder();});
            ButtonAt(actions,"Otwórz Debugging Tools",412,92,220,delegate{OpenWinDbg();});
            Panel dumps=Card(p,"ZNALEZIONE PLIKI ZRZUTU",10,160,950,145);
            bsodDumpList=new ListBox();bsodDumpList.Location=new Point(18,45);bsodDumpList.Size=new Size(895,80);
            bsodDumpList.BackColor=Color.FromArgb(7,13,23);bsodDumpList.ForeColor=Color.FromArgb(200,235,220);dumps.Controls.Add(bsodDumpList);
            Panel result=Card(p,"RAPORT ANALIZY",10,320,950,345);
            bsodReportBox=new TextBox();bsodReportBox.Multiline=true;bsodReportBox.ReadOnly=true;bsodReportBox.ScrollBars=ScrollBars.Both;bsodReportBox.WordWrap=false;
            bsodReportBox.Font=new Font("Consolas",8.5F);bsodReportBox.BackColor=Color.FromArgb(7,13,23);bsodReportBox.ForeColor=Color.FromArgb(200,235,220);
            bsodReportBox.Location=new Point(18,45);bsodReportBox.Size=new Size(895,275);result.Controls.Add(bsodReportBox);
            RefreshDumpList();
        }

        private void RefreshDumpList()
        {
            if(bsodDumpList==null)return;
            bsodDumpList.Items.Clear();string dir=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows),"Minidump");
            try{if(Directory.Exists(dir))foreach(string f in Directory.GetFiles(dir,"*.dmp")){FileInfo i=new FileInfo(f);bsodDumpList.Items.Add(i.LastWriteTime.ToString("yyyy-MM-dd HH:mm")+" | "+Math.Round(i.Length/1024.0,1)+" KB | "+f);}}catch{}
            string full=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows),"MEMORY.DMP");
            try{if(File.Exists(full)){FileInfo i=new FileInfo(full);bsodDumpList.Items.Add(i.LastWriteTime.ToString("yyyy-MM-dd HH:mm")+" | "+Math.Round(i.Length/1048576.0,1)+" MB | "+full);}}catch{}
            if(bsodDumpList.Items.Count==0)bsodDumpList.Items.Add("Nie znaleziono plików zrzutu w Windows\\Minidump ani MEMORY.DMP.");
        }

        private void AnalyzeBsod()
        {
            StringBuilder b=new StringBuilder();b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — BSOD & CRASH ANALYZER");
            b.AppendLine("Data: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));b.AppendLine("System: "+GetOsCaption()+" / "+GetBuild());
            b.AppendLine();b.AppendLine("PLIKI ZRZUTU:");
            string dir=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows),"Minidump");int dumps=0;
            try{if(Directory.Exists(dir))foreach(string f in Directory.GetFiles(dir,"*.dmp")){FileInfo i=new FileInfo(f);b.AppendLine(i.LastWriteTime.ToString("yyyy-MM-dd HH:mm")+" | "+i.Length+" B | "+f);dumps++;}}catch(Exception ex){b.AppendLine("Minidump error: "+ex.Message);}
            string memory=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows),"MEMORY.DMP");
            try{if(File.Exists(memory)){FileInfo i=new FileInfo(memory);b.AppendLine(i.LastWriteTime.ToString("yyyy-MM-dd HH:mm")+" | "+i.Length+" B | "+memory);dumps++;}}catch{}
            b.AppendLine("Liczba zrzutów: "+dumps);b.AppendLine();b.AppendLine("ZDARZENIA SYSTEMOWE (BugCheck / Kernel-Power / EventLog):");
            int added=0;
            try {
                using(EventLog log=new EventLog("System")) {
                    int max=Math.Max(0,log.Entries.Count-500);
                    for(int i=log.Entries.Count-1;i>=max && added<80;i--) {
                        try {
                            EventLogEntry e=log.Entries[i];string src=e.Source??"";
                            if(e.InstanceId==1001 || e.InstanceId==41 || e.InstanceId==6008 || src.IndexOf("BugCheck",StringComparison.OrdinalIgnoreCase)>=0 || src.IndexOf("WER-SystemErrorReporting",StringComparison.OrdinalIgnoreCase)>=0) {
                                b.AppendLine("["+e.TimeGenerated.ToString("yyyy-MM-dd HH:mm:ss")+"] ID="+e.InstanceId+" Source="+src);
                                string message=e.Message??"";if(message.Length>1600)message=message.Substring(0,1600)+" ...";b.AppendLine(message);b.AppendLine();added++;
                            }
                        } catch{}
                    }
                }
            } catch(Exception ex){b.AppendLine("EventLog error: "+ex.Message);}
            b.AppendLine("\r\nUWAGA: kody BugCheck z dziennika są wskazówką. Pełna analiza DMP wymaga WinDbg i symboli Microsoft. Sama obecność Kernel-Power 41 nie wskazuje jednoznacznej przyczyny.");
            string path=Path.Combine(dataRoot,"BSOD_Report_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".txt");File.WriteAllText(path,b.ToString(),Encoding.UTF8);
            if(bsodReportBox!=null)bsodReportBox.Text=b.ToString();RefreshDumpList();AppendLog("Zapisano raport BSOD: "+path);
        }

        private void OpenMinidumpFolder()
        {
            string dir=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows),"Minidump");
            if(!Directory.Exists(dir))Directory.CreateDirectory(dir);try{Process.Start("explorer.exe",dir);}catch(Exception ex){MessageBox.Show(ex.Message);}
        }
        private void OpenWinDbg()
        {
            string[] paths=new string[]{
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),"Windows Kits","10","Debuggers","x64","windbg.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),"Windows Kits","10","Debuggers","x64","windbg.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),"Windows Kits","10","Debuggers","x86","windbg.exe")};
            foreach(string f in paths)if(File.Exists(f)){Process.Start(f);return;}
            OpenUrl("https://learn.microsoft.com/windows-hardware/drivers/debugger/");
        }

        private class UpdateFeedResult
        {
            public string Version,Url,Sha256,Notes,Region,Language,Architecture,Channel,SourceFeed,SignerThumbprint;
            public List<string> Mirrors = new List<string>();
            public bool IsNew;
        }
        private class UpdateJob
        {
            public List<string> FeedUrls;
            public string Channel,ChannelKey,Region,Language,Architecture;
        }
        private class UpdateDownloadJob
        {
            public List<string> Urls;
            public string Sha256,Version;
            public int MaxSpeedKBps;
            public string SignerThumbprint;
        }
        private class UpdateDownloadResult
        {
            public string Path,SourceUrl;
            public long SizeBytes;
            public string AuthenticodeStatus;
        }
        private sealed class AuthenticodeCheckResult
        {
            public string Status,Message,Thumbprint,Subject;
            public bool IsValid;
        }
        private sealed class ReleaseCatalogEntry
        {
            public string Version,Channel,PublishedUtc,Notes,PackageUrl,Sha256,SignerThumbprint,SignatureStatus;
            public long SizeBytes;
        }

        private sealed class UpdateProgressInfo
        {
            public int Percent;
            public string Message;
            public UpdateProgressInfo(int percent,string message){Percent=percent;Message=message;}
        }
        private sealed class UpdateWebClient : WebClient
        {
            public int TimeoutMilliseconds = 15000;
            public Uri LastResponseUri;
            protected override WebRequest GetWebRequest(Uri address)
            {
                WebRequest request=base.GetWebRequest(address);
                HttpWebRequest http=request as HttpWebRequest;
                if(http!=null)
                {
                    http.Timeout=TimeoutMilliseconds;
                    http.ReadWriteTimeout=TimeoutMilliseconds;
                    http.KeepAlive=true;
                    http.UserAgent="KomputeroweCentrumSerwisu/"+ProgramVersion;
                }
                return request;
            }
            protected override WebResponse GetWebResponse(WebRequest request)
            {
                WebResponse response=base.GetWebResponse(request);
                LastResponseUri=response.ResponseUri;
                return response;
            }
            protected override WebResponse GetWebResponse(WebRequest request,IAsyncResult result)
            {
                WebResponse response=base.GetWebResponse(request,result);
                LastResponseUri=response.ResponseUri;
                return response;
            }
        }




        private string GetOfficialUpdateManifestUrl()
        {
            bool beta=updaterChannelBox!=null && updaterChannelBox.SelectedIndex==1;
            return OfficialUpdateBaseUrl+(beta?"manifest-beta.xml":"manifest-stable.xml");
        }

        private string GetOfficialUpdatePackageUrl()
        {
            return OfficialUpdateBaseUrl+"KomputeroweCentrumSerwisu_FIX072_INSTALATOR.exe";
        }
        private string GetOfficialReleaseCatalogUrl()
        {
            return OfficialUpdateBaseUrl+"releases.json";
        }

        private int GetUpdaterPageLogicalWidth(Panel page)
        {
            float scale=layoutScale<=0?1.0F:layoutScale;
            int client=content==null?Width-280:content.ClientSize.Width-UX(44);
            int logical=(int)Math.Floor(client/scale);
            return Math.Max(950,logical);
        }

        private void InitializeGlobalUpdateService()
        {
            if(updaterAutoTimer!=null)return;
            try
            {
                // Budujemy ekran niewidocznie, aby sprawdzanie działało także wtedy,
                // gdy użytkownik pozostaje na pulpicie.
                BuildUpdaterPage();
                LoadUpdaterSettings();

                updaterAutoTimer=new System.Windows.Forms.Timer();
                updaterAutoTimer.Interval=Math.Max(1,Math.Min(24,updaterCheckIntervalHours))*60*60*1000;
                updaterAutoTimer.Tick+=delegate
                {
                    if(updaterAutoCheckBox!=null && updaterAutoCheckBox.Checked &&
                       (updaterWorker==null || !updaterWorker.IsBusy))
                        CheckProgramUpdate();
                };
                updaterAutoTimer.Start();

                if(updaterAutoCheckBox==null || updaterAutoCheckBox.Checked)
                {
                    BeginInvoke((MethodInvoker)delegate
                    {
                        if(!IsDisposed && (updaterWorker==null || !updaterWorker.IsBusy))
                            CheckProgramUpdate();
                    });
                }
            }
            catch(Exception ex)
            {
                AppendLog("Automatyczna usługa aktualizacji nie uruchomiła się: "+ex.Message);
            }
        }

        private void BuildUpdaterPage()
        {
            if(FindPage("Aktualizator PRO")!=null)return;
            Panel p=NewPage("Aktualizator PRO","AUTOMATYCZNE AKTUALIZACJE — WYKRYWANIE / POBIERANIE / INSTALACJA");
            int pageW=GetUpdaterPageLogicalWidth(p);
            int innerW=Math.Max(900,pageW-55);

            Panel status=Card(p,"CENTRUM AKTUALIZACJI GLOBALNYCH",10,8,pageW,150);
            // Keep every status label strictly to the left of the two action buttons.
            // The previous width crossed the buttons and made their text appear to ghost/bleed through.
            int statusTextWidth=Math.Max(380,pageW-468);
            updaterStatusLabel=LabelAt(status,"ŁĄCZENIE Z OFICJALNYM SERWEREM AKTUALIZACJI…",18,42,statusTextWidth,25);
            updaterStatusLabel.Font=new Font("Segoe UI",10F*layoutScaleY,FontStyle.Bold);
            updaterStatusLabel.ForeColor=Color.FromArgb(245,190,95);
            LabelAt(status,"Program: "+ProgramVersion+"  |  Serwer: GITHUB RELEASES  |  Kanał: Stable",18,82,statusTextWidth,18);
            LabelAt(status,"Region: "+DetectUpdaterRegion()+"  |  Język: "+DetectUpdaterLanguage()+"  |  Architektura: "+(IntPtr.Size==8?"x64":"x86"),18,103,statusTextWidth,18);

            ButtonAt(status,"TEST GITHUB RELEASES",pageW-420,39,195,delegate{TestGitHubUpdateEndpoint();});
            ButtonAt(status,"SPRAWDŹ TERAZ",pageW-210,39,180,delegate{CheckProgramUpdate();});
            updaterServerDiagLabel=LabelAt(status,"DIAGNOSTYKA: oczekiwanie na test HTTPS / GitHub API / wydań / manifestów / SHA-256.",18,126,innerW-35,18);
            updaterServerDiagLabel.ForeColor=Color.FromArgb(155,197,218);
            updaterServerDiagLabel.Font=new Font("Segoe UI",8.2F*layoutScaleY,FontStyle.Bold);

            Panel settings=Card(p,"USTAWIENIA AUTOMATYCZNE — BEZ RĘCZNEGO KONFIGUROWANIA SERWERÓW",10,168,pageW,140);
            updaterChannelBox=ComboAt(settings,new string[]{"Stable — wersja normalna","Beta — wersja testowa"},18,42,250);
            updaterChannelBox.SelectedIndex=savedProgramChannel.IndexOf("Beta",StringComparison.OrdinalIgnoreCase)>=0?1:0;
            updaterChannelBox.SelectedIndexChanged+=delegate
            {
                if(updaterStatusLabel!=null)
                    SetUpdaterStatus("Wybrany kanał: "+(updaterChannelBox.SelectedIndex==1?"Beta":"Stable")+
                        ". Adres manifestu zostanie dobrany automatycznie.",true);
            };

            updaterAutoCheckBox=new CheckBox();
            updaterAutoCheckBox.Text="Automatycznie sprawdzaj po uruchomieniu i według harmonogramu";
            updaterAutoCheckBox.Checked=true;
            updaterAutoCheckBox.Location=new Point(UX(290),UY(43));
            updaterAutoCheckBox.Size=new Size(UX(360),UY(24));
            updaterAutoCheckBox.ForeColor=Color.FromArgb(220,239,249);
            updaterAutoCheckBox.BackColor=Color.Transparent;
            updaterAutoCheckBox.Font=new Font("Segoe UI",8.8F*layoutScaleY);
            settings.Controls.Add(updaterAutoCheckBox);

            updaterAutoDownloadBox=new CheckBox();
            updaterAutoDownloadBox.Text="Automatycznie pobieraj wykryte aktualizacje";
            updaterAutoDownloadBox.Checked=true;
            updaterAutoDownloadBox.Location=new Point(UX(290),UY(73));
            updaterAutoDownloadBox.Size=new Size(UX(360),UY(24));
            updaterAutoDownloadBox.ForeColor=Color.FromArgb(220,239,249);
            updaterAutoDownloadBox.BackColor=Color.Transparent;
            updaterAutoDownloadBox.Font=new Font("Segoe UI",8.8F*layoutScaleY);
            settings.Controls.Add(updaterAutoDownloadBox);

            updaterAutoInstallBox=new CheckBox();
            updaterAutoInstallBox.Text="Po pobraniu uruchom instalator automatycznie (wymaga zgody UAC)";
            updaterAutoInstallBox.Checked=false;
            updaterAutoInstallBox.Location=new Point(UX(290),UY(101));
            updaterAutoInstallBox.Size=new Size(UX(Math.Max(420,pageW-340)),UY(24));
            updaterAutoInstallBox.ForeColor=Color.FromArgb(220,239,249);
            updaterAutoInstallBox.BackColor=Color.Transparent;
            updaterAutoInstallBox.Font=new Font("Segoe UI",8.8F*layoutScaleY);
            settings.Controls.Add(updaterAutoInstallBox);

            LabelAt(settings,"LIMIT PRĘDKOŚCI (KB/s, 0 = bez limitu)",680,42,160,20);
            updaterSpeedLimitBox=new NumericUpDown();
            updaterSpeedLimitBox.Minimum=0;updaterSpeedLimitBox.Maximum=500000;updaterSpeedLimitBox.Increment=64;
            updaterSpeedLimitBox.Value=updaterMaxSpeedKBps;
            updaterSpeedLimitBox.Location=new Point(UX(845),UY(40));updaterSpeedLimitBox.Size=new Size(UX(88),UY(27));
            updaterSpeedLimitBox.BackColor=Color.FromArgb(3,13,27);updaterSpeedLimitBox.ForeColor=Color.White;
            settings.Controls.Add(updaterSpeedLimitBox);
            LabelAt(settings,"SPRAWDZAJ CO (GODZ.)",680,82,160,20);
            updaterIntervalBox=new NumericUpDown();
            updaterIntervalBox.Minimum=1;updaterIntervalBox.Maximum=24;updaterIntervalBox.Value=updaterCheckIntervalHours;
            updaterIntervalBox.Location=new Point(UX(845),UY(80));updaterIntervalBox.Size=new Size(UX(88),UY(27));
            updaterIntervalBox.BackColor=Color.FromArgb(3,13,27);updaterIntervalBox.ForeColor=Color.White;
            settings.Controls.Add(updaterIntervalBox);

            ButtonAt(settings,"ZAPISZ USTAWIENIA",18,84,230,delegate{SaveUpdaterSettings();});

            Panel check=Card(p,"DOSTĘPNE WYDANIA — POBIERANIE I WERYFIKACJA",10,318,pageW,225);
            ButtonAt(check,"SPRAWDŹ WYDANIE",18,43,210,delegate{CheckProgramUpdate();});
            ButtonAt(check,"POBIERZ / WZNÓW",238,43,190,delegate{DownloadProgramUpdate();});
            updaterPauseButton=ButtonAt(check,"WSTRZYMAJ",438,43,145,delegate{TogglePauseProgramUpdate();});
            updaterStopButton=ButtonAt(check,"ZATRZYMAJ",593,43,145,delegate{StopProgramUpdate();});
            ButtonAt(check,"OTWÓRZ POBRANE",pageW-230,43,190,delegate{OpenGlobalUpdatesFolder();});
            updaterPauseButton.Enabled=false;
            updaterStopButton.Enabled=false;

            updaterResultBox=new TextBox();
            updaterResultBox.Multiline=true;
            updaterResultBox.ReadOnly=true;
            updaterResultBox.ScrollBars=ScrollBars.Vertical;
            updaterResultBox.WordWrap=true;
            updaterResultBox.Location=new Point(UX(18),UY(87));
            updaterResultBox.Size=new Size(UX(innerW),UY(76));
            updaterResultBox.BackColor=Color.FromArgb(7,13,23);
            updaterResultBox.ForeColor=Color.FromArgb(200,235,220);
            updaterResultBox.Text="Automatyczne sprawdzanie jest włączone. Program sam wybiera region, język, kanał i oficjalny adres manifestu.";
            check.Controls.Add(updaterResultBox);

            updaterProgressBar=new ProgressBar();
            updaterProgressBar.Location=new Point(UX(18),UY(173));
            updaterProgressBar.Size=new Size(UX(Math.Max(520,pageW-300)),UY(18));
            updaterProgressBar.Minimum=0;
            updaterProgressBar.Maximum=100;
            updaterProgressBar.Value=0;
            check.Controls.Add(updaterProgressBar);
            updaterProgressLabel=LabelAt(check,"Oczekiwanie na automatyczne sprawdzenie.",pageW-260,170,220,24);

            Panel history=Card(p,"HISTORIA I WYNIKI KONTROLI",10,553,pageW,200);
            ButtonAt(history,"USUŃ STARE WPISY SERWERA",18,42,235,delegate{ClearArchivedUpdaterHistory();});
            updaterHistoryList=new ListBox();
            updaterHistoryList.Location=new Point(UX(18),UY(88));
            updaterHistoryList.Size=new Size(UX(innerW),UY(90));
            updaterHistoryList.BackColor=Color.FromArgb(7,13,23);
            updaterHistoryList.ForeColor=Color.FromArgb(205,235,245);
            updaterHistoryList.Font=new Font("Segoe UI",9.0F*layoutScaleY);
            updaterHistoryList.DrawMode=DrawMode.OwnerDrawFixed;
            updaterHistoryList.ItemHeight=UY(20);
            updaterHistoryList.HorizontalScrollbar=true;
            updaterHistoryList.HorizontalExtent=2200;
            updaterHistoryList.DrawItem+=delegate(object sender,DrawItemEventArgs e)
            {
                if(e.Index<0)return;
                e.DrawBackground();
                string item=Convert.ToString(updaterHistoryList.Items[e.Index]);
                bool selected=(e.State&DrawItemState.Selected)==DrawItemState.Selected;
                Color fore=selected?Color.White:Color.FromArgb(205,225,238);
                if(!selected)
                {
                    if(item.IndexOf("[ARCHIWUM]",StringComparison.OrdinalIgnoreCase)>=0)fore=Color.FromArgb(145,161,178);
                    else if(item.IndexOf("| OK |",StringComparison.OrdinalIgnoreCase)>=0)fore=Color.FromArgb(90,220,172);
                    else if(item.IndexOf("| Błąd |",StringComparison.OrdinalIgnoreCase)>=0 || item.IndexOf("| Serwer niedostępny |",StringComparison.OrdinalIgnoreCase)>=0)fore=Color.FromArgb(255,184,103);
                }
                TextRenderer.DrawText(e.Graphics,item,updaterHistoryList.Font,e.Bounds,fore,TextFormatFlags.Left|TextFormatFlags.VerticalCenter|TextFormatFlags.NoPrefix|TextFormatFlags.EndEllipsis);
                if(selected)e.DrawFocusRectangle();
            };
            history.Controls.Add(updaterHistoryList);

            Panel monitoring=Card(p,"MONITORING AKTUALIZACJI — HTTPS / GITHUB API / WYDANIA / MANIFESTY / SHA-256",10,765,pageW,118);
            int metricW=Math.Max(145,(pageW-95)/5);
            updaterHttpsMetricLabel=LabelAt(monitoring,"HTTPS: NIE TESTOWANO",18,45,metricW-8,22);
            updaterApiMetricLabel=LabelAt(monitoring,"GITHUB API: NIE TESTOWANO",18+metricW,45,metricW-8,22);
            updaterAssetsMetricLabel=LabelAt(monitoring,"ASSETY: NIE TESTOWANO",18+metricW*2,45,metricW-8,22);
            updaterManifestMetricLabel=LabelAt(monitoring,"MANIFESTY: NIE TESTOWANO",18+metricW*3,45,metricW-8,22);
            updaterSecurityMetricLabel=LabelAt(monitoring,"PODPIS: NIE TESTOWANO",18+metricW*4,45,metricW-18,22);
            ButtonAt(monitoring,"RAPORT DIAGNOSTYCZNY",18,76,220,delegate{ExportUpdaterDiagnosticReport();});
            ButtonAt(monitoring,"KOPIUJ WYNIK",250,76,170,delegate{CopyUpdaterDiagnosticReport();});
            ButtonAt(monitoring,"PEŁNA KONTROLA",432,76,190,delegate{TestGitHubUpdateEndpoint();LoadUpdateReleaseCatalog();});

            Panel catalog=Card(p,"KATALOG WYDAŃ — STABLE / BETA / HISTORIA PUBLIKACJI",10,893,pageW,196);
            updaterReleaseCatalogList=new ListBox();
            updaterReleaseCatalogList.Location=new Point(UX(18),UY(42));
            updaterReleaseCatalogList.Size=new Size(UX(Math.Max(480,pageW-340)),UY(118));
            updaterReleaseCatalogList.BackColor=Color.FromArgb(7,13,23);updaterReleaseCatalogList.ForeColor=Color.FromArgb(205,235,245);
            updaterReleaseCatalogList.Font=new Font("Segoe UI",9.0F*layoutScaleY);updaterReleaseCatalogList.HorizontalScrollbar=true;
            updaterReleaseCatalogList.SelectedIndexChanged+=delegate{ShowSelectedReleaseCatalogDetails();};
            catalog.Controls.Add(updaterReleaseCatalogList);
            updaterReleaseDetailsBox=new TextBox();updaterReleaseDetailsBox.Multiline=true;updaterReleaseDetailsBox.ReadOnly=true;
            updaterReleaseDetailsBox.ScrollBars=ScrollBars.Vertical;updaterReleaseDetailsBox.WordWrap=true;
            updaterReleaseDetailsBox.Location=new Point(UX(Math.Max(520,pageW-300)),UY(42));
            updaterReleaseDetailsBox.Size=new Size(UX(245),UY(118));
            updaterReleaseDetailsBox.BackColor=Color.FromArgb(7,13,23);updaterReleaseDetailsBox.ForeColor=Color.FromArgb(205,235,245);
            updaterReleaseDetailsBox.Font=new Font("Segoe UI",8.2F*layoutScaleY);catalog.Controls.Add(updaterReleaseDetailsBox);
            ButtonAt(catalog,"ODŚWIEŻ KATALOG",18,160,210,delegate{LoadUpdateReleaseCatalog();});
            ButtonAt(catalog,"OTWÓRZ KATALOG ONLINE",238,160,225,delegate{OpenUrl(GetOfficialReleaseCatalogUrl());});
            ButtonAt(catalog,"OTWÓRZ POBRANE",473,160,180,delegate{OpenGlobalUpdatesFolder();});
            ButtonAt(catalog,"POBIERZ WYBRANE WYDANIE",661,160,245,delegate{DownloadSelectedCatalogRelease();});

            Panel rollback=Card(p,"OCHRONA WYDANIA — KOPIA POPRZEDNIEJ WERSJI / COFANIE / PODPIS",10,1099,pageW,150);
            LabelAt(rollback,"Przed instalacją program zachowuje poprzedni plik EXE i zasoby aplikacji, zapisuje ich SHA-256 oraz kopię ustawień. Cofnięcie wymaga zamknięcia programu i potwierdzenia UAC.",18,42,pageW-55,34);
            ButtonAt(rollback,"UTWÓRZ KOPIĘ TERAZ",18,89,220,delegate{string result=BackupUpdaterSettingsBeforeInstall("ręczna-kopia");SetUpdaterStatus(result.StartsWith("BŁĄD",StringComparison.OrdinalIgnoreCase)?result:"Kopia aplikacji i ustawień została zapisana: "+result,!result.StartsWith("BŁĄD",StringComparison.OrdinalIgnoreCase));});
            updaterRollbackButton=ButtonAt(rollback,"COFNIJ DO POPRZEDNIEJ WERSJI",250,89,285,delegate{StartRollbackToPreviousVersion();});
            updaterRollbackButton.Enabled=HasRollbackSnapshot();
            ButtonAt(rollback,"SPRAWDŹ PODPIS EXE",547,89,220,delegate{CheckCurrentProgramAuthenticode();});

            p.AutoScrollMinSize=new Size(0,1270);
            updaterSettingsPath=Path.Combine(dataRoot,"update_channels.xml");
            updaterHistoryPath=Path.Combine(dataRoot,"GlobalUpdates","history.xml");
            LoadUpdaterSettings();
            LoadUpdaterHistory();
            LoadUpdateReleaseCatalog();
        }

        private string ResolveHostViaDnsOverHttps(string host)
        {
            try
            {
                ServicePointManager.SecurityProtocol=(SecurityProtocolType)3072;
                string url="https://dns.google/resolve?name="+Uri.EscapeDataString(host)+"&type=A";
                HttpWebRequest request=(HttpWebRequest)WebRequest.Create(url);
                request.Method="GET";request.Timeout=9000;request.ReadWriteTimeout=9000;
                request.Accept="application/dns-json";request.UserAgent="KomputeroweCentrumSerwisu/"+ProgramVersion;
                using(HttpWebResponse response=(HttpWebResponse)request.GetResponse())
                using(StreamReader reader=new StreamReader(response.GetResponseStream(),Encoding.UTF8))
                {
                    string json=reader.ReadToEnd();
                    Match status=Regex.Match(json,"\\\"Status\\\"\\s*:\\s*(\\d+)");
                    if(status.Success && status.Groups[1].Value=="3")return "NXDOMAIN — publiczny DNS Google nie zna hosta.";
                    MatchCollection answers=Regex.Matches(json,"\\\"data\\\"\\s*:\\s*\\\"((?:\\d{1,3}\\.){3}\\d{1,3})\\\"");
                    if(answers.Count>0)
                    {
                        List<string> ips=new List<string>();
                        foreach(Match m in answers)if(!ips.Contains(m.Groups[1].Value))ips.Add(m.Groups[1].Value);
                        return "FOUND — publiczny DNS Google widzi: "+String.Join(", ",ips.ToArray());
                    }
                    return "NOANSWER — publiczny DNS Google nie zwrócił rekordu A.";
                }
            }
            catch(Exception ex){return "DOH-ERROR — "+ex.GetBaseException().Message;}
        }

        private void SetUpdaterMetric(Label label,string text,bool success,bool unknown)
        {
            if(label==null || label.IsDisposed)return;
            label.Text=text;
            label.ForeColor=unknown?Color.FromArgb(170,190,205):(success?Color.FromArgb(84,224,174):Color.FromArgb(255,181,102));
            label.Invalidate();
        }

        private void TestGitHubUpdateEndpoint()
        {
            if(updaterDiagnosticsWorker!=null && updaterDiagnosticsWorker.IsBusy)return;
            if(updaterServerDiagLabel!=null)updaterServerDiagLabel.Text="DIAGNOSTYKA: GitHub API, publiczne wydanie i wymagane assety…";
            if(updaterStatusLabel!=null)updaterStatusLabel.Text="TEST GITHUB RELEASES — PROSZĘ CZEKAĆ…";
            updaterDiagnosticsWorker=new BackgroundWorker();
            updaterDiagnosticsWorker.DoWork+=delegate(object sender,DoWorkEventArgs e)
            {
                string repoFile=Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"GITHUB_REPOSITORY.txt");
                if(!File.Exists(repoFile))throw new InvalidDataException("Brak pliku GITHUB_REPOSITORY.txt. Zainstaluj najnowszą wersję z jednego pakietu serwisowego.");
                string repo=File.ReadAllText(repoFile).Trim();
                if(!String.Equals(repo,"naprawapclaptop1-dev/komputerowe-centrum-serwisu",StringComparison.OrdinalIgnoreCase))throw new InvalidDataException("Repozytorium aktualizacji nie jest przypisane do Komputerowego Centrum Serwisu.");
                string api="https://api.github.com/repos/"+repo+"/releases/tags/v"+ProgramVersion;
                HttpWebRequest request=(HttpWebRequest)WebRequest.Create(api);request.Method="GET";request.Timeout=20000;
                request.UserAgent="KomputeroweCentrumSerwisu/"+ProgramVersion;request.Accept="application/vnd.github+json";
                using(HttpWebResponse response=(HttpWebResponse)request.GetResponse())
                using(StreamReader reader=new StreamReader(response.GetResponseStream(),Encoding.UTF8))
                {
                    string json=reader.ReadToEnd();
                    string[] required={"KomputeroweCentrumSerwisu_FIX072_INSTALATOR.exe","KomputeroweCentrumSerwisu_FIX072_PORTABLE.exe","manifest-stable.xml","manifest-beta.xml","releases.json","SHA256SUMS.txt"};
                    List<string> missing=new List<string>();foreach(string name in required)if(json.IndexOf(name,StringComparison.OrdinalIgnoreCase)<0)missing.Add(name);
                    if(missing.Count>0)throw new InvalidDataException("W najnowszym wydaniu GitHub brakuje assetów: "+String.Join(", ",missing.ToArray()));
                    string tag=ReadJsonStringProperty(json,"tag_name");
                    if(!String.Equals(tag,"v"+ProgramVersion,StringComparison.OrdinalIgnoreCase))throw new InvalidDataException("GitHub zwrócił nieoczekiwany tag wydania: "+tag);
                    if(json.IndexOf("\"draft\": true",StringComparison.OrdinalIgnoreCase)>=0)throw new InvalidDataException("Wydanie v"+ProgramVersion+" nadal jest szkicem (draft).");
                    e.Result="GitHub API OK | repozytorium: "+repo+" | wydanie: "+tag+" | assety Stable/Beta i pakiety obecne.";
                }
            };
            updaterDiagnosticsWorker.RunWorkerCompleted+=delegate(object sender,RunWorkerCompletedEventArgs e)
            {
                if(e.Error!=null)
                {
                    string detail=DescribeGitHubFailure(e.Error);
                    updaterLastGitHubResult=detail;
                    bool httpsOk=detail.IndexOf("BRAK POŁĄCZENIA",StringComparison.OrdinalIgnoreCase)<0 && detail.IndexOf("NIE ROZPOZNAJE",StringComparison.OrdinalIgnoreCase)<0 && detail.IndexOf("BRAK DOSTĘPU",StringComparison.OrdinalIgnoreCase)<0;
                    SetUpdaterMetric(updaterHttpsMetricLabel,httpsOk?"HTTPS: OK":"HTTPS: BŁĄD",httpsOk,!httpsOk);
                    SetUpdaterMetric(updaterApiMetricLabel,"GITHUB API: NIEPOTWIERDZONE",false,true);
                    SetUpdaterMetric(updaterAssetsMetricLabel,"ASSETY: NIEPOTWIERDZONE",false,true);
                    SetUpdaterMetric(updaterManifestMetricLabel,"MANIFESTY: NIEPOTWIERDZONE",false,true);
                    if(updaterServerDiagLabel!=null){updaterServerDiagLabel.Text="DIAGNOSTYKA: "+detail;updaterServerDiagLabel.ForeColor=Color.FromArgb(255,187,101);}
                    if(updaterStatusLabel!=null)updaterStatusLabel.Text=detail;
                    AppendUpdaterHistory("Test GitHub","Błąd",detail);
                    AppendLog("Test GitHub: "+detail);
                }
                else
                {
                    string result=Convert.ToString(e.Result);updaterLastGitHubResult=result;
                    SetUpdaterMetric(updaterHttpsMetricLabel,"HTTPS: OK",true,false);
                    SetUpdaterMetric(updaterApiMetricLabel,"GITHUB API: OK",true,false);
                    SetUpdaterMetric(updaterAssetsMetricLabel,"ASSETY: OK",true,false);
                    SetUpdaterMetric(updaterManifestMetricLabel,"MANIFESTY + EXE: OK",true,false);
                    if(updaterServerDiagLabel!=null){updaterServerDiagLabel.Text="DIAGNOSTYKA: "+result;updaterServerDiagLabel.ForeColor=Color.FromArgb(76,224,169);}
                    if(updaterStatusLabel!=null)updaterStatusLabel.Text="GITHUB RELEASES — DZIAŁA";
                    AppendUpdaterHistory("Test GitHub","OK",result);
                }
            };
            updaterDiagnosticsWorker.RunWorkerAsync();
        }

        private string DescribeGitHubFailure(Exception exception)
        {
            Exception current=exception;
            while(current!=null)
            {
                InvalidDataException invalidData=current as InvalidDataException;
                if(invalidData!=null)return invalidData.Message;
                SocketException socket=current as SocketException;
                if(socket!=null && (socket.SocketErrorCode==SocketError.HostNotFound || socket.SocketErrorCode==SocketError.TryAgain || socket.SocketErrorCode==SocketError.NoData))
                    return "DNS NIE ROZPOZNAJE "+new Uri(OfficialUpdateBaseUrl).Host+" ("+socket.SocketErrorCode+"). Sprawdź połączenie DNS/Internet i spróbuj ponownie.";
                WebException web=current as WebException;
                if(web!=null)
                {
                    if(web.Status==WebExceptionStatus.NameResolutionFailure)
                        return "DNS NIE ROZPOZNAJE "+new Uri(OfficialUpdateBaseUrl).Host+". Sprawdź połączenie DNS/Internet i spróbuj ponownie.";
                    if(web.Status==WebExceptionStatus.ConnectFailure || web.Status==WebExceptionStatus.Timeout)
                        return "BRAK POŁĄCZENIA HTTPS Z GITHUB API — sprawdź dostęp do Internetu, zaporę i adres api.github.com.";
                    if(web.Status==WebExceptionStatus.ProtocolError)
                    {
                        HttpWebResponse response=web.Response as HttpWebResponse;
                        if(response!=null)
                        {
                            int status=(int)response.StatusCode;
                            if(status==503)return "GITHUB API HTTP 503 — usługa GitHub jest chwilowo niedostępna. Spróbuj ponownie później.";
                            if(status==404)return "BRAK WYDANIA v"+ProgramVersion+" LUB ASSETU AKTUALIZACJI. Sprawdź publiczny tag v"+ProgramVersion+" i jego pliki manifest-stable.xml / manifest-beta.xml.";
                            if(status==403)return "GITHUB HTTP 403 — limit zapytań API albo ograniczenie dostępu. Spróbuj ponownie później.";
                            return "GITHUB HTTP "+status+" — sprawdź publiczne repozytorium i dostęp do GitHub Releases.";
                        }
                        return "GITHUB API ODPOWIADA BŁĘDEM HTTP — sprawdź status GitHub i połączenie HTTPS.";
                    }
                }
                current=current.InnerException;
            }
            string message=exception==null?"Nieznany błąd.":exception.GetBaseException().Message;
            if(message.IndexOf("DNS NIE ROZPOZNAJE HOSTA",StringComparison.OrdinalIgnoreCase)>=0 ||
               message.IndexOf("NameResolutionFailure",StringComparison.OrdinalIgnoreCase)>=0 ||
               message.IndexOf("could not be resolved",StringComparison.OrdinalIgnoreCase)>=0 ||
               message.IndexOf("nie można rozpoznać nazwy",StringComparison.OrdinalIgnoreCase)>=0)
                return "BRAK DOSTĘPU DO "+new Uri(OfficialUpdateBaseUrl).Host+". Sprawdź DNS/Internet. Szczegóły: "+message;
            return "BŁĄD TESTU GITHUB RELEASES: "+message;
        }

        private void SetUpdaterStatus(string message,bool positive)
        {
            if(updaterStatusLabel!=null && !updaterStatusLabel.IsDisposed)
            {
                updaterStatusLabel.Text=message;
                updaterStatusLabel.ForeColor=positive?Color.FromArgb(91,218,184):Color.FromArgb(245,190,95);
            }
        }

        private void SetUpdaterProgress(int percent,string message)
        {
            if(updaterProgressBar!=null && !updaterProgressBar.IsDisposed)
                updaterProgressBar.Value=Math.Max(updaterProgressBar.Minimum,Math.Min(updaterProgressBar.Maximum,percent));
            if(updaterProgressLabel!=null && !updaterProgressLabel.IsDisposed)
                updaterProgressLabel.Text=message;
        }

        private AuthenticodeCheckResult GetAuthenticodeSignatureInfo(string filePath)
        {
            AuthenticodeCheckResult result=new AuthenticodeCheckResult();
            result.Status="Unknown";result.Message="Nie udało się uruchomić kontroli podpisu.";result.IsValid=false;
            try
            {
                string ps=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"WindowsPowerShell","v1.0","powershell.exe");
                if(!File.Exists(ps))ps="powershell.exe";
                string safe=(filePath??"").Replace("'","''");
                string command="$s=Get-AuthenticodeSignature -LiteralPath '"+safe+"'; $t=''; $sub=''; if($s.SignerCertificate){$t=$s.SignerCertificate.Thumbprint;$sub=$s.SignerCertificate.Subject}; Write-Output ('KCSAUTH'+[char]9+[string]$s.Status+[char]9+$t+[char]9+$sub)";
                ProcessStartInfo info=new ProcessStartInfo();info.FileName=ps;
                info.Arguments="-NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command \""+command+"\"";
                info.UseShellExecute=false;info.CreateNoWindow=true;info.RedirectStandardOutput=true;info.RedirectStandardError=true;
                using(Process process=Process.Start(info))
                {
                    if(process==null)throw new InvalidOperationException("Nie uruchomiono PowerShell do sprawdzenia podpisu.");
                    StringBuilder output=new StringBuilder();
                    StringBuilder error=new StringBuilder();
                    process.OutputDataReceived+=delegate(object sender,DataReceivedEventArgs args){if(args.Data!=null)lock(output)output.AppendLine(args.Data);};
                    process.ErrorDataReceived+=delegate(object sender,DataReceivedEventArgs args){if(args.Data!=null)lock(error)error.AppendLine(args.Data);};
                    process.BeginOutputReadLine();
                    process.BeginErrorReadLine();
                    if(!process.WaitForExit(15000))
                    {
                        try{process.Kill();}catch{}
                        try{process.WaitForExit(3000);}catch{}
                        throw new TimeoutException("Kontrola Authenticode przekroczyła 15 sekund.");
                    }
                    process.WaitForExit();
                    string outputText;string errorText;
                    lock(output)outputText=output.ToString();
                    lock(error)errorText=error.ToString();
                    string line="";foreach(string candidate in outputText.Split(new char[]{'\r','\n'},StringSplitOptions.RemoveEmptyEntries))if(candidate.StartsWith("KCSAUTH",StringComparison.Ordinal))line=candidate;
                    if(String.IsNullOrEmpty(line))throw new InvalidDataException("PowerShell nie zwrócił wyniku Authenticode: "+errorText);
                    string[] parts=line.Split(new char[]{'\t'},4);
                    result.Status=parts.Length>1?parts[1]:"Unknown";
                    result.Thumbprint=parts.Length>2?parts[2].Replace(" ","").ToUpperInvariant():"";
                    result.Subject=parts.Length>3?parts[3]:"";
                    result.IsValid=String.Equals(result.Status,"Valid",StringComparison.OrdinalIgnoreCase);
                    result.Message=result.IsValid?"Podpis Authenticode jest prawidłowy.":"Status Authenticode: "+result.Status;
                }
            }
            catch(Exception ex){result.Status="Error";result.Message=ex.GetBaseException().Message;result.IsValid=false;}
            return result;
        }

        private string ReadJsonStringProperty(string json,string property)
        {
            Match m=Regex.Match(json??"","\""+Regex.Escape(property)+"\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"",RegexOptions.Singleline);
            if(!m.Success)return "";
            string value=m.Groups[1].Value;
            value=value.Replace("\\\"","\"").Replace("\\n","\n").Replace("\\r","\r").Replace("\\t","\t").Replace("\\/","/").Replace("\\\\","\\");
            return value;
        }

        private void LoadUpdateReleaseCatalog()
        {
            if(updaterCatalogWorker!=null && updaterCatalogWorker.IsBusy)return;
            updaterCatalogWorker=new BackgroundWorker();
            updaterCatalogWorker.DoWork+=delegate(object sender,DoWorkEventArgs e)
            {
                using(UpdateWebClient client=new UpdateWebClient())
                {
                    client.TimeoutMilliseconds=20000;
                    e.Result=client.DownloadString(GetOfficialReleaseCatalogUrl());
                }
            };
            updaterCatalogWorker.RunWorkerCompleted+=delegate(object sender,RunWorkerCompletedEventArgs e)
            {
                if(e.Error!=null)
                {
                    if(updaterReleaseDetailsBox!=null)updaterReleaseDetailsBox.Text="Katalog niedostępny. Sprawdź publiczne wydanie GitHub Releases i plik releases.json.\r\n"+e.Error.GetBaseException().Message;
                    AppendUpdaterHistory("Katalog wydań","Niedostępny",e.Error.GetBaseException().Message);
                    return;
                }
                List<ReleaseCatalogEntry> entries=new List<ReleaseCatalogEntry>();
                try
                {
                string json=Convert.ToString(e.Result);
                JavaScriptSerializer serializer=new JavaScriptSerializer();
                object parsedCatalog=serializer.DeserializeObject(json);
                ArrayList catalogArray=parsedCatalog as ArrayList;
                if(catalogArray==null)throw new InvalidDataException("Katalog releases.json musi być tablicą wpisów wydań.");
                if(catalogArray.Count>100)throw new InvalidDataException("Katalog zawiera więcej niż 100 wpisów. Odrzucono nieoczekiwanie duży katalog.");
                foreach(object rawEntry in catalogArray)
                {
                    Dictionary<string,object> item=rawEntry as Dictionary<string,object>;
                    if(item==null)continue;
                    ReleaseCatalogEntry entry=new ReleaseCatalogEntry();
                    object field=null;
                    if(item.TryGetValue("version",out field))entry.Version=Convert.ToString(field);
                    if(item.TryGetValue("channel",out field))entry.Channel=Convert.ToString(field);
                    if(item.TryGetValue("publishedUtc",out field))entry.PublishedUtc=Convert.ToString(field);
                    if(item.TryGetValue("notes",out field))entry.Notes=Convert.ToString(field);
                    if(item.TryGetValue("packageUrl",out field))entry.PackageUrl=Convert.ToString(field);
                    if(item.TryGetValue("sha256",out field))entry.Sha256=Convert.ToString(field);
                    if(item.TryGetValue("signerThumbprint",out field))entry.SignerThumbprint=Convert.ToString(field);
                    if(item.TryGetValue("signatureStatus",out field))entry.SignatureStatus=Convert.ToString(field);
                    if(item.TryGetValue("sizeBytes",out field))
                    {
                        try{entry.SizeBytes=Convert.ToInt64(field,CultureInfo.InvariantCulture);}catch{entry.SizeBytes=0;}
                    }
                    Version parsedVersion;Uri packageUri;
                    bool validSigner=String.IsNullOrWhiteSpace(entry.SignerThumbprint) || Regex.IsMatch(entry.SignerThumbprint.Replace(" ",""),"^[0-9a-fA-F]{40}$");
                    bool validPackage=Uri.TryCreate(entry.PackageUrl,UriKind.Absolute,out packageUri) &&
                        IsTrustedGitHubAssetUrl(entry.PackageUrl) &&
                        packageUri.AbsolutePath.EndsWith(".exe",StringComparison.OrdinalIgnoreCase);
                    if(Version.TryParse(entry.Version,out parsedVersion) &&
                       (String.Equals(entry.Channel,"stable",StringComparison.OrdinalIgnoreCase) || String.Equals(entry.Channel,"beta",StringComparison.OrdinalIgnoreCase)) &&
                       Regex.IsMatch(entry.Sha256??"","^[0-9a-fA-F]{64}$") && validSigner &&
                       validPackage && IsSafeHttpsUpdateUrl(entry.PackageUrl))
                        entries.Add(entry);
                }
                }
                catch(Exception parseError)
                {
                    if(updaterReleaseDetailsBox!=null)updaterReleaseDetailsBox.Text="Katalog wydań ma nieprawidłowy format lub nie przeszedł kontroli bezpieczeństwa.\r\n"+parseError.GetBaseException().Message;
                    AppendUpdaterHistory("Katalog wydań","Błąd formatu",parseError.GetBaseException().Message);
                    return;
                }
                updaterReleaseCatalogEntries=entries;
                if(updaterReleaseCatalogList!=null)
                {
                    updaterReleaseCatalogList.BeginUpdate();
                    updaterReleaseCatalogList.Items.Clear();
                    foreach(ReleaseCatalogEntry entry in updaterReleaseCatalogEntries)
                        updaterReleaseCatalogList.Items.Add(entry.Version+" | "+entry.Channel.ToUpperInvariant()+" | "+entry.PublishedUtc);
                    updaterReleaseCatalogList.EndUpdate();
                    if(updaterReleaseCatalogList.Items.Count>0)updaterReleaseCatalogList.SelectedIndex=0;
                }
                if(updaterReleaseDetailsBox!=null)updaterReleaseDetailsBox.Text="Liczba wydań: "+entries.Count+"\r\nŹródło: "+GetOfficialReleaseCatalogUrl()+"\r\nKanały: Stable / Beta\r\nWybierz wydanie, aby zobaczyć szczegóły i pobrać konkretny pakiet.";
                AppendUpdaterHistory("Katalog wydań","OK","Pobrano wpisów: "+entries.Count);
            };
            updaterCatalogWorker.RunWorkerAsync();
        }

        private void ShowSelectedReleaseCatalogDetails()
        {
            if(updaterReleaseCatalogList==null || updaterReleaseDetailsBox==null)return;
            int index=updaterReleaseCatalogList.SelectedIndex;
            if(index<0 || index>=updaterReleaseCatalogEntries.Count)return;
            ReleaseCatalogEntry entry=updaterReleaseCatalogEntries[index];
            updaterReleaseDetailsBox.Text="WERSJA: "+entry.Version+"\r\n"+
                "KANAŁ: "+entry.Channel.ToUpperInvariant()+"\r\n"+
                "DATA UTC: "+entry.PublishedUtc+"\r\n"+
                "ROZMIAR: "+(entry.SizeBytes>0?(entry.SizeBytes/1048576.0).ToString("0.00",CultureInfo.InvariantCulture)+" MB":"nieznany")+"\r\n"+
                "PODPIS: "+(String.IsNullOrEmpty(entry.SignatureStatus)?"nie podano":entry.SignatureStatus)+"\r\n"+
                "CERTYFIKAT: "+(String.IsNullOrEmpty(entry.SignerThumbprint)?"nie przypięto":entry.SignerThumbprint)+"\r\n"+
                "SHA-256: "+entry.Sha256+"\r\n"+
                "OPIS: "+entry.Notes+"\r\n"+
                "PAKIET: "+entry.PackageUrl;
        }

        private void DownloadSelectedCatalogRelease()
        {
            if(updaterReleaseCatalogList==null || updaterReleaseCatalogList.SelectedIndex<0 ||
               updaterReleaseCatalogList.SelectedIndex>=updaterReleaseCatalogEntries.Count)
            {MessageBox.Show("Najpierw wybierz wydanie z katalogu.","Katalog wydań",MessageBoxButtons.OK,MessageBoxIcon.Information);return;}
            ReleaseCatalogEntry entry=updaterReleaseCatalogEntries[updaterReleaseCatalogList.SelectedIndex];
            Uri packageUri;
            if(!Uri.TryCreate(entry.PackageUrl,UriKind.Absolute,out packageUri) ||
               !IsSafeHttpsUpdateUrl(entry.PackageUrl) ||
               !IsTrustedGitHubAssetUrl(entry.PackageUrl) ||
               !packageUri.AbsolutePath.EndsWith(".exe",StringComparison.OrdinalIgnoreCase) ||
               !Regex.IsMatch(entry.Sha256??"","^[0-9a-fA-F]{64}$"))
            {MessageBox.Show("Wybrane wydanie ma nieprawidłowy adres lub SHA-256. Nie zostanie pobrane.","Nieprawidłowy wpis katalogu",MessageBoxButtons.OK,MessageBoxIcon.Error);return;}
            Version parsed;if(!Version.TryParse(entry.Version,out parsed))return;
            pendingUpdateVersion=entry.Version;pendingUpdateUrl=entry.PackageUrl;pendingUpdateSha=entry.Sha256;
            pendingUpdateSignerThumbprint=(entry.SignerThumbprint??"").Replace(" ","").ToUpperInvariant();
            pendingUpdateNotes=entry.Notes;pendingUpdateChannel=entry.Channel;pendingUpdateFeed=GetOfficialReleaseCatalogUrl();
            pendingUpdateRegion="global";pendingUpdateLanguage="all";pendingUpdateMirrors.Clear();pendingUpdateAvailable=true;
            SetUpdaterStatus("WYBRANO WYDANIE "+entry.Version+" — pobieranie wymaga potwierdzenia.",true);
            if(updaterResultBox!=null)updaterResultBox.Text="Wybrane wydanie z katalogu:\r\n"+entry.Version+" / "+entry.Channel.ToUpperInvariant()+"\r\n"+entry.Notes+"\r\nSHA-256: "+entry.Sha256+"\r\nPakiet: "+entry.PackageUrl;
            DownloadProgramUpdate(false);
        }

        private string BuildUpdaterDiagnosticReport()
        {
            StringBuilder b=new StringBuilder();
            b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — RAPORT AKTUALIZATORA");
            b.AppendLine("Data: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
            b.AppendLine("Program: "+ProgramVersion+" | Kanał: "+(updaterChannelBox!=null && updaterChannelBox.SelectedIndex==1?"Beta":"Stable"));
            b.AppendLine("System: "+GetOsCaption()+" | Architektura: "+(IntPtr.Size==8?"x64":"x86"));
            b.AppendLine("Region: "+DetectUpdaterRegion()+" | Język: "+DetectUpdaterLanguage());
            b.AppendLine("Manifest: "+GetOfficialUpdateManifestUrl());
            b.AppendLine("Katalog: "+GetOfficialReleaseCatalogUrl());
            b.AppendLine("GitHub Releases: "+updaterLastGitHubResult);
            b.AppendLine("Authenticode: "+updaterLastSignatureStatus);
            b.AppendLine("Maks. prędkość KB/s: "+(updaterSpeedLimitBox==null?updaterMaxSpeedKBps:(int)updaterSpeedLimitBox.Value));
            b.AppendLine("Częstotliwość godzin: "+(updaterIntervalBox==null?updaterCheckIntervalHours:(int)updaterIntervalBox.Value));
            b.AppendLine("Wykryta aktualizacja: "+(pendingUpdateAvailable?pendingUpdateVersion:"brak / niepotwierdzona"));
            b.AppendLine("SHA-256 oczekiwany: "+(String.IsNullOrEmpty(pendingUpdateSha)?"brak":pendingUpdateSha));
            b.AppendLine("Podpis przypięty w manifeście: "+(String.IsNullOrEmpty(pendingUpdateSignerThumbprint)?"nie podano":pendingUpdateSignerThumbprint));
            b.AppendLine("Najnowsza kopia rollback: "+(HasRollbackSnapshot()?GetLatestRollbackSnapshot():"brak"));
            b.AppendLine();b.AppendLine("Diagnoza nie zawiera haseł ani tokenów GitHub.");
            return b.ToString();
        }

        private void ExportUpdaterDiagnosticReport()
        {
            try
            {
                string folder=Path.Combine(dataRoot,"GlobalUpdates","Diagnostics");Directory.CreateDirectory(folder);
                string path=Path.Combine(folder,"Updater_Diagnostics_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".txt");
                File.WriteAllText(path,BuildUpdaterDiagnosticReport(),new UTF8Encoding(true));
                AppendUpdaterHistory("Diagnostyka","Zapisano",path);
                MessageBox.Show("Zapisano raport diagnostyczny:\r\n"+path,"Raport aktualizatora",MessageBoxButtons.OK,MessageBoxIcon.Information);
                try{Process.Start("explorer.exe","/select,\""+path+"\"");}catch{}
            }
            catch(Exception ex){MessageBox.Show("Nie zapisano raportu: "+ex.Message);}
        }

        private void CopyUpdaterDiagnosticReport()
        {
            try{Clipboard.SetText(BuildUpdaterDiagnosticReport());SetUpdaterStatus("Raport diagnostyczny skopiowany do schowka.",true);}
            catch(Exception ex){MessageBox.Show("Nie skopiowano raportu: "+ex.Message);}
        }

        private void CheckCurrentProgramAuthenticode()
        {
            AuthenticodeCheckResult result=GetAuthenticodeSignatureInfo(Application.ExecutablePath);
            updaterLastSignatureStatus=result.Status+" | "+result.Thumbprint+" | "+result.Subject+" | "+result.Message;
            SetUpdaterMetric(updaterSecurityMetricLabel,"PODPIS: "+result.Status.ToUpperInvariant(),result.IsValid,!result.IsValid);
            SetUpdaterStatus("Kontrola podpisu aplikacji: "+updaterLastSignatureStatus,result.IsValid);
            AppendUpdaterHistory("Authenticode",result.Status,updaterLastSignatureStatus);
        }

        private string GetLatestRollbackSnapshot()
        {
            string rootFolder=Path.Combine(dataRoot,"GlobalUpdates","SettingsBackups");
            if(!Directory.Exists(rootFolder))return "";
            string[] dirs=Directory.GetDirectories(rootFolder);Array.Sort(dirs,StringComparer.OrdinalIgnoreCase);
            for(int i=dirs.Length-1;i>=0;i--)
            {
                string candidate=Path.Combine(dirs[i],"PreviousApplication");
                if(Directory.Exists(candidate) && File.Exists(Path.Combine(candidate,"rollback-files.txt")) && File.Exists(Path.Combine(candidate,"RestorePreviousVersion.ps1")))return candidate;
            }
            return "";
        }

        private bool HasRollbackSnapshot(){return !String.IsNullOrEmpty(GetLatestRollbackSnapshot());}

        private void StartRollbackToPreviousVersion()
        {
            string snapshot=GetLatestRollbackSnapshot();
            if(String.IsNullOrEmpty(snapshot)){MessageBox.Show("Nie znaleziono kopii poprzedniej wersji programu. Wykonaj kopię przed aktualizacją.","Brak kopii",MessageBoxButtons.OK,MessageBoxIcon.Information);return;}
            string exe=Application.ExecutablePath;string oldVersion="nieznana";
            try{oldVersion=FileVersionInfo.GetVersionInfo(Path.Combine(snapshot,Path.GetFileName(exe))).FileVersion;}catch{}
            if(MessageBox.Show("Cofnąć pliki aplikacji do wersji "+oldVersion+"?\r\n\r\nProgram zamknie się, Windows poprosi o UAC, a skrypt odtworzy pliki z kopii po sprawdzeniu SHA-256. Ustawienia użytkownika zostaną zachowane.","Cofnięcie wersji",MessageBoxButtons.YesNo,MessageBoxIcon.Warning,MessageBoxDefaultButton.Button2)!=DialogResult.Yes)return;
            try
            {
                string script=Path.Combine(snapshot,"RestorePreviousVersion.ps1");
                string target=Path.GetDirectoryName(exe);string ps=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"WindowsPowerShell","v1.0","powershell.exe");
                if(!File.Exists(ps))ps="powershell.exe";
                ProcessStartInfo info=new ProcessStartInfo();info.FileName=ps;
                info.Arguments="-NoProfile -ExecutionPolicy Bypass -File \""+script+"\" -TargetPid "+Process.GetCurrentProcess().Id+" -BackupDir \""+snapshot+"\" -TargetDir \""+target+"\" -ExeName \""+Path.GetFileName(exe)+"\"";
                info.UseShellExecute=true;info.Verb="runas";info.WorkingDirectory=snapshot;Process.Start(info);
                AppendUpdaterHistory("Rollback","Uruchomiono","Przywracanie plików aplikacji z "+snapshot);
                isExitingFromTray=true;BeginInvoke((MethodInvoker)delegate{Close();});
            }
            catch(Exception ex){SetUpdaterStatus("Nie uruchomiono cofania: "+ex.Message,false);MessageBox.Show("Nie uruchomiono cofania wersji:\r\n"+ex.Message);}
        }

        private void AppendUpdaterHistory(string action,string result,string details)
        {
            try
            {
                string folder=Path.GetDirectoryName(updaterHistoryPath);
                if(!Directory.Exists(folder))Directory.CreateDirectory(folder);
                XmlDocument d=new XmlDocument();d.XmlResolver=null;
                if(File.Exists(updaterHistoryPath))d.Load(updaterHistoryPath);
                else {XmlElement r=d.CreateElement("UpdateHistory");d.AppendChild(r);}
                XmlElement item=d.CreateElement("Event");
                item.SetAttribute("date",DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
                item.SetAttribute("action",action??"");item.SetAttribute("result",result??"");
                item.InnerText=details??"";
                d.DocumentElement.AppendChild(item);
                while(d.DocumentElement.SelectNodes("Event").Count>200)
                    d.DocumentElement.RemoveChild(d.DocumentElement.FirstChild);
                SaveXmlSafely(d,updaterHistoryPath,8);
                LoadUpdaterHistory();
            }
            catch(Exception ex){AppendLog("Nie zapisano historii aktualizacji: "+ex.Message);}
        }

        private void LoadUpdaterHistory()
        {
            if(updaterHistoryList==null || updaterHistoryList.IsDisposed || String.IsNullOrEmpty(updaterHistoryPath))return;
            updaterHistoryList.Items.Clear();
            try
            {
                if(!File.Exists(updaterHistoryPath))return;
                XmlDocument d=new XmlDocument();d.XmlResolver=null;d.Load(updaterHistoryPath);
                foreach(XmlNode item in d.SelectNodes("/UpdateHistory/Event"))
                {
                    string date=item.Attributes["date"]==null?"":item.Attributes["date"].Value;
                    string action=item.Attributes["action"]==null?"":item.Attributes["action"].Value;
                    string result=item.Attributes["result"]==null?"":item.Attributes["result"].Value;
                    bool legacyHost=(item.InnerText??"").IndexOf("naprawapclaptop.pl/updates/",StringComparison.OrdinalIgnoreCase)>=0;
                    string marker=legacyHost?"[ARCHIWUM — STARY SERWER] ":"";
                    updaterHistoryList.Items.Add(marker+date+" | "+action+" | "+result+" | "+item.InnerText);
                }
            }
            catch(Exception ex){AppendLog("Nie wczytano historii aktualizacji: "+ex.Message);}
        }

        private void ClearArchivedUpdaterHistory()
        {
            try
            {
                if(String.IsNullOrEmpty(updaterHistoryPath) || !File.Exists(updaterHistoryPath))
                {
                    MessageBox.Show("Nie ma zapisanych starszych wpisów do usunięcia.","Historia aktualizacji",MessageBoxButtons.OK,MessageBoxIcon.Information);
                    return;
                }
                XmlDocument d=new XmlDocument();d.XmlResolver=null;d.Load(updaterHistoryPath);
                XmlNode root=d.SelectSingleNode("/UpdateHistory");
                if(root==null)return;
                List<XmlNode> archived=new List<XmlNode>();
                foreach(XmlNode item in root.SelectNodes("Event"))
                {
                    if((item.InnerText??"").IndexOf("naprawapclaptop.pl/updates/",StringComparison.OrdinalIgnoreCase)>=0)
                        archived.Add(item);
                }
                if(archived.Count==0)
                {
                    MessageBox.Show("Nie znaleziono wpisów starego serwera. Bieżące wpisy GitHub pozostają bez zmian.","Historia aktualizacji",MessageBoxButtons.OK,MessageBoxIcon.Information);
                    return;
                }
                if(MessageBox.Show("Usunąć "+archived.Count+" archiwalnych wpisów poprzedniego serwera naprawapclaptop.pl?\r\n\r\nBieżące wpisy GitHub zostaną zachowane.","Czyszczenie archiwalnych wpisów",MessageBoxButtons.YesNo,MessageBoxIcon.Question,MessageBoxDefaultButton.Button2)!=DialogResult.Yes)return;

                foreach(XmlNode item in archived)root.RemoveChild(item);
                SaveXmlSafely(d,updaterHistoryPath,8);
                LoadUpdaterHistory();
                AppendUpdaterHistory("Historia","Oczyszczono archiwum","Usunięto "+archived.Count+" wpisów starego serwera; bieżąca historia GitHub została zachowana.");
            }
            catch(Exception ex){MessageBox.Show("Nie udało się oczyścić archiwalnych wpisów: "+ex.Message,"Historia aktualizacji",MessageBoxButtons.OK,MessageBoxIcon.Warning);}
        }

        private void OpenGlobalUpdateGuide()
        {
            string path=Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"GLOBAL_UPDATE_DEPLOYMENT.txt");
            if(File.Exists(path)){try{Process.Start("notepad.exe","\""+path+"\"");}catch{}}
            else MessageBox.Show("Nie znaleziono instrukcji publikacji: "+path);
        }

        private void OpenGlobalUpdateDeploymentFolder()
        {
            string path=Path.Combine(dataRoot,"GlobalUpdateDeployment");
            try{Directory.CreateDirectory(path);Process.Start("explorer.exe","\""+path+"\"");}
            catch(Exception ex){MessageBox.Show("Nie można otworzyć katalogu publikacji: "+ex.Message);}
        }

        private void OpenGlobalUpdatesFolder()
        {
            string path=Path.Combine(dataRoot,"GlobalUpdates");
            try{Directory.CreateDirectory(path);Process.Start("explorer.exe","\""+path+"\"");}
            catch(Exception ex){MessageBox.Show("Nie można otworzyć katalogu pobrań: "+ex.Message);}
        }

        private void OpenReadyUpdatePackage(string path)
        {
            if(String.IsNullOrEmpty(path) || !File.Exists(path))return;
            try{Process.Start("explorer.exe","/select,\""+path+"\"");}
            catch(Exception ex){MessageBox.Show("Pakiet został pobrany, ale nie można otworzyć folderu: "+ex.Message);}
        }

        private bool IsSafeHttpsUpdateUrl(string value)
        {
            Uri uri;
            if(String.IsNullOrWhiteSpace(value) || !Uri.TryCreate(value.Trim(),UriKind.Absolute,out uri))return false;
            return uri.Scheme==Uri.UriSchemeHttps && String.IsNullOrEmpty(uri.UserInfo) && !uri.IsLoopback;
        }

        private string DetectUpdaterRegion()
        {
            string country="";
            try{country=RegionInfo.CurrentRegion.TwoLetterISORegionName.ToUpperInvariant();}catch{}
            string[] north={"US","CA","MX","GL","GT","BZ","HN","SV","NI","CR","PA","CU","JM","HT","DO","BS","BB","TT","LC","GD","AG","DM","KN","VC"};
            string[] south={"AR","BO","BR","CL","CO","EC","GY","PY","PE","SR","UY","VE","GF"};
            string[] middle={"AE","SA","QA","KW","BH","OM","YE","IR","IQ","JO","LB","SY","IL","PS"};
            string[] africa={"DZ","EG","LY","MA","TN","AO","BJ","BW","BF","BI","CM","CV","CF","TD","KM","CG","CD","CI","DJ","GQ","ER","ET","GA","GM","GH","GN","GW","KE","LS","LR","MG","MW","ML","MR","MU","MZ","NA","NE","NG","RW","ST","SN","SC","SL","SO","ZA","SS","SD","SZ","TZ","TG","UG","ZM","ZW"};
            string[] asia={"CN","JP","KR","IN","AU","NZ","SG","HK","TW","TH","VN","MY","ID","PH","PK","BD","LK","NP","MM","KH","LA","BN","MN","FJ","PG"};
            string[] europe={"PL","DE","FR","IT","ES","PT","NL","BE","LU","AT","CH","GB","IE","DK","SE","NO","FI","IS","EE","LV","LT","CZ","SK","HU","SI","HR","RO","BG","GR","CY","MT","UA","RS","BA","ME","MK","AL","MD","BY","RU","XK"};
            if(Array.IndexOf(north,country)>=0)return "Ameryka Północna";
            if(Array.IndexOf(south,country)>=0)return "Ameryka Południowa";
            if(Array.IndexOf(middle,country)>=0)return "Bliski Wschód";
            if(Array.IndexOf(africa,country)>=0)return "Afryka";
            if(Array.IndexOf(asia,country)>=0)return "Azja i Pacyfik";
            if(Array.IndexOf(europe,country)>=0)return "Europa";
            return "Globalny";
        }

        private string DetectUpdaterLanguage()
        {
            try{return CultureInfo.CurrentUICulture.TwoLetterISOLanguageName.ToLowerInvariant();}
            catch{return "en";}
        }

        private string SelectedUpdaterRegion()
        {
            return DetectUpdaterRegion();
        }

        private string RegionKey(string region)
        {
            switch(region)
            {
                case "Europa":return "europe";
                case "Ameryka Północna":return "north-america";
                case "Ameryka Południowa":return "south-america";
                case "Azja i Pacyfik":return "asia-pacific";
                case "Afryka":return "africa";
                case "Bliski Wschód":return "middle-east";
                case "Globalny":return "global";
                default:return "global";
            }
        }

        private string SelectedUpdaterLanguage()
        {
            return DetectUpdaterLanguage();
        }

        private bool ContainsUpdateUrl(List<string> urls,string value)
        {
            if(urls==null)return false;
            foreach(string item in urls)
                if(String.Equals(item,value,StringComparison.OrdinalIgnoreCase))return true;
            return false;
        }

        private List<string> SplitUpdateUrls(string text)
        {
            List<string> result=new List<string>();
            if(String.IsNullOrWhiteSpace(text))return result;
            string[] lines=text.Split(new char[]{'\r','\n',';','|'},StringSplitOptions.RemoveEmptyEntries);
            foreach(string line in lines)
            {
                string value=line.Trim();
                if(IsSafeHttpsUpdateUrl(value) && !ContainsUpdateUrl(result,value))result.Add(value);
            }
            return result;
        }

        private bool ManifestValueMatches(string manifestValue,string wanted)
        {
            if(String.IsNullOrWhiteSpace(manifestValue) || manifestValue.Equals("global",StringComparison.OrdinalIgnoreCase) ||
               manifestValue.Equals("all",StringComparison.OrdinalIgnoreCase) || manifestValue=="*")return true;
            string[] values=manifestValue.Split(new char[]{',',';','|',' '},StringSplitOptions.RemoveEmptyEntries);
            foreach(string v in values)if(v.Equals(wanted,StringComparison.OrdinalIgnoreCase))return true;
            return false;
        }

        private UpdateFeedResult ParseGlobalUpdateManifest(string xml,UpdateJob job,string feedUrl)
        {
            XmlDocument d=new XmlDocument();d.XmlResolver=null;
            XmlReaderSettings settings=new XmlReaderSettings();settings.DtdProcessing=DtdProcessing.Prohibit;settings.XmlResolver=null;
            using(StringReader sr=new StringReader(xml))
            using(XmlReader xr=XmlReader.Create(sr,settings)){d.Load(xr);}
            XmlElement el=d.DocumentElement;
            if(el==null || !el.Name.Equals("Update",StringComparison.OrdinalIgnoreCase))throw new InvalidDataException("Nieprawidłowy korzeń manifestu. Oczekiwano elementu Update.");
            UpdateFeedResult u=new UpdateFeedResult();
            u.Version=el.GetAttribute("version");
            u.Url=el.GetAttribute("packageUrl");
            u.Sha256=el.GetAttribute("sha256");
            u.SignerThumbprint=(el.GetAttribute("signerThumbprint")??"").Replace(" ","").ToUpperInvariant();
            u.Notes="";u.SourceFeed=feedUrl;
            u.Region=el.GetAttribute("region");u.Language=el.GetAttribute("language");
            u.Architecture=el.GetAttribute("architecture");u.Channel=el.GetAttribute("channel");
            Version remote,current;
            if(!Version.TryParse(u.Version,out remote))throw new InvalidDataException("Manifest zawiera nieprawidłową wersję.");
            if(!Version.TryParse(ProgramVersion,out current))throw new InvalidDataException("Bieżąca wersja aplikacji jest nieprawidłowa.");
            if(!IsSafeHttpsUpdateUrl(u.Url))throw new InvalidDataException("Adres pakietu musi być poprawnym adresem HTTPS bez danych logowania.");
            Uri packageUri;
            if(!Uri.TryCreate(u.Url,UriKind.Absolute,out packageUri) ||
               !packageUri.AbsolutePath.EndsWith(".exe",StringComparison.OrdinalIgnoreCase))
                throw new InvalidDataException("Aktualizacja aplikacji musi wskazywać instalator Windows EXE.");
            if(!IsTrustedGitHubAssetUrl(u.Url))
                throw new InvalidDataException("Instalator musi pochodzić z zaufanych zasobów GitHub Releases. Inne adresy są odrzucane.");
            if(!Regex.IsMatch(u.Sha256??"","^[0-9a-fA-F]{64}$"))throw new InvalidDataException("SHA-256 manifestu musi zawierać dokładnie 64 znaki szesnastkowe.");
            if(!String.IsNullOrWhiteSpace(u.SignerThumbprint) && !Regex.IsMatch(u.SignerThumbprint,"^[0-9A-F]{40}$"))
                throw new InvalidDataException("Manifest zawiera nieprawidłowy odcisk certyfikatu Authenticode. Oczekiwano 40 znaków szesnastkowych.");
            if(!String.IsNullOrWhiteSpace(u.Channel) && !u.Channel.Equals(job.ChannelKey,StringComparison.OrdinalIgnoreCase))
                throw new InvalidDataException("Manifest jest przeznaczony dla innego kanału: "+u.Channel);
            string requestedRegion=RegionKey(job.Region);
            if(!ManifestValueMatches(u.Region,requestedRegion))throw new InvalidDataException("Manifest nie jest przeznaczony dla regionu "+job.Region+".");
            if(!ManifestValueMatches(u.Language,job.Language))throw new InvalidDataException("Manifest nie jest przeznaczony dla języka "+job.Language+".");
            string arch=IntPtr.Size==8?"x64":"x86";
            if(!String.IsNullOrWhiteSpace(u.Architecture) && !u.Architecture.Equals("any",StringComparison.OrdinalIgnoreCase) &&
               !u.Architecture.Equals(arch,StringComparison.OrdinalIgnoreCase))
                throw new InvalidDataException("Manifest jest przeznaczony dla innej architektury: "+u.Architecture);

            XmlNode note=d.SelectSingleNode("/Update/Notes");
            if(note!=null)
            {
                string noteLang=note.Attributes["lang"]==null?"all":note.Attributes["lang"].Value;
                if(noteLang.Equals(job.Language,StringComparison.OrdinalIgnoreCase) || noteLang.Equals("all",StringComparison.OrdinalIgnoreCase))
                    u.Notes=note.InnerText;
                else
                {
                    XmlNode fallback=d.SelectSingleNode("/Update/Notes[@lang='all']");
                    if(fallback!=null)u.Notes=fallback.InnerText;
                }
            }
            XmlNodeList mirrorNodes=d.SelectNodes("/Update/Mirrors/Url");
            foreach(XmlNode n in mirrorNodes)
            {
                string mirror=n.InnerText.Trim();
                if(IsSafeHttpsUpdateUrl(mirror) && !ContainsUpdateUrl(u.Mirrors,mirror))u.Mirrors.Add(mirror);
            }
            u.IsNew=remote>current;
            return u;
        }


        private void ApplyUpdaterSchedule()
        {
            updaterCheckIntervalHours=Math.Max(1,Math.Min(24,updaterIntervalBox==null?updaterCheckIntervalHours:(int)updaterIntervalBox.Value));
            updaterMaxSpeedKBps=Math.Max(0,Math.Min(500000,updaterSpeedLimitBox==null?updaterMaxSpeedKBps:(int)updaterSpeedLimitBox.Value));
            if(updaterAutoTimer!=null)updaterAutoTimer.Interval=updaterCheckIntervalHours*60*60*1000;
        }

        private void SaveUpdaterSettings()
        {
            try
            {
                XmlDocument d=new XmlDocument();
                XmlElement root=d.CreateElement("UpdateChannels");d.AppendChild(root);
                XmlElement stable=d.CreateElement("Stable");stable.InnerText=OfficialUpdateBaseUrl+"manifest-stable.xml";root.AppendChild(stable);
                XmlElement beta=d.CreateElement("Beta");beta.InnerText=OfficialUpdateBaseUrl+"manifest-beta.xml";root.AppendChild(beta);
                XmlElement region=d.CreateElement("Region");region.InnerText="Automatyczny (wykryj region)";root.AppendChild(region);
                XmlElement language=d.CreateElement("Language");language.InnerText="Automatyczny";root.AppendChild(language);
                XmlElement channel=d.CreateElement("Channel");channel.InnerText=updaterChannelBox!=null && updaterChannelBox.SelectedIndex==1?"beta":"stable";root.AppendChild(channel);
                XmlElement auto=d.CreateElement("AutoCheck");auto.InnerText=updaterAutoCheckBox!=null && updaterAutoCheckBox.Checked?"true":"false";root.AppendChild(auto);
                XmlElement autoDownload=d.CreateElement("AutoDownload");autoDownload.InnerText=updaterAutoDownloadBox!=null && updaterAutoDownloadBox.Checked?"true":"false";root.AppendChild(autoDownload);
                XmlElement autoInstall=d.CreateElement("AutoInstall");autoInstall.InnerText=updaterAutoInstallBox!=null && updaterAutoInstallBox.Checked?"true":"false";root.AppendChild(autoInstall);
                updaterMaxSpeedKBps=updaterSpeedLimitBox==null?updaterMaxSpeedKBps:(int)updaterSpeedLimitBox.Value;
                updaterCheckIntervalHours=updaterIntervalBox==null?updaterCheckIntervalHours:(int)updaterIntervalBox.Value;
                XmlElement speed=d.CreateElement("MaxSpeedKBps");speed.InnerText=updaterMaxSpeedKBps.ToString(CultureInfo.InvariantCulture);root.AppendChild(speed);
                XmlElement interval=d.CreateElement("CheckIntervalHours");interval.InnerText=updaterCheckIntervalHours.ToString(CultureInfo.InvariantCulture);root.AppendChild(interval);

                string dir=Path.GetDirectoryName(updaterSettingsPath);
                if(!Directory.Exists(dir))Directory.CreateDirectory(dir);
                SaveXmlSafely(d,updaterSettingsPath,8);

                savedProgramChannel=updaterChannelBox!=null && updaterChannelBox.SelectedIndex==1?"Beta / wersja testowa":"Stable / wersja normalna";
                ApplyUpdaterSchedule();
                SaveConfig();
                if(updaterResultBox!=null)
                    updaterResultBox.Text="Ustawienia automatyczne zapisane.\r\n"
                        +"Serwer: "+OfficialUpdateBaseUrl+"\r\n"
                        +"Kanał: "+(updaterChannelBox==null?"Stable":updaterChannelBox.Text)+"\r\n"
                        +"Region i język: wykrywane z systemu Windows.\r\n"
                        +"Automatyczne sprawdzanie: "+(updaterAutoCheckBox!=null && updaterAutoCheckBox.Checked?"włączone":"wyłączone")+" — co "+updaterCheckIntervalHours+" godz.\r\n"
                        +"Limit pobierania: "+(updaterMaxSpeedKBps<=0?"bez limitu":updaterMaxSpeedKBps+" KB/s")+"\r\n"
                        +"Automatyczne pobieranie: "+(updaterAutoDownloadBox!=null && updaterAutoDownloadBox.Checked?"włączone":"wyłączone")+"\r\n"
                        +"Automatyczna instalacja: "+(updaterAutoInstallBox!=null && updaterAutoInstallBox.Checked?"włączona — UAC nadal wymaga zgody":"wymaga potwierdzenia użytkownika");
                SetUpdaterStatus("AUTOMATYCZNA KONFIGURACJA ZAPISANA — nie trzeba wpisywać serwerów.",true);
                AppendUpdaterHistory("Ustawienia","Zapisano","Kanał="+(updaterChannelBox!=null && updaterChannelBox.SelectedIndex==1?"Beta":"Stable")+
                    "; AutoCheck="+(updaterAutoCheckBox!=null && updaterAutoCheckBox.Checked)+
                    "; AutoDownload="+(updaterAutoDownloadBox!=null && updaterAutoDownloadBox.Checked)+
                    "; AutoInstall="+(updaterAutoInstallBox!=null && updaterAutoInstallBox.Checked)+
                    "; CheckIntervalHours="+updaterCheckIntervalHours+"; MaxSpeedKBps="+updaterMaxSpeedKBps);
            }
            catch(Exception ex){MessageBox.Show("Nie zapisano ustawień automatycznych: "+ex.Message);}
        }

        private void LoadUpdaterSettings()
        {
            try
            {
                // Adresy są stałe i pochodzą z aplikacji. Stare, ręcznie wpisane URL-e
                // z poprzednich wersji nie nadpisują już oficjalnego źródła aktualizacji.

                if(File.Exists(updaterSettingsPath))
                {
                    XmlDocument d=new XmlDocument();d.XmlResolver=null;d.Load(updaterSettingsPath);
                    XmlNode n=d.SelectSingleNode("/UpdateChannels/Channel");
                    if(n!=null && updaterChannelBox!=null)updaterChannelBox.SelectedIndex=n.InnerText.Equals("beta",StringComparison.OrdinalIgnoreCase)?1:0;
                    n=d.SelectSingleNode("/UpdateChannels/AutoCheck");
                    if(n!=null && updaterAutoCheckBox!=null)updaterAutoCheckBox.Checked=String.Equals(n.InnerText,"true",StringComparison.OrdinalIgnoreCase);
                    n=d.SelectSingleNode("/UpdateChannels/AutoDownload");
                    if(n!=null && updaterAutoDownloadBox!=null)updaterAutoDownloadBox.Checked=String.Equals(n.InnerText,"true",StringComparison.OrdinalIgnoreCase);
                    n=d.SelectSingleNode("/UpdateChannels/AutoInstall");
                    if(n!=null && updaterAutoInstallBox!=null)updaterAutoInstallBox.Checked=String.Equals(n.InnerText,"true",StringComparison.OrdinalIgnoreCase);
                    int parsedSetting=0;
                    n=d.SelectSingleNode("/UpdateChannels/MaxSpeedKBps");
                    if(n!=null && Int32.TryParse(n.InnerText,NumberStyles.Integer,CultureInfo.InvariantCulture,out parsedSetting))
                        updaterMaxSpeedKBps=Math.Max(0,Math.Min(500000,parsedSetting));
                    n=d.SelectSingleNode("/UpdateChannels/CheckIntervalHours");
                    if(n!=null && Int32.TryParse(n.InnerText,NumberStyles.Integer,CultureInfo.InvariantCulture,out parsedSetting))
                        updaterCheckIntervalHours=Math.Max(1,Math.Min(24,parsedSetting));
                }
                if(updaterSpeedLimitBox!=null)updaterSpeedLimitBox.Value=Math.Max(updaterSpeedLimitBox.Minimum,Math.Min(updaterSpeedLimitBox.Maximum,updaterMaxSpeedKBps));
                if(updaterIntervalBox!=null)updaterIntervalBox.Value=Math.Max(updaterIntervalBox.Minimum,Math.Min(updaterIntervalBox.Maximum,updaterCheckIntervalHours));
                ApplyUpdaterSchedule();

                bool autoCheck=updaterAutoCheckBox==null || updaterAutoCheckBox.Checked;
                string manifest=GetOfficialUpdateManifestUrl();
                SetUpdaterStatus("OFICJALNY ADRES AKTUALIZACJI USTAWIONY AUTOMATYCZNIE — "+manifest, true);
                if(updaterResultBox!=null)
                    updaterResultBox.Text="Źródło aktualizacji jest wbudowane w program — niczego nie wpisujesz.\r\n"
                        +"Manifest: "+manifest+"\r\n"
                        +"Region: "+DetectUpdaterRegion()+" | język: "+DetectUpdaterLanguage()+" | architektura: "+(IntPtr.Size==8?"x64":"x86")+"\r\n"
                        +"Sprawdzanie przy uruchomieniu i co "+updaterCheckIntervalHours+" godz.: "+(autoCheck?"włączone":"wyłączone")+"\r\n"
                        +"Limit pobierania: "+(updaterMaxSpeedKBps<=0?"bez limitu":updaterMaxSpeedKBps+" KB/s")+"\r\n"
                        +"Automatyczne pobieranie nowej wersji: "+(updaterAutoDownloadBox!=null && updaterAutoDownloadBox.Checked?"włączone":"wyłączone")+"\r\n"
                        +"Instalacja wymaga potwierdzenia albo świadomego włączenia automatycznej instalacji z UAC.\r\n"
                        +"Jeżeli manifest nie jest jeszcze opublikowany na serwerze, program ponowi próbę później.";
            }
            catch(Exception ex){AppendLog("Nie wczytano ustawień aktualizatora: "+ex.Message);}
        }


        private void SaveUpdateManifestTemplate()
        {
            SaveFileDialog d=new SaveFileDialog();
            d.Filter="XML (*.xml)|*.xml";
            d.FileName=updaterChannelBox!=null && updaterChannelBox.SelectedIndex==1?"manifest-beta.xml":"manifest-stable.xml";
            if(d.ShowDialog()!=DialogResult.OK)return;
            string channel=updaterChannelBox!=null && updaterChannelBox.SelectedIndex==1?"beta":"stable";
            string sample="<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n"+
                "<Update version=\"1.0.0.72\" channel=\""+channel+"\" region=\"global\" language=\"all\" architecture=\"any\" packageUrl=\""+
                GetOfficialUpdatePackageUrl()+"\" sha256=\"WSTAW_64_ZNAKI_SHA256\">\r\n"+
                "  <Notes lang=\"pl\">Wydanie "+ProgramVersion+"</Notes>\r\n"+
                "  <Notes lang=\"en\">Release "+ProgramVersion+"</Notes>\r\n"+
                "  <Mirrors></Mirrors>\r\n"+
                "</Update>\r\n";
            File.WriteAllText(d.FileName,sample,new UTF8Encoding(true));
            AppendLog("Zapisano szablon manifestu dla wbudowanego serwera: "+d.FileName);
        }


        private void BuildReleaseManifest()
        {
            OpenFileDialog pick=new OpenFileDialog();
            pick.Title="Wybierz gotowy instalator KOMPUTEROWEGO CENTRUM SERWISU";
            pick.Filter="Instalator Windows (*.exe)|*.exe";
            pick.Multiselect=false;
            if(pick.ShowDialog()!=DialogResult.OK)return;
            if(!pick.FileName.EndsWith(".exe",StringComparison.OrdinalIgnoreCase))
            {
                MessageBox.Show("Publikacja aktualizacji wymaga instalatora EXE.","Nieprawidłowy plik");
                return;
            }

            string channel=updaterChannelBox!=null && updaterChannelBox.SelectedIndex==1?"beta":"stable";
            string manifestName=channel=="beta"?"manifest-beta.xml":"manifest-stable.xml";
            string folder=Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"GlobalUpdateServer");
            string packageName="KomputeroweCentrumSerwisu_FIX072_INSTALATOR.exe";
            string packagePath=Path.Combine(folder,packageName);
            string manifestPath=Path.Combine(folder,manifestName);
            try
            {
                Directory.CreateDirectory(folder);
                File.Copy(pick.FileName,packagePath,true);
                string sha=HashFile(packagePath);

                XmlDocument doc=new XmlDocument();
                XmlElement update=doc.CreateElement("Update");
                doc.AppendChild(update);
                update.SetAttribute("version",ProgramVersion);
                update.SetAttribute("channel",channel);
                update.SetAttribute("region","global");
                update.SetAttribute("language","all");
                update.SetAttribute("architecture","any");
                update.SetAttribute("packageUrl",GetOfficialUpdatePackageUrl());
                update.SetAttribute("sha256",sha);

                XmlElement pl=doc.CreateElement("Notes");
                pl.SetAttribute("lang","pl");
                pl.InnerText="Wydanie "+ProgramVersion+" — Komputerowe Centrum Serwisu";
                update.AppendChild(pl);
                XmlElement en=doc.CreateElement("Notes");
                en.SetAttribute("lang","en");
                en.InnerText="Release "+ProgramVersion+" — Computer Service Center";
                update.AppendChild(en);
                update.AppendChild(doc.CreateElement("Mirrors"));
                SaveXmlSafely(doc,manifestPath,4);

                string info=Path.Combine(folder,"README_PUBLISH.txt");
                File.WriteAllText(info,
                    "KOMPUTEROWE CENTRUM SERWISU — PLIK WYDANIA DO PUBLIKACJI\r\n"+
                    "Kanał: "+channel+"\r\nWersja: "+ProgramVersion+"\r\n"+
                    "Pakiet: "+packageName+"\r\nManifest: "+manifestName+"\r\n"+
                    "SHA-256: "+sha+"\r\n\r\n"+
                    "Prześlij oba pliki do katalogu /updates na zatwierdzonym hostingu/CDN.\r\n"+
                    "Adres pakietu w manifeście: "+GetOfficialUpdatePackageUrl()+"\r\n"+
                    "Manifest klienta: "+GetOfficialUpdateManifestUrl()+"\r\n"+
                    "Ten etap tworzy pliki lokalnie — nie loguje się do hostingu i nie publikuje plików samodzielnie.\r\n",
                    new UTF8Encoding(true));

                AppendUpdaterHistory("Publikacja","Przygotowano","Pakiet i manifest utworzone w "+folder+"; SHA-256 "+sha);
                SetUpdaterStatus("PAKIET WYDANIA I MANIFEST PRZYGOTOWANE LOKALNIE — wymagają publikacji na CDN.",true);
                MessageBox.Show("Utworzono gotowe pliki publikacji:\r\n\r\n"+packagePath+"\r\n"+manifestPath+
                    "\r\n\r\nSHA-256: "+sha+
                    "\r\n\r\nPozostaje opublikować te dwa pliki pod adresem wskazanym w README_PUBLISH.txt.",
                    "Pliki publikacji gotowe",MessageBoxButtons.OK,MessageBoxIcon.Information);
                try{Process.Start("explorer.exe","\""+folder+"\"");}catch{}
            }
            catch(Exception ex)
            {
                MessageBox.Show("Nie udało się przygotować plików wydania: "+ex.Message);
                AppendUpdaterHistory("Publikacja","Błąd",ex.Message);
            }
        }

        private void CheckProgramUpdate()
        {
            if(updaterWorker!=null && updaterWorker.IsBusy)return;
            if(updaterChannelBox==null)return;

            string primary=GetOfficialUpdateManifestUrl();
            List<string> feeds=new List<string>();
            if(IsSafeHttpsUpdateUrl(primary))feeds.Add(primary);
            if(feeds.Count==0)
            {
                pendingUpdateAvailable=false;
                if(updaterResultBox!=null)updaterResultBox.Text="Błąd wewnętrznej konfiguracji adresu aktualizacji. Nie zmieniaj ustawień ręcznie — zgłoś ten błąd.";
                SetUpdaterStatus("BŁĄD WBUDOWANEGO ADRESU AKTUALIZACJI.",false);
                AppendUpdaterHistory("Sprawdzenie","Błąd konfiguracji","Nieprawidłowy wbudowany URL: "+primary);
                return;
            }

            pendingUpdateAvailable=false;
            pendingUpdateUrl="";
            pendingUpdateSha="";
            pendingUpdateSignerThumbprint="";
            pendingUpdateMirrors.Clear();

            UpdateJob job=new UpdateJob();
            job.FeedUrls=feeds;
            job.Channel=updaterChannelBox.Text;
            job.ChannelKey=updaterChannelBox.SelectedIndex==1?"beta":"stable";
            job.Region=SelectedUpdaterRegion();
            job.Language=SelectedUpdaterLanguage();
            job.Architecture=IntPtr.Size==8?"x64":"x86";

            updaterWorker=new BackgroundWorker();
            updaterWorker.WorkerReportsProgress=true;
            updaterWorker.DoWork+=delegate(object sender,DoWorkEventArgs e)
            {
                BackgroundWorker bw=(BackgroundWorker)sender;
                UpdateJob j=(UpdateJob)e.Argument;
                ServicePointManager.SecurityProtocol=(SecurityProtocolType)3072;
                List<string> errors=new List<string>();
                UpdateFeedResult result=null;
                foreach(string feed in j.FeedUrls)
                {
                    bw.ReportProgress(10,new UpdateProgressInfo(10,"Łączenie z oficjalnym serwerem: "+feed));
                    try
                    {
                        using(UpdateWebClient client=new UpdateWebClient())
                        {
                            client.TimeoutMilliseconds=15000;
                            string xml=client.DownloadString(feed);
                            if(client.LastResponseUri==null || client.LastResponseUri.Scheme!=Uri.UriSchemeHttps)
                                throw new WebException("Przekierowanie manifestu poza HTTPS zostało zablokowane.");
                            result=ParseGlobalUpdateManifest(xml,j,feed);
                            break;
                        }
                    }
                    catch(Exception ex){errors.Add(feed+" -> "+ex.Message);}
                }
                if(result==null)
                {
                    string allErrors=String.Join("\r\n",errors.ToArray());
                    string reason=allErrors.IndexOf("NameResolutionFailure",StringComparison.OrdinalIgnoreCase)>=0 ||
                                  allErrors.IndexOf("nie można rozpoznać nazwy",StringComparison.OrdinalIgnoreCase)>=0 ||
                                  allErrors.IndexOf("could not be resolved",StringComparison.OrdinalIgnoreCase)>=0
                        ? "NIE MOŻNA ODNALEŹĆ HOSTA "+new Uri(OfficialUpdateBaseUrl).Host+". Sprawdź DNS, zaporę i dostęp do GitHub."
                        : "GitHub Releases nie udostępnił manifestu. Sprawdź repozytorium, wydanie i załączone pliki.";
                    throw new WebException(reason+"\r\nUruchom URUCHOM_TYLKO_TEN_PLIK.cmd — jeden przebieg buduje i publikuje aplikację.\r\n"+allErrors);
                }
                e.Result=result;
            };
            updaterWorker.ProgressChanged+=delegate(object sender,ProgressChangedEventArgs e)
            {
                UpdateProgressInfo info=e.UserState as UpdateProgressInfo;
                if(info!=null)SetUpdaterProgress(info.Percent,info.Message);
            };
            updaterWorker.RunWorkerCompleted+=delegate(object sender,RunWorkerCompletedEventArgs e)
            {
                updaterStartupCheckCompleted=true;
                if(e.Error!=null)
                {
                    string reason=DescribeGitHubFailure(e.Error);
                    string message="KONTROLA AKTUALIZACJI NIE POWIODŁA SIĘ\r\n"+
                        "Źródło: "+primary+"\r\n"+
                        reason+"\r\n\r\n"+
                        "Ponowna próba nastąpi zgodnie z harmonogramem lub po użyciu przycisku SPRAWDŹ TERAZ.";
                    if(updaterResultBox!=null)updaterResultBox.Text=message;
                    SetUpdaterStatus(reason,false);
                    if(updaterServerDiagLabel!=null){updaterServerDiagLabel.Text="DIAGNOSTYKA: "+reason;updaterServerDiagLabel.ForeColor=Color.FromArgb(255,187,101);}
                    SetUpdaterProgress(0,"Sprawdzanie nieudane — ponowna próba za maksymalnie 6 godzin.");
                    AppendLog("Automatyczne sprawdzanie aktualizacji: "+e.Error.Message);
                    AppendUpdaterHistory("Sprawdzenie","Serwer niedostępny",e.Error.Message);
                    return;
                }

                UpdateFeedResult update=(UpdateFeedResult)e.Result;
                pendingUpdateUrl=update.Url;
                pendingUpdateSha=update.Sha256;
                pendingUpdateSignerThumbprint=update.SignerThumbprint;
                pendingUpdateVersion=update.Version;
                pendingUpdateNotes=update.Notes;
                pendingUpdateMirrors=new List<string>(update.Mirrors);
                pendingUpdateAvailable=update.IsNew;
                pendingUpdateChannel=job.Channel;
                pendingUpdateRegion=job.Region;
                pendingUpdateLanguage=job.Language;
                pendingUpdateFeed=update.SourceFeed;

                bool alreadyDownloaded=!String.IsNullOrEmpty(pendingUpdatePackagePath) &&
                    File.Exists(pendingUpdatePackagePath) &&
                    pendingUpdatePackagePath.IndexOf("KCS_"+update.Version+"_",StringComparison.OrdinalIgnoreCase)>=0;

                if(updaterResultBox!=null)
                {
                    updaterResultBox.Text="WYNIK AUTOMATYCZNEGO SPRAWDZENIA\r\n"+
                        "Kanał: "+job.ChannelKey+"\r\n"+
                        "Wersja zainstalowana: "+ProgramVersion+"\r\n"+
                        "Wersja na serwerze: "+update.Version+"\r\n"+
                        "Region wykryty: "+job.Region+" | język: "+job.Language+" | architektura: "+job.Architecture+"\r\n"+
                        "Źródło: "+update.SourceFeed+"\r\n"+
                        "Wynik: "+(update.IsNew?"DOSTĘPNA NOWA WERSJA": "PROGRAM JEST AKTUALNY")+"\r\n"+
                        "Opis: "+update.Notes+"\r\n"+
                        "Serwery kopii z manifestu: "+update.Mirrors.Count+"\r\n"+
                        (alreadyDownloaded?"Pakiet tej wersji jest już pobrany i zweryfikowany.":"");
                }

                SetUpdaterStatus(update.IsNew?
                    (alreadyDownloaded?"NOWA WERSJA "+update.Version+" — PAKIET JUŻ POBRANY.":
                     "WYKRYTO NOWĄ WERSJĘ "+update.Version+" — AUTOMATYCZNE POBIERANIE."):
                    "PROGRAM JEST AKTUALNY — wersja "+ProgramVersion+".",true);
                SetUpdaterProgress(100,"Sprawdzenie zakończone. Serwer: "+OfficialUpdateBaseUrl);
                AppendLog("Automatyczne sprawdzenie "+job.ChannelKey+": wersja serwera "+update.Version+"; nowa="+update.IsNew);
                AppendUpdaterHistory("Sprawdzenie",update.IsNew?"Nowa wersja":"Aktualny",
                    job.ChannelKey+" / "+job.Region+" / "+job.Language+" / "+update.Version);

                if(update.IsNew && !alreadyDownloaded &&
                   updaterAutoDownloadBox!=null && updaterAutoDownloadBox.Checked)
                {
                    BeginInvoke((MethodInvoker)delegate
                    {
                        if(!IsDisposed && (updaterWorker==null || !updaterWorker.IsBusy))
                            DownloadProgramUpdate(true);
                    });
                }
            };

            SetUpdaterStatus("AUTOMATYCZNE SPRAWDZANIE — "+primary,true);
            SetUpdaterProgress(5,"Wykrywanie nowej wersji, regionu i języka…");
            if(updaterResultBox!=null)
                updaterResultBox.Text="Program sam łączy się z oficjalnym serwerem. Nie trzeba wpisywać adresu ani manifestu.";
            AppendUpdaterHistory("Sprawdzenie","Rozpoczęto","Źródło="+primary+"; region="+job.Region+"; język="+job.Language);
            updaterWorker.RunWorkerAsync(job);
        }

        private void DownloadProgramUpdate()
        {
            DownloadProgramUpdate(false);
        }

        private void DownloadProgramUpdate(bool automatic)
        {
            if(!pendingUpdateAvailable || String.IsNullOrEmpty(pendingUpdateUrl) || String.IsNullOrEmpty(pendingUpdateSha))
            {
                string msg="Nie ma potwierdzonego pakietu do pobrania. Najpierw sprawdź manifest i upewnij się, że zawiera nowszą wersję.";
                if(updaterResultBox!=null)updaterResultBox.Text=msg;
                SetUpdaterStatus("BRAK POTWIERDZONEJ AKTUALIZACJI DO POBRANIA.",false);
                return;
            }
            if(updaterWorker!=null && updaterWorker.IsBusy)return;
            if(!automatic && MessageBox.Show("Pobrać wybrane wydanie "+pendingUpdateVersion+"? Program sprawdzi SHA-256, podpis wydawcy (jeśli przypięty) i wykona kopię ustawień.","Automatyczna aktualizacja",MessageBoxButtons.YesNo,MessageBoxIcon.Question)!=DialogResult.Yes)return;

            UpdateDownloadJob job=new UpdateDownloadJob();job.Version=pendingUpdateVersion;job.Sha256=pendingUpdateSha;
            job.SignerThumbprint=pendingUpdateSignerThumbprint;
            job.MaxSpeedKBps=updaterSpeedLimitBox==null?updaterMaxSpeedKBps:(int)updaterSpeedLimitBox.Value;
            job.Urls=new List<string>();job.Urls.Add(pendingUpdateUrl);
            foreach(string mirror in pendingUpdateMirrors)if(!ContainsUpdateUrl(job.Urls,mirror))job.Urls.Add(mirror);
            updaterPauseGate.Set();updaterDownloadPaused=false;
            if(updaterPauseButton!=null){updaterPauseButton.Enabled=true;updaterPauseButton.Text="WSTRZYMAJ";}
            if(updaterStopButton!=null)updaterStopButton.Enabled=true;
            updaterWorker=new BackgroundWorker();updaterWorker.WorkerReportsProgress=true;updaterWorker.WorkerSupportsCancellation=true;
            updaterWorker.DoWork+=delegate(object sender,DoWorkEventArgs e)
            {
                BackgroundWorker bw=(BackgroundWorker)sender;
                UpdateDownloadJob j=(UpdateDownloadJob)e.Argument;
                List<string> errors=new List<string>();
                ServicePointManager.SecurityProtocol=(SecurityProtocolType)3072;
                string folder=Path.Combine(dataRoot,"GlobalUpdates");Directory.CreateDirectory(folder);
                string hashKey=(j.Sha256??"").Length>=12?j.Sha256.Substring(0,12):"nohash";
                string part=Path.Combine(folder,"update_"+j.Version+"_"+hashKey+".part");

                // Three attempts per source, with mirrors interleaved and partial-file resume.
                for(int urlIndex=0;urlIndex<j.Urls.Count*3;urlIndex++)
                {
                    int selectedUrlIndex=urlIndex%j.Urls.Count;
                    int retryAttempt=(urlIndex/j.Urls.Count)+1;
                    string url=j.Urls[selectedUrlIndex];
                    if(!IsSafeHttpsUpdateUrl(url)){errors.Add(url+" -> odrzucono adres nie-HTTPS.");continue;}
                    try
                    {
                        long existing=File.Exists(part)?new FileInfo(part).Length:0;
                        HttpWebRequest request=(HttpWebRequest)WebRequest.Create(url);
                        request.Method="GET";request.Timeout=15000;request.ReadWriteTimeout=120000;
                        request.AllowAutoRedirect=true;request.KeepAlive=true;
                        request.UserAgent="KomputeroweCentrumSerwisu/"+ProgramVersion;
                        if(existing>0)request.AddRange(existing);
                        using(HttpWebResponse response=(HttpWebResponse)request.GetResponse())
                        {
                            if(response.ResponseUri==null || response.ResponseUri.Scheme!=Uri.UriSchemeHttps)
                                throw new WebException("Przekierowanie pakietu poza HTTPS zostało zablokowane.");
                            bool append=existing>0 && response.StatusCode==HttpStatusCode.PartialContent;
                            if(append)
                            {
                                string contentRange=response.Headers["Content-Range"]??"";
                                if(!contentRange.StartsWith("bytes "+existing.ToString(CultureInfo.InvariantCulture)+"-",StringComparison.OrdinalIgnoreCase))
                                    throw new InvalidDataException("Serwer zwrócił niewłaściwy Content-Range przy wznawianiu. Odrzucono dopisanie danych.");
                            }
                            if(!append)existing=0;
                            long total=response.ContentLength>0?existing+response.ContentLength:-1;
                            using(Stream input=response.GetResponseStream())
                            using(FileStream output=new FileStream(part,append?FileMode.Append:FileMode.Create,FileAccess.Write,FileShare.None,65536,FileOptions.SequentialScan))
                            {
                                byte[] buffer=new byte[65536];int read;long downloaded=existing;DateTime lastUpdate=DateTime.MinValue;
                                DateTime speedStart=DateTime.UtcNow;long speedStartBytes=existing;
                                while(true)
                                {
                                    updaterPauseGate.WaitOne();
                                    if(bw.CancellationPending){e.Cancel=true;return;}
                                    read=input.Read(buffer,0,buffer.Length);
                                    if(read<=0)break;
                                    output.Write(buffer,0,read);downloaded+=read;
                                    if(j.MaxSpeedKBps>0)
                                    {
                                        double expectedMs=((double)(downloaded-existing)*1000.0)/(j.MaxSpeedKBps*1024.0);
                                        double elapsedMs=(DateTime.UtcNow-speedStart).TotalMilliseconds;
                                        if(expectedMs>elapsedMs)Thread.Sleep((int)Math.Min(250.0,expectedMs-elapsedMs));
                                    }
                                    if((DateTime.UtcNow-lastUpdate).TotalMilliseconds>=500)
                                    {
                                        DateTime now=DateTime.UtcNow;
                                        double seconds=Math.Max(0.001,(now-speedStart).TotalSeconds);
                                        double speed=(downloaded-speedStartBytes)/seconds;
                                        int percent=total>0?(int)Math.Min(99,Math.Max(0,(downloaded*100L)/total)):0;
                                        string mb=(downloaded/1048576.0).ToString("0.0",CultureInfo.InvariantCulture);
                                        string totalText=total>0?(total/1048576.0).ToString("0.0",CultureInfo.InvariantCulture)+" MB":"nieznany";
                                        string speedText=(speed/1048576.0).ToString("0.00",CultureInfo.InvariantCulture)+" MB/s";
                                        string eta="ETA: —";
                                        if(total>downloaded && speed>0)eta="ETA: "+TimeSpan.FromSeconds((total-downloaded)/speed).ToString(@"hh\:mm\:ss");
                                        bw.ReportProgress(percent,new UpdateProgressInfo(percent,"Pobrano "+mb+" MB / "+totalText+" | "+speedText+" | "+eta+" | źródło "+(selectedUrlIndex+1)+"/"+j.Urls.Count+" | próba "+retryAttempt+"/3"));
                                        lastUpdate=now;
                                    }
                                }
                                output.Flush();
                            }
                        }

                        if(bw.CancellationPending){e.Cancel=true;return;}
                        bw.ReportProgress(99,new UpdateProgressInfo(99,"Sprawdzanie SHA-256 pobranego pakietu..."));
                        string actual=HashFile(part);
                        if(!String.Equals(actual,j.Sha256,StringComparison.OrdinalIgnoreCase))
                        {
                            try{File.Delete(part);}catch{}
                            throw new InvalidDataException("SHA-256 niezgodny z manifestem. Częściowy plik został usunięty.");
                        }
                        AuthenticodeCheckResult signatureCheck=GetAuthenticodeSignatureInfo(part);
                        if(!String.IsNullOrWhiteSpace(j.SignerThumbprint) &&
                           (!signatureCheck.IsValid || !String.Equals(signatureCheck.Thumbprint,j.SignerThumbprint,StringComparison.OrdinalIgnoreCase)))
                            throw new InvalidDataException("Manifest wymaga podpisu Authenticode "+j.SignerThumbprint+", a instalator ma status "+signatureCheck.Status+" i certyfikat "+signatureCheck.Thumbprint+". Plik nie zostanie uruchomiony.");
                        string name=Path.GetFileName(new Uri(url).LocalPath);
                        if(String.IsNullOrEmpty(name))name="KomputeroweCentrumSerwisu_Update_"+j.Version+".zip";
                        foreach(char c in Path.GetInvalidFileNameChars())name=name.Replace(c,'_');
                        string finalPath=Path.Combine(folder,"KCS_"+j.Version+"_"+name);
                        if(File.Exists(finalPath))File.Delete(finalPath);
                        File.Move(part,finalPath);
                        UpdateDownloadResult done=new UpdateDownloadResult();done.Path=finalPath;done.SourceUrl=url;
                        done.SizeBytes=new FileInfo(finalPath).Length;done.AuthenticodeStatus=signatureCheck.Status+" | "+signatureCheck.Thumbprint+" | "+signatureCheck.Subject;
                        e.Result=done;return;
                    }
                    catch(Exception ex)
                    {
                        errors.Add(url+" | próba "+retryAttempt+"/3 -> "+ex.Message);
                        WebException web=ex as WebException;
                        HttpWebResponse http=web==null?null:web.Response as HttpWebResponse;
                        if(http!=null && http.StatusCode==HttpStatusCode.RequestedRangeNotSatisfiable)
                        {
                            try{File.Delete(part);}catch{}
                        }
                        if(bw.CancellationPending){e.Cancel=true;return;}
                        if(retryAttempt<3)
                        {
                            int wait=retryAttempt*1500;
                            bw.ReportProgress(0,new UpdateProgressInfo(0,"Błąd źródła "+(selectedUrlIndex+1)+". Ponawiam za "+(wait/1000)+" s — próba "+(retryAttempt+1)+"/3."));
                            Thread.Sleep(wait);
                        }
                    }
                }
                throw new WebException("Nie udało się pobrać i zweryfikować pakietu z żadnego serwera:\r\n"+String.Join("\r\n",errors.ToArray()));
            };
            updaterWorker.ProgressChanged+=delegate(object sender,ProgressChangedEventArgs e)
            {
                UpdateProgressInfo info=e.UserState as UpdateProgressInfo;
                if(info!=null)SetUpdaterProgress(info.Percent,info.Message);
            };
            updaterWorker.RunWorkerCompleted+=delegate(object sender,RunWorkerCompletedEventArgs e)
            {
                updaterPauseGate.Set();updaterDownloadPaused=false;
                if(updaterPauseButton!=null){updaterPauseButton.Enabled=false;updaterPauseButton.Text="WSTRZYMAJ";}
                if(updaterStopButton!=null)updaterStopButton.Enabled=false;
                if(e.Cancelled)
                {
                    string partialFolder=Path.Combine(dataRoot,"GlobalUpdates");
                    updaterResultBox.Text="POBIERANIE ZATRZYMANE.\r\nPlik tymczasowy .part został zachowany. Kliknij POBIERZ / WZNÓW, aby kontynuować transfer.";
                    SetUpdaterStatus("POBIERANIE ZATRZYMANE — częściowy plik zachowany do wznowienia.",false);
                    SetUpdaterProgress(updaterProgressBar==null?0:updaterProgressBar.Value,"Można wznowić pobieranie z tego samego pakietu.");
                    AppendUpdaterHistory("Pobieranie","Zatrzymano","Częściowy plik pozostawiono w "+partialFolder);
                    return;
                }
                if(e.Error!=null)
                {
                    updaterResultBox.Text="POBIERANIE NIEUDANE:\r\n"+e.Error.Message+"\r\nPlik .part, jeżeli jest poprawny, może zostać wykorzystany przy następnej próbie.";
                    SetUpdaterStatus("POBIERANIE NIEUDANE — sprawdź połączenie lub serwery zapasowe.",false);
                    SetUpdaterProgress(0,"Błąd pobierania / weryfikacji.");
                    AppendLog("Global updater download error: "+e.Error.Message);
                    AppendUpdaterHistory("Pobieranie","Błąd",e.Error.Message);
                    return;
                }

                UpdateDownloadResult result=(UpdateDownloadResult)e.Result;
                pendingUpdatePackagePath=result.Path;
                updaterLastSignatureStatus=result.AuthenticodeStatus;
                bool signatureValid=result.AuthenticodeStatus!=null && result.AuthenticodeStatus.StartsWith("Valid",StringComparison.OrdinalIgnoreCase);
                SetUpdaterMetric(updaterSecurityMetricLabel,"PODPIS: "+(signatureValid?"VALID":"NIEPODPISANY / OSTRZEŻENIE"),signatureValid,!signatureValid);
                string backupFolder=BackupUpdaterSettingsBeforeInstall(pendingUpdateVersion);
                updaterResultBox.Text="PAKIET POBRANY I SPRAWDZONY\r\nWersja: "+pendingUpdateVersion+
                    "\r\nŹródło: "+result.SourceUrl+"\r\nSHA-256: "+pendingUpdateSha+
                    "\r\nPlik: "+result.Path+
                    "\r\nKopia ustawień i poprzednich plików programu: "+backupFolder+
                    "\r\nRozmiar: "+(result.SizeBytes/1048576.0).ToString("0.00",CultureInfo.InvariantCulture)+" MB"+
                    "\r\nAuthenticode: "+result.AuthenticodeStatus+
                    "\r\nUruchom instalator po zamknięciu programu. Program nie podmienia własnego EXE w tle.";
                bool backupOk=!backupFolder.StartsWith("BŁĄD KOPII",StringComparison.OrdinalIgnoreCase);
                SetUpdaterStatus(backupOk?"PAKIET ZWERYFIKOWANY — SHA-256 zgodny. Kopia ustawień wykonana.":
                    "PAKIET ZWERYFIKOWANY — SHA-256 zgodny, ale kopia ustawień nie powiodła się.",backupOk);
                SetUpdaterProgress(100,"Pobieranie zakończone i SHA-256 zgodny.");
                AppendLog("Pobrano i zweryfikowano globalny pakiet "+pendingUpdateVersion+" z "+result.SourceUrl);
                AppendUpdaterHistory("Pobieranie","Zweryfikowano","Wersja "+pendingUpdateVersion+"; SHA-256 zgodny; plik "+result.Path+"; kopia "+backupFolder);
                if(!backupOk)
                {
                    MessageBox.Show("Pakiet przeszedł kontrolę SHA-256, ale nie udało się wykonać kopii poprzedniej wersji i ustawień.\r\n\r\nInstalacja została zablokowana, aby nie utracić możliwości powrotu. Pakiet pozostaje w folderze pobranych aktualizacji.\r\n\r\n"+backupFolder,
                        "Aktualizacja zablokowana — brak kopii",MessageBoxButtons.OK,MessageBoxIcon.Warning);
                    OpenReadyUpdatePackage(result.Path);
                    return;
                }
                if(!result.Path.EndsWith(".exe",StringComparison.OrdinalIgnoreCase))
                {
                    MessageBox.Show("Pakiet został pobrany i zweryfikowany, ale nie jest instalatorem EXE. Nie uruchomię go automatycznie.\r\n"+result.Path,
                        "Aktualizacja pobrana",MessageBoxButtons.OK,MessageBoxIcon.Information);
                    OpenReadyUpdatePackage(result.Path);
                    return;
                }
                bool autoInstall=updaterAutoInstallBox!=null && updaterAutoInstallBox.Checked;
                if(autoInstall)
                {
                    StartDownloadedUpdateInstaller(result.Path);
                }
                else
                {
                    DialogResult install=MessageBox.Show(
                        "Wydanie "+pendingUpdateVersion+" zostało pobrane i zweryfikowane.\r\n\r\n"+
                        "Kopia ustawień: "+backupFolder+"\r\n\r\nUruchomić instalator teraz? Program zamknie się przed aktualizacją.",
                        "Aktualizacja gotowa",MessageBoxButtons.YesNo,MessageBoxIcon.Question,MessageBoxDefaultButton.Button2);
                    if(install==DialogResult.Yes)StartDownloadedUpdateInstaller(result.Path);
                    else OpenReadyUpdatePackage(result.Path);
                }
            };
            updaterResultBox.Text=automatic?
                "Automatycznie pobieram wykrytą aktualizację. Możesz wstrzymać lub zatrzymać transfer.":
                "Pobieranie pakietu. Możesz wstrzymać transfer lub go zatrzymać.";
            SetUpdaterStatus(automatic?"AUTOMATYCZNE POBIERANIE AKTUALIZACJI — transfer w toku.":"POBIERANIE AKTUALIZACJI — transfer w toku.",true);
            SetUpdaterProgress(0,"Rozpoczynanie pobierania...");
            updaterWorker.RunWorkerAsync(job);
        }


        private void StartDownloadedUpdateInstaller(string path)
        {
            try
            {
                if(String.IsNullOrEmpty(path) || !File.Exists(path))
                    throw new FileNotFoundException("Nie znaleziono pobranego instalatora.",path);
                if(!path.EndsWith(".exe",StringComparison.OrdinalIgnoreCase))
                    throw new InvalidDataException("Automatyczna instalacja obsługuje wyłącznie pliki EXE.");

                string updatesRoot=Path.GetFullPath(Path.Combine(dataRoot,"GlobalUpdates"));
                string fullPath=Path.GetFullPath(path);
                if(!fullPath.StartsWith(updatesRoot+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase))
                    throw new InvalidDataException("Odrzucono instalator spoza katalogu pobrań aplikacji.");

                // Ponownie sprawdzamy plik dokładnie przed uruchomieniem UAC.
                string launchHash=HashFile(fullPath);
                if(!String.Equals(launchHash,pendingUpdateSha,StringComparison.OrdinalIgnoreCase))
                    throw new InvalidDataException("SHA-256 instalatora zmienił się po pobraniu. Plik nie zostanie uruchomiony.");
                string actualVersion=FileVersionInfo.GetVersionInfo(fullPath).FileVersion;
                if(String.IsNullOrWhiteSpace(actualVersion) ||
                   !String.Equals(actualVersion.Trim(),pendingUpdateVersion,StringComparison.OrdinalIgnoreCase))
                    throw new InvalidDataException("Wersja instalatora ("+(actualVersion??"brak")+") nie zgadza się z manifestem ("+pendingUpdateVersion+").");
                AuthenticodeCheckResult signature=GetAuthenticodeSignatureInfo(fullPath);
                if(!String.IsNullOrWhiteSpace(pendingUpdateSignerThumbprint) &&
                   (!signature.IsValid || !String.Equals(signature.Thumbprint,pendingUpdateSignerThumbprint,StringComparison.OrdinalIgnoreCase)))
                    throw new InvalidDataException("Podpis Authenticode nie przeszedł ponownej kontroli przed UAC: "+signature.Status+" / "+signature.Thumbprint);
                if(String.IsNullOrWhiteSpace(pendingUpdateSignerThumbprint) && !signature.IsValid)
                    AppendUpdaterHistory("Bezpieczeństwo","Ostrzeżenie","Instalator nie ma prawidłowego podpisu Authenticode; SHA-256 jest zgodny z manifestem, ale autor pliku nie został potwierdzony certyfikatem.");

                ProcessStartInfo info=new ProcessStartInfo();
                info.FileName=fullPath;
                info.WorkingDirectory=Path.GetDirectoryName(fullPath);
                info.UseShellExecute=true;
                info.Verb="runas";
                Process.Start(info);
                AppendUpdaterHistory("Instalacja","Uruchomiono UAC","Instalator="+fullPath+"; aplikacja zamyka się przed aktualizacją.");
                AppendLog("Uruchomiono zweryfikowany instalator aktualizacji: "+fullPath);
                isExitingFromTray=true;
                BeginInvoke((MethodInvoker)delegate{Close();});
            }
            catch(Exception ex)
            {
                SetUpdaterStatus("NIE URUCHOMIONO INSTALATORA — "+ex.Message,false);
                AppendUpdaterHistory("Instalacja","Błąd",ex.Message);
                MessageBox.Show("Nie uruchomiono instalatora aktualizacji.\r\n"+ex.Message,
                    "Błąd instalacji",MessageBoxButtons.OK,MessageBoxIcon.Error);
            }
        }

        private string BackupUpdaterSettingsBeforeInstall(string version)
        {
            string rootFolder=Path.Combine(dataRoot,"GlobalUpdates","SettingsBackups");
            string safeVersion=Regex.Replace(version??"manual","[^A-Za-z0-9._-]","_");
            string backup=Path.Combine(rootFolder,DateTime.Now.ToString("yyyyMMdd_HHmmss")+"_before_"+safeVersion);
            lastRollbackSnapshotPath="";
            int copied=0;
            try
            {
                Directory.CreateDirectory(backup);
                if(!String.IsNullOrEmpty(configPath) && File.Exists(configPath))
                {
                    File.Copy(configPath,Path.Combine(backup,"settings.xml"),true);copied++;
                }
                if(!String.IsNullOrEmpty(updaterSettingsPath) && File.Exists(updaterSettingsPath))
                {
                    File.Copy(updaterSettingsPath,Path.Combine(backup,"update_channels.xml"),true);copied++;
                }

                // Snapshot the currently installed program and side-by-side assets for a real
                // application-file rollback. User data stays in its normal dataRoot untouched.
                string appFolder=Path.GetDirectoryName(Application.ExecutablePath);
                string rollback=Path.Combine(backup,"PreviousApplication");
                Directory.CreateDirectory(rollback);
                StringBuilder files=new StringBuilder();
                long totalBytes=0;int appFiles=0;
                string[] allowed={".exe",".dll",".ico",".png",".jpg",".jpeg",".config",".manifest"};
                foreach(string file in Directory.GetFiles(appFolder, "*", SearchOption.TopDirectoryOnly))
                {
                    string ext=Path.GetExtension(file).ToLowerInvariant();
                    if(Array.IndexOf(allowed,ext)<0)continue;
                    FileInfo fi=new FileInfo(file);
                    if(fi.Length>268435456L || totalBytes+fi.Length>536870912L)
                        throw new IOException("Kopia rollback przekroczyłaby bezpieczny limit 512 MB lub pojedynczy plik ma ponad 256 MB: "+fi.Name);
                    DriveInfo backupDrive=new DriveInfo(Path.GetPathRoot(backup));
                    if(backupDrive.AvailableFreeSpace<fi.Length+16777216L)
                        throw new IOException("Za mało wolnego miejsca na kopię poprzedniej wersji. Wymagana dodatkowa przestrzeń: "+(fi.Length+16777216L)+" bajtów.");
                    string dest=Path.Combine(rollback,Path.GetFileName(file));
                    File.Copy(file,dest,true);
                    string hash=HashFile(dest);
                    files.Append(Path.GetFileName(file)).Append('|').Append(hash).Append("\r\n");
                    totalBytes+=fi.Length;appFiles++;
                }
                if(appFiles==0 || !File.Exists(Path.Combine(rollback,Path.GetFileName(Application.ExecutablePath))))
                    throw new InvalidDataException("Nie udało się zachować kopii aktualnie uruchomionego EXE.");
                File.WriteAllText(Path.Combine(rollback,"rollback-files.txt"),files.ToString(),new UTF8Encoding(true));

                string rollbackScript=@"
param([int]$TargetPid,[string]$BackupDir,[string]$TargetDir,[string]$ExeName)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
$log = Join-Path $BackupDir 'rollback.log'
try {
    try { Wait-Process -Id $TargetPid -Timeout 45 -ErrorAction Stop } catch {}
    if (Get-Process -Id $TargetPid -ErrorAction SilentlyContinue) {
        Stop-Process -Id $TargetPid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
    $manifest = Join-Path $BackupDir 'rollback-files.txt'
    if (-not (Test-Path -LiteralPath $manifest)) { throw 'Brak manifestu kopii rollback.' }
    foreach ($line in Get-Content -LiteralPath $manifest) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        $parts = $line.Split('|',2)
        if ($parts.Count -ne 2) { throw 'Nieprawidłowy wpis manifestu rollback.' }
        $name = [IO.Path]::GetFileName($parts[0])
        if ($name -ne $parts[0]) { throw 'Odrzucono ścieżkę spoza kopii rollback.' }
        $source = Join-Path $BackupDir $name
        $target = Join-Path $TargetDir $name
        if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw ('Brak pliku kopii: ' + $name) }
        $hash = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($hash -ne $parts[1].ToLowerInvariant()) { throw ('SHA-256 kopii jest niezgodny: ' + $name) }
        Copy-Item -LiteralPath $source -Destination $target -Force
    }
    Add-Content -LiteralPath $log -Value ('PASS ' + (Get-Date).ToString('s'))
    Start-Sleep -Seconds 2
    Start-Process -FilePath (Join-Path $TargetDir $ExeName) -WorkingDirectory $TargetDir
} catch {
    Add-Content -LiteralPath $log -Value ('FAIL ' + $_.Exception.Message)
    [void][Windows.Forms.MessageBox]::Show($_.Exception.Message,'Cofanie wersji — błąd')
    exit 1
}
";
                File.WriteAllText(Path.Combine(rollback,"RestorePreviousVersion.ps1"),rollbackScript,new UTF8Encoding(true));
                lastRollbackSnapshotPath=rollback;
                if(updaterRollbackButton!=null)updaterRollbackButton.Enabled=true;
                File.WriteAllText(Path.Combine(backup,"BACKUP_INFO.txt"),
                    "KOMPUTEROWE CENTRUM SERWISU — KOPIA PRZED AKTUALIZACJĄ\r\n"+
                    "Wersja pakietu: "+version+"\r\nWersja programu przed aktualizacją: "+FileVersionInfo.GetVersionInfo(Application.ExecutablePath).FileVersion+"\r\n"+
                    "Data: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")+"\r\n"+
                    "Kopie ustawień: "+copied+"\r\nPliki aplikacji: "+appFiles+"\r\nRozmiar snapshotu: "+totalBytes+" bajtów\r\n"+
                    "SHA-256 plików zapisano w PreviousApplication\\rollback-files.txt.\r\n"+
                    "Cofanie przywraca pliki programu i zasoby. Nie jest to obraz całego Windows ani kopia pełnego systemu.\r\n",new UTF8Encoding(true));
                return backup;
            }
            catch(Exception ex)
            {
                lastRollbackSnapshotPath="";
                try{if(Directory.Exists(backup))Directory.Delete(backup,true);}catch{}
                if(updaterRollbackButton!=null)updaterRollbackButton.Enabled=HasRollbackSnapshot();
                AppendLog("Nie utworzono pełnej kopii ustawień / rollback: "+ex.Message);
                return "BŁĄD KOPII: "+ex.Message;
            }
        }

        private void RestoreLatestUpdaterSettingsBackup()
        {
            if(updaterWorker!=null && updaterWorker.IsBusy){MessageBox.Show("Zatrzymaj najpierw sprawdzanie lub pobieranie aktualizacji.");return;}
            string rootFolder=Path.Combine(dataRoot,"GlobalUpdates","SettingsBackups");
            if(!Directory.Exists(rootFolder)){MessageBox.Show("Nie znaleziono kopii ustawień aktualizatora.");return;}
            string[] dirs=Directory.GetDirectories(rootFolder);
            Array.Sort(dirs,StringComparer.OrdinalIgnoreCase);
            if(dirs.Length==0){MessageBox.Show("Nie znaleziono kopii ustawień aktualizatora.");return;}
            string latest=dirs[dirs.Length-1];
            if(MessageBox.Show("Przywrócić ustawienia z kopii:\r\n"+latest+"?","Przywracanie ustawień",MessageBoxButtons.YesNo,MessageBoxIcon.Warning,MessageBoxDefaultButton.Button2)!=DialogResult.Yes)return;
            try
            {
                string cfg=Path.Combine(latest,"settings.xml");
                string channels=Path.Combine(latest,"update_channels.xml");
                if(File.Exists(cfg))
                {
                    XmlDocument importedConfig;string configError;
                    if(!TryLoadXmlDocument(cfg,out importedConfig,out configError) || !IsValidSettingsDocument(importedConfig,out configError))throw new InvalidDataException("Kopia konfiguracji jest nieprawidłowa: "+configError);
                    SaveConfig();CreateConfigBackupSnapshot();SaveXmlSafely(importedConfig,configPath,12);
                }
                if(File.Exists(channels))
                {
                    XmlDocument importedChannels;string channelsError;
                    if(!TryLoadXmlDocument(channels,out importedChannels,out channelsError) || importedChannels.DocumentElement==null || importedChannels.DocumentElement.Name!="UpdateChannels")throw new InvalidDataException("Kopia kanałów aktualizacji jest nieprawidłowa: "+channelsError);
                    SaveXmlSafely(importedChannels,updaterSettingsPath,8);
                }
                LoadConfig();LoadUpdaterSettings();
                AppendUpdaterHistory("Kopia ustawień","Przywrócono","Z kopii "+latest);
                MessageBox.Show("Przywrócono kopię ustawień. Nie jest to cofnięcie wersji programu — instalator EXE musi być cofnięty oddzielnie.");
            }
            catch(Exception ex){MessageBox.Show("Nie udało się przywrócić kopii ustawień: "+ex.Message);}
        }

        private void TogglePauseProgramUpdate()
        {
            if(updaterWorker==null || !updaterWorker.IsBusy || updaterPauseButton==null)return;
            if(!updaterDownloadPaused)
            {
                updaterDownloadPaused=true;updaterPauseGate.Reset();
                updaterPauseButton.Text="WZNÓW";
                SetUpdaterStatus("POBIERANIE WSTRZYMANE — plik tymczasowy zachowany.",false);
                SetUpdaterProgress(updaterProgressBar==null?0:updaterProgressBar.Value,"Pauza — kliknij WZNÓW, aby kontynuować.");
                AppendUpdaterHistory("Pobieranie","Wstrzymano","Transfer oczekuje na wznowienie.");
            }
            else
            {
                updaterDownloadPaused=false;updaterPauseGate.Set();
                updaterPauseButton.Text="WSTRZYMAJ";
                SetUpdaterStatus("WZNOWIONO POBIERANIE",true);
                AppendUpdaterHistory("Pobieranie","Wznowiono","Kontynuacja transferu.");
            }
        }

        private void StopProgramUpdate()
        {
            if(updaterWorker==null || !updaterWorker.IsBusy)return;
            updaterWorker.CancelAsync();updaterPauseGate.Set();updaterDownloadPaused=false;
            if(updaterPauseButton!=null)updaterPauseButton.Enabled=false;
            if(updaterStopButton!=null)updaterStopButton.Enabled=false;
            SetUpdaterStatus("ZATRZYMYWANIE — zachowuję częściowy plik do wznowienia.",false);
        }

        private void ExportPdfReport()
        {
            string htmlPath=Path.Combine(dataRoot,"Raport_NaprawaPC_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".html");
            string safe=System.Security.SecurityElement.Escape(BuildServiceReport());
            string page="<!doctype html><html><head><meta charset='utf-8'><title>Raport — KOMPUTEROWE CENTRUM SERWISU</title><style>body{font-family:Segoe UI,Arial;color:#152338;padding:24px}h1{color:#007eae}pre{white-space:pre-wrap;font-family:Consolas,monospace;font-size:10pt}</style></head><body><h1>KOMPUTEROWE CENTRUM SERWISU — RAPORT SERWISOWY</h1><pre>"+safe+"</pre></body></html>";
            try{File.WriteAllText(htmlPath,page,new UTF8Encoding(true));}catch(Exception ex){MessageBox.Show(ex.Message);return;}
            string[] browsers=new string[]{
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),"Microsoft","Edge","Application","msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),"Microsoft","Edge","Application","msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),"Google","Chrome","Application","chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),"Google","Chrome","Application","chrome.exe")};
            string browser="";foreach(string b in browsers)if(File.Exists(b)){browser=b;break;}
            if(!String.IsNullOrEmpty(browser)) {
                string pdf=Path.ChangeExtension(htmlPath,".pdf");
                try {
                    ProcessStartInfo pi=new ProcessStartInfo(browser,"--headless --disable-gpu --no-pdf-header-footer --print-to-pdf=\""+pdf+"\" \"file:///"+htmlPath.Replace("\\","/")+"\"");
                    pi.UseShellExecute=false;Process proc=Process.Start(pi);proc.WaitForExit(60000);
                    if(File.Exists(pdf)&&new FileInfo(pdf).Length>1000){AppendLog("Wygenerowano PDF: "+pdf);MessageBox.Show("Raport PDF zapisano:\r\n"+pdf);Process.Start("explorer.exe","/select,\""+pdf+"\"");return;}
                } catch(Exception ex){AppendLog("Headless print-to-PDF nie powiódł się: "+ex.Message);}
            }
            MessageBox.Show("Nie udało się automatycznie wygenerować PDF. Otworzę raport HTML — użyj Ctrl+P → Microsoft Print to PDF / Zapisz jako PDF.","Eksport PDF",MessageBoxButtons.OK,MessageBoxIcon.Information);
            try{Process.Start(htmlPath);}catch{}
        }

        private void BuildWinPeUsb()
        {
            if(GetFamily()!="10" && GetFamily()!="11") {MessageBox.Show("WinPE Builder wymaga Windows 10/11.");return;}
            if(!IsAdmin()){MessageBox.Show("Uruchom program jako administrator.");return;}
            if(usbDriveBox==null || usbDriveBox.SelectedItem==null){MessageBox.Show("Odśwież listę nośników i wybierz pendrive.");return;}
            Match m=Regex.Match(Convert.ToString(usbDriveBox.SelectedItem),"^([A-Z]:)",RegexOptions.IgnoreCase);
            if(!m.Success){MessageBox.Show("Nie wybrano prawidłowego dysku USB.");return;}
            string drive=m.Groups[1].Value.ToUpperInvariant()+"\\";DriveInfo selected=null;
            foreach(DriveInfo d in DriveInfo.GetDrives())try{if(String.Equals(d.Name,drive,StringComparison.OrdinalIgnoreCase))selected=d;}catch{}
            if(selected==null||!selected.IsReady||selected.DriveType!=DriveType.Removable){MessageBox.Show("Wybrany dysk nie jest zgłoszony przez Windows jako Removable. Automatyczna budowa została zablokowana.");return;}
            string adk=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),"Windows Kits","10","Assessment and Deployment Kit","Windows Preinstallation Environment");
            string copype=Path.Combine(adk,"copype.cmd"),media=Path.Combine(adk,"MakeWinPEMedia.cmd");
            if(!File.Exists(copype)||!File.Exists(media)){MessageBox.Show("Nie znaleziono copype.cmd / MakeWinPEMedia.cmd. Zainstaluj Windows ADK oraz osobny WinPE Add-on Microsoft.\r\n\r\n"+adk,"Brak ADK / WinPE Add-on");OpenUrl("https://learn.microsoft.com/windows-hardware/get-started/adk-install");return;}
            string work=Path.Combine(dataRoot,"WinPE_x64_"+DateTime.Now.ToString("yyyyMMdd_HHmmss"));
            string warning="UWAGA — NOŚNIK ZOSTANIE SFORMATOWANY.\r\n\r\nWybrany dysk: "+drive+"\r\nEtykieta: "+selected.VolumeLabel+"\r\nPojemność: "+Math.Round(selected.TotalSize/1073741824.0,1)+" GB\r\n\r\nWszystkie dane na tym pendrivie zostaną usunięte przez MakeWinPEMedia. Odłącz inne dyski USB, aby nie pomylić urządzenia.\r\n\r\nCzy na pewno kontynuować?";
            if(MessageBox.Show(warning,"OSTATNIE POTWIERDZENIE — FORMAT USB",MessageBoxButtons.YesNo,MessageBoxIcon.Stop)!=DialogResult.Yes)return;
            string command="\""+copype+"\" amd64 \""+work+"\" && \""+media+"\" /UFD \""+work+"\" "+drive.TrimEnd('\\');
            try {
                ProcessStartInfo pi=new ProcessStartInfo("cmd.exe","/c \""+command+"\"");pi.UseShellExecute=true;pi.Verb="runas";
                Process.Start(pi);AppendLog("Uruchomiono WinPE Builder z ADK dla dysku "+drive+". Przebieg należy obserwować w oknie CMD.");
                MessageBox.Show("Uruchomiono oficjalne narzędzia ADK. Okno CMD pokaże wynik. Pendrive zostanie sformatowany.","WinPE Builder");
            } catch(Exception ex){MessageBox.Show("Nie udało się uruchomić WinPE Builder: "+ex.Message);}
        }

        private void BuildHardwareMonitorPage()
        {
            if(FindPage("Monitor sprzętu")!=null)return;
            Panel p=NewPage("Monitor sprzętu","Hardware Monitor PRO");
            Panel cpu=Card(p,"PROCESOR / PAMIĘĆ / SZYBKIE MODUŁY",10,8,950,170);
            LabelAt(cpu,"CPU i RAM pochodzą z WMI. Temperatury, VRAM i GPU zależą od sterowników i kontrolera — brak odczytu nie oznacza prawidłowego stanu.",18,43,900,34);
            ButtonAt(cpu,"ODŚWIEŻ SPRZĘT",18,82,190,delegate{RefreshHardwareMonitorPage();});
            ButtonAt(cpu,"Menedżer zadań",220,82,175,delegate{RunCommand("taskmgr.exe","");});
            ButtonAt(cpu,"Monitor zasobów",405,82,190,delegate{RunCommand("resmon.exe","");});
            ButtonAt(cpu,"dxdiag",605,82,130,delegate{RunCommand("dxdiag.exe","");});
            ButtonAt(cpu,"MONITOR LIVE CPU / RAM / GPU",18,125,290,delegate{ShowPage("Windows Performance");});
            ButtonAt(cpu,"GPU / MONITORY / PNP",318,125,260,delegate{ShowPage("Hardware Intelligence PRO");});
            ButtonAt(cpu,"SMART / NVMe",588,125,190,delegate{ShowPage("NVMe SSD Doctor");});
            ButtonAt(cpu,"BIOS / UEFI",788,125,135,delegate{ShowPage("Partycje i UEFI");});

            Panel metrics=Card(p,"ODCZYT SPRZĘTU — WMI / ACPI / WSZYSTKIE ADAPTERY",10,195,950,270);
            TextBox output=new TextBox();output.Name="HardwareMonitorReport";output.Multiline=true;output.ReadOnly=true;
            output.ScrollBars=ScrollBars.Both;output.WordWrap=true;output.Font=new Font("Consolas",9F);
            output.BackColor=Color.FromArgb(7,13,23);output.ForeColor=Color.FromArgb(205,235,245);
            output.Location=new Point(UX(18),UY(45));output.Size=new Size(UX(895),UY(145));metrics.Controls.Add(output);
            ButtonAt(metrics,"ZAPISZ RAPORT",18,205,190,delegate{
                SaveFileDialog d=new SaveFileDialog();d.Filter="Raport TXT (*.txt)|*.txt";
                d.FileName="Hardware_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".txt";
                if(d.ShowDialog()==DialogResult.OK){File.WriteAllText(d.FileName,output.Text,Encoding.UTF8);AppendLog("Zapisano raport sprzętu: "+d.FileName);}
            });
            ButtonAt(metrics,"Eksport sterowników",220,205,205,delegate{ExportDrivers();});

            Panel sensors=Card(p,"CZUJNIKI I OGRANICZENIA ODCZYTU",10,475,950,145);
            LabelAt(sensors,"Windows nie udostępnia uniwersalnego API do temperatur CPU/GPU i obrotów wentylatorów. Odczyt ACPI może zwracać strefę termiczną, a nie temperaturę rdzenia CPU.",18,45,900,42);
            ButtonAt(sensors,"Otwórz Monitor wydajności",18,95,245,delegate{RunCommand("perfmon.exe","");});
            ButtonAt(sensors,"Otwórz dxdiag",275,95,180,delegate{RunCommand("dxdiag.exe","");});
            ButtonAt(sensors,"Otwórz Menedżer urządzeń",465,95,250,delegate{RunCommand("mmc.exe","devmgmt.msc");});

            RefreshHardwareMonitorPage();
        }

        private void RefreshHardwareMonitorPage()
        {
            Panel page=FindPage("Monitor sprzętu");if(page==null)return;
            Control[] found=page.Controls.Find("HardwareMonitorReport",true);
            if(found.Length==0)return;
            TextBox box=found[0] as TextBox;if(box==null)return;
            if(hardwareMonitorWorker!=null && hardwareMonitorWorker.IsBusy)
            {
                box.Text="Poprzedni odczyt sprzętu nadal trwa. Poczekaj na jego zakończenie.";return;
            }
            box.Text="Odczytywanie informacji sprzętowych w tle...";
            BackgroundWorker bw=new BackgroundWorker();hardwareMonitorWorker=bw;
            bw.DoWork+=delegate(object sender,DoWorkEventArgs e){e.Result=ReadHardwareSnapshot();};
            bw.RunWorkerCompleted+=delegate(object sender,RunWorkerCompletedEventArgs e){
                try
                {
                    if(box.IsDisposed)return;
                    if(e.Error!=null){box.Text="Błąd odczytu: "+e.Error.GetBaseException().Message;AppendLog("Hardware Monitor PRO: "+e.Error.GetBaseException().Message);return;}
                    HardwareSnapshot h=(HardwareSnapshot)e.Result;
                    StringBuilder b=new StringBuilder();
                    b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — HARDWARE MONITOR PRO");
                    b.AppendLine("Data: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
                    b.AppendLine("CPU: "+h.Cpu);b.AppendLine("Rdzenie / wątki: "+h.Cores);b.AppendLine("Obciążenie CPU: "+h.CpuLoad);
                    b.AppendLine("RAM: "+h.Ram);b.AppendLine("GPU: "+h.Gpu);b.AppendLine("VRAM: "+h.Vram);
                    b.AppendLine("Status fizycznego GPU: "+h.GpuPhysicalStatus);b.AppendLine("Adaptery graficzne:");b.AppendLine(h.GpuDetails);
                    b.AppendLine("Temperatura ACPI: "+h.CpuTemperature);
                    b.AppendLine("BIOS: "+h.Bios);b.AppendLine("Płyta główna: "+h.Board);
                    b.AppendLine("Dyski fizyczne: "+h.Disks);b.AppendLine("Wolne miejsce: "+h.Drives);
                    b.AppendLine("TPM: "+h.Tpm);b.AppendLine("Firmware: "+h.Firmware);b.AppendLine("Secure Boot: "+h.SecureBoot);
                    box.Text=b.ToString();AppendLog("Odświeżono Hardware Monitor PRO.");
                }
                finally
                {
                    if(hardwareMonitorWorker==bw)hardwareMonitorWorker=null;
                    bw.Dispose();
                }
            };
            bw.RunWorkerAsync();
        }

        private void BuildDiskHealthPage()
        {
            if(FindPage("Zdrowie dysków")!=null)return;
            Panel p=NewPage("Zdrowie dysków","Disk Health PRO");
            Panel list=Card(p,"WYKRYTE DYSKI FIZYCZNE",10,8,950,190);
            diskHealthList=new ListBox();diskHealthList.Location=new Point(UX(18),UY(45));diskHealthList.Size=new Size(UX(895),UY(88));
            diskHealthList.BackColor=Color.FromArgb(7,13,23);diskHealthList.ForeColor=Color.FromArgb(205,235,245);
            list.Controls.Add(diskHealthList);
            ButtonAt(list,"ODŚWIEŻ LISTĘ",18,145,180,delegate{RefreshDiskHealth();});
            ButtonAt(list,"Optymalizuj dyski",210,145,200,delegate{RunCommand("dfrgui.exe","");});
            ButtonAt(list,"Zarządzanie dyskami",422,145,225,delegate{RunCommand("mmc.exe","diskmgmt.msc");});
            ButtonAt(list,"CHKDSK /scan",659,145,190,delegate{RunCommand("chkdsk.exe",Environment.GetEnvironmentVariable("SystemDrive")+" /scan");});

            Panel report=Card(p,"STATUS DYSKÓW / SMART / WOLUMINY",10,215,950,310);
            diskHealthReportBox=new TextBox();diskHealthReportBox.Multiline=true;diskHealthReportBox.ReadOnly=true;
            diskHealthReportBox.ScrollBars=ScrollBars.Both;diskHealthReportBox.WordWrap=false;
            diskHealthReportBox.Font=new Font("Consolas",8.5F);diskHealthReportBox.BackColor=Color.FromArgb(7,13,23);
            diskHealthReportBox.ForeColor=Color.FromArgb(205,235,245);
            diskHealthReportBox.Location=new Point(UX(18),UY(45));diskHealthReportBox.Size=new Size(UX(895),UY(255));
            report.Controls.Add(diskHealthReportBox);

            Panel note=Card(p,"INTERPRETACJA / NARZĘDZIA",10,540,950,145);
            LabelAt(note,"Status WMI „OK” i PredictFailure nie zastępują pełnego odczytu wszystkich atrybutów SMART. Nie każdy kontroler NVMe/USB udostępnia te dane. Brak danych nie oznacza zdrowia dysku. Przed testami obciążeniowymi wykonaj kopię.",18,43,900,48);
            ButtonAt(note,"Otwórz raport diagnostyczny",18,101,210,delegate{ShowPage("Diagnostyka PC");});
            ButtonAt(note,"NVMe / Storage Reliability",238,101,245,delegate{ShowPage("NVMe SSD Doctor");});
            ButtonAt(note,"Zapisz raport dysków",493,101,210,delegate{SaveTextReport(diskHealthReportBox,"DiskHealth");});
            ButtonAt(note,"KOPIA / ODZYSKIWANIE",713,101,210,delegate{ShowPage("Backup Recovery ULTIMATE");});
            RefreshDiskHealth();
        }

        private DiskHealthSnapshot ReadDiskHealthSnapshot()
        {
            DiskHealthSnapshot result=new DiskHealthSnapshot();
            StringBuilder report=new StringBuilder();
            report.AppendLine("KOMPUTEROWE CENTRUM SERWISU — DISK HEALTH PRO");
            report.AppendLine("Data: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
            report.AppendLine();
            try
            {
                using(ManagementObjectSearcher q=CreateTimedWmiSearcher("root\\cimv2","SELECT Index,Model,Status,Size,InterfaceType,MediaType,PNPDeviceID FROM Win32_DiskDrive",7))
                {
                    foreach(ManagementObject o in q.Get())
                    {
                        result.DiskCount++;
                        string model=Convert.ToString(o["Model"]);
                        string status=Convert.ToString(o["Status"]);
                        double size=0;try{size=Convert.ToDouble(o["Size"])/1073741824.0;}catch{}
                        string item="#"+Convert.ToString(o["Index"])+" | "+model+" | "+size.ToString("0.0",CultureInfo.InvariantCulture)+" GB | "+status;
                        result.Disks.Add(item);report.AppendLine(item);
                        report.AppendLine("  Interface: "+Convert.ToString(o["InterfaceType"])+" | Media: "+Convert.ToString(o["MediaType"]));
                        report.AppendLine("  PNP: "+Convert.ToString(o["PNPDeviceID"]));
                    }
                }
            }
            catch(Exception ex){report.AppendLine("Win32_DiskDrive error: "+ex.Message);}
            if(result.DiskCount==0)report.AppendLine("Nie zwrócono fizycznych dysków przez WMI.");
            report.AppendLine();report.AppendLine("PREDICTIVE FAILURE / SMART WMI:");
            try
            {
                using(ManagementObjectSearcher q=CreateTimedWmiSearcher("root\\WMI","SELECT InstanceName,PredictFailure,Reason FROM MSStorageDriver_FailurePredictStatus",6))
                {
                    foreach(ManagementObject o in q.Get())
                    {
                        result.SmartAvailable=true;
                        report.AppendLine("Instance: "+Convert.ToString(o["InstanceName"]));
                        report.AppendLine("PredictFailure: "+Convert.ToString(o["PredictFailure"]));
                        report.AppendLine("Reason: "+Convert.ToString(o["Reason"]));
                        report.AppendLine();
                    }
                }
            }
            catch(Exception ex){report.AppendLine("SMART WMI niedostępny: "+ex.Message);}
            if(!result.SmartAvailable)report.AppendLine("Brak danych PredictFailure. Kontroler/sterownik może nie udostępniać tej klasy; nie oznacza to automatycznie zdrowego dysku.");
            report.AppendLine();report.AppendLine("WOLUMINY:");
            foreach(DriveInfo d in DriveInfo.GetDrives())
            {
                try
                {
                    if(d.DriveType!=DriveType.Fixed && d.DriveType!=DriveType.Removable)continue;
                    if(d.IsReady)report.AppendLine(d.Name+" | "+d.DriveType+" | wolne "+Math.Round(d.AvailableFreeSpace/1073741824.0,1)+" GB / "+Math.Round(d.TotalSize/1073741824.0,1)+" GB");
                }
                catch(Exception ex){report.AppendLine(d.Name+" | wolumin niedostępny: "+ex.Message);}
            }
            report.AppendLine();report.AppendLine("Uwaga: WMI Status=OK nie jest pełnym testem SMART/NVMe. To odczyt informacyjny; przed testami naprawczymi wykonaj kopię danych.");
            result.Report=report.ToString();
            return result;
        }

        private void RefreshDiskHealth()
        {
            if(diskHealthList==null || diskHealthList.IsDisposed)return;
            if(diskHealthWorker!=null && diskHealthWorker.IsBusy)
            {
                if(diskHealthReportBox!=null && !diskHealthReportBox.IsDisposed)diskHealthReportBox.Text="Poprzedni odczyt dysków nadal trwa. Poczekaj na jego zakończenie.";
                return;
            }
            diskHealthList.Items.Clear();diskHealthList.Items.Add("Trwa bezpieczny odczyt dysków i SMART...");
            if(diskHealthReportBox!=null && !diskHealthReportBox.IsDisposed)diskHealthReportBox.Text="Odczytuję Win32_DiskDrive, SMART i woluminy w tle. Interfejs pozostaje dostępny.";
            BackgroundWorker worker=new BackgroundWorker();
            diskHealthWorker=worker;
            worker.DoWork+=delegate(object sender,DoWorkEventArgs e){e.Result=ReadDiskHealthSnapshot();};
            worker.RunWorkerCompleted+=delegate(object sender,RunWorkerCompletedEventArgs e)
            {
                try
                {
                    if(diskHealthList==null || diskHealthList.IsDisposed)return;
                    if(e.Error!=null)
                    {
                        diskHealthList.Items.Clear();diskHealthList.Items.Add("Błąd odczytu dysków — sprawdź raport.");
                        if(diskHealthReportBox!=null && !diskHealthReportBox.IsDisposed)diskHealthReportBox.Text="Błąd odczytu dysków: "+e.Error.GetBaseException().Message;
                        AppendLog("Disk Health PRO: błąd odczytu WMI — "+e.Error.GetBaseException().Message);return;
                    }
                    DiskHealthSnapshot snap=(DiskHealthSnapshot)e.Result;
                    diskHealthList.BeginUpdate();
                    try
                    {
                        diskHealthList.Items.Clear();
                        if(snap.Disks.Count==0)diskHealthList.Items.Add("Nie wykryto dysków przez WMI — sprawdź Menedżer urządzeń.");
                        else foreach(string disk in snap.Disks)diskHealthList.Items.Add(disk);
                    }
                    finally{diskHealthList.EndUpdate();}
                    if(diskHealthReportBox!=null && !diskHealthReportBox.IsDisposed)diskHealthReportBox.Text=snap.Report;
                    AppendLog("Odczyt Disk Health PRO zakończony; wykryto dysków: "+snap.DiskCount+"; SMART WMI: "+(snap.SmartAvailable?"dostępny":"brak danych"));
                }
                finally
                {
                    if(diskHealthWorker==worker)diskHealthWorker=null;
                    worker.Dispose();
                }
            };
            try{worker.RunWorkerAsync();}
            catch(Exception ex)
            {
                if(diskHealthWorker==worker)diskHealthWorker=null;
                worker.Dispose();
                if(diskHealthReportBox!=null && !diskHealthReportBox.IsDisposed)diskHealthReportBox.Text="Nie udało się uruchomić odczytu dysków: "+ex.Message;
                AppendLog("Disk Health PRO: nie udało się uruchomić workera — "+ex.Message);
            }
        }


        private void BuildServiceDeskPage()
        {
            if(FindPage("Serwis klientów")!=null)return;
            Panel p=NewPage("Serwis klientów","Kartoteka klientów i zlecenia serwisowe");
            Panel details=Card(p,"KARTA KLIENTA / ZGŁOSZENIE SERWISOWE",10,8,950,400);

            LabelAt(details,"Klient / firma",18,43,135,24);
            serviceClientBox=TextAt(details,160,39,725,26,"");

            LabelAt(details,"Komputer / model",18,82,180,24);
            serviceDeviceBox=TextAt(details,200,78,685,26,Environment.MachineName);

            LabelAt(details,"Telefon",18,121,90,24);
            servicePhoneBox=TextAt(details,105,117,300,26,"");
            LabelAt(details,"E-mail",430,121,80,24);
            serviceEmailBox=TextAt(details,510,117,375,26,"");

            LabelAt(details,"Opis usterki / cel usługi",18,160,230,24);
            serviceProblemBox=TextAt(details,245,156,640,26,"");

            LabelAt(details,"Wykonane czynności",18,198,180,24);
            serviceActionsBox=TextAt(details,18,222,867,48,"");
            serviceActionsBox.Multiline=true;serviceActionsBox.ScrollBars=ScrollBars.Vertical;

            LabelAt(details,"Uwagi serwisanta",18,278,180,24);
            serviceNotesBox=TextAt(details,18,302,867,42,"");
            serviceNotesBox.Multiline=true;serviceNotesBox.ScrollBars=ScrollBars.Vertical;

            LabelAt(details,"Status",18,359,70,24);
            serviceStatusBox=ComboAt(details,new string[]{"Nowe","W diagnozie","Oczekuje na część","Oczekuje na klienta","W naprawie","Gotowe do odbioru","Zamknięte"},90,355,190);
            ButtonAt(details,"ZAPISZ / AKTUALIZUJ",296,352,195,delegate{SaveServiceCase();});
            ButtonAt(details,"NOWA KARTA",500,352,125,delegate{ClearServiceCase();});
            ButtonAt(details,"EKSPORT RAPORTU",634,352,150,delegate{ExportServiceCase();});
            ButtonAt(details,"USUŃ",793,352,92,delegate{DeleteServiceCase();});

            Panel history=Card(p,"HISTORIA ZGŁOSZEŃ — WYBIERZ WPIS, ABY GO EDYTOWAĆ",10,420,950,225);
            serviceCaseList=new ListBox();serviceCaseList.Location=new Point(UX(18),UY(43));serviceCaseList.Size=new Size(UX(895),UY(167));
            serviceCaseList.BackColor=Color.FromArgb(7,13,23);serviceCaseList.ForeColor=Color.FromArgb(205,235,245);
            serviceCaseList.Font=new Font("Segoe UI",9F);history.Controls.Add(serviceCaseList);
            serviceCaseList.SelectedIndexChanged+=delegate{LoadSelectedServiceCase();};
            LoadServiceCases();

            Panel privacy=Card(p,"PRYWATNOŚĆ I KOPIA KARTOTEKI",10,660,950,115);
            LabelAt(privacy,"Dane kontaktowe i zgłoszenia są przechowywane lokalnie. Plik XML nie jest szyfrowany — zabezpiecz konto Windows i folder danych. Wykonuj regularną kopię folderu Data/ServiceDesk; program nie przesyła danych klientów do chmury.",18,43,900,58);
            p.AutoScrollMinSize=new Size(0,790);
        }

        private XmlDocument LoadServiceCaseDocument()
        {
            XmlDocument d=new XmlDocument();
            if(File.Exists(serviceCasesPath))d.Load(serviceCasesPath);
            else {
                XmlElement root=d.CreateElement("ServiceCases");
                d.AppendChild(root);
            }
            if(d.DocumentElement==null) {
                XmlElement root=d.CreateElement("ServiceCases");d.AppendChild(root);
            }
            return d;
        }


        private void SaveServiceCase()
        {
            if(serviceClientBox==null)return;
            if(String.IsNullOrWhiteSpace(serviceClientBox.Text) || String.IsNullOrWhiteSpace(serviceDeviceBox.Text)) {
                MessageBox.Show("Wpisz klienta oraz komputer/model urządzenia.");return;
            }
            try {
                XmlDocument d=LoadServiceCaseDocument();
                XmlElement item=null;
                if(!String.IsNullOrEmpty(selectedServiceCaseId))
                {
                    foreach(XmlNode node in d.DocumentElement.SelectNodes("Case"))
                        if(node.Attributes["id"]!=null && node.Attributes["id"].Value==selectedServiceCaseId){item=node as XmlElement;break;}
                }
                bool created=item==null;
                if(created)
                {
                    item=d.CreateElement("Case");
                    selectedServiceCaseId=DateTime.Now.ToString("yyyyMMddHHmmss")+"-"+Guid.NewGuid().ToString("N").Substring(0,8);
                    item.SetAttribute("id",selectedServiceCaseId);
                    d.DocumentElement.AppendChild(item);
                }
                item.SetAttribute("date",DateTime.Now.ToString("o"));
                item.SetAttribute("status",serviceStatusBox==null?"Nowe":serviceStatusBox.Text);
                SetCaseValue(d,item,"Client",serviceClientBox.Text);
                SetCaseValue(d,item,"Device",serviceDeviceBox.Text);
                SetCaseValue(d,item,"Phone",servicePhoneBox==null?"":servicePhoneBox.Text);
                SetCaseValue(d,item,"Email",serviceEmailBox==null?"":serviceEmailBox.Text);
                SetCaseValue(d,item,"Problem",serviceProblemBox.Text);
                SetCaseValue(d,item,"Actions",serviceActionsBox.Text);
                SetCaseValue(d,item,"Notes",serviceNotesBox.Text);
                SetCaseValue(d,item,"Windows",GetOsCaption()+" / "+GetBuild());
                SetCaseValue(d,item,"Machine",Environment.MachineName);
                Directory.CreateDirectory(Path.GetDirectoryName(serviceCasesPath));
                SaveXmlSafely(d,serviceCasesPath,12);
                AppendLog((created?"Utworzono":"Zaktualizowano")+" zgłoszenie serwisowe dla: "+serviceClientBox.Text);
                LoadServiceCases();
                MessageBox.Show((created?"Zgłoszenie utworzone":"Zgłoszenie zaktualizowane")+" lokalnie:\r\n"+serviceCasesPath,"Kartoteka serwisowa");
            } catch(Exception ex){MessageBox.Show("Nie udało się zapisać zgłoszenia: "+ex.Message);}
        }

        private void SetCaseValue(XmlDocument d,XmlElement parent,string name,string value)
        {
            XmlNode existing=parent.SelectSingleNode(name);
            if(existing==null){XmlElement e=d.CreateElement(name);e.InnerText=value??"";parent.AppendChild(e);}
            else existing.InnerText=value??"";
        }

        private void DeleteServiceCase()
        {
            if(String.IsNullOrEmpty(selectedServiceCaseId)){MessageBox.Show("Najpierw wybierz zgłoszenie z historii.");return;}
            if(MessageBox.Show("Usunąć wybrane zgłoszenie z lokalnej kartoteki? Tej operacji nie można cofnąć.","Potwierdzenie usunięcia",MessageBoxButtons.YesNo,MessageBoxIcon.Warning,MessageBoxDefaultButton.Button2)!=DialogResult.Yes)return;
            try {
                XmlDocument d=LoadServiceCaseDocument();XmlElement target=null;
                foreach(XmlNode node in d.DocumentElement.SelectNodes("Case"))
                    if(node.Attributes["id"]!=null && node.Attributes["id"].Value==selectedServiceCaseId){target=node as XmlElement;break;}
                if(target!=null){d.DocumentElement.RemoveChild(target);SaveXmlSafely(d,serviceCasesPath,12);}
                AppendLog("Usunięto zgłoszenie z lokalnej kartoteki: "+selectedServiceCaseId);
                ClearServiceCase();LoadServiceCases();
            } catch(Exception ex){MessageBox.Show("Nie udało się usunąć zgłoszenia: "+ex.Message);}
        }

        private void AddCaseValue(XmlDocument d,XmlElement parent,string name,string value)
        {
            XmlElement e=d.CreateElement(name);e.InnerText=value??"";parent.AppendChild(e);
        }


        private void LoadServiceCases()
        {
            if(serviceCaseList==null)return;
            serviceCaseList.Items.Clear();
            try {
                XmlDocument d=LoadServiceCaseDocument();
                foreach(XmlNode n in d.SelectNodes("/ServiceCases/Case")) {
                    string date=n.Attributes["date"]==null?"":n.Attributes["date"].Value;
                    string client=n.SelectSingleNode("Client")==null?"":n.SelectSingleNode("Client").InnerText;
                    string device=n.SelectSingleNode("Device")==null?"":n.SelectSingleNode("Device").InnerText;
                    string id=n.Attributes["id"]==null?"":n.Attributes["id"].Value;
                    string status=n.Attributes["status"]==null?"Nowe":n.Attributes["status"].Value;
                    serviceCaseList.Items.Add(id+" | "+date+" | "+status+" | "+client+" | "+device);
                }
            } catch(Exception ex){AppendLog("Błąd odczytu kartoteki serwisowej: "+ex.Message);}
        }

        private void LoadSelectedServiceCase()
        {
            if(serviceCaseList==null || serviceCaseList.SelectedItem==null)return;
            string row=Convert.ToString(serviceCaseList.SelectedItem);
            string id=row.Split('|')[0].Trim();
            try {
                XmlDocument d=LoadServiceCaseDocument();
                XmlNode n=null;
                foreach(XmlNode node in d.SelectNodes("/ServiceCases/Case"))
                    if(node.Attributes["id"]!=null && node.Attributes["id"].Value==id){n=node;break;}
                if(n==null)return;
                selectedServiceCaseId=id;
                serviceClientBox.Text=ReadCaseValue(n,"Client");
                serviceDeviceBox.Text=ReadCaseValue(n,"Device");
                if(servicePhoneBox!=null)servicePhoneBox.Text=ReadCaseValue(n,"Phone");
                if(serviceEmailBox!=null)serviceEmailBox.Text=ReadCaseValue(n,"Email");
                serviceProblemBox.Text=ReadCaseValue(n,"Problem");
                serviceActionsBox.Text=ReadCaseValue(n,"Actions");
                serviceNotesBox.Text=ReadCaseValue(n,"Notes");
                if(serviceStatusBox!=null)
                {
                    string status=n.Attributes["status"]==null?"Nowe":n.Attributes["status"].Value;
                    int index=serviceStatusBox.Items.IndexOf(status);serviceStatusBox.SelectedIndex=index>=0?index:0;
                }
            } catch(Exception ex){AppendLog("Błąd wczytania zgłoszenia: "+ex.Message);}
        }

        private string ReadCaseValue(XmlNode n,string name)
        {
            XmlNode v=n.SelectSingleNode(name);return v==null?"":v.InnerText;
        }

        private void ClearServiceCase()
        {
            if(serviceClientBox==null)return;
            selectedServiceCaseId="";
            serviceClientBox.Clear();serviceDeviceBox.Text=Environment.MachineName;
            if(servicePhoneBox!=null)servicePhoneBox.Clear();
            if(serviceEmailBox!=null)serviceEmailBox.Clear();
            serviceProblemBox.Clear();serviceActionsBox.Clear();serviceNotesBox.Clear();
            if(serviceStatusBox!=null)serviceStatusBox.SelectedIndex=0;
            if(serviceCaseList!=null)serviceCaseList.ClearSelected();
        }

        private void ExportServiceCase()
        {
            if(serviceClientBox==null || String.IsNullOrWhiteSpace(serviceClientBox.Text)) {
                MessageBox.Show("Wybierz lub wypełnij zgłoszenie.");return;
            }
            SaveFileDialog d=new SaveFileDialog();d.Filter="Raport HTML (*.html)|*.html|Tekst (*.txt)|*.txt";
            d.FileName="Zgloszenie_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".html";
            if(d.ShowDialog()!=DialogResult.OK)return;
            StringBuilder b=new StringBuilder();
            b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — RAPORT SERWISOWY");
            b.AppendLine("Data: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
            b.AppendLine("Klient: "+serviceClientBox.Text);
            b.AppendLine("Urządzenie: "+serviceDeviceBox.Text);
            b.AppendLine("Telefon: "+(servicePhoneBox==null?"":servicePhoneBox.Text));
            b.AppendLine("E-mail: "+(serviceEmailBox==null?"":serviceEmailBox.Text));
            b.AppendLine("Status: "+(serviceStatusBox==null?"Nowe":serviceStatusBox.Text));
            b.AppendLine("Usterka: "+serviceProblemBox.Text);
            b.AppendLine("Czynności: "+serviceActionsBox.Text);
            b.AppendLine("Uwagi: "+serviceNotesBox.Text);
            b.AppendLine("System: "+GetOsCaption()+" / "+GetBuild());
            if(Path.GetExtension(d.FileName).Equals(".txt",StringComparison.OrdinalIgnoreCase))File.WriteAllText(d.FileName,b.ToString(),Encoding.UTF8);
            else {
                string safe=System.Security.SecurityElement.Escape(b.ToString());
                string page="<!doctype html><html><head><meta charset='utf-8'><title>Komputerowe Centrum Serwisu - raport serwisowy</title><style>body{font-family:Segoe UI,Arial;color:#152338;padding:28px}h1{color:#007eae}pre{white-space:pre-wrap}</style></head><body><h1>KOMPUTEROWE CENTRUM SERWISU — RAPORT SERWISOWY</h1><pre>"+safe+"</pre><button onclick='window.print()'>Drukuj / PDF</button></body></html>";
                File.WriteAllText(d.FileName,page,new UTF8Encoding(true));
            }
            AppendLog("Wyeksportowano zgłoszenie: "+d.FileName);
            try{Process.Start(d.FileName);}catch{}
        }


        // FIX053: local integrity baseline. This is a change detector, not a publisher signature.
        private void BuildIntegrityPage()
        {
            if(FindPage("Kontrola integralności")!=null)return;
            Panel p=NewPage("Kontrola integralności","Kontrola integralności programu");
            Panel intro=Card(p,"KONTROLA PLIKÓW APLIKACJI",10,8,950,145);
            LabelAt(intro,"Sprawdza SHA-256 pliku EXE i dostępnych plików programu względem lokalnie zapisanego wzorca. Wzorzec tworzysz po upewnieniu się, że bieżąca wersja pochodzi z zaufanego pakietu.",18,45,900,42);
            integrityStateLabel=LabelAt(intro,"STAN: nie wykonano kontroli.",18,90,650,24);
            ButtonAt(intro,"SPRAWDŹ INTEGRALNOŚĆ",18,112,225,delegate{RunIntegrityCheck(false);});
            ButtonAt(intro,"UTWÓRZ WZORZEC ZAUFANY",255,112,245,delegate{RunIntegrityCheck(true);});
            Panel results=Card(p,"WYNIK KONTROLI SHA-256",10,165,950,355);
            integrityReportBox=new TextBox();integrityReportBox.Multiline=true;integrityReportBox.ReadOnly=true;
            integrityReportBox.ScrollBars=ScrollBars.Both;integrityReportBox.WordWrap=false;
            integrityReportBox.Font=new Font("Consolas",8.5F);integrityReportBox.BackColor=Color.FromArgb(7,13,23);
            integrityReportBox.ForeColor=Color.FromArgb(205,235,245);
            integrityReportBox.Location=new Point(UX(18),UY(45));integrityReportBox.Size=new Size(UX(895),UY(285));
            results.Controls.Add(integrityReportBox);
            ButtonAt(results,"ZAPISZ RAPORT",18,318,170,delegate{SaveTextReport(integrityReportBox,"Integrity");});
            Panel note=Card(p,"WAŻNE OGRANICZENIE",10,535,950,115);
            LabelAt(note,"Lokalny wzorzec wykrywa późniejsze zmiany plików, ale sam nie potwierdza tożsamości wydawcy. Nie zastępuje podpisu cyfrowego ani wzorca pobranego z zaufanego, niezależnego źródła.",18,45,900,48);
            ButtonAt(note,"Otwórz folder danych",18,90,210,delegate{OpenDataFolder();});
            RenderIntegrityBaselineStatus();
        }

        private List<string> GetIntegrityCandidateFiles()
        {
            List<string> files=new List<string>();
            string appDir=Path.GetDirectoryName(Application.ExecutablePath);
            string[] names=new string[]{
                Application.ExecutablePath,
                Path.Combine(appDir,"VERSION.txt"),
                Path.Combine(appDir,"CHANGELOG.txt"),
                Path.Combine(appDir,"README.txt"),
                Path.Combine(appDir,"README_PORTABLE.txt"),
                Path.Combine(appDir,"app.manifest"),
                Path.Combine(appDir,"WindowsVersionSwitcherPRO.cs"),
                Path.Combine(appDir,"WindowsVersionSwitcherPRO.Modules.cs"),
                Path.Combine(appDir,"docs","VERSION.txt"),
                Path.Combine(appDir,"docs","CHANGELOG.txt"),
                Path.Combine(appDir,"docs","README.txt")
            };
            foreach(string f in names)if(File.Exists(f) && !files.Contains(f))files.Add(f);
            return files;
        }

        private string ComputeSha256(string file)
        {
            using(FileStream fs=File.OpenRead(file))
            using(SHA256 sha=SHA256.Create())
            {
                byte[] hash=sha.ComputeHash(fs);StringBuilder b=new StringBuilder();
                foreach(byte x in hash)b.Append(x.ToString("x2"));
                return b.ToString();
            }
        }

        private string GetIntegrityBaselinePath()
        {
            string dir=Path.Combine(dataRoot,"Integrity");
            if(!Directory.Exists(dir))Directory.CreateDirectory(dir);
            return Path.Combine(dir,"trusted-baseline.xml");
        }

        private void RenderIntegrityBaselineStatus()
        {
            string path=GetIntegrityBaselinePath();
            if(integrityStateLabel==null)return;
            integrityStateLabel.Text=File.Exists(path)?"STAN: lokalny wzorzec SHA-256 istnieje.":"STAN: brak wzorca — najpierw utwórz go po weryfikacji pakietu.";
        }

        private void RunIntegrityCheck(bool createBaseline)
        {
            if(integrityReportBox==null)return;
            string baseline=GetIntegrityBaselinePath();
            List<string> candidates=GetIntegrityCandidateFiles();
            StringBuilder report=new StringBuilder();
            report.AppendLine("KOMPUTEROWE CENTRUM SERWISU — KONTROLA INTEGRALNOŚCI");
            report.AppendLine("Data: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
            report.AppendLine("EXE: "+Application.ExecutablePath);
            report.AppendLine("Tryb: "+(createBaseline?"UTWORZENIE WZORCA":"PORÓWNANIE Z WZORCEM"));
            report.AppendLine();
            if(createBaseline)
            {
                if(MessageBox.Show("Utworzyć lokalny wzorzec SHA-256 na podstawie aktualnych plików?\r\n\r\nZrób to wyłącznie po sprawdzeniu, że bieżący EXE i pakiet FIX053 pochodzą z zaufanego źródła. Wzorzec lokalny nie potwierdza podpisu wydawcy.",
                    "Potwierdzenie wzorca integralności",MessageBoxButtons.YesNo,MessageBoxIcon.Warning,
                    MessageBoxDefaultButton.Button2)!=DialogResult.Yes)return;
                try
                {
                    XmlDocument d=new XmlDocument();XmlElement root=d.CreateElement("IntegrityBaseline");
                    root.SetAttribute("Created",DateTime.Now.ToString("o"));
                    root.SetAttribute("Computer",Environment.MachineName);
                    root.SetAttribute("ProductVersion",ProgramVersion);
                    d.AppendChild(root);
                    string appDir=Path.GetDirectoryName(Application.ExecutablePath);
                    foreach(string file in candidates)
                    {
                        string rel=file.Substring(appDir.TrimEnd(Path.DirectorySeparatorChar).Length).TrimStart(Path.DirectorySeparatorChar);
                        XmlElement item=d.CreateElement("File");item.SetAttribute("Path",rel);
                        item.SetAttribute("Length",new FileInfo(file).Length.ToString(CultureInfo.InvariantCulture));
                        item.SetAttribute("SHA256",ComputeSha256(file));root.AppendChild(item);
                    }
                    SaveXmlSafely(d,baseline,5);
                    report.AppendLine("Utworzono wzorzec: "+baseline);
                    report.AppendLine("Liczba plików: "+candidates.Count);
                    foreach(string f in candidates)report.AppendLine("[BASELINE] "+f+" | "+ComputeSha256(f));
                    integrityStateLabel.Text="STAN: zapisano lokalny wzorzec dla "+candidates.Count+" plików.";
                    AppendLog("Utworzono lokalny wzorzec integralności SHA-256.");
                }
                catch(Exception ex){report.AppendLine("BŁĄD: "+ex.Message);integrityStateLabel.Text="STAN: błąd zapisu wzorca.";AppendLog("Integrity baseline error: "+ex.Message);}
            }
            else
            {
                if(!File.Exists(baseline))
                {
                    report.AppendLine("BRAK WZORCA. Najpierw użyj „Utwórz wzorzec zaufany”.");
                    integrityStateLabel.Text="STAN: brak wzorca — kontrola porównawcza niemożliwa.";
                    integrityReportBox.Text=report.ToString();return;
                }
                try
                {
                    XmlDocument d=new XmlDocument();d.XmlResolver=null;d.Load(baseline);
                    XmlNodeList items=d.SelectNodes("/IntegrityBaseline/File");
                    int ok=0,changed=0,missing=0;
                    string appDir=Path.GetDirectoryName(Application.ExecutablePath);
                    foreach(XmlNode n in items)
                    {
                        string rel=n.Attributes["Path"].Value;
                        string full=Path.GetFullPath(Path.Combine(appDir,rel));
                        string root=Path.GetFullPath(appDir).TrimEnd(Path.DirectorySeparatorChar)+Path.DirectorySeparatorChar;
                        if(!full.StartsWith(root,StringComparison.OrdinalIgnoreCase))
                        {report.AppendLine("[ODRZUCONO] Ścieżka poza folderem aplikacji: "+rel);continue;}
                        if(!File.Exists(full)){missing++;report.AppendLine("[BRAK] "+rel);continue;}
                        string actual=ComputeSha256(full);
                        string expected=n.Attributes["SHA256"].Value;
                        long length=0;Int64.TryParse(n.Attributes["Length"].Value,out length);
                        long actualLength=new FileInfo(full).Length;
                        if(String.Equals(actual,expected,StringComparison.OrdinalIgnoreCase) && actualLength==length)
                        {ok++;report.AppendLine("[OK] "+rel+" | "+actual);}
                        else {changed++;report.AppendLine("[ZMIENIONO] "+rel+" | SHA256="+actual+" | rozmiar="+actualLength);}
                    }
                    report.AppendLine();
                    report.AppendLine("PODSUMOWANIE: OK="+ok+" | ZMIENIONE="+changed+" | BRAKUJĄCE="+missing);
                    integrityStateLabel.Text=changed==0 && missing==0?"STAN: pliki zgodne z lokalnym wzorcem.":"STAN: wykryto różnice — sprawdź raport.";
                    AppendLog("Kontrola integralności: OK="+ok+" changed="+changed+" missing="+missing);
                }
                catch(Exception ex){report.AppendLine("BŁĄD ODCZYTU WZORCA: "+ex.Message);integrityStateLabel.Text="STAN: nie udało się sprawdzić wzorca.";}
            }
            integrityReportBox.Text=report.ToString();
        }

        private void SaveTextReport(TextBox source,string prefix)
        {
            if(source==null || String.IsNullOrWhiteSpace(source.Text)){MessageBox.Show("Najpierw wykonaj kontrolę.");return;}
            SaveFileDialog d=new SaveFileDialog();d.Filter="Raport tekstowy (*.txt)|*.txt";
            d.FileName=prefix+"_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".txt";
            if(d.ShowDialog()!=DialogResult.OK)return;
            try{File.WriteAllText(d.FileName,source.Text,Encoding.UTF8);AppendLog("Zapisano raport: "+d.FileName);}
            catch(Exception ex){MessageBox.Show("Nie udało się zapisać raportu: "+ex.Message);}
        }

        private void BuildConfigurationPage()
        {
            if(FindPage("Konfiguracja PRO")!=null)return;
            Panel p=NewPage("Konfiguracja PRO","Kopia konfiguracji PRO");
            Panel intro=Card(p,"EKSPORT / IMPORT USTAWIEŃ",10,8,950,175);
            LabelAt(intro,"Eksportuje wybór systemu, kanałów, edycji, architektury, języka, motywu i ścieżek ostatniego projektu. Nie kopiuje obrazów systemu, danych klientów ani backupów.",18,45,900,45);
            ButtonAt(intro,"EKSPORTUJ KONFIGURACJĘ",18,98,240,delegate{ExportConfiguration();});
            ButtonAt(intro,"IMPORTUJ KONFIGURACJĘ",270,98,240,delegate{ImportConfiguration();});
            ButtonAt(intro,"OTWÓRZ FOLDER DANYCH",522,98,220,delegate{OpenDataFolder();});
            Panel safety=Card(p,"KOPIA USTAWIEŃ PRZED IMPORTEM",10,195,950,145);
            LabelAt(safety,"Przed importem aktualna konfiguracja trafia do rotacyjnej kopii .backup_*.xml. Import obejmuje wyłącznie settings.xml — nie przenosi plików ani nie zmienia lokalizacji backupów.",18,45,900,42);
            ButtonAt(safety,"UTWÓRZ KOPIĘ TERAZ",18,96,210,delegate{BackupConfigurationNow();});
            ButtonAt(safety,"OTWÓRZ PLIK USTAWIEŃ",240,96,220,delegate{OpenConfigurationFile();});
            Panel note=Card(p,"UWAGA",10,360,950,110);
            LabelAt(note,"Po imporcie uruchom program ponownie, aby zastosować wszystkie wybory i motyw. Zaimportowana ścieżka ISO lub manifestu może nie istnieć na tym komputerze — program nie pobiera ani nie przywraca tych plików automatycznie.",18,45,900,45);
            Panel recovery=Card(p,"AUTOMATYCZNA OCHRONA / WALIDACJA / ODTWARZANIE KONFIGURACJI",10,480,950,165);
            LabelAt(recovery,"Ustawienia są zapisywane atomowo. Przed zmianą poprzedni poprawny XML trafia do rotacyjnych kopii; przy uszkodzeniu pliku program próbuje odzyskać najnowszą prawidłową wersję.",18,43,900,42);
            ButtonAt(recovery,"SPRAWDŹ KONFIGURACJĘ",18,100,210,delegate{ValidateConfigurationNow();});
            ButtonAt(recovery,"PRZYWRÓĆ OSTATNIĄ KOPIĘ",240,100,235,delegate{RestoreLatestConfigBackup();});
            ButtonAt(recovery,"OTWÓRZ KOPIE KONFIGURACJI",487,100,250,delegate{OpenConfigBackupFolder();});
            p.AutoScrollMinSize=new Size(0,680);
        }

        private void BackupConfigurationNow()
        {
            try
            {
                SaveConfig();
                if(!File.Exists(configPath)){MessageBox.Show("Nie znaleziono settings.xml.");return;}
                string backup=CreateConfigBackupSnapshot();
                if(String.IsNullOrEmpty(backup)){MessageBox.Show("Nie utworzono kopii konfiguracji.");return;}
                AppendLog("Utworzono ręczną kopię konfiguracji: "+backup);
                MessageBox.Show("Kopia konfiguracji zapisana:\r\n"+backup,"Kopia ustawień");
            }
            catch(Exception ex){MessageBox.Show("Nie udało się wykonać kopii konfiguracji: "+ex.GetBaseException().Message);}
        }

        private void ValidateConfigurationNow()
        {
            try
            {
                SaveConfig();
                XmlDocument document;string error;
                bool valid=TryLoadXmlDocument(configPath,out document,out error) && IsValidSettingsDocument(document,out error);
                List<string> backups=GetConfigBackupCandidates();int validBackups=0;
                foreach(string file in backups){XmlDocument b;string e;if(TryLoadXmlDocument(file,out b,out e)&&IsValidSettingsDocument(b,out e))validBackups++;}
                string report="WYNIK KONTROLI KONFIGURACJI\r\n\r\nPlik: "+configPath+"\r\nStan: "+(valid?"POPRAWNY":"BŁĄD — "+error)+"\r\nKopie znalezione: "+backups.Count+"\r\nKopie poprawne: "+validBackups+"\r\nStatus ostatniego wczytania: "+configLoadStatus+"\r\n\r\nRotacja: maksymalnie 12 kopii XML.\r\nZapis: plik tymczasowy → walidacja XML → atomowa podmiana.";
                AppendLog(valid?"Kontrola konfiguracji: PASS; kopie poprawne="+validBackups:"Kontrola konfiguracji: FAIL; "+error);
                MessageBox.Show(report,"Kontrola konfiguracji",MessageBoxButtons.OK,valid&&validBackups>0?MessageBoxIcon.Information:MessageBoxIcon.Warning);
            }
            catch(Exception ex){MessageBox.Show("Kontrola konfiguracji nie powiodła się: "+ex.GetBaseException().Message);}
        }

        private void RestoreLatestConfigBackup()
        {
            try
            {
                string selected="";
                foreach(string candidate in GetConfigBackupCandidates())
                {
                    XmlDocument d;string error;
                    if(TryLoadXmlDocument(candidate,out d,out error) && IsValidSettingsDocument(d,out error)){selected=candidate;break;}
                }
                if(String.IsNullOrEmpty(selected)){MessageBox.Show("Nie znaleziono poprawnej kopii ustawień.","Odzyskiwanie konfiguracji",MessageBoxButtons.OK,MessageBoxIcon.Warning);return;}
                if(MessageBox.Show("Przywrócić konfigurację z kopii?\r\n\r\n"+selected+"\r\n\r\nBieżące ustawienia zostaną najpierw zapisane do nowej kopii.","Potwierdź odzyskiwanie",MessageBoxButtons.YesNo,MessageBoxIcon.Warning,MessageBoxDefaultButton.Button2)!=DialogResult.Yes)return;
                SaveConfig();CreateConfigBackupSnapshot();
                XmlDocument backup;string loadError;
                if(!TryLoadXmlDocument(selected,out backup,out loadError) || !IsValidSettingsDocument(backup,out loadError))throw new InvalidDataException("Wybrana kopia przestała być poprawna: "+loadError);
                SaveXmlSafely(backup,configPath,12);
                LoadConfig();selectedIso=savedIsoPath;ApplyTheme();ApplyInterfaceStyle();
                string page=IsKnownPageId(savedLastPage)?savedLastPage:"Pulpit";ShowPage(page);
                AppendLog("Przywrócono konfigurację z kopii: "+selected);
                MessageBox.Show("Konfiguracja została przywrócona. Moduł i wygląd zostały odświeżone.","Odzyskiwanie konfiguracji",MessageBoxButtons.OK,MessageBoxIcon.Information);
            }
            catch(Exception ex){MessageBox.Show("Nie udało się przywrócić konfiguracji: "+ex.GetBaseException().Message,"Odzyskiwanie konfiguracji",MessageBoxButtons.OK,MessageBoxIcon.Error);}
        }

        private void OpenConfigBackupFolder()
        {
            try
            {
                string dir=Path.GetDirectoryName(configPath);if(!Directory.Exists(dir))Directory.CreateDirectory(dir);
                if(Directory.GetFiles(dir,Path.GetFileName(configPath)+".backup_*.xml").Length==0)CreateConfigBackupSnapshot();
                Process.Start("explorer.exe",dir);
            }
            catch(Exception ex){MessageBox.Show("Nie udało się otworzyć folderu kopii: "+ex.GetBaseException().Message);}
        }

        private void ExportConfiguration()
        {
            try
            {
                SaveConfig();
                if(!File.Exists(configPath)){MessageBox.Show("Nie znaleziono pliku konfiguracji.");return;}
                SaveFileDialog d=new SaveFileDialog();d.Filter="Konfiguracja XML (*.xml)|*.xml";
                d.FileName="NaprawaPC_WindowsSwitcher_Settings_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".xml";
                if(d.ShowDialog()!=DialogResult.OK)return;
                File.Copy(configPath,d.FileName,true);
                AppendLog("Wyeksportowano konfigurację: "+d.FileName);
                MessageBox.Show("Konfiguracja wyeksportowana. Dane backupów i kartoteka klientów nie zostały skopiowane.");
            }
            catch(Exception ex){MessageBox.Show("Błąd eksportu konfiguracji: "+ex.Message);}
        }

        private void ImportConfiguration()
        {
            OpenFileDialog d=new OpenFileDialog();d.Filter="Konfiguracja NaprawaPC (*.xml)|*.xml";
            if(d.ShowDialog()!=DialogResult.OK)return;
            try
            {
                FileInfo info=new FileInfo(d.FileName);
                if(info.Length>1024*1024)throw new InvalidDataException("Plik konfiguracji jest większy niż 1 MB.");
                XmlDocument imported;string importLoadError;
                if(!TryLoadXmlDocument(d.FileName,out imported,out importLoadError))throw new InvalidDataException("Nie można bezpiecznie odczytać konfiguracji: "+importLoadError);
                if(imported.DocumentElement==null || imported.DocumentElement.Name!="Settings")
                    throw new InvalidDataException("Nieprawidłowy format. Oczekiwany główny element <Settings>.");
                string validationError;
                if(!IsValidSettingsDocument(imported,out validationError))throw new InvalidDataException(validationError);
                if(MessageBox.Show("Import zastąpi bieżące ustawienia programu. Najpierw utworzę kopię aktualnego settings.xml.\r\n\r\nKontynuować?",
                    "Import konfiguracji",MessageBoxButtons.YesNo,MessageBoxIcon.Warning,MessageBoxDefaultButton.Button2)!=DialogResult.Yes)return;
                SaveConfig();CreateConfigBackupSnapshot();
                SaveXmlSafely(imported,configPath,12);
                LoadConfig();selectedIso=savedIsoPath;ApplyTheme();ApplyInterfaceStyle();
                AppendLog("Zaimportowano konfigurację z: "+d.FileName);
                MessageBox.Show("Konfiguracja została zaimportowana. Zamknij i uruchom program ponownie, aby zastosować wszystkie ustawienia.");
            }
            catch(Exception ex){MessageBox.Show("Nie udało się zaimportować konfiguracji: "+ex.Message,"Import konfiguracji",MessageBoxButtons.OK,MessageBoxIcon.Error);}
        }

        private void OpenConfigurationFile()
        {
            try
            {
                SaveConfig();
                if(File.Exists(configPath))Process.Start("notepad.exe",configPath);
                else MessageBox.Show("Plik konfiguracji jeszcze nie istnieje.");
            }
            catch(Exception ex){MessageBox.Show(ex.Message);}
        }

        private void BuildMigrationReadinessPage()
        {
            if(FindPage("Raport przed migracją")!=null)return;
            Panel p=NewPage("Raport przed migracją","Raport przed migracją");
            Panel top=Card(p,"KONTROLA GOTOWOŚCI — PRZED AKTUALIZACJĄ",10,8,950,145);
            LabelAt(top,"Kontrola zbiera informacje o systemie, wybranym celu, kopii, wolnym miejscu, firmware, TPM, Secure Boot oraz dostępności instalatora. Nie zastępuje oficjalnego skanu Windows Setup.",18,45,900,42);
            ButtonAt(top,"ODŚWIEŻ KONTROLĘ",18,95,200,delegate{RefreshMigrationReadiness();});
            ButtonAt(top,"ZAPISZ RAPORT",230,95,180,delegate{SaveTextReport(migrationReadinessBox,"PreMigration");});
            ButtonAt(top,"Otwórz migrację",422,95,190,delegate{ShowPage("Migracja");});
            Panel result=Card(p,"RAPORT WYNIKOWY",10,165,950,390);
            migrationReadinessBox=new TextBox();migrationReadinessBox.Multiline=true;migrationReadinessBox.ReadOnly=true;
            migrationReadinessBox.ScrollBars=ScrollBars.Both;migrationReadinessBox.WordWrap=false;
            migrationReadinessBox.Font=new Font("Consolas",8.5F);migrationReadinessBox.BackColor=Color.FromArgb(7,13,23);
            migrationReadinessBox.ForeColor=Color.FromArgb(205,235,245);
            migrationReadinessBox.Location=new Point(UX(18),UY(45));migrationReadinessBox.Size=new Size(UX(895),UY(330));
            result.Controls.Add(migrationReadinessBox);
            Panel note=Card(p,"ZASADA BEZPIECZEŃSTWA",10,565,950,105);
            LabelAt(note,"Raport nie uruchamia instalacji. Jeśli którakolwiek pozycja jest nieznana albo niezaliczona, wstrzymaj migrację i sprawdź ją ręcznie. Keep All potwierdza dopiero rzeczywista opcja Windows Setup.",18,45,900,40);
            RefreshMigrationReadiness();
        }

        private string BuildMigrationReadinessReport()
        {
            StringBuilder b=new StringBuilder();
            b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — RAPORT GOTOWOŚCI DO MIGRACJI");
            b.AppendLine("Data: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
            b.AppendLine("Komputer: "+Environment.MachineName);
            b.AppendLine("System źródłowy: "+GetOsCaption()+" | "+GetBuild()+" | "+GetArchitecture());
            b.AppendLine("EditionID: "+GetEditionId());
            b.AppendLine("Cel: "+(targetBox==null?savedTarget:targetBox.Text));
            b.AppendLine("Kanał Windows: "+(windowsChannelBox==null?savedWindowsChannel:windowsChannelBox.Text));
            b.AppendLine("Edycja docelowa: "+(migrationEditionBox==null?savedEdition:migrationEditionBox.Text));
            b.AppendLine("Architektura: "+(migrationArchBox==null?savedArchitecture:migrationArchBox.Text));
            b.AppendLine("Język: "+(migrationLanguageBox==null?savedLanguage:migrationLanguageBox.Text));
            b.AppendLine("Tryb: "+(installationModeBox==null?savedInstallMode:installationModeBox.Text));
            b.AppendLine("ISO: "+(String.IsNullOrEmpty(selectedIso)?"nie wybrano":selectedIso));
            b.AppendLine("setup.exe: "+(String.IsNullOrEmpty(selectedSetup)?"nie wybrano":selectedSetup));
            b.AppendLine();
            b.AppendLine("KONTROLE:");
            b.AppendLine((IsAdmin()?"[OK]":"[UWAGA]")+" Uprawnienia administratora: "+IsAdmin());
            b.AppendLine((HasVerifiedBackup()?"[OK]":"[BRAK]")+" Zweryfikowana kopia plików + obraz systemu: "+HasVerifiedBackup());
            b.AppendLine((File.Exists(selectedSetup)?"[OK]":"[BRAK]")+" Wybrany setup.exe istnieje.");
            string systemRoot=Path.GetPathRoot(Environment.GetFolderPath(Environment.SpecialFolder.System));
            try{DriveInfo sys=new DriveInfo(systemRoot);b.AppendLine("[INFO] Dysk systemowy: wolne "+Math.Round(sys.AvailableFreeSpace/1073741824.0,1)+" GB / "+Math.Round(sys.TotalSize/1073741824.0,1)+" GB");}
            catch(Exception ex){b.AppendLine("[NIEZNANE] Wolne miejsce: "+ex.Message);}
            b.AppendLine("[INFO] Firmware: "+ReadFirmwareType());
            b.AppendLine("[INFO] Secure Boot: "+ReadSecureBoot());
            b.AppendLine("[INFO] TPM: "+ReadTpmSpec());
            b.AppendLine("[INFO] Status skanu Setup: "+(scanPassed?"zaliczony dla bieżącego fingerprintu":"niezaliczony / nie wykonano"));
            string route;
            bool routeAllowed=StrictRoute(out route);
            b.AppendLine((routeAllowed?"[TRASA WSTĘPNIE DOZWOLONA] ":"[TRASA ZABLOKOWANA] ")+route);
            b.AppendLine();
            b.AppendLine("WAŻNE: to raport wstępny. Nie potwierdza zgodności sterowników ani rzeczywistej opcji Keep All. Windows Setup może nadal zablokować proces.");
            b.AppendLine("Nie kontynuuj, jeśli Setup nie oferuje 'Zachowaj pliki osobiste i aplikacje'.");
            return b.ToString();
        }

        private void RefreshMigrationReadiness()
        {
            if(migrationReadinessBox==null)return;
            migrationReadinessBox.Text="Tworzenie raportu gotowości...";
            migrationReadinessBox.Text=BuildMigrationReadinessReport();
            AppendLog("Odświeżono raport przed migracją.");
        }

        private string GetPartitionFirmwareReport()
        {
            StringBuilder b=new StringBuilder();
            b.AppendLine("PARTYCJE / GPT / MBR / UEFI");
            b.AppendLine("Firmware: "+ReadFirmwareType());
            b.AppendLine("Secure Boot: "+ReadSecureBoot());
            b.AppendLine("TPM: "+ReadTpmSpec());
            b.AppendLine();
            b.AppendLine("GET-DISK (PowerShell Storage module):");
            try
            {
                string powershell=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"WindowsPowerShell","v1.0","powershell.exe");
                if(File.Exists(powershell))
                {
                    int code;string output=CaptureExternal(powershell,
                        "-NoProfile -ExecutionPolicy Bypass -Command \"Get-Disk | Select-Object Number,FriendlyName,PartitionStyle,OperationalStatus,IsBoot,IsSystem,Size | Format-Table -AutoSize | Out-String -Width 220\"",out code);
                    b.AppendLine("ExitCode: "+code);b.AppendLine(output);
                    if(code==0 && !String.IsNullOrWhiteSpace(output))return b.ToString();
                }
                else b.AppendLine("Windows PowerShell nie jest dostępny.");
            }
            catch(Exception ex){b.AppendLine("Get-Disk niedostępne: "+ex.Message);}
            b.AppendLine();
            b.AppendLine("WMI — dyski fizyczne:");
            try
            {
                using(ManagementObjectSearcher q=new ManagementObjectSearcher("SELECT Index,Model,InterfaceType,Size,Status FROM Win32_DiskDrive"))
                {
                    foreach(ManagementObject o in q.Get())
                    {
                        double size=0;try{size=Convert.ToDouble(o["Size"])/1073741824.0;}catch{}
                        b.AppendLine("Dysk "+Convert.ToString(o["Index"])+": "+Convert.ToString(o["Model"])+" | "+size.ToString("0.0",CultureInfo.InvariantCulture)+" GB | "+Convert.ToString(o["InterfaceType"])+" | "+Convert.ToString(o["Status"]));
                    }
                }
            }
            catch(Exception ex){b.AppendLine("Błąd WMI dysków: "+ex.Message);}
            b.AppendLine();
            b.AppendLine("WMI — partycje:");
            try
            {
                using(ManagementObjectSearcher q=new ManagementObjectSearcher("SELECT DeviceID,Type,BootPartition,PrimaryPartition,Size,StartingOffset FROM Win32_DiskPartition"))
                {
                    foreach(ManagementObject o in q.Get())
                    {
                        double size=0;try{size=Convert.ToDouble(o["Size"])/1073741824.0;}catch{}
                        b.AppendLine(Convert.ToString(o["DeviceID"])+" | "+Convert.ToString(o["Type"])+" | "+size.ToString("0.0",CultureInfo.InvariantCulture)+" GB | Boot="+Convert.ToString(o["BootPartition"])+" | Primary="+Convert.ToString(o["PrimaryPartition"]));
                    }
                }
            }
            catch(Exception ex){b.AppendLine("Błąd WMI partycji: "+ex.Message);}
            b.AppendLine();
            b.AppendLine("Uwaga: WMI nie zawsze podaje GPT/MBR. Jeśli Get-Disk nie działa, styl partycji pozostaje nieznany — nie zakładaj MBR ani GPT.");
            return b.ToString();
        }

        private void BuildPartitionFirmwarePage()
        {
            if(FindPage("Partycje i UEFI")!=null)return;
            Panel p=NewPage("Partycje i UEFI","Partycje / GPT / UEFI");
            Panel top=Card(p,"ROZPOZNANIE ROZRUCHU I PARTYCJI",10,8,950,145);
            LabelAt(top,"Wykrywa typ firmware, Secure Boot, TPM oraz próbuje pobrać styl dysków GPT/MBR i partycje przez PowerShell Storage/WMI.",18,45,900,40);
            ButtonAt(top,"ODŚWIEŻ INFORMACJE",18,95,210,delegate{RefreshPartitionFirmware();});
            ButtonAt(top,"ZARZĄDZANIE DYSKAMI",240,95,215,delegate{RunCommand("mmc.exe","diskmgmt.msc");});
            ButtonAt(top,"INFORMACJE SYSTEMOWE",468,95,220,delegate{RunCommand("msinfo32.exe","");});
            Panel result=Card(p,"RAPORT DYSKÓW I URUCHAMIANIA",10,165,950,390);
            partitionFirmwareBox=new TextBox();partitionFirmwareBox.Multiline=true;partitionFirmwareBox.ReadOnly=true;
            partitionFirmwareBox.ScrollBars=ScrollBars.Both;partitionFirmwareBox.WordWrap=false;
            partitionFirmwareBox.Font=new Font("Consolas",8.5F);partitionFirmwareBox.BackColor=Color.FromArgb(7,13,23);
            partitionFirmwareBox.ForeColor=Color.FromArgb(205,235,245);
            partitionFirmwareBox.Location=new Point(UX(18),UY(45));partitionFirmwareBox.Size=new Size(UX(895),UY(330));
            result.Controls.Add(partitionFirmwareBox);
            Panel note=Card(p,"UWAGA — NIE ZMIENIAJ PARTYCJI W CIEMNO",10,565,950,105);
            LabelAt(note,"Program tylko odczytuje informacje. Nie konwertuje MBR/GPT, nie formatuje EFI i nie zmienia ustawień BIOS. Zmiana trybu Legacy/UEFI lub konwersja partycji wymaga osobnego planu i pełnego backupu.",18,45,900,42);
            RefreshPartitionFirmware();
        }

        private void RefreshPartitionFirmware()
        {
            if(partitionFirmwareBox==null)return;
            partitionFirmwareBox.Text="Odczytywanie partycji i firmware...";
            partitionFirmwareBox.Text=GetPartitionFirmwareReport();
            AppendLog("Odświeżono raport GPT/MBR/UEFI.");
        }

        private bool IsSystemToolAvailable(string exe)
        {
            string system=Environment.GetFolderPath(Environment.SpecialFolder.System);
            if(File.Exists(Path.Combine(system,exe)))return true;
            string windows=Environment.GetFolderPath(Environment.SpecialFolder.Windows);
            if(File.Exists(Path.Combine(windows,exe)))return true;
            if(String.Equals(exe,"powershell.exe",StringComparison.OrdinalIgnoreCase))
                return File.Exists(Path.Combine(system,"WindowsPowerShell","v1.0","powershell.exe"));
            return false;
        }

        private string BuildSystemToolsReport()
        {
            string[] tools=new string[]{"dism.exe","sfc.exe","chkdsk.exe","wbadmin.exe","pnputil.exe","reagentc.exe","bcdboot.exe","diskpart.exe","powershell.exe","manage-bde.exe","msinfo32.exe","dxdiag.exe","wevtutil.exe"};
            StringBuilder b=new StringBuilder();
            b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — KONTROLA NARZĘDZI WINDOWS");
            b.AppendLine("Windows: "+GetOsCaption()+" | "+GetBuild()+" | "+GetArchitecture());
            b.AppendLine("Uruchomiono jako administrator: "+IsAdmin());
            b.AppendLine();
            foreach(string tool in tools)b.AppendLine((IsSystemToolAvailable(tool)?"[OK] ":"[BRAK] ")+tool);
            string kit=Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
            string adk=Path.Combine(kit,"Windows Kits","10","Assessment and Deployment Kit");
            b.AppendLine();
            b.AppendLine("WINDOWS ADK:");
            b.AppendLine(Directory.Exists(adk)?"[OK] ADK folder: "+adk:"[BRAK] Nie wykryto standardowego folderu ADK.");
            string winpe=Path.Combine(adk,"Windows Preinstallation Environment");
            b.AppendLine(Directory.Exists(winpe)?"[OK] WinPE Add-on folder":"[BRAK] WinPE Add-on lub inna lokalizacja.");
            string oscdimg=Path.Combine(adk,"Deployment Tools","amd64","Oscdimg","oscdimg.exe");
            b.AppendLine(File.Exists(oscdimg)?"[OK] oscdimg.exe":"[BRAK] oscdimg.exe w standardowej lokalizacji.");
            b.AppendLine();
            b.AppendLine("Brak narzędzia oznacza niedostępność danej funkcji na tym systemie, a nie awarię aplikacji.");
            return b.ToString();
        }

        private void BuildSystemToolsPage()
        {
            if(FindPage("Kontrola narzędzi")!=null)return;
            Panel p=NewPage("Kontrola narzędzi","Kontrola narzędzi Windows");
            Panel top=Card(p,"DOSTĘPNOŚĆ NARZĘDZI SYSTEMOWYCH",10,8,950,145);
            LabelAt(top,"Sprawdza narzędzia Windows i elementy ADK/WinPE wymagane przez funkcje serwisowe. Nie instaluje ani nie zmienia systemu.",18,45,900,40);
            ButtonAt(top,"ODŚWIEŻ LISTĘ",18,95,175,delegate{RefreshSystemTools();});
            ButtonAt(top,"ZAPISZ RAPORT",205,95,170,delegate{SaveTextReport(systemToolsBox,"WindowsTools");});
            ButtonAt(top,"POBIERZ ADK",387,95,170,delegate{OpenUrl("https://learn.microsoft.com/windows-hardware/get-started/adk-install");});
            ButtonAt(top,"POBIERZ WINPE",568,95,175,delegate{OpenUrl("https://learn.microsoft.com/windows-hardware/manufacture/desktop/winpe-intro");});
            Panel result=Card(p,"WYNIK WYKRYWANIA",10,165,950,355);
            systemToolsBox=new TextBox();systemToolsBox.Multiline=true;systemToolsBox.ReadOnly=true;
            systemToolsBox.ScrollBars=ScrollBars.Both;systemToolsBox.WordWrap=false;
            systemToolsBox.Font=new Font("Consolas",8.5F);systemToolsBox.BackColor=Color.FromArgb(7,13,23);
            systemToolsBox.ForeColor=Color.FromArgb(205,235,245);
            systemToolsBox.Location=new Point(UX(18),UY(45));systemToolsBox.Size=new Size(UX(895),UY(285));
            result.Controls.Add(systemToolsBox);
            RefreshSystemTools();
        }

        private void RefreshSystemTools()
        {
            if(systemToolsBox==null)return;
            systemToolsBox.Text=BuildSystemToolsReport();
            AppendLog("Odświeżono kontrolę narzędzi Windows / ADK.");
        }

        // FIX053 — Windows migration planner. Route is advisory; Setup decides Keep All.
        private void BuildMigrationPlannerPage()
        {
            if(FindPage("Plan migracji PRO")!=null)return;
            Panel p=NewPage("Plan migracji PRO","Windows Migration Planner PRO");
            Panel choices=Card(p,"WYBÓR SYSTEMU DOCELOWEGO",10,8,950,150);
            LabelAt(choices,"System wykryty: "+GetOsCaption()+" | build "+GetBuild()+" | architektura "+GetArchitecture(),18,45,900,24);
            LabelAt(choices,"Wybierz docelowy Windows",18,79,190,24);
            plannerTargetBox=ComboAt(choices,new string[]{"Windows 7","Windows 8.1","Windows 10","Windows 11"},215,75,260);
            if(plannerTargetBox.Items.Contains(savedTarget))plannerTargetBox.SelectedItem=savedTarget;
            else if(plannerTargetBox.Items.Contains("Windows 11"))plannerTargetBox.SelectedItem="Windows 11";
            ButtonAt(choices,"WYZNACZ TRASĘ",495,72,190,delegate{CreateMigrationPlan();});
            ButtonAt(choices,"PRZEJDŹ DO MIGRACJI",695,72,220,delegate{
                if(plannerTargetBox!=null && targetBox!=null && targetBox.Items.Contains(plannerTargetBox.Text))
                    targetBox.SelectedItem=plannerTargetBox.Text;
                savedTarget=plannerTargetBox==null?savedTarget:plannerTargetBox.Text;
                SaveConfig();ShowPage("Migracja");
            });
            Panel plan=Card(p,"PLAN MIGRACJI / OGRANICZENIA",10,170,950,390);
            plannerReportBox=new TextBox();plannerReportBox.Multiline=true;plannerReportBox.ReadOnly=true;
            plannerReportBox.ScrollBars=ScrollBars.Vertical;plannerReportBox.Font=new Font("Consolas",8.5F);
            plannerReportBox.BackColor=Color.FromArgb(7,13,23);plannerReportBox.ForeColor=Color.FromArgb(205,235,245);
            plannerReportBox.Location=new Point(UX(18),UY(45));plannerReportBox.Size=new Size(UX(895),UY(330));plan.Controls.Add(plannerReportBox);
            Panel warning=Card(p,"KEEP ALL — WAŻNE",10,570,950,125);
            LabelAt(warning,"Plan pokazuje techniczną trasę orientacyjną. Nie gwarantuje zachowania aplikacji ani danych. XP/Vista i część przejść 7/8 wymagają instalacji niestandardowej lub etapowej. Zawsze potwierdź opcję zachowania aplikacji w rzeczywistym Windows Setup.",18,45,900,60);
            CreateMigrationPlan();
        }

        private void CreateMigrationPlan()
        {
            if(plannerReportBox==null)return;
            string src=GetFamily();
            string target=plannerTargetBox==null?"Windows 11":plannerTargetBox.Text;
            string dst=target.Replace("Windows ","");
            StringBuilder b=new StringBuilder();
            b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — WINDOWS MIGRATION PLANNER PRO");
            b.AppendLine("Źródło: "+GetOsCaption()+" | rodzina "+src+" | "+GetBuild());
            b.AppendLine("Cel: "+target+" | data: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
            b.AppendLine();
            b.AppendLine("PROPONOWANA ŚCIEŻKA:");
            if(src==dst) b.AppendLine("[INFO] System jest już w wybranej rodzinie. Użyj aktualizacji wersji/kompilacji, jeśli jest dostępna.");
            else if(src=="XP" && dst=="7")
            {
                b.AppendLine("1. Wykonaj pełny obraz dysku i kopię danych.");
                b.AppendLine("2. Sprawdź aplikacje, licencje, sterowniki i architekturę.");
                b.AppendLine("3. Windows XP → Windows 7: planuj instalację niestandardową; zachowanie zainstalowanych programów nie jest oferowane jako Keep All.");
                b.AppendLine("4. Po instalacji odtwórz dane i ponownie zainstaluj aplikacje.");
            }
            else if((src=="7" || src=="8.1") && dst=="10")
            {
                b.AppendLine("1. Zweryfikuj edycję, język i architekturę.");
                b.AppendLine("2. Wykonaj pełny obraz systemu.");
                b.AppendLine("3. Uruchom zgodny instalator Windows 10 i sprawdź, czy oferuje zachowanie aplikacji.");
                b.AppendLine("4. Przed potwierdzeniem sprawdź listę zachowywanych elementów.");
            }
            else if(src=="8" && (dst=="10" || dst=="11"))
            {
                b.AppendLine("1. Windows 8 nie jest traktowany jako bezpośrednia ścieżka Keep All do celu.");
                b.AppendLine("2. Rozważ etap Windows 8.1, potem właściwą trasę do Windows 10/11, jeśli nośniki i aplikacje na to pozwolą.");
                b.AppendLine("3. Przygotuj możliwość instalacji niestandardowej i odtworzenia danych.");
            }
            else if(src=="10" && dst=="11")
            {
                b.AppendLine("1. Sprawdź CPU, TPM 2.0, Secure Boot, UEFI, RAM i wolne miejsce.");
                b.AppendLine("2. Wykonaj pełny obraz systemu na innym dysku.");
                b.AppendLine("3. Użyj oficjalnego instalatora Windows 11 zgodnego z edycją, językiem i architekturą.");
                b.AppendLine("4. Kontynuuj wyłącznie, jeśli Windows Setup oferuje „Zachowaj pliki osobiste i aplikacje”.");
            }
            else if((src=="7" || src=="8.1" || src=="XP" || src=="Vista") && dst=="11")
            {
                b.AppendLine("1. Brak gwarantowanej bezpośredniej ścieżki Keep All do Windows 11.");
                b.AppendLine("2. Wymagane może być etapowe przejście lub czysta instalacja.");
                b.AppendLine("3. Zweryfikuj zgodność sprzętu i dostępność sterowników dla Windows 11.");
                b.AppendLine("4. Nie rozpoczynaj operacji bez pełnego obrazu dysku i planu odtworzenia aplikacji.");
            }
            else
            {
                b.AppendLine("1. Sprawdź oficjalną dokumentację i wymagania docelowego Windows.");
                b.AppendLine("2. Zweryfikuj kompatybilność aplikacji, edycję, język i architekturę.");
                b.AppendLine("3. Wykonaj pełny backup i uruchom skan Windows Setup.");
            }
            b.AppendLine();
            b.AppendLine("KONTROLE PRZED STARTEM:");
            b.AppendLine("[INFO] Firmware: "+ReadFirmwareType());
            b.AppendLine("[INFO] Secure Boot: "+ReadSecureBoot());
            b.AppendLine("[INFO] TPM: "+ReadTpmSpec());
            b.AppendLine("[INFO] Zweryfikowana kopia: "+(HasVerifiedBackup()?"TAK":"NIE"));
            b.AppendLine("[INFO] Setup wskazany: "+(!String.IsNullOrEmpty(selectedSetup)&&File.Exists(selectedSetup)?"TAK":"NIE"));
            b.AppendLine();
            b.AppendLine("UWAGA: każda trasa jest orientacyjna. Rzeczywiste możliwości zależą od dokładnej wersji, edycji, języka, architektury, nośnika i komunikatów Setup.");
            plannerReportBox.Text=b.ToString();
            AppendLog("Wygenerowano plan migracji: "+src+" -> "+dst);
        }

        // System image recovery: inspect wbadmin catalog and reuse the existing verified backup workflow.
        private void BuildSystemImageRecoveryPage()
        {
            if(FindPage("Obraz systemu PRO")!=null)return;
            Panel p=NewPage("Obraz systemu PRO","System Image Recovery PRO");
            Panel source=Card(p,"LOKALIZACJA KOPII / DYSK BACKUPU",10,8,950,145);
            TextBox path=TextAt(source,18,47,690,26,"");
            ButtonAt(source,"Wybierz folder",720,43,195,delegate{
                FolderBrowserDialog d=new FolderBrowserDialog();d.Description="Wskaż wolumin lub folder zawierający kopię WindowsImageBackup.";
                if(d.ShowDialog()==DialogResult.OK)path.Text=d.SelectedPath;
            });
            ButtonAt(source,"SPRAWDŹ KATALOG WBADMIN",18,88,255,delegate{InspectSystemImageCatalog(path.Text);});
            ButtonAt(source,"UTWÓRZ KOPIĘ SYSTEMU",285,88,220,delegate{ShowPage("Kopia zapasowa");});
            Panel report=Card(p,"WYNIK WBADMIN / DOSTĘPNE WERSJE",10,165,950,335);
            systemImageReportBox=new TextBox();systemImageReportBox.Multiline=true;systemImageReportBox.ReadOnly=true;
            systemImageReportBox.ScrollBars=ScrollBars.Both;systemImageReportBox.WordWrap=false;
            systemImageReportBox.Font=new Font("Consolas",8.5F);systemImageReportBox.BackColor=Color.FromArgb(7,13,23);
            systemImageReportBox.ForeColor=Color.FromArgb(205,235,245);
            systemImageReportBox.Location=new Point(UX(18),UY(45));systemImageReportBox.Size=new Size(UX(895),UY(275));report.Controls.Add(systemImageReportBox);
            ButtonAt(report,"ZAPISZ RAPORT",18,300,175,delegate{SaveTextReport(systemImageReportBox,"SystemImage");});
            Panel info=Card(p,"PRZYWRACANIE OBRAZU",10,510,950,155);
            LabelAt(info,"Pełny obraz systemu przywraca się z Windows Recovery/WinPE. Przed odtworzeniem sprawdź datę kopii i dysk docelowy — operacja może nadpisać partycje i dane na dysku.",18,45,900,46);
            ButtonAt(info,"INSTRUKCJA ODZYSKIWANIA",18,100,250,delegate{ShowImageRestoreGuide();});
            ButtonAt(info,"URUCHOM WINRE",280,100,180,delegate{RequestWinRERestart();});
        }

        private void InspectSystemImageCatalog(string target)
        {
            if(String.IsNullOrWhiteSpace(target)){MessageBox.Show("Wskaż dysk lub folder kopii.");return;}
            if(!Directory.Exists(target)){MessageBox.Show("Wskazany folder nie istnieje.");return;}
            int code;string output=CaptureExternal(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"wbadmin.exe"),
                "get versions -backuptarget:"+QuoteCmd(target),out code);
            string report="WBADMIN GET VERSIONS\r\nCel: "+target+"\r\nKod wyjścia: "+code+"\r\n\r\n"+output;
            if(systemImageReportBox!=null)systemImageReportBox.Text=report;
            AppendLog("Sprawdzono katalog kopii wbadmin: "+target+"; exit="+code);
        }

        // BCD is backed up before any optional import. Default view operations are read-only.
        private void BuildBootManagerPage()
        {
            if(FindPage("Boot Manager PRO")!=null)return;
            Panel p=NewPage("Boot Manager PRO","Boot Manager PRO");
            Panel ops=Card(p,"BOOT CONFIGURATION DATA — ODCZYT I KOPIA",10,8,950,155);
            LabelAt(ops,"Domyślnie moduł tylko odczytuje wpisy rozruchowe. Eksport tworzy kopię BCD. Import zmienia konfigurację rozruchu i wymaga ponownego potwierdzenia.",18,45,900,42);
            ButtonAt(ops,"ODCZYTAJ BCD",18,95,170,delegate{RefreshBootManager();});
            ButtonAt(ops,"EKSPORTUJ BCD",198,95,170,delegate{ExportBcdStore();});
            ButtonAt(ops,"IMPORTUJ KOPIĘ BCD",378,95,210,delegate{ImportBcdStore();});
            ButtonAt(ops,"OTWÓRZ MSINFO32",600,95,190,delegate{RunCommand("msinfo32.exe","");});
            Panel result=Card(p,"WPISY ROZRUCHOWE / RAPORT",10,170,950,375);
            bootManagerReportBox=new TextBox();bootManagerReportBox.Multiline=true;bootManagerReportBox.ReadOnly=true;
            bootManagerReportBox.ScrollBars=ScrollBars.Both;bootManagerReportBox.WordWrap=false;
            bootManagerReportBox.Font=new Font("Consolas",8.5F);bootManagerReportBox.BackColor=Color.FromArgb(7,13,23);
            bootManagerReportBox.ForeColor=Color.FromArgb(205,235,245);
            bootManagerReportBox.Location=new Point(UX(18),UY(45));bootManagerReportBox.Size=new Size(UX(895),UY(315));result.Controls.Add(bootManagerReportBox);
            Panel note=Card(p,"OSTRZEŻENIE",10,555,950,120);
            LabelAt(note,"Nie usuwaj wpisów, nie zmieniaj BCD i nie formatuj partycji EFI bez pełnej kopii. Nieprawidłowa konfiguracja może zatrzymać rozruch Windows.",18,45,900,42);
            ButtonAt(note,"ZAPISZ RAPORT",18,90,180,delegate{SaveTextReport(bootManagerReportBox,"BootManager");});
            RefreshBootManager();
        }

        private void RefreshBootManager()
        {
            if(bootManagerReportBox==null)return;
            int code;string output=CaptureExternal(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"bcdedit.exe"),"/enum all /v",out code);
            bootManagerReportBox.Text="BCDEDIT /ENUM ALL /V\r\nKod: "+code+"\r\nFirmware: "+ReadFirmwareType()+"\r\n\r\n"+output;
            AppendLog("Odczytano magazyn BCD; exit="+code);
        }

        private void ExportBcdStore()
        {
            FolderBrowserDialog d=new FolderBrowserDialog();d.Description="Wybierz folder, w którym zapisać kopię BCD.";
            if(d.ShowDialog()!=DialogResult.OK)return;
            string file=Path.Combine(d.SelectedPath,"BCD_Backup_"+DateTime.Now.ToString("yyyyMMdd_HHmmss"));
            int code;string output=CaptureExternal(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"bcdedit.exe"),"/export "+QuoteCmd(file),out code);
            if(code==0 && File.Exists(file)){AppendLog("Wyeksportowano BCD: "+file);MessageBox.Show("Kopia BCD zapisana:\r\n"+file);}
            else MessageBox.Show("Eksport BCD nie został potwierdzony.\r\nKod: "+code+"\r\n"+output);
        }

        private void ImportBcdStore()
        {
            OpenFileDialog d=new OpenFileDialog();d.Title="Wybierz wcześniej wyeksportowaną kopię BCD";
            d.Filter="Pliki BCD bez rozszerzenia (*.*)|*.*";
            if(d.ShowDialog()!=DialogResult.OK)return;
            if(MessageBox.Show("IMPORT BCD NADPISZE BIEŻĄCY MAGAZYN ROZRUCHU.\r\n\r\nWykonuj to tylko z poprawną kopią odpowiadającą temu komputerowi i po przygotowaniu nośnika odzyskiwania. Kontynuować na własną odpowiedzialność?",
                "Krytyczna zmiana rozruchu",MessageBoxButtons.YesNo,MessageBoxIcon.Warning,MessageBoxDefaultButton.Button2)!=DialogResult.Yes)return;
            int code;string output=CaptureExternal(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"bcdedit.exe"),"/import "+QuoteCmd(d.FileName),out code);
            AppendLog("Import BCD: "+d.FileName+"; exit="+code);
            MessageBox.Show("Kod importu: "+code+"\r\n"+output+"\r\nPo imporcie może być wymagany restart.");
            RefreshBootManager();
        }

        // Driver checks report installed-device problems; they do not promise future driver availability.
        private void BuildDriverCompatibilityPage()
        {
            if(FindPage("Zgodność sterowników")!=null)return;
            Panel p=NewPage("Zgodność sterowników","Driver Compatibility Analyzer");
            Panel top=Card(p,"ANALIZA AKTUALNYCH URZĄDZEŃ",10,8,950,145);
            LabelAt(top,"Wykrywa bieżące problemy PnP i zapisuje wersje obecnych sterowników. Nie może zagwarantować dostępności sterownika dla przyszłej wersji Windows.",18,45,900,40);
            ButtonAt(top,"SKANUJ URZĄDZENIA",18,95,205,delegate{RunDriverCompatibilityScan();});
            ButtonAt(top,"EKSPORTUJ STEROWNIKI",235,95,220,delegate{ExportDrivers();});
            ButtonAt(top,"MENEDŻER URZĄDZEŃ",467,95,220,delegate{RunCommand("mmc.exe","devmgmt.msc");});
            Panel result=Card(p,"RAPORT URZĄDZEŃ / BŁĘDY PNP",10,165,950,385);
            driverCompatReportBox=new TextBox();driverCompatReportBox.Multiline=true;driverCompatReportBox.ReadOnly=true;
            driverCompatReportBox.ScrollBars=ScrollBars.Both;driverCompatReportBox.WordWrap=false;
            driverCompatReportBox.Font=new Font("Consolas",8.5F);driverCompatReportBox.BackColor=Color.FromArgb(7,13,23);
            driverCompatReportBox.ForeColor=Color.FromArgb(205,235,245);
            driverCompatReportBox.Location=new Point(UX(18),UY(45));driverCompatReportBox.Size=new Size(UX(895),UY(325));result.Controls.Add(driverCompatReportBox);
            ButtonAt(result,"ZAPISZ RAPORT",18,330,180,delegate{SaveTextReport(driverCompatReportBox,"DriverCompatibility");});
            Panel warning=Card(p,"INTERPRETACJA",10,560,950,110);
            LabelAt(warning,"Brak błędów PnP nie oznacza, że producent wspiera docelowy Windows. Sprawdź stronę producenta płyty, laptopa, GPU, Wi-Fi i urządzeń specjalistycznych.",18,45,900,42);
            RunDriverCompatibilityScan();
        }

        private void RunDriverCompatibilityScan()
        {
            if(driverCompatReportBox==null)return;
            StringBuilder b=new StringBuilder();b.AppendLine("DRIVER COMPATIBILITY — "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
            b.AppendLine("System: "+GetOsCaption()+" | "+GetBuild()+" | "+GetArchitecture());b.AppendLine();
            int total=0,problems=0;
            try
            {
                using(ManagementObjectSearcher q=new ManagementObjectSearcher("SELECT Name,PNPDeviceID,ConfigManagerErrorCode,Status FROM Win32_PnPEntity"))
                {
                    foreach(ManagementObject o in q.Get())
                    {
                        total++;
                        int code=0;try{code=Convert.ToInt32(o["ConfigManagerErrorCode"]);}catch{}
                        if(code!=0)
                        {
                            problems++;b.AppendLine("[PROBLEM CODE "+code+"] "+Convert.ToString(o["Name"]));
                            b.AppendLine("  PNP: "+Convert.ToString(o["PNPDeviceID"]));
                        }
                    }
                }
            }
            catch(Exception ex){b.AppendLine("WMI PnP error: "+ex.Message);}
            b.AppendLine();b.AppendLine("Liczba urządzeń: "+total+" | z kodem problemu: "+problems);
            int codeExit;string pnputil=CaptureExternal(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"pnputil.exe"),"/enum-drivers",out codeExit);
            b.AppendLine();b.AppendLine("PNPUTIL /ENUM-DRIVERS (exit "+codeExit+")");b.AppendLine(pnputil);
            b.AppendLine("Raport dotyczy bieżącego systemu. Nie przewiduje wsparcia przez producenta dla docelowego Windows.");
            driverCompatReportBox.Text=b.ToString();
            AppendLog("Skan zgodności bieżących sterowników: urządzenia="+total+" problemy="+problems);
        }

        private void BuildMigrationTaskCenterPage()
        {
            if(FindPage("Centrum zadań")!=null)return;
            Panel p=NewPage("Centrum zadań","Migration Task Center");
            Panel top=Card(p,"ZADANIA / HISTORIA PROCESU",10,8,950,145);
            LabelAt(top,"Panel pokazuje trwały dziennik działań programu. Nie wznawia samoczynnie przerwanego Windows Setup — wznowienie zależy od instalatora i stanu systemu.",18,45,900,40);
            ButtonAt(top,"ODŚWIEŻ HISTORIĘ",18,95,190,delegate{RefreshMigrationTaskCenter();});
            ButtonAt(top,"EKSPORTUJ HISTORIĘ",218,95,210,delegate{SaveTextReport(taskCenterReportBox,"MigrationTasks");});
            ButtonAt(top,"PRZEJDŹ DO MIGRACJI",440,95,220,delegate{ShowPage("Migracja");});
            Panel report=Card(p,"OSTATNIE OPERACJE",10,165,950,390);
            taskCenterReportBox=new TextBox();taskCenterReportBox.Multiline=true;taskCenterReportBox.ReadOnly=true;
            taskCenterReportBox.ScrollBars=ScrollBars.Both;taskCenterReportBox.WordWrap=false;
            taskCenterReportBox.Font=new Font("Consolas",8.5F);taskCenterReportBox.BackColor=Color.FromArgb(7,13,23);
            taskCenterReportBox.ForeColor=Color.FromArgb(205,235,245);
            taskCenterReportBox.Location=new Point(UX(18),UY(45));taskCenterReportBox.Size=new Size(UX(895),UY(330));report.Controls.Add(taskCenterReportBox);
            Panel quick=Card(p,"SZYBKIE ETAPY",10,565,950,120);
            ButtonAt(quick,"Kopia zapasowa",18,45,190,delegate{ShowPage("Kopia zapasowa");});
            ButtonAt(quick,"Raport gotowości",220,45,210,delegate{ShowPage("Raport przed migracją");});
            ButtonAt(quick,"Skan Setup",442,45,170,delegate{ShowPage("Migracja");});
            ButtonAt(quick,"Dziennik operacji",622,45,220,delegate{ShowPage("Dziennik operacji");});
            RefreshMigrationTaskCenter();
        }

        private void RefreshMigrationTaskCenter()
        {
            if(taskCenterReportBox==null)return;
            StringBuilder b=new StringBuilder();b.AppendLine("MIGRATION TASK CENTER");b.AppendLine("Data: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));b.AppendLine();
            int start=Math.Max(0,logHistory.Count-300);
            for(int i=logHistory.Count-1;i>=start;i--)b.AppendLine(logHistory[i]);
            if(logHistory.Count==0)b.AppendLine("Brak wpisów dziennika.");
            taskCenterReportBox.Text=b.ToString();
        }

        private void BuildWindowsLicensePage()
        {
            if(FindPage("Licencja Windows")!=null)return;
            Panel p=NewPage("Licencja Windows","Windows License Center");
            Panel info=Card(p,"INFORMACJE O AKTYWACJI",10,8,950,145);
            LabelAt(info,"Odczyt statusu licencji Windows — bez wyświetlania pełnego klucza produktu i bez zmiany aktywacji.",18,45,900,32);
            ButtonAt(info,"SPRAWDŹ AKTYWACJĘ",18,88,220,delegate{RefreshWindowsLicense();});
            ButtonAt(info,"OTWÓRZ USTAWIENIA AKTYWACJI",250,88,270,delegate{OpenUrl("ms-settings:activation");});
            Panel report=Card(p,"STATUS / WYGAŚNIĘCIE / EDYCJA",10,165,950,330);
            licenseReportBox=new TextBox();licenseReportBox.Multiline=true;licenseReportBox.ReadOnly=true;
            licenseReportBox.ScrollBars=ScrollBars.Vertical;licenseReportBox.Font=new Font("Consolas",8.5F);
            licenseReportBox.BackColor=Color.FromArgb(7,13,23);licenseReportBox.ForeColor=Color.FromArgb(205,235,245);
            licenseReportBox.Location=new Point(UX(18),UY(45));licenseReportBox.Size=new Size(UX(895),UY(270));report.Controls.Add(licenseReportBox);
            Panel warning=Card(p,"BEZPIECZEŃSTWO LICENCJI",10,505,950,115);
            LabelAt(warning,"Moduł nie zmienia klucza, nie omija aktywacji i nie aktywuje nieoryginalnych licencji. Do aktywacji używaj Ustawień Windows lub uprawnionego administratora organizacji.",18,45,900,45);
            RefreshWindowsLicense();
        }

        private void RefreshWindowsLicense()
        {
            if(licenseReportBox==null)return;
            StringBuilder b=new StringBuilder();b.AppendLine("WINDOWS LICENSE STATUS");b.AppendLine("System: "+GetOsCaption()+" | "+GetEditionId()+" | "+GetBuild());b.AppendLine();
            try
            {
                using(ManagementObjectSearcher q=new ManagementObjectSearcher("SELECT Name,Description,LicenseStatus,GracePeriodRemaining FROM SoftwareLicensingProduct WHERE ApplicationID='55c92734-d682-4d71-983e-d6ec3f16059f' AND PartialProductKey IS NOT NULL"))
                {
                    foreach(ManagementObject o in q.Get())
                    {
                        b.AppendLine("Produkt: "+Convert.ToString(o["Name"]));
                        b.AppendLine("Opis: "+Convert.ToString(o["Description"]));
                        int s=0;try{s=Convert.ToInt32(o["LicenseStatus"]);}catch{}
                        string status=s==1?"Licencjonowany":s==2?"Początkowy okres prolongaty":s==3?"Okres prolongaty":s==4?"Tryb nieoryginalny":s==5?"Powiadomienia":s==0?"Nielicencjonowany":"Nieznany";
                        b.AppendLine("Status: "+status+" ("+s+")");
                        b.AppendLine("Pozostały okres grace: "+Convert.ToString(o["GracePeriodRemaining"]));
                        b.AppendLine();
                    }
                }
            }
            catch(Exception ex){b.AppendLine("WMI licensing query error: "+ex.Message);}
            string cscript=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"cscript.exe");
            string slmgr=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"slmgr.vbs");
            if(File.Exists(cscript)&&File.Exists(slmgr))
            {
                int code;string output=CaptureExternal(cscript,"//Nologo "+QuoteCmd(slmgr)+" /xpr",out code);
                b.AppendLine("SLMGR /XPR (exit "+code+")");b.AppendLine(output);
            }
            else b.AppendLine("Nie znaleziono cscript.exe/slmgr.vbs.");
            b.AppendLine("Pełny klucz produktu nie jest wyświetlany ani zapisywany.");
            licenseReportBox.Text=b.ToString();AppendLog("Odczytano status aktywacji Windows.");
        }

        private void BuildRegistryBackupPage()
        {
            if(FindPage("Kopia rejestru")!=null)return;
            Panel p=NewPage("Kopia rejestru","Registry Backup PRO");
            Panel top=Card(p,"EKSPORT WYBRANYCH GAŁĘZI REJESTRU",10,8,950,170);
            LabelAt(top,"Utworzy kopię HKLM\\SOFTWARE, HKLM\\SYSTEM i HKCU\\Software do plików .reg. Wymaga uprawnień administratora. Import przywraca ustawienia i może wpłynąć na działanie systemu.",18,45,900,45);
            ButtonAt(top,"UTWÓRZ KOPIĘ REJESTRU",18,100,245,delegate{ExportRegistryBranches();});
            ButtonAt(top,"IMPORTUJ PLIK REG",275,100,220,delegate{ImportRegistryFile();});
            ButtonAt(top,"OTWÓRZ FOLDER DANYCH",508,100,220,delegate{OpenDataFolder();});
            Panel report=Card(p,"OSTATNIA KOPIA / INFORMACJE",10,190,950,220);
            registryReportBox=new TextBox();registryReportBox.Multiline=true;registryReportBox.ReadOnly=true;
            registryReportBox.ScrollBars=ScrollBars.Vertical;registryReportBox.Font=new Font("Consolas",8.5F);
            registryReportBox.BackColor=Color.FromArgb(7,13,23);registryReportBox.ForeColor=Color.FromArgb(205,235,245);
            registryReportBox.Location=new Point(UX(18),UY(45));registryReportBox.Size=new Size(UX(895),UY(160));report.Controls.Add(registryReportBox);
            if(!String.IsNullOrEmpty(lastRegistryBackupFolder))
                registryReportBox.Text="Ostatnia kopia rejestru:\r\n"+lastRegistryBackupFolder;
            Panel note=Card(p,"WAŻNE",10,420,950,125);
            LabelAt(note,"Eksport rejestru nie jest pełną kopią systemu. Przywracanie plików .reg może nadpisać aktualne ustawienia. Nie importuj kopii z innej wersji Windows ani innego komputera bez analizy.",18,45,900,55);
        }

        private void ExportRegistryBranches()
        {
            if(!IsAdmin()){MessageBox.Show("Uruchom program jako administrator.");return;}
            string folder=Path.Combine(dataRoot,"RegistryBackup_"+DateTime.Now.ToString("yyyyMMdd_HHmmss"));
            Directory.CreateDirectory(folder);
            string[] keys=new string[]{"HKLM\\SOFTWARE","HKLM\\SYSTEM","HKCU\\Software"};
            StringBuilder report=new StringBuilder();report.AppendLine("REGISTRY BACKUP");report.AppendLine(folder);
            foreach(string key in keys)
            {
                string file=Path.Combine(folder,key.Replace("\\","_").Replace(":","")+".reg");
                int code;string output=CaptureExternal(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"reg.exe"),
                    "export "+QuoteCmd(key)+" "+QuoteCmd(file)+" /y",out code);
                report.AppendLine(key+" | exit="+code+" | file="+File.Exists(file));
                if(!String.IsNullOrEmpty(output))report.AppendLine(output);
            }
            File.WriteAllText(Path.Combine(folder,"backup-report.txt"),report.ToString(),Encoding.UTF8);
            lastRegistryBackupFolder=folder;
            if(registryReportBox!=null)registryReportBox.Text=report.ToString();
            AppendLog("Eksport rejestru zakończony: "+folder);
            MessageBox.Show(report.ToString(),"Kopia rejestru");
        }

        private void ImportRegistryFile()
        {
            OpenFileDialog d=new OpenFileDialog();d.Filter="Pliki rejestru (*.reg)|*.reg";
            if(d.ShowDialog()!=DialogResult.OK)return;
            if(MessageBox.Show("Import pliku REG zmieni bieżący rejestr Windows. Plik powinien pochodzić z kopii tego samego komputera i kompatybilnej wersji systemu.\r\n\r\nWykonałeś pełną kopię systemu i chcesz kontynuować?",
                "OSTRZEŻENIE — IMPORT REJESTRU",MessageBoxButtons.YesNo,MessageBoxIcon.Warning,MessageBoxDefaultButton.Button2)!=DialogResult.Yes)return;
            int code;string output=CaptureExternal(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"reg.exe"),
                "import "+QuoteCmd(d.FileName),out code);
            AppendLog("Import rejestru: "+d.FileName+"; exit="+code);
            MessageBox.Show("Kod importu: "+code+"\r\n"+output);
        }

        private void BuildNetworkRecoveryPage()
        {
            if(FindPage("Naprawa sieci")!=null)return;
            Panel p=NewPage("Naprawa sieci","Network Recovery PRO");
            Panel diagnosis=Card(p,"DIAGNOSTYKA SIECI",10,8,950,160);
            LabelAt(diagnosis,"Odczyt konfiguracji IP, DNS, bramy, tras i test DNS. Raport nie zmienia ustawień.",18,45,900,35);
            ButtonAt(diagnosis,"IPCONFIG /ALL",18,88,175,delegate{RunNetworkDiagnostic("ipconfig.exe","/all");});
            ButtonAt(diagnosis,"IPCONFIG /FLUSHDNS",205,88,205,delegate{RunNetworkDiagnostic("ipconfig.exe","/flushdns");});
            ButtonAt(diagnosis,"TEST DNS",420,88,155,delegate{RunNetworkDiagnostic("nslookup.exe","microsoft.com");});
            ButtonAt(diagnosis,"OTWÓRZ USTAWIENIA",585,88,220,delegate{OpenUrl("ms-settings:network-status");});
            Panel repair=Card(p,"NAPRAWA STOSU SIECIOWEGO",10,180,950,195);
            LabelAt(repair,"Reset Winsock i TCP/IP może wymagać restartu komputera i ponownego ustawienia VPN, proxy lub statycznych adresów. Wykonaj go tylko po zapisaniu konfiguracji.",18,45,900,45);
            ButtonAt(repair,"RESET WINSOCK",18,105,190,delegate{RunNetworkReset("winsock");});
            ButtonAt(repair,"RESET TCP/IP",220,105,190,delegate{RunNetworkReset("tcpip");});
            ButtonAt(repair,"PEŁNA NAPRAWA SIECI",422,105,245,delegate{RunNetworkReset("full");});
            Panel note=Card(p,"BEZPIECZEŃSTWO",10,395,950,110);
            LabelAt(note,"Operacje resetujące są uruchamiane w osobnym oknie administratora, aby było widać wynik. Program nie zmienia automatycznie DNS ani statycznego IP.",18,45,900,42);
            Panel output=Card(p,"WYNIK DIAGNOSTYKI SIECI",10,515,950,220);
            networkReportBox=new TextBox();networkReportBox.Multiline=true;networkReportBox.ReadOnly=true;
            networkReportBox.ScrollBars=ScrollBars.Both;networkReportBox.WordWrap=false;
            networkReportBox.Font=new Font("Consolas",8.5F);networkReportBox.BackColor=Color.FromArgb(7,13,23);
            networkReportBox.ForeColor=Color.FromArgb(205,235,245);
            networkReportBox.Location=new Point(UX(18),UY(45));networkReportBox.Size=new Size(UX(895),UY(165));output.Controls.Add(networkReportBox);
        }

        private void RunNetworkDiagnostic(string exe,string args)
        {
            try
            {
                string log=Path.Combine(dataRoot,"Network_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".txt");
                int code;string output=CaptureExternal(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),exe),args,out code);
                string report="COMMAND: "+exe+" "+args+"\r\nEXIT: "+code+"\r\n\r\n"+output;
                File.WriteAllText(log,report,Encoding.UTF8);
                if(networkReportBox!=null)networkReportBox.Text=report;
                AppendLog("Diagnostyka sieci "+exe+" exit="+code+"; "+log);
                MessageBox.Show("Raport zapisano: "+log+"\r\nKod wyjścia: "+code,"Diagnostyka sieci");
            }
            catch(Exception ex){MessageBox.Show(ex.Message);}
        }

        private void RunNetworkReset(string mode)
        {
            if(!IsAdmin()){MessageBox.Show("Uruchom program jako administrator.");return;}
            string commands;
            if(mode=="winsock")commands="netsh winsock reset";
            else if(mode=="tcpip")commands="netsh int ip reset";
            else commands="ipconfig /flushdns & netsh winsock reset & netsh int ip reset";
            string warning="Operacja: "+mode.ToUpperInvariant()+"\r\n\r\nMoże zerwać połączenia, wymagać restartu i wymusić ponowną konfigurację VPN/proxy/statycznego IP. Kontynuować na własną odpowiedzialność?";
            if(MessageBox.Show(warning,"Reset sieci — potwierdzenie",MessageBoxButtons.YesNo,MessageBoxIcon.Warning,MessageBoxDefaultButton.Button2)!=DialogResult.Yes)return;
            RunCommand("cmd.exe","/k "+commands);
            AppendLog("Uruchomiono reset sieci: "+mode);
        }

        private void BuildWindowsUpdatePage()
        {
            if(FindPage("Windows Update PRO")!=null)return;
            Panel p=NewPage("Windows Update PRO","Windows Update Center PRO");
            Panel controls=Card(p,"CENTRUM AKTUALIZACJI WINDOWS",10,8,950,160);
            LabelAt(controls,"Otwiera oficjalne Ustawienia Windows Update. Dodatkowe polecenia skanu są zależne od wersji Windows i mogą być wycofane przez Microsoft.",18,45,900,38);
            ButtonAt(controls,"OTWÓRZ WINDOWS UPDATE",18,92,235,delegate{OpenUrl("ms-settings:windowsupdate");});
            ButtonAt(controls,"URUCHOM USOCLIENT SCAN",265,92,235,delegate{RunCommand("UsoClient.exe","StartScan");});
            ButtonAt(controls,"HISTORIA AKTUALIZACJI",512,92,235,delegate{OpenUrl("ms-settings:windowsupdate-history");});
            Panel diag=Card(p,"DIAGNOSTYKA WINDOWS UPDATE",10,175,950,230);
            LabelAt(diag,"Zapisuje ostatnie zdarzenia związane z Windows Update z dziennika System/WindowsUpdateClient, jeśli są dostępne.",18,45,900,35);
            ButtonAt(diag,"ODCZYTAJ ZDARZENIA WU",18,88,245,delegate{ReadWindowsUpdateEvents();});
            windowsUpdateReportBox=new TextBox();windowsUpdateReportBox.Multiline=true;windowsUpdateReportBox.ReadOnly=true;
            windowsUpdateReportBox.ScrollBars=ScrollBars.Both;windowsUpdateReportBox.WordWrap=false;
            windowsUpdateReportBox.Font=new Font("Consolas",8.5F);windowsUpdateReportBox.BackColor=Color.FromArgb(7,13,23);
            windowsUpdateReportBox.ForeColor=Color.FromArgb(205,235,245);
            windowsUpdateReportBox.Location=new Point(UX(18),UY(132));windowsUpdateReportBox.Size=new Size(UX(895),UY(85));diag.Controls.Add(windowsUpdateReportBox);
            Panel warning=Card(p,"UWAGA",10,415,950,105);
            LabelAt(warning,"Nie wyłączaj komputera podczas instalowania aktualizacji. Nie każda kompilacja, edycja ani sprzęt otrzymają te same aktualizacje. Windows 10 po zakończeniu standardowego wsparcia może wymagać ESU lub edycji LTSC.",18,45,900,43);
            ReadWindowsUpdateEvents();
        }

        private void ReadWindowsUpdateEvents()
        {
            if(windowsUpdateReportBox==null)return;
            string exe=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"wevtutil.exe");
            int code;string output=CaptureExternal(exe,"qe Microsoft-Windows-WindowsUpdateClient/Operational /c:30 /rd:true /f:text",out code);
            windowsUpdateReportBox.Text="WEVTUTIL exit="+code+"\r\n"+output;
            AppendLog("Odczytano zdarzenia Windows Update; exit="+code);
        }

        private void BuildEventLogAnalyzerPage()
        {
            if(FindPage("Dziennik zdarzeń")!=null)return;
            Panel p=NewPage("Dziennik zdarzeń","Windows Event Log Analyzer");
            Panel top=Card(p,"ANALIZA BŁĘDÓW SYSTEMOWYCH",10,8,950,145);
            LabelAt(top,"Odczytuje ostatnie błędy i zdarzenia krytyczne z dziennika System. Nie usuwa ani nie modyfikuje dzienników Windows.",18,45,900,35);
            ButtonAt(top,"SKANUJ OSTATNIE BŁĘDY",18,92,235,delegate{RefreshEventLog();});
            ButtonAt(top,"ZAPISZ RAPORT",265,92,180,delegate{SaveTextReport(eventLogReportBox,"WindowsEvents");});
            Panel report=Card(p,"OSTATNIE ZDARZENIA LEVEL 1/2",10,155,950,410);
            eventLogReportBox=new TextBox();eventLogReportBox.Multiline=true;eventLogReportBox.ReadOnly=true;
            eventLogReportBox.ScrollBars=ScrollBars.Both;eventLogReportBox.WordWrap=false;
            eventLogReportBox.Font=new Font("Consolas",8.5F);eventLogReportBox.BackColor=Color.FromArgb(7,13,23);
            eventLogReportBox.ForeColor=Color.FromArgb(205,235,245);
            eventLogReportBox.Location=new Point(UX(18),UY(45));eventLogReportBox.Size=new Size(UX(895),UY(350));report.Controls.Add(eventLogReportBox);
            RefreshEventLog();
        }

        private void RefreshEventLog()
        {
            if(eventLogReportBox==null)return;
            string exe=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"wevtutil.exe");
            int code;string output=CaptureExternal(exe,"qe System /q:"+QuoteCmd("*[System[(Level=1 or Level=2)]]")+" /c:100 /rd:true /f:text",out code);
            eventLogReportBox.Text="WEVTUTIL QE SYSTEM / ERROR+CRITICAL\r\nExit: "+code+"\r\n\r\n"+output;
            AppendLog("Zeskanowano dziennik zdarzeń System; exit="+code);
        }

        private void BuildOfflineRepairPage()
        {
            if(FindPage("Naprawa offline")!=null)return;
            Panel p=NewPage("Naprawa offline","Offline Windows Image Repair");
            Panel source=Card(p,"WSKAŻ KATALOG SYSTEMU WINDOWS OFFLINE",10,8,950,155);
            offlineWindowsPathBox=TextAt(source,18,47,690,26,lastOfflineWindowsPath);
            ButtonAt(source,"WYBIERZ FOLDER",720,43,195,delegate{
                FolderBrowserDialog d=new FolderBrowserDialog();d.Description="Wskaż główny folder offline Windows (zawierający Windows\\System32).";
                if(d.ShowDialog()==DialogResult.OK){offlineWindowsPathBox.Text=d.SelectedPath;lastOfflineWindowsPath=d.SelectedPath;}
            });
            ButtonAt(source,"SPRAWDŹ OBRAZ",18,91,190,delegate{InspectOfflineWindowsImage();});
            Panel actions=Card(p,"OPERACJE DISM OFFLINE",10,175,950,155);
            LabelAt(actions,"CheckHealth i ScanHealth odczytują stan komponentów. RestoreHealth modyfikuje obraz offline — wymaga prawidłowego źródła naprawy lub Windows Update.",18,45,900,42);
            ButtonAt(actions,"DISM CHECKHEALTH",18,95,195,delegate{RunOfflineDism("/CheckHealth");});
            ButtonAt(actions,"DISM SCANHEALTH",225,95,195,delegate{RunOfflineDism("/ScanHealth");});
            ButtonAt(actions,"DISM RESTOREHEALTH",432,95,220,delegate{RunOfflineDism("/RestoreHealth");});
            Panel report=Card(p,"WYNIK / ŚCIEŻKA OFFLINE",10,350,950,280);
            offlineRepairReportBox=new TextBox();offlineRepairReportBox.Multiline=true;offlineRepairReportBox.ReadOnly=true;
            offlineRepairReportBox.ScrollBars=ScrollBars.Both;offlineRepairReportBox.WordWrap=false;
            offlineRepairReportBox.Font=new Font("Consolas",8.5F);offlineRepairReportBox.BackColor=Color.FromArgb(7,13,23);
            offlineRepairReportBox.ForeColor=Color.FromArgb(205,235,245);
            offlineRepairReportBox.Location=new Point(UX(18),UY(45));offlineRepairReportBox.Size=new Size(UX(895),UY(220));report.Controls.Add(offlineRepairReportBox);
        }

        private void InspectOfflineWindowsImage()
        {
            if(offlineWindowsPathBox==null)return;
            string path=offlineWindowsPathBox.Text.Trim();
            if(!Directory.Exists(Path.Combine(path,"Windows","System32")))
            {
                MessageBox.Show("Nie znaleziono Windows\\System32. Wskaż katalog główny instalacji Windows offline.");
                return;
            }
            lastOfflineWindowsPath=path;
            if(offlineRepairReportBox!=null)offlineRepairReportBox.Text="Wykryto katalog offline Windows:\r\n"+path+"\r\n\r\nObraz jest gotowy do wywołania DISM. Nie uruchomiono jeszcze modyfikacji.";
            AppendLog("Wskazano obraz Windows offline: "+path);
        }

        private void RunOfflineDism(string operation)
        {
            if(offlineWindowsPathBox==null)return;
            string path=offlineWindowsPathBox.Text.Trim();
            if(!Directory.Exists(Path.Combine(path,"Windows","System32")))
            {
                MessageBox.Show("Najpierw wskaż poprawny folder Windows offline.");
                return;
            }
            if(operation=="/RestoreHealth" && MessageBox.Show("DISM RestoreHealth będzie modyfikować obraz offline. Wykonaj wcześniej kopię obrazu. Kontynuować na własną odpowiedzialność?",
                "Naprawa offline — potwierdzenie",MessageBoxButtons.YesNo,MessageBoxIcon.Warning,MessageBoxDefaultButton.Button2)!=DialogResult.Yes)return;
            string args="/Image:"+QuoteCmd(path)+" /Cleanup-Image "+operation;
            string log=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows),"Logs","DISM","dism.log");
            if(offlineRepairReportBox!=null)offlineRepairReportBox.Text="Uruchamiam DISM "+operation+" dla "+path+"\r\nDziennik DISM: "+log;
            try
            {
                ProcessStartInfo pi=new ProcessStartInfo(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"dism.exe"),args);
                pi.UseShellExecute=true;pi.Verb="runas";pi.WorkingDirectory=dataRoot;
                Process pr=Process.Start(pi);
                AppendLog("Uruchomiono DISM offline "+operation+"; pid="+(pr==null?"unknown":pr.Id.ToString())+"; log="+log);
            }
            catch(Exception ex){if(offlineRepairReportBox!=null)offlineRepairReportBox.AppendText("\r\nBłąd: "+ex.Message);AppendLog("DISM offline start error: "+ex.Message);}
        }

        private void BuildRadioOnlinePage()
        {
            if(FindPage("Radio online")!=null)return;
            Panel p=NewPage("Radio online","Radio online — pływający dymek");
            Panel player=Card(p,"RADIO ONLINE — ODTWARZACZ W DYMKU",10,8,950,180);
            LabelAt(player,"Kliknij przycisk, aby otworzyć mały, niezależny dymek. Muzyka może grać podczas przechodzenia między modułami programu.",18,45,900,35);
            ButtonAt(player,"OTWÓRZ DYMek RADIO",18,88,230,delegate{ToggleRadioBubble();});
            ButtonAt(player,"RADIO 357 — STRONA OFICJALNA",260,88,280,delegate{OpenUrl("https://radio357.pl/");});
            ButtonAt(player,"KATALOG STACJI ONLINE",552,88,230,delegate{OpenUrl("https://www.radio-browser.info/");});
            LabelAt(player,"Dymek obsługuje adresy HTTP/HTTPS, zapisane ulubione i regulację głośności. Wymaga składnika Windows Media Player COM.",18,135,900,25);
            Panel info=Card(p,"ZAPISANE STACJE",10,205,950,160);
            LabelAt(info,"Katalog Radio Browser wyszukuje stacje z różnych krajów, języków i gatunków. Zapisane ulubione pozostają lokalnie; test strumienia sprawdza również próbkę danych audio. Odtwarzanie zależy od kodeków i składników multimedialnych Windows.",18,45,900,45);
            ButtonAt(info,"OTWÓRZ DYMek I ZARZĄDZAJ STACJAMI",18,100,330,delegate{ToggleRadioBubble();});
            Panel note=Card(p,"PRYWATNOŚĆ I OGRANICZENIA",10,380,950,130);
            LabelAt(note,"Po uruchomieniu streamu serwer stacji widzi publiczny adres IP komputera. Program nie nagrywa ani nie przesyła dźwięku. Zgodność kodeków zależy od Windows Media Player i składników multimedialnych systemu.",18,45,900,50);
        }


        private void BuildWindowsPerformancePage()
        {
            if(FindPage("Windows Performance")!=null)return;
            Panel p=NewPage("Windows Performance","Windows Performance Center");
            Panel top=Card(p,"MONITORING WYDAJNOŚCI NA ŻYWO",10,8,950,145);
            LabelAt(top,"Automatyczny odczyt CPU, RAM, wykorzystania silnika GPU, pamięci GPU i transferu dysków co 5 sekund. GPU oraz Storage Reliability zależą od dostępności providerów Windows / sterownika.",18,45,900,35);
            ButtonAt(top,"ODŚWIEŻ TERAZ",18,92,190,delegate{RefreshPerformanceCenter();});
            ButtonAt(top,"MONITOR ZASOBÓW",220,92,205,delegate{RunCommand("resmon.exe","");});
            ButtonAt(top,"MENEDŻER ZADAŃ",437,92,205,delegate{RunCommand("taskmgr.exe","");});
            performanceUiStatus=LabelAt(top,"STATUS: oczekiwanie na pierwszy odczyt...",18,119,890,20);

            Panel graph=Card(p,"HISTORIA CPU / RAM / GPU — OSTATNIE 60 ODCZYTÓW",10,165,950,190);
            performanceUiGraph=new Panel();
            performanceUiGraph.Location=new Point(UX(18),UY(45));
            performanceUiGraph.Size=new Size(UX(895),UY(125));
            performanceUiGraph.BackColor=Color.FromArgb(7,18,31);
            performanceUiGraph.Paint+=delegate(object sender,PaintEventArgs e){DrawPerformanceGraph(e.Graphics,performanceUiGraph.ClientRectangle);};
            graph.Controls.Add(performanceUiGraph);

            Panel report=Card(p,"TOP PROCESY WG PAMIĘCI / SYSTEM",10,365,950,360);
            performanceReportBox=new TextBox();performanceReportBox.Multiline=true;performanceReportBox.ReadOnly=true;
            performanceReportBox.ScrollBars=ScrollBars.Both;performanceReportBox.WordWrap=false;performanceReportBox.Font=new Font("Consolas",8.5F);
            performanceReportBox.BackColor=Color.FromArgb(7,13,23);performanceReportBox.ForeColor=Color.FromArgb(205,235,245);
            performanceReportBox.Location=new Point(UX(18),UY(45));performanceReportBox.Size=new Size(UX(895),UY(305));report.Controls.Add(performanceReportBox);
            ButtonAt(report,"ZAPISZ RAPORT",18,310,180,delegate{SaveTextReport(performanceReportBox,"Performance");});
        }

        private void StartPerformanceMonitor()
        {
            if(FindPage("Windows Performance")==null)return;
            if(performanceTimer==null)
            {
                performanceTimer=new System.Windows.Forms.Timer();
                performanceTimer.Interval=5000;
                performanceTimer.Tick+=delegate{RefreshPerformanceCenter();};
            }
            if(!performanceTimer.Enabled)performanceTimer.Start();
            RefreshPerformanceCenter();
        }

        private void StopPerformanceMonitor()
        {
            if(performanceTimer!=null && performanceTimer.Enabled)performanceTimer.Stop();
        }

        private void DrawPerformanceGraph(Graphics g,Rectangle bounds)
        {
            g.SmoothingMode=System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
            using(SolidBrush bg=new SolidBrush(Color.FromArgb(7,18,31)))g.FillRectangle(bg,bounds);
            using(Pen grid=new Pen(Color.FromArgb(42,76,104),1))
            {
                for(int i=1;i<4;i++){int y=bounds.Top+(bounds.Height*i/4);g.DrawLine(grid,bounds.Left+8,y,bounds.Right-8,y);}
                g.DrawLine(grid,bounds.Left+8,bounds.Bottom-10,bounds.Right-8,bounds.Bottom-10);
            }
            using(Font f=new Font("Segoe UI",8F))
            using(SolidBrush t=new SolidBrush(Color.FromArgb(165,194,216)))
            {
                g.DrawString("100%",f,t,3,2);g.DrawString("0%",f,t,3,bounds.Height-18);
                g.DrawString("CPU",f,Brushes.DeepSkyBlue,bounds.Width-158,4);
                g.DrawString("RAM",f,Brushes.LightGreen,bounds.Width-112,4);
                g.DrawString("GPU",f,Brushes.Gold,bounds.Width-62,4);
            }
            DrawHistoryLine(g,bounds,performanceCpuHistory,Color.DeepSkyBlue);
            DrawHistoryLine(g,bounds,performanceRamHistory,Color.LightGreen);
            DrawHistoryLine(g,bounds,performanceGpuHistory,Color.Gold);
        }

        private void DrawHistoryLine(Graphics g,Rectangle bounds,List<float> values,Color color)
        {
            if(values==null || values.Count<2)return;
            List<PointF> pts=new List<PointF>();
            int count=values.Count;float usableW=Math.Max(1,bounds.Width-24);float usableH=Math.Max(1,bounds.Height-22);
            for(int i=0;i<count;i++)
            {
                float v=values[i];if(v<0)v=0;if(v>100)v=100;
                float x=12+(usableW*i/Math.Max(1,count-1));
                float y=bounds.Height-11-(usableH*v/100.0F);
                pts.Add(new PointF(x,y));
            }
            if(pts.Count>=2)using(Pen line=new Pen(color,2.0F))g.DrawLines(line,pts.ToArray());
        }

        private PerformanceSnapshot ReadPerformanceSnapshot()
        {
            PerformanceSnapshot result=new PerformanceSnapshot();StringBuilder b=new StringBuilder();
            b.AppendLine("WINDOWS PERFORMANCE CENTER");b.AppendLine("Data: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
            b.AppendLine("CPU: "+GetCpuName());
            try
            {
                using(ManagementObjectSearcher q=CreateTimedWmiSearcher("root\\cimv2","SELECT PercentProcessorTime FROM Win32_PerfFormattedData_PerfOS_Processor WHERE Name='_Total'",4))
                    foreach(ManagementObject o in q.Get())
                    {
                        float cpu;
                        if(Single.TryParse(Convert.ToString(o["PercentProcessorTime"]),NumberStyles.Any,CultureInfo.InvariantCulture,out cpu))
                        {result.CpuPercent=Math.Max(0,Math.Min(100,cpu));result.CpuKnown=true;}
                        b.AppendLine("CPU load (WMI PerfFormattedData): "+Convert.ToString(o["PercentProcessorTime"])+"%");
                        break;
                    }
            }
            catch(Exception ex){b.AppendLine("CPU load: provider WMI niedostępny: "+ex.Message);}
            try
            {
                using(ManagementObjectSearcher q=CreateTimedWmiSearcher("root\\cimv2","SELECT TotalVisibleMemorySize,FreePhysicalMemory FROM Win32_OperatingSystem",4))
                    foreach(ManagementObject o in q.Get())
                    {
                        double total=Convert.ToDouble(o["TotalVisibleMemorySize"])/1048576.0;
                        double free=Convert.ToDouble(o["FreePhysicalMemory"])/1048576.0;
                        double usedPercent=total<=0?0:(total-free)/total*100.0;
                        result.RamPercent=(float)Math.Max(0,Math.Min(100,usedPercent));result.RamKnown=true;
                        b.AppendLine(String.Format(CultureInfo.InvariantCulture,"RAM: {0:0.0} GB użyte / {1:0.0} GB łącznie ({2:0.0}% wolne)",total-free,total,free/Math.Max(0.01,total)*100));break;
                    }
            }
            catch(Exception ex){b.AppendLine("RAM: błąd WMI: "+ex.Message);}
            try
            {
                float maxGpu=0;bool seenGpu=false;
                using(ManagementObjectSearcher q=CreateTimedWmiSearcher("root\\cimv2","SELECT Name,UtilizationPercentage FROM Win32_PerfFormattedData_GPUPerformanceCounters_GPUEngine",4))
                    foreach(ManagementObject o in q.Get())
                    {
                        string instance=Convert.ToString(o["Name"]);
                        if(instance.IndexOf("engtype_3D",StringComparison.OrdinalIgnoreCase)<0 && instance.IndexOf("engtype_Compute",StringComparison.OrdinalIgnoreCase)<0)continue;
                        float value;if(Single.TryParse(Convert.ToString(o["UtilizationPercentage"]),NumberStyles.Any,CultureInfo.InvariantCulture,out value))
                        {maxGpu=Math.Max(maxGpu,Math.Max(0,Math.Min(100,value)));seenGpu=true;}
                    }
                if(seenGpu){result.GpuPercent=maxGpu;result.GpuKnown=true;result.GpuSource="WMI GPU Engine (maksymalny odczyt 3D/Compute; nie suma silników)";b.AppendLine("GPU Engine usage: "+maxGpu.ToString("0.0",CultureInfo.InvariantCulture)+"% — "+result.GpuSource);}
                else b.AppendLine("GPU Engine usage: provider nie zwrócił danych; brak odczytu nie oznacza 0%.");
            }
            catch(Exception ex){b.AppendLine("GPU Engine usage niedostępny: "+ex.Message);}
            try
            {
                bool memorySeen=false;double dedicated=0,shared=0;
                using(ManagementObjectSearcher q=CreateTimedWmiSearcher("root\\cimv2","SELECT Name,DedicatedUsage,SharedUsage FROM Win32_PerfFormattedData_GPUPerformanceCounters_GPUAdapterMemory",4))
                    foreach(ManagementObject o in q.Get())
                    {
                        double d=0,sh=0;try{d=Convert.ToDouble(o["DedicatedUsage"]);}catch{}try{sh=Convert.ToDouble(o["SharedUsage"]);}catch{}
                        dedicated+=d;shared+=sh;memorySeen=true;
                    }
                if(memorySeen){result.GpuDedicatedMemoryMb=dedicated/1048576.0;result.GpuSharedMemoryMb=shared/1048576.0;result.GpuMemoryKnown=true;
                    b.AppendLine("GPU memory counters (suma dostępnych adapterów): dedicated "+result.GpuDedicatedMemoryMb.ToString("0",CultureInfo.InvariantCulture)+" MB; shared "+result.GpuSharedMemoryMb.ToString("0",CultureInfo.InvariantCulture)+" MB (Windows performance provider)");}
                else b.AppendLine("GPU memory counters: provider niedostępny.");
            }
            catch(Exception ex){b.AppendLine("GPU memory counters niedostępne: "+ex.Message);}
            try
            {
                bool diskSeen=false;double read=0,write=0;float busy=0;
                using(ManagementObjectSearcher q=CreateTimedWmiSearcher("root\\cimv2","SELECT Name,DiskReadBytesPersec,DiskWriteBytesPersec,PercentDiskTime FROM Win32_PerfFormattedData_PerfDisk_PhysicalDisk",4))
                    foreach(ManagementObject o in q.Get())
                    {
                        if(!String.Equals(Convert.ToString(o["Name"]),"_Total",StringComparison.OrdinalIgnoreCase))continue;
                        try{read=Convert.ToDouble(o["DiskReadBytesPersec"])/1048576.0;}catch{}
                        try{write=Convert.ToDouble(o["DiskWriteBytesPersec"])/1048576.0;}catch{}
                        try{busy=(float)Convert.ToDouble(o["PercentDiskTime"]);}catch{}
                        diskSeen=true;break;
                    }
                if(diskSeen){result.DiskReadMbPerSec=read;result.DiskWriteMbPerSec=write;result.DiskIoKnown=true;
                    b.AppendLine("Dyski fizyczne _Total: odczyt "+read.ToString("0.00",CultureInfo.InvariantCulture)+" MB/s; zapis "+write.ToString("0.00",CultureInfo.InvariantCulture)+" MB/s; zajętość "+busy.ToString("0",CultureInfo.InvariantCulture)+"% (WMI Performance)");}
                else b.AppendLine("Dysk I/O: licznik WMI _Total niedostępny.");
            }
            catch(Exception ex){b.AppendLine("Dysk I/O niedostępny: "+ex.Message);}
            b.AppendLine("Liczba logicznych procesorów: "+Environment.ProcessorCount);b.AppendLine();
            b.AppendLine("TOP 25 PROCESÓW WG WORKING SET:");
            try
            {
                Process[] procs=Process.GetProcesses();
                Array.Sort(procs,delegate(Process a,Process c){long x=0,y=0;try{x=a.WorkingSet64;}catch{}try{y=c.WorkingSet64;}catch{}return y.CompareTo(x);});
                int count=0;
                foreach(Process pr in procs)
                {
                    try{b.AppendLine(String.Format(CultureInfo.InvariantCulture,"{0,-34} PID={1,-7} RAM={2,8:0.0} MB CPU_TIME={3}",pr.ProcessName,pr.Id,pr.WorkingSet64/1048576.0,pr.TotalProcessorTime));count++;}
                    catch{}
                    if(count>=25)break;
                }
                foreach(Process pr in procs)try{pr.Dispose();}catch{}
            }
            catch(Exception ex){b.AppendLine("Procesy: "+ex.Message);}
            b.AppendLine();b.AppendLine("Uwaga: Working Set to pamięć widoczna procesu; WMI może nie udostępnić obciążenia CPU.");
            result.Report=b.ToString();return result;
        }

        private void RefreshPerformanceCenter()
        {
            if(performanceReportBox==null || performanceReportBox.IsDisposed)return;
            if(performanceWorker!=null && performanceWorker.IsBusy)return;
            if(performanceUiStatus!=null)performanceUiStatus.Text="STATUS: odczytuję CPU, RAM, GPU i dyski...";
            BackgroundWorker worker=new BackgroundWorker();
            performanceWorker=worker;
            worker.DoWork+=delegate(object sender,DoWorkEventArgs e){e.Result=ReadPerformanceSnapshot();};
            worker.RunWorkerCompleted+=delegate(object sender,RunWorkerCompletedEventArgs e)
            {
                try
                {
                    if(performanceReportBox==null || performanceReportBox.IsDisposed)return;
                    if(e.Error!=null)
                    {
                        if(performanceUiStatus!=null)performanceUiStatus.Text="STATUS: błąd odczytu — "+e.Error.GetBaseException().Message;
                        performanceReportBox.Text="Błąd monitoringu: "+e.Error.GetBaseException().Message;return;
                    }
                    PerformanceSnapshot snap=(PerformanceSnapshot)e.Result;performanceReportBox.Text=snap.Report;
                    if(snap.CpuKnown){performanceCpuHistory.Add(snap.CpuPercent);if(performanceCpuHistory.Count>60)performanceCpuHistory.RemoveAt(0);}
                    if(snap.RamKnown){performanceRamHistory.Add(snap.RamPercent);if(performanceRamHistory.Count>60)performanceRamHistory.RemoveAt(0);}
                    if(snap.GpuKnown){performanceGpuHistory.Add(snap.GpuPercent);if(performanceGpuHistory.Count>60)performanceGpuHistory.RemoveAt(0);}
                    if(performanceUiStatus!=null)
                        performanceUiStatus.Text="OSTATNI ODCZYT: "+DateTime.Now.ToString("HH:mm:ss")+
                            " | CPU: "+(snap.CpuKnown?snap.CpuPercent.ToString("0",CultureInfo.InvariantCulture)+"%":"brak danych")+
                            " | RAM: "+(snap.RamKnown?snap.RamPercent.ToString("0",CultureInfo.InvariantCulture)+"%":"brak danych")+
                            " | GPU: "+(snap.GpuKnown?snap.GpuPercent.ToString("0",CultureInfo.InvariantCulture)+"%":"brak provider")+
                            (snap.GpuMemoryKnown?" VRAM ded./wsp.: "+snap.GpuDedicatedMemoryMb.ToString("0",CultureInfo.InvariantCulture)+"/"+snap.GpuSharedMemoryMb.ToString("0",CultureInfo.InvariantCulture)+" MB":"")+
                            " | Dysk R/W: "+(snap.DiskIoKnown?snap.DiskReadMbPerSec.ToString("0.0",CultureInfo.InvariantCulture)+"/"+snap.DiskWriteMbPerSec.ToString("0.0",CultureInfo.InvariantCulture)+" MB/s":"brak licznika");
                    if(performanceUiGraph!=null && !performanceUiGraph.IsDisposed)performanceUiGraph.Invalidate();
                    AppendLog("Odświeżono Windows Performance Center.");
                }
                finally
                {
                    if(performanceWorker==worker)performanceWorker=null;
                    worker.Dispose();
                }
            };
            try{worker.RunWorkerAsync();}
            catch(Exception ex)
            {
                if(performanceWorker==worker)performanceWorker=null;
                worker.Dispose();
                if(performanceUiStatus!=null)performanceUiStatus.Text="STATUS: nie udało się uruchomić odczytu — "+ex.Message;
                if(performanceReportBox!=null && !performanceReportBox.IsDisposed)performanceReportBox.Text="Nie udało się uruchomić monitoringu: "+ex.Message;
                AppendLog("Windows Performance Center: nie udało się uruchomić workera — "+ex.Message);
            }
        }


        private string GetCpuName()
        {
            try{using(ManagementObjectSearcher q=CreateTimedWmiSearcher("root\\cimv2","SELECT Name FROM Win32_Processor",4))foreach(ManagementObject o in q.Get())return Convert.ToString(o["Name"]);}catch{}
            return "Niedostępne";
        }

        private void BuildApplicationMigrationPage()
        {
            if(FindPage("Application Migration")!=null)return;
            Panel p=NewPage("Application Migration","Application Migration PRO");
            Panel top=Card(p,"INWENTARYZACJA ZAINSTALOWANYCH PROGRAMÓW",10,8,950,145);
            LabelAt(top,"Tworzy listę aplikacji z rejestru Windows (32/64-bit i bieżący użytkownik). Nie kopiuje binariów i nie obiecuje automatycznego przeniesienia licencji.",18,45,900,38);
            ButtonAt(top,"SKANUJ APLIKACJE",18,92,215,delegate{ScanInstalledApplications();});
            ButtonAt(top,"EKSPORT CSV",245,92,175,delegate{ExportApplicationInventory();});
            Panel report=Card(p,"LISTA PROGRAMÓW / WERSJE / WYDAWCA",10,165,950,390);
            applicationInventoryBox=new TextBox();applicationInventoryBox.Multiline=true;applicationInventoryBox.ReadOnly=true;
            applicationInventoryBox.ScrollBars=ScrollBars.Both;applicationInventoryBox.WordWrap=false;applicationInventoryBox.Font=new Font("Consolas",8.2F);
            applicationInventoryBox.BackColor=Color.FromArgb(7,13,23);applicationInventoryBox.ForeColor=Color.FromArgb(205,235,245);
            applicationInventoryBox.Location=new Point(UX(18),UY(45));applicationInventoryBox.Size=new Size(UX(895),UY(330));report.Controls.Add(applicationInventoryBox);
            ButtonAt(report,"ZAPISZ LISTĘ",18,335,180,delegate{SaveTextReport(applicationInventoryBox,"ApplicationInventory");});
            Panel note=Card(p,"PLAN ODTWORZENIA",10,565,950,110);
            LabelAt(note,"Po migracji zainstaluj ponownie aplikacje z oryginalnych, zaufanych instalatorów. Sprawdź osobno licencje, profile użytkowników, wtyczki i dane. Nie kopiuj programów z Program Files jako zamiennika instalacji.",18,45,900,45);
            ScanInstalledApplications();
        }

        private void ScanInstalledApplications()
        {
            if(applicationInventoryBox==null)return;
            List<string> rows=new List<string>();HashSet<string> seen=new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            RegistryKey[] roots=new RegistryKey[]{
                Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"),
                Registry.LocalMachine.OpenSubKey(@"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"),
                Registry.CurrentUser.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall")
            };
            foreach(RegistryKey root in roots)
            {
                if(root==null)continue;
                using(root)
                {
                    foreach(string sub in root.GetSubKeyNames())
                    {
                        try
                        {
                            using(RegistryKey k=root.OpenSubKey(sub))
                            {
                                if(k==null)continue;
                                string name=Convert.ToString(k.GetValue("DisplayName"));if(String.IsNullOrWhiteSpace(name))continue;
                                string version=Convert.ToString(k.GetValue("DisplayVersion"));
                                string publisher=Convert.ToString(k.GetValue("Publisher"));
                                string location=Convert.ToString(k.GetValue("InstallLocation"));
                                string uninstall=Convert.ToString(k.GetValue("UninstallString"));
                                string key=name+"|"+version+"|"+publisher;
                                if(!seen.Add(key))continue;
                                rows.Add(name+"\t"+version+"\t"+publisher+"\t"+location+"\t"+uninstall);
                            }
                        }
                        catch{}
                    }
                }
            }
            rows.Sort(StringComparer.OrdinalIgnoreCase);
            StringBuilder b=new StringBuilder();b.AppendLine("NAZWA\tWERSJA\tWYDAWCA\tLOKALIZACJA\tODINSTALOWANIE");
            foreach(string row in rows)b.AppendLine(row);
            b.AppendLine();b.AppendLine("Liczba wykrytych wpisów: "+rows.Count);
            b.AppendLine("Lista jest inwentaryzacją rejestru Uninstall; aplikacje portable i część Store mogą nie pojawić się na liście.");
            applicationInventoryBox.Text=b.ToString();AppendLog("Skan aplikacji zakończony. Wykryto wpisów: "+rows.Count);
        }

        private void ExportApplicationInventory()
        {
            if(applicationInventoryBox==null || String.IsNullOrWhiteSpace(applicationInventoryBox.Text)){MessageBox.Show("Najpierw wykonaj skan aplikacji.");return;}
            SaveFileDialog d=new SaveFileDialog();d.Filter="CSV UTF-8 (*.csv)|*.csv";d.FileName="Aplikacje_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".csv";
            if(d.ShowDialog()!=DialogResult.OK)return;
            try
            {
                StringBuilder b=new StringBuilder();b.AppendLine("Nazwa;Wersja;Wydawca;Lokalizacja;Polecenie odinstalowania");
                string[] lines=applicationInventoryBox.Text.Split(new string[]{Environment.NewLine},StringSplitOptions.RemoveEmptyEntries);
                for(int i=1;i<lines.Length;i++)
                {
                    if(lines[i].StartsWith("Liczba wykrytych")||lines[i].StartsWith("Lista jest"))break;
                    string[] cols=lines[i].Split('\t');
                    List<string> escaped=new List<string>();foreach(string c in cols)escaped.Add("\""+(c??"").Replace("\"","\"\"")+"\"");
                    b.AppendLine(String.Join(";",escaped.ToArray()));
                }
                File.WriteAllText(d.FileName,b.ToString(),new UTF8Encoding(true));AppendLog("Wyeksportowano inwentaryzację programów: "+d.FileName);
            }
            catch(Exception ex){MessageBox.Show("Błąd eksportu CSV: "+ex.Message);}
        }

        private void BuildSecurityAlertPage()
        {
            if(FindPage("Security Center")!=null)return;
            Panel p=NewPage("Security Center","Security & Alert Center");
            Panel top=Card(p,"KONTROLA ZABEZPIECZEŃ WINDOWS",10,8,950,145);
            LabelAt(top,"Odczyt statusu Microsoft Defender, zapory, BitLocker, TPM i Secure Boot. Moduł nie wyłącza ochrony ani nie zmienia polityk bezpieczeństwa.",18,45,900,38);
            ButtonAt(top,"SKANUJ ZABEZPIECZENIA",18,92,235,delegate{RefreshSecurityCenter();});
            ButtonAt(top,"ZAPISZ RAPORT",265,92,180,delegate{SaveTextReport(securityReportBox,"SecurityAudit");});
            Panel report=Card(p,"STATUS / ALERTY",10,165,950,390);
            securityReportBox=new TextBox();securityReportBox.Multiline=true;securityReportBox.ReadOnly=true;
            securityReportBox.ScrollBars=ScrollBars.Both;securityReportBox.WordWrap=false;securityReportBox.Font=new Font("Consolas",8.5F);
            securityReportBox.BackColor=Color.FromArgb(7,13,23);securityReportBox.ForeColor=Color.FromArgb(205,235,245);
            securityReportBox.Location=new Point(UX(18),UY(45));securityReportBox.Size=new Size(UX(895),UY(330));report.Controls.Add(securityReportBox);
            Panel note=Card(p,"WAŻNE",10,565,950,110);
            LabelAt(note,"Brak danych z providerów WMI lub PowerShell nie jest dowodem, że ochrona jest wyłączona. Sprawdź stan również w Zabezpieczeniach Windows i u dostawcy ochrony.",18,45,900,45);
            RefreshSecurityCenter();
        }

        private void RefreshSecurityCenter()
        {
            if(securityReportBox==null)return;
            StringBuilder b=new StringBuilder();b.AppendLine("SECURITY & ALERT CENTER");b.AppendLine(DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));b.AppendLine();
            b.AppendLine("Secure Boot: "+ReadSecureBoot());b.AppendLine("TPM: "+ReadTpmSpec());b.AppendLine("Firmware: "+ReadFirmwareType());b.AppendLine();
            string ps=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"WindowsPowerShell","v1.0","powershell.exe");
            if(File.Exists(ps))
            {
                int code;string defender=CaptureExternal(ps,"-NoProfile -ExecutionPolicy Bypass -Command \"Get-MpComputerStatus | Select-Object AMServiceEnabled,AntivirusEnabled,RealTimeProtectionEnabled,AntispywareEnabled,AntivirusSignatureLastUpdated | Format-List | Out-String\"",out code);
                b.AppendLine("MICROSOFT DEFENDER (PowerShell; exit="+code+")");b.AppendLine(defender);
            }
            else b.AppendLine("PowerShell niedostępny — nie można odczytać Defender status.");
            int fw;string firewall=CaptureExternal(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"netsh.exe"),"advfirewall show allprofiles",out fw);
            b.AppendLine("WINDOWS FIREWALL (exit="+fw+")");b.AppendLine(firewall);
            string manage=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"manage-bde.exe");
            if(File.Exists(manage)){int bc;string bitlocker=CaptureExternal(manage,"-status",out bc);b.AppendLine("BITLOCKER (exit="+bc+")");b.AppendLine(bitlocker);}
            else b.AppendLine("manage-bde.exe niedostępny — BitLocker status nieodczytany.");
            b.AppendLine("Nie zmieniono żadnych ustawień ochrony.");securityReportBox.Text=b.ToString();AppendLog("Odświeżono Security & Alert Center.");
        }

        private void BuildRollbackManagerPage()
        {
            if(FindPage("Rollback Manager")!=null)return;
            Panel p=NewPage("Rollback Manager","Rollback Manager PRO");
            Panel top=Card(p,"PUNKTY PRZYWRACANIA SYSTEMU",10,8,950,155);
            LabelAt(top,"Sprawdź punkty przywracania Windows, utwórz nowy punkt przed zmianami albo otwórz kreator Przywracania systemu. Dostępność zależy od konfiguracji Ochrony systemu.",18,45,900,42);
            ButtonAt(top,"ODŚWIEŻ PUNKTY",18,95,185,delegate{RefreshRollbackPoints();});
            ButtonAt(top,"UTWÓRZ PUNKT",215,95,190,delegate{CreateRollbackPointConfirmed();});
            ButtonAt(top,"URUCHOM PRZYWRACANIE",417,95,250,delegate{RunCommand("rstrui.exe","");});
            Panel report=Card(p,"HISTORIA PUNKTÓW / OSTATNIE DZIAŁANIA",10,175,950,360);
            rollbackReportBox=new TextBox();rollbackReportBox.Multiline=true;rollbackReportBox.ReadOnly=true;
            rollbackReportBox.ScrollBars=ScrollBars.Both;rollbackReportBox.WordWrap=false;rollbackReportBox.Font=new Font("Consolas",8.5F);
            rollbackReportBox.BackColor=Color.FromArgb(7,13,23);rollbackReportBox.ForeColor=Color.FromArgb(205,235,245);
            rollbackReportBox.Location=new Point(UX(18),UY(45));rollbackReportBox.Size=new Size(UX(895),UY(300));report.Controls.Add(rollbackReportBox);
            Panel note=Card(p,"OGRANICZENIA",10,545,950,125);
            LabelAt(note,"Punkt przywracania nie zastępuje kopii obrazu dysku i nie chroni wszystkich plików osobistych. Windows może ograniczać tworzenie punktów do jednego na określony czas. W razie awarii użyj pełnej kopii systemu.",18,45,900,55);
            RefreshRollbackPoints();
        }

        private void RefreshRollbackPoints()
        {
            if(rollbackReportBox==null)return;
            StringBuilder b=new StringBuilder();b.AppendLine("SYSTEM RESTORE POINTS");b.AppendLine(DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
            string ps=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"WindowsPowerShell","v1.0","powershell.exe");
            if(File.Exists(ps))
            {
                int code;string output=CaptureExternal(ps,"-NoProfile -ExecutionPolicy Bypass -Command \"Get-ComputerRestorePoint | Select-Object SequenceNumber,Description,CreationTime,RestorePointType | Format-Table -AutoSize | Out-String\"",out code);
                b.AppendLine("PowerShell exit="+code);b.AppendLine(output);
            }
            else b.AppendLine("PowerShell niedostępny. Uruchom rstrui.exe, aby sprawdzić dostępne punkty.");
            b.AppendLine("Jeśli Ochrona systemu jest wyłączona, lista może być pusta.");rollbackReportBox.Text=b.ToString();
        }

        private void CreateRollbackPointConfirmed()
        {
            if(MessageBox.Show("Utworzyć punkt przywracania Windows? Ta funkcja działa tylko, gdy Ochrona systemu jest włączona. Punkt przywracania nie zastępuje pełnego backupu.","Punkt przywracania",MessageBoxButtons.YesNo,MessageBoxIcon.Warning,MessageBoxDefaultButton.Button2)!=DialogResult.Yes)return;
            string ps=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"WindowsPowerShell","v1.0","powershell.exe");
            if(!File.Exists(ps)){MessageBox.Show("PowerShell nie jest dostępny.");return;}
            try{ProcessStartInfo pi=new ProcessStartInfo(ps,"-NoProfile -ExecutionPolicy Bypass -Command \"Checkpoint-Computer -Description 'NaprawaPC FIX053 przed zmianami' -RestorePointType MODIFY_SETTINGS\"");pi.UseShellExecute=true;pi.Verb="runas";Process.Start(pi);AppendLog("Uruchomiono tworzenie punktu przywracania FIX053.");}
            catch(Exception ex){MessageBox.Show("Nie udało się uruchomić tworzenia punktu: "+ex.Message);}
        }

        private void BuildCpuRamBenchmarkPage()
        {
            if(FindPage("Benchmark CPU RAM")!=null)return;
            Panel p=NewPage("Benchmark CPU RAM","CPU & RAM Benchmark");
            Panel top=Card(p,"TEST PROCESORA I PAMIĘCI",10,8,950,160);
            LabelAt(top,"Test wykonuje obliczenia CPU i kopiowanie pamięci w wątku tła. Wyniki służą do porównania tego samego komputera, nie są rankingiem GPU ani uniwersalnym wynikiem między platformami.",18,45,900,42);
            benchmarkRunButton=ButtonAt(top,"URUCHOM TEST CPU + RAM",18,98,250,delegate{StartCpuRamBenchmark();});
            ButtonAt(top,"ZAPISZ RAPORT",280,98,180,delegate{SaveTextReport(benchmarkReportBox,"Benchmark");});
            Panel report=Card(p,"WYNIKI TESTU",10,180,950,300);
            benchmarkReportBox=new TextBox();benchmarkReportBox.Multiline=true;benchmarkReportBox.ReadOnly=true;
            benchmarkReportBox.ScrollBars=ScrollBars.Vertical;benchmarkReportBox.Font=new Font("Consolas",9F);
            benchmarkReportBox.BackColor=Color.FromArgb(7,13,23);benchmarkReportBox.ForeColor=Color.FromArgb(205,235,245);
            benchmarkReportBox.Location=new Point(UX(18),UY(45));benchmarkReportBox.Size=new Size(UX(895),UY(240));report.Controls.Add(benchmarkReportBox);
            Panel note=Card(p,"TEST GPU",10,490,950,125);
            LabelAt(note,"Ten test nie obciąża GPU i nie udaje pomiaru FPS. Rzeczywisty benchmark GPU wymaga natywnego testu Direct3D lub zewnętrznego narzędzia producenta. Używaj testów obciążeniowych tylko z kontrolą temperatur.",18,45,900,50);
            benchmarkReportBox.Text="Gotowe. Kliknij URUCHOM TEST CPU + RAM. Test może chwilowo zwiększyć obciążenie procesora.";
        }

        private void StartCpuRamBenchmark()
        {
            if(benchmarkWorker!=null && benchmarkWorker.IsBusy)return;
            if(benchmarkReportBox==null)return;
            benchmarkRunButton.Enabled=false;benchmarkReportBox.Text="Test w toku...";
            benchmarkWorker=new BackgroundWorker();
            benchmarkWorker.DoWork+=delegate(object sender,DoWorkEventArgs e)
            {
                Stopwatch sw=Stopwatch.StartNew();long primes=0;long n=2;DateTime end=DateTime.UtcNow.AddSeconds(4);
                while(DateTime.UtcNow<end)
                {
                    bool prime=true;for(long d=2;d*d<=n;d++)if(n%d==0){prime=false;break;}
                    if(prime)primes++;n++;
                }
                sw.Stop();
                const int mb=64;byte[] src=new byte[mb*1024*1024];byte[] dst=new byte[src.Length];
                Random rnd=new Random(1234);rnd.NextBytes(src);Stopwatch mem=Stopwatch.StartNew();long bytes=0;
                for(int i=0;i<6;i++){Buffer.BlockCopy(src,0,dst,0,src.Length);bytes+=src.Length;}
                mem.Stop();
                double throughput=mem.Elapsed.TotalSeconds<=0?0:(bytes/1048576.0)/mem.Elapsed.TotalSeconds;
                e.Result=String.Format(CultureInfo.InvariantCulture,"CPU prime candidates: {0:N0}\r\nCPU loop time: {1:0.00} s\r\nPrimes found: {2:N0}\r\nRAM copy: {3:0.0} MB/s\r\nRAM test size: {4} MB × 6 copies\r\n",n-2,sw.Elapsed.TotalSeconds,primes,throughput,mb);
            };
            benchmarkWorker.RunWorkerCompleted+=delegate(object sender,RunWorkerCompletedEventArgs e)
            {
                benchmarkRunButton.Enabled=true;
                if(e.Error!=null){benchmarkReportBox.Text="Test zakończył się błędem: "+e.Error.GetBaseException().Message;return;}
                benchmarkReportBox.Text="KOMPUTEROWE CENTRUM SERWISU — CPU + RAM BENCHMARK\r\nData: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")+"\r\nCPU: "+GetCpuName()+"\r\nRdzenie logiczne: "+Environment.ProcessorCount+"\r\n\r\n"+Convert.ToString(e.Result)+"\r\nWynik zależy od temperatury, trybu zasilania, pamięci i obciążenia tła. Nie jest certyfikowanym benchmarkiem GPU.";
                AppendLog("Zakończono benchmark CPU/RAM.");
            };
            benchmarkWorker.RunWorkerAsync();
        }

        // FIX053 — NVMe/SSD telemetry via Windows Storage module + WMI fallback; strictly read-only.
        private void BuildNvmeDoctorPage()
        {
            if(FindPage("NVMe SSD Doctor")!=null)return;
            Panel p=NewPage("NVMe SSD Doctor","NVMe & SSD Doctor PRO");
            Panel top=Card(p,"DIAGNOSTYKA DYSKÓW HDD / SSD / NVMe",10,8,950,150);
            LabelAt(top,"Odczyt SMART / Storage Reliability Counters, jeśli kontroler i sterownik udostępniają dane. Moduł niczego nie zapisuje na dysku i nie wykonuje testu destrukcyjnego.",18,45,900,44);
            ButtonAt(top,"SKANUJ DYSKI",18,98,190,delegate{RefreshNvmeDoctor();});
            ButtonAt(top,"ZARZĄDZANIE DYSKAMI",220,98,220,delegate{RunCommand("mmc.exe","diskmgmt.msc");});
            ButtonAt(top,"OTWÓRZ MONITOR ZASOBÓW",452,98,230,delegate{RunCommand("resmon.exe","");});
            Panel report=Card(p,"SMART / TEMPERATURA / ZUŻYCIE / BŁĘDY",10,165,950,365);
            nvmeReportBox=new TextBox();nvmeReportBox.Multiline=true;nvmeReportBox.ReadOnly=true;
            nvmeReportBox.ScrollBars=ScrollBars.Both;nvmeReportBox.WordWrap=false;nvmeReportBox.Font=new Font("Consolas",8.5F);
            nvmeReportBox.BackColor=Color.FromArgb(7,13,23);nvmeReportBox.ForeColor=Color.FromArgb(205,235,245);
            nvmeReportBox.Location=new Point(UX(18),UY(45));nvmeReportBox.Size=new Size(UX(895),UY(315));report.Controls.Add(nvmeReportBox);
            ButtonAt(report,"ZAPISZ RAPORT",18,320,180,delegate{SaveTextReport(nvmeReportBox,"NvmeSmart");});
            Panel note=Card(p,"INTERPRETACJA DANYCH",10,540,950,135);
            LabelAt(note,"Brak Storage Reliability Counter lub SMART nie oznacza zdrowego dysku. Niektóre kontrolery NVMe/USB ukrywają telemetrię. Temperatury i wartości zużycia pokazujemy tylko wtedy, gdy zwraca je system.",18,45,900,52);
            ButtonAt(note,"URUCHOM DISK HEALTH PRO",18,100,240,delegate{ShowPage("Zdrowie dysków");});
            RefreshNvmeDoctor();
        }

        private void RefreshNvmeDoctor()
        {
            if(nvmeReportBox==null || nvmeReportBox.IsDisposed)return;
            if(nvmeWorker!=null && nvmeWorker.IsBusy){nvmeReportBox.Text="Poprzedni odczyt jeszcze trwa...";return;}
            nvmeReportBox.Text="Odczytuję dane dysków. Brak danych zostanie oznaczony jako niedostępny...";
            nvmeWorker=new BackgroundWorker();
            nvmeWorker.DoWork+=delegate(object sender,DoWorkEventArgs e)
            {
                StringBuilder b=new StringBuilder();b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — NVMe & SSD DOCTOR PRO");
                b.AppendLine("Data: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));b.AppendLine("Tryb: tylko odczyt");b.AppendLine();
                string ps=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"WindowsPowerShell\\v1.0\\powershell.exe");
                bool storageRead=false;
                if(File.Exists(ps))
                {
                    string script="$ErrorActionPreference='Continue'; if(Get-Command Get-PhysicalDisk -ErrorAction SilentlyContinue){ Get-PhysicalDisk | ForEach-Object { $d=$_; $r=$null; try{$r=$d | Get-StorageReliabilityCounter -ErrorAction Stop}catch{}; [pscustomobject]@{Number=$d.DeviceId;Name=$d.FriendlyName;MediaType=$d.MediaType;HealthStatus=$d.HealthStatus;OperationalStatus=($d.OperationalStatus -join ',');Temperature=$r.Temperature;Wear=$r.Wear;PowerOnHours=$r.PowerOnHours;ReadErrorsTotal=$r.ReadErrorsTotal;WriteErrorsTotal=$r.WriteErrorsTotal;ReadLatencyMax=$r.ReadLatencyMax;WriteLatencyMax=$r.WriteLatencyMax} } | Format-List | Out-String -Width 220 } else { 'BRAK Get-PhysicalDisk — moduł Storage niedostępny.' }";
                    int code;string output=CaptureExternal(ps,"-NoProfile -ExecutionPolicy Bypass -Command "+QuoteCmd(script),out code);
                    b.AppendLine("WINDOWS STORAGE / GET-PHYSICALDISK (exit="+code+")");b.AppendLine(output);
                    storageRead=code==0 && output.IndexOf("BRAK Get-PhysicalDisk",StringComparison.OrdinalIgnoreCase)<0;
                }
                else b.AppendLine("Windows PowerShell niedostępny.");
                b.AppendLine();b.AppendLine("WMI / SMART PREDICTIVE FAILURE:");
                try
                {
                    using(ManagementObjectSearcher q=new ManagementObjectSearcher("SELECT Index,Model,Status,Size,InterfaceType FROM Win32_DiskDrive"))
                    foreach(ManagementObject o in q.Get())
                    {
                        double size=0;try{size=Convert.ToDouble(o["Size"])/1073741824.0;}catch{}
                        b.AppendLine("Dysk "+Convert.ToString(o["Index"])+": "+Convert.ToString(o["Model"])+" | "+size.ToString("0.0",CultureInfo.InvariantCulture)+" GB | "+Convert.ToString(o["InterfaceType"])+" | WMI Status="+Convert.ToString(o["Status"]));
                    }
                }
                catch(Exception ex){b.AppendLine("Win32_DiskDrive niedostępny: "+ex.Message);}
                bool smart=false;
                try
                {
                    using(ManagementObjectSearcher q=new ManagementObjectSearcher("root\\WMI","SELECT InstanceName,PredictFailure,Reason FROM MSStorageDriver_FailurePredictStatus"))
                    foreach(ManagementObject o in q.Get())
                    {smart=true;b.AppendLine("Instance="+Convert.ToString(o["InstanceName"])+" | PredictFailure="+Convert.ToString(o["PredictFailure"])+" | Reason="+Convert.ToString(o["Reason"]));}
                }
                catch(Exception ex){b.AppendLine("SMART WMI niedostępny: "+ex.Message);}
                if(!storageRead && !smart)b.AppendLine("BRAK WIARYGODNYCH LICZNIKÓW SMART/RELIABILITY. Nie oznacza to, że dysk jest zdrowy.");
                b.AppendLine();b.AppendLine("WOLUMINY:");
                foreach(DriveInfo d in DriveInfo.GetDrives())try{if(d.IsReady)b.AppendLine(d.Name+" | "+d.DriveType+" | wolne "+Math.Round(d.AvailableFreeSpace/1073741824.0,1)+" GB / "+Math.Round(d.TotalSize/1073741824.0,1)+" GB");}catch{}
                b.AppendLine();b.AppendLine("UWAGA: odczyty zależą od firmware i sterownika. Nie wykonano testu zapisu ani naprawy.");
                e.Result=b.ToString();
            };
            nvmeWorker.RunWorkerCompleted+=delegate(object sender,RunWorkerCompletedEventArgs e)
            {
                if(nvmeReportBox==null || nvmeReportBox.IsDisposed)return;
                nvmeReportBox.Text=e.Error==null?Convert.ToString(e.Result):"Błąd odczytu dysków: "+e.Error.GetBaseException().Message;
                AppendLog(e.Error==null?"Zakończono NVMe & SSD Doctor.":"NVMe doctor error: "+e.Error.GetBaseException().Message);
            };
            nvmeWorker.RunWorkerAsync();
        }

        // FIX053 — rescue hub: checks and opens built-in Windows recovery tools; no silent destructive changes.
        private void BuildPcRescuePage()
        {
            if(FindPage("PC Rescue Center")!=null)return;
            Panel p=NewPage("PC Rescue Center","PC Rescue Center ULTIMATE");
            Panel checks=Card(p,"STAN ŚRODOWISKA ODZYSKIWANIA",10,8,950,155);
            LabelAt(checks,"Sprawdź WinRE, status backupu i dostępność narzędzi odzyskiwania. Operacje rozruchu oraz przywracania mogą zmienić system lub nadpisać dane.",18,45,900,40);
            ButtonAt(checks,"SPRAWDŹ WINRE",18,95,185,delegate{RefreshPcRescueReport();});
            ButtonAt(checks,"OTWÓRZ USTAWIENIA ODZYSKIWANIA",215,95,280,delegate{OpenUrl("ms-settings:recovery");});
            ButtonAt(checks,"URUCHOM PRZYWRACANIE SYSTEMU",505,95,270,delegate{RunCommand("rstrui.exe","");});
            Panel tools=Card(p,"SZYBKIE NARZĘDZIA RATUNKOWE",10,175,950,205);
            ButtonAt(tools,"DISM RESTOREHEALTH",18,48,205,delegate{
                if(MessageBox.Show("DISM RestoreHealth może naprawiać składniki Windows i zmieniać pliki systemowe. Przed rozpoczęciem upewnij się, że masz kopię danych i stabilne zasilanie. Kontynuować?", "Potwierdzenie naprawy Windows", MessageBoxButtons.YesNo, MessageBoxIcon.Warning, MessageBoxDefaultButton.Button2)==DialogResult.Yes)
                    RunCommand("dism.exe","/Online /Cleanup-Image /RestoreHealth");
            });
            ButtonAt(tools,"SFC /SCANNOW",235,48,180,delegate{RunCommand("sfc.exe","/scannow");});
            ButtonAt(tools,"CHKDSK /SCAN",427,48,170,delegate{RunCommand("chkdsk.exe",Environment.GetEnvironmentVariable("SystemDrive")+" /scan");});
            ButtonAt(tools,"BOOT MANAGER",609,48,170,delegate{ShowPage("Boot Manager PRO");});
            ButtonAt(tools,"KREATOR USB / WINPE",18,100,225,delegate{ShowPage("Kreator USB");});
            ButtonAt(tools,"OBRAZ SYSTEMU / WBADMIN",255,100,260,delegate{ShowPage("Obraz systemu PRO");});
            ButtonAt(tools,"KOPIA ZAPASOWA",527,100,190,delegate{ShowPage("Kopia zapasowa");});
            LabelAt(tools,"Polecenia DISM/SFC/CHKDSK są uruchamiane z monitami UAC. Sprawdź wynik w otwartym oknie i dzienniku.",18,150,900,28);
            Panel report=Card(p,"RAPORT PC RESCUE",10,390,950,260);
            rescueReportBox=new TextBox();rescueReportBox.Multiline=true;rescueReportBox.ReadOnly=true;
            rescueReportBox.ScrollBars=ScrollBars.Both;rescueReportBox.WordWrap=false;rescueReportBox.Font=new Font("Consolas",8.5F);
            rescueReportBox.BackColor=Color.FromArgb(7,13,23);rescueReportBox.ForeColor=Color.FromArgb(205,235,245);
            rescueReportBox.Location=new Point(UX(18),UY(45));rescueReportBox.Size=new Size(UX(895),UY(205));report.Controls.Add(rescueReportBox);
            ButtonAt(report,"ZAPISZ RAPORT",18,215,175,delegate{SaveTextReport(rescueReportBox,"PcRescue");});
            Panel restart=Card(p,"ZAawansowany START / WINRE",10,660,950,125);
            LabelAt(restart,"Restart do zaawansowanych opcji uruchamiania zamknie sesję Windows. Zapisz pracę i upewnij się, że masz klucz odzyskiwania BitLocker, jeśli szyfrowanie jest aktywne.",18,45,900,44);
            ButtonAt(restart,"RESTART DO WINRE",18,92,205,delegate{RequestAdvancedStartup();});
            RefreshPcRescueReport();
        }

        private void RefreshPcRescueReport()
        {
            if(rescueReportBox==null)return;
            StringBuilder b=new StringBuilder();b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — PC RESCUE CENTER");b.AppendLine("Data: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
            b.AppendLine("System: "+GetOsCaption()+" | "+GetBuild()+" | "+GetArchitecture());
            b.AppendLine("Backup programu: "+(HasVerifiedBackup()?"zweryfikowany":"brak / niepełny"));
            string reagent=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"reagentc.exe");
            if(File.Exists(reagent)){int code;string output=CaptureExternal(reagent,"/info",out code);b.AppendLine();b.AppendLine("REAGENTC /INFO (exit="+code+")");b.AppendLine(output);}
            else b.AppendLine("Brak reagentc.exe.");
            string wb=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"wbadmin.exe");
            b.AppendLine("WBADMIN: "+(File.Exists(wb)?"dostępny":"brak"));
            b.AppendLine("Firmware: "+ReadFirmwareType()+" | Secure Boot: "+ReadSecureBoot()+" | TPM: "+ReadTpmSpec());
            string bitlocker=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"manage-bde.exe");
            if(File.Exists(bitlocker)){int code;string output=CaptureExternal(bitlocker,"-status "+Environment.GetEnvironmentVariable("SystemDrive"),out code);b.AppendLine();b.AppendLine("BITLOCKER STATUS (exit="+code+")");b.AppendLine(output);}
            b.AppendLine("Uwaga: WinRE status nie gwarantuje, że środowisko odzyskiwania uruchomi się. Sprawdź nośnik ratunkowy przed krytyczną migracją.");
            rescueReportBox.Text=b.ToString();AppendLog("Odświeżono PC Rescue Center.");
        }

        private void RequestAdvancedStartup()
        {
            if(MessageBox.Show("Komputer zostanie ponownie uruchomiony do zaawansowanych opcji Windows. Zapisz wszystkie otwarte pliki. Jeśli BitLocker jest aktywny, przygotuj klucz odzyskiwania. Kontynuować?",
                "Restart do WinRE",MessageBoxButtons.YesNo,MessageBoxIcon.Warning,MessageBoxDefaultButton.Button2)!=DialogResult.Yes)return;
            if(MessageBox.Show("OSTATNIE POTWIERDZENIE: uruchomić shutdown /r /o /t 0?", "Restart systemu",MessageBoxButtons.YesNo,MessageBoxIcon.Warning,MessageBoxDefaultButton.Button2)!=DialogResult.Yes)return;
            RunCommand("shutdown.exe","/r /o /t 0");
            AppendLog("Użytkownik zlecił restart do zaawansowanych opcji WinRE.");
        }

        // FIX053 — Windows Memory Diagnostic: vendor-independent memory test is scheduled by Windows at reboot.
        private void BuildMemoryTestPage()
        {
            if(FindPage("RAM Test PRO")!=null)return;
            Panel p=NewPage("RAM Test PRO","RAM Test PRO / Windows Memory Diagnostic");
            Panel top=Card(p,"INFORMACJE O ZAINSTALOWANEJ PAMIĘCI",10,8,950,155);
            LabelAt(top,"Odczyt modułów RAM z WMI. Dokładny test błędów pamięci wymaga diagnostyki offline po restarcie — program nie będzie udawał, że krótki benchmark wykrywa uszkodzone komórki RAM.",18,45,900,44);
            ButtonAt(top,"ODCZYTAJ MODUŁY RAM",18,98,220,delegate{RefreshMemoryReport();});
            memoryTestButton=ButtonAt(top,"URUCHOM DIAGNOSTYKĘ WINDOWS",250,98,270,delegate{LaunchWindowsMemoryDiagnostic();});
            ButtonAt(top,"BENCHMARK CPU + RAM",532,98,230,delegate{ShowPage("Benchmark CPU RAM");});
            Panel report=Card(p,"MODUŁY / CZĘSTOTLIWOŚĆ / POJEMNOŚĆ",10,165,950,350);
            memoryTestReportBox=new TextBox();memoryTestReportBox.Multiline=true;memoryTestReportBox.ReadOnly=true;
            memoryTestReportBox.ScrollBars=ScrollBars.Both;memoryTestReportBox.WordWrap=false;memoryTestReportBox.Font=new Font("Consolas",8.5F);
            memoryTestReportBox.BackColor=Color.FromArgb(7,13,23);memoryTestReportBox.ForeColor=Color.FromArgb(205,235,245);
            memoryTestReportBox.Location=new Point(UX(18),UY(45));memoryTestReportBox.Size=new Size(UX(895),UY(300));report.Controls.Add(memoryTestReportBox);
            Panel history=Card(p,"OSTATNI WYNIK WINDOWS MEMORY DIAGNOSTIC",10,530,950,135);
            LabelAt(history,"Wynik może pojawić się w dzienniku zdarzeń System jako MemoryDiagnostics-Results po ponownym uruchomieniu i zakończeniu testu.",18,45,900,35);
            ButtonAt(history,"ODCZYTAJ OSTATNI WYNIK",18,88,235,delegate{ReadMemoryDiagnosticResult();});
            ButtonAt(history,"OTWÓRZ PODGLĄD ZDARZEŃ",265,88,230,delegate{RunCommand("eventvwr.msc","");});
            RefreshMemoryReport();
        }

        private void RefreshMemoryReport()
        {
            if(memoryTestReportBox==null)return;
            StringBuilder b=new StringBuilder();b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — RAM TEST PRO");b.AppendLine("Data: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
            try
            {
                using(ManagementObjectSearcher q=new ManagementObjectSearcher("SELECT DeviceLocator,Manufacturer,PartNumber,Capacity,Speed,ConfiguredClockSpeed,MemoryType,SMBIOSMemoryType FROM Win32_PhysicalMemory"))
                {
                    int i=0;foreach(ManagementObject o in q.Get())
                    {
                        i++;double gb=0;try{gb=Convert.ToDouble(o["Capacity"])/1073741824.0;}catch{}
                        b.AppendLine("MODUŁ "+i+": "+Convert.ToString(o["DeviceLocator"]));
                        b.AppendLine("  Producent: "+Convert.ToString(o["Manufacturer"])+" | Part: "+Convert.ToString(o["PartNumber"]));
                        b.AppendLine("  Pojemność: "+gb.ToString("0.0",CultureInfo.InvariantCulture)+" GB | Speed: "+Convert.ToString(o["Speed"])+" MHz | Configured: "+Convert.ToString(o["ConfiguredClockSpeed"])+" MHz");
                        b.AppendLine("  MemoryType: "+Convert.ToString(o["MemoryType"])+" | SMBIOS: "+Convert.ToString(o["SMBIOSMemoryType"]));
                    }
                    if(i==0)b.AppendLine("WMI nie zwróciło informacji o modułach RAM.");
                }
            }
            catch(Exception ex){b.AppendLine("Błąd WMI RAM: "+ex.Message);}
            try
            {
                using(ManagementObjectSearcher q=CreateTimedWmiSearcher("root\\cimv2","SELECT TotalVisibleMemorySize,FreePhysicalMemory FROM Win32_OperatingSystem",4))
                foreach(ManagementObject o in q.Get())
                {
                    double total=Convert.ToDouble(o["TotalVisibleMemorySize"])/1048576.0;
                    double free=Convert.ToDouble(o["FreePhysicalMemory"])/1048576.0;
                    b.AppendLine();b.AppendLine(String.Format(CultureInfo.InvariantCulture,"Pamięć użyta: {0:0.0} GB / {1:0.0} GB | wolne {2:0.0}%",total-free,total,free/Math.Max(0.01,total)*100));break;
                }
            }
            catch(Exception ex){b.AppendLine("RAM totals error: "+ex.Message);}
            b.AppendLine();b.AppendLine("Status testu błędów: nie wykonano testu offline w tej sesji. Użyj Diagnostyki pamięci Windows.");
            memoryTestReportBox.Text=b.ToString();AppendLog("Odczytano inwentaryzację RAM.");
        }

        private void LaunchWindowsMemoryDiagnostic()
        {
            if(MessageBox.Show("Diagnostyka pamięci Windows zaplanuje test przy następnym uruchomieniu lub zaproponuje restart. Zapisz pracę i zamknij programy. Test może potrwać kilkanaście minut lub dłużej. Kontynuować?",
                "Windows Memory Diagnostic",MessageBoxButtons.YesNo,MessageBoxIcon.Warning,MessageBoxDefaultButton.Button2)!=DialogResult.Yes)return;
            RunCommand("mdsched.exe","");AppendLog("Uruchomiono Windows Memory Diagnostic.");
        }

        private void ReadMemoryDiagnosticResult()
        {
            string wevtutil=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"wevtutil.exe");
            int code;string output=CaptureExternal(wevtutil,"qe System /q:"+QuoteCmd("*[System[Provider[@Name='Microsoft-Windows-MemoryDiagnostics-Results']]]")+" /c:20 /rd:true /f:text",out code);
            memoryTestReportBox.Text="MEMORYDIAGNOSTICS-RESULTS (exit="+code+")\r\n\r\n"+output;
            AppendLog("Odczytano wyniki Memory Diagnostics; exit="+code);
        }

        // FIX053 — in-app quality checks are read-only and report PASS/WARN/FAIL instead of changing Windows.
        private void BuildQualityControlPage()
        {
            if(FindPage("Quality Control PRO")!=null)return;
            Panel p=NewPage("Quality Control PRO","Quality Control PRO — test aplikacji");
            Panel top=Card(p,"TESTY APLIKACJI / MODUŁÓW / ŚRODOWISKA",10,8,950,150);
            LabelAt(top,"Wykonuje bezpieczne kontrole odczytowe: plik EXE, metadane wersji, zapisywalność danych, wymagane narzędzia, główne moduły i dostępność komponentów radia.",18,45,900,40);
            ButtonAt(top,"URUCHOM KONTROLĘ",18,96,205,delegate{RunQualityControl();});
            ButtonAt(top,"TEST KATALOGU RADIA",235,96,220,delegate{TestRadioDirectoryForQc();});
            ButtonAt(top,"ZAPISZ RAPORT",467,96,180,delegate{SaveTextReport(qualityReportBox,"QualityControl");});
            Panel result=Card(p,"PASS / WARN / FAIL",10,165,950,390);
            qualityReportBox=new TextBox();qualityReportBox.Multiline=true;qualityReportBox.ReadOnly=true;
            qualityReportBox.ScrollBars=ScrollBars.Both;qualityReportBox.WordWrap=false;qualityReportBox.Font=new Font("Consolas",8.5F);
            qualityReportBox.BackColor=Color.FromArgb(7,13,23);qualityReportBox.ForeColor=Color.FromArgb(205,235,245);
            qualityReportBox.Location=new Point(UX(18),UY(45));qualityReportBox.Size=new Size(UX(895),UY(340));result.Controls.Add(qualityReportBox);
            Panel note=Card(p,"ZAKRES TESTU",10,565,950,110);
            LabelAt(note,"PASS oznacza, że kontrola odczytowa się powiodła. WARN oznacza brak opcjonalnego narzędzia lub danych. Test nie uruchamia migracji, naprawy, benchmarku ani zmian rejestru.",18,45,900,45);
            RunQualityControl();
        }

        private void AddQualityLine(StringBuilder b,ref int pass,ref int warn,ref int fail,string state,string label,string details)
        {
            if(state=="PASS")pass++;else if(state=="FAIL")fail++;else warn++;
            b.AppendLine("["+state+"] "+label+(String.IsNullOrWhiteSpace(details)?"":" — "+details));
        }

        private void RunQualityControl()
        {
            if(qualityReportBox==null || qualityReportBox.IsDisposed)return;
            StringBuilder b=new StringBuilder();int pass=0,warn=0,fail=0;
            b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — QUALITY CONTROL PRO");b.AppendLine("Data: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
            b.AppendLine("EXE: "+Application.ExecutablePath);b.AppendLine("Wersja pliku: "+FileVersionInfo.GetVersionInfo(Application.ExecutablePath).FileVersion);
            b.AppendLine("Tryb: "+(portableMode?"PORTABLE":"INSTALLATION"));b.AppendLine();
            try
            {
                FileInfo exe=new FileInfo(Application.ExecutablePath);
                AddQualityLine(b,ref pass,ref warn,ref fail,exe.Exists&&exe.Length>50000?"PASS":"FAIL","Plik wykonywalny",exe.Exists?exe.Length+" bajtów":"brak");
            }
            catch(Exception ex){AddQualityLine(b,ref pass,ref warn,ref fail,"FAIL","Plik wykonywalny",ex.Message);}
            try
            {
                if(!Directory.Exists(dataRoot))Directory.CreateDirectory(dataRoot);
                string test=Path.Combine(dataRoot,"qc_write_test.tmp");File.WriteAllText(test,"NaprawaPC QC "+DateTime.Now.ToString("o"),Encoding.UTF8);
                bool ok=File.Exists(test)&&new FileInfo(test).Length>0;File.Delete(test);
                AddQualityLine(b,ref pass,ref warn,ref fail,ok?"PASS":"FAIL","Folder danych",dataRoot);
            }
            catch(Exception ex){AddQualityLine(b,ref pass,ref warn,ref fail,"FAIL","Folder danych",ex.Message);}
            AddQualityLine(b,ref pass,ref warn,ref fail,File.Exists(configPath)?"PASS":"WARN","Konfiguracja",File.Exists(configPath)?configPath:"nie utworzono jeszcze settings.xml");
            AddQualityLine(b,ref pass,ref warn,ref fail,HasVerifiedBackup()?"PASS":"WARN","Kopia zapasowa",HasVerifiedBackup()?"program rozpoznaje zweryfikowaną kopię":"brak kompletnej zweryfikowanej kopii");
            string[] tools=new string[]{"dism.exe","sfc.exe","chkdsk.exe","wbadmin.exe","pnputil.exe","reagentc.exe","bcdedit.exe","wevtutil.exe","powershell.exe","mdsched.exe"};
            string system=Environment.GetFolderPath(Environment.SpecialFolder.System);
            foreach(string tool in tools)
            {
                string path=Path.Combine(system,tool);bool ok=File.Exists(path);
                if(tool=="powershell.exe" && !ok)ok=File.Exists(Path.Combine(system,"WindowsPowerShell","v1.0","powershell.exe"));
                AddQualityLine(b,ref pass,ref warn,ref fail,ok?"PASS":"WARN",tool,ok?"dostępny":"brak / inna lokalizacja");
            }
            string winfrPath=FindWinfrExecutable();
            AddQualityLine(b,ref pass,ref warn,ref fail,String.IsNullOrEmpty(winfrPath)?"WARN":"PASS","Windows File Recovery (winfr.exe)",String.IsNullOrEmpty(winfrPath)?"opcjonalne narzędzie nie jest zainstalowane":winfrPath);
            string[] methods=new string[]{"BuildDashboard","BuildRadioOnlinePage","BuildHardwareMonitorPage","BuildDiskHealthPage","BuildServiceDeskPage","BuildMigrationPlannerPage","BuildBootManagerPage","BuildNvmeDoctorPage","BuildPcRescuePage","BuildMemoryTestPage","BuildQualityControlPage",
                "BuildNotificationCenterPage","BuildBackupSchedulerPage","BuildServiceAssistantPage",
                "BuildDriverRepositoryPage","BuildWifiAnalyzerPage","BuildWindowsFileRecoveryPage",
                "BuildAppCompatibilityPage","BuildBuildManagerPage",
                "BuildMigrationIntelligencePage","BuildBackupRecoveryUltimatePage","BuildHardwareIntelligencePage",
                "BuildWindowsCompatibilityDatabasePage","BuildUniversalBootRepairPage","BuildDriverDownloadCenterPage",
                "BuildServiceReportDesignerPage","BuildOperationRecoveryCenterPage"};
            foreach(string method in methods)
            {
                bool ok=GetType().GetMethod(method,System.Reflection.BindingFlags.Instance|System.Reflection.BindingFlags.NonPublic)!=null;
                AddQualityLine(b,ref pass,ref warn,ref fail,ok?"PASS":"FAIL","Moduł "+method,ok?"metoda skompilowana":"brak implementacji");
            }
            Type wmp=Type.GetTypeFromProgID("WMPlayer.OCX",false);
            AddQualityLine(b,ref pass,ref warn,ref fail,wmp!=null?"PASS":"WARN","Windows Media Player COM",wmp!=null?"komponent dostępny":"brak; sprawdź VLC lub przeglądarkę");
            AddQualityLine(b,ref pass,ref warn,ref fail,FindVlcPathForQuality()!=null?"PASS":"WARN","VLC",FindVlcPathForQuality()!=null?FindVlcPathForQuality():"nie wykryto VLC");
            AddQualityLine(b,ref pass,ref warn,ref fail,Directory.Exists(Path.GetDirectoryName(notificationsPath))?"PASS":"WARN","Folder historii powiadomień",notificationsPath);
            AddQualityLine(b,ref pass,ref warn,ref fail,Directory.Exists(Path.GetDirectoryName(backupSchedulePath))?"PASS":"WARN","Folder harmonogramu kopii",backupSchedulePath);
            AddQualityLine(b,ref pass,ref warn,ref fail,schedulerEnabled?"PASS":"WARN","Harmonogram kopii",schedulerEnabled?"włączony; następna kopia: "+schedulerNextRun.ToString("yyyy-MM-dd HH:mm"):"wyłączony");
            AddQualityLine(b,ref pass,ref warn,ref fail,Directory.Exists(Path.GetDirectoryName(compatibilityDbPath))?"PASS":"WARN","Windows Compatibility DB folder",compatibilityDbPath);
            AddQualityLine(b,ref pass,ref warn,ref fail,File.Exists(Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"NaprawaPC.ico"))?"PASS":"WARN","Application icon source","NaprawaPC.ico obok EXE/źródeł");
            b.AppendLine();b.AppendLine("PODSUMOWANIE: PASS="+pass+" | WARN="+warn+" | FAIL="+fail);
            b.AppendLine("Kontrole są odczytowe. Nie dowodzą poprawności wszystkich funkcji i nie zastępują testów instalacji, dźwięku, migracji ani odzyskiwania.");
            qualityReportBox.Text=b.ToString();AppendLog("Quality Control PRO: PASS="+pass+" WARN="+warn+" FAIL="+fail);
        }

        private string FindVlcPathForQuality()
        {
            string[] paths=new string[]{
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),"VideoLAN","VLC","vlc.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),"VideoLAN","VLC","vlc.exe")};
            foreach(string path in paths)if(File.Exists(path))return path;return null;
        }

        private void TestRadioDirectoryForQc()
        {
            if(qualityRadioWorker!=null && qualityRadioWorker.IsBusy){qualityReportBox.AppendText("\r\nRadio API: test trwa...");return;}
            if(qualityReportBox!=null)qualityReportBox.AppendText("\r\n\r\nRADIO BROWSER API: sprawdzanie...");
            qualityRadioWorker=new BackgroundWorker();
            qualityRadioWorker.DoWork+=delegate(object sender,DoWorkEventArgs e){string host;string json=RadioBrowserRequest("/json/stats",out host);e.Result=host+"\r\n"+json;};
            qualityRadioWorker.RunWorkerCompleted+=delegate(object sender,RunWorkerCompletedEventArgs e)
            {
                if(qualityReportBox==null||qualityReportBox.IsDisposed)return;
                qualityReportBox.AppendText(e.Error==null?"\r\n[PASS] Radio Browser API:\r\n"+Convert.ToString(e.Result):"\r\n[WARN] Radio Browser API niedostępne: "+e.Error.GetBaseException().Message);
                AppendLog(e.Error==null?"Quality Control: Radio Browser API OK":"Quality Control: Radio Browser API unavailable");
            };
            qualityRadioWorker.RunWorkerAsync();
        }

        // FIX053 — persistent local notifications.
        private void LoadNotifications()
        {
            notificationHistory.Clear();
            try
            {
                string dir=Path.GetDirectoryName(notificationsPath);if(!Directory.Exists(dir))Directory.CreateDirectory(dir);
                if(!File.Exists(notificationsPath))return;
                XmlDocument d=new XmlDocument();d.XmlResolver=null;d.Load(notificationsPath);
                foreach(XmlNode n in d.SelectNodes("/Notifications/Notification"))
                {
                    NotificationRecord r=new NotificationRecord();DateTime dt;
                    if(DateTime.TryParse(ReadNotificationValue(n,"When"),null,DateTimeStyles.RoundtripKind,out dt))r.When=dt;
                    r.Level=ReadNotificationValue(n,"Level");r.Title=ReadNotificationValue(n,"Title");r.Message=ReadNotificationValue(n,"Message");
                    notificationHistory.Add(r);
                }
            }
            catch(Exception ex){AppendLog("Notification history load error: "+ex.Message);}
            while(notificationHistory.Count>200)notificationHistory.RemoveAt(0);
        }

        private string ReadNotificationValue(XmlNode node,string name)
        {
            XmlNode n=node.SelectSingleNode(name);return n==null?"":n.InnerText;
        }

        private void SaveNotifications()
        {
            try
            {
                string dir=Path.GetDirectoryName(notificationsPath);if(!Directory.Exists(dir))Directory.CreateDirectory(dir);
                XmlDocument d=new XmlDocument();XmlElement root=d.CreateElement("Notifications");root.SetAttribute("Updated",DateTime.Now.ToString("o"));d.AppendChild(root);
                int start=Math.Max(0,notificationHistory.Count-200);
                for(int i=start;i<notificationHistory.Count;i++)
                {
                    NotificationRecord r=notificationHistory[i];XmlElement item=d.CreateElement("Notification");root.AppendChild(item);
                    AddCaseValue(d,item,"When",r.When.ToString("o"));AddCaseValue(d,item,"Level",r.Level);
                    AddCaseValue(d,item,"Title",r.Title);AddCaseValue(d,item,"Message",r.Message);
                }
                SaveXmlSafely(d,notificationsPath,8);
            }
            catch(Exception ex){try{File.AppendAllText(activityLogPath,"Notification save error: "+ex.Message+Environment.NewLine);}catch{}}
        }


        private void NotifyUser(string level,string title,string message,bool balloon)
        {
            NotificationRecord r=new NotificationRecord();
            r.When=DateTime.Now;
            r.Level=String.IsNullOrEmpty(level)?"INFO":level;
            r.Title=String.IsNullOrEmpty(title)?"KOMPUTEROWE CENTRUM SERWISU":title;
            r.Message=message??"";
            notificationHistory.Add(r);
            while(notificationHistory.Count>200)notificationHistory.RemoveAt(0);
            SaveNotifications();
            if(notificationUiReport!=null && !notificationUiReport.IsDisposed && activePage=="Powiadomienia PRO")
                RefreshNotificationCenter();
            if(balloon && appTrayIcon!=null && appTrayIcon.Visible)
            {
                string body=r.Message;
                if(body.Length>240)body=body.Substring(0,237)+"...";
                ToolTipIcon icon=r.Level=="ERROR"?ToolTipIcon.Error:(r.Level=="WARN"?ToolTipIcon.Warning:ToolTipIcon.Info);
                try{appTrayIcon.ShowBalloonTip(3500,r.Title,body,icon);}catch{}
            }
        }

        private void BuildNotificationCenterPage()
        {
            if(FindPage("Powiadomienia PRO")!=null)return;
            Panel p=NewPage("Powiadomienia PRO","Centrum powiadomień PRO");
            Panel top=Card(p,"POWIADOMIENIA SYSTEMOWE / PROGRAMU",10,8,950,150);
            LabelAt(top,"Trwała historia błędów, zakończonych kopii, ostrzeżeń i ważnych zdarzeń. Zapis lokalny w folderze Data.",18,45,900,35);
            ButtonAt(top,"ODŚWIEŻ",18,92,150,delegate{RefreshNotificationCenter();});
            ButtonAt(top,"WYCZYŚĆ HISTORIĘ",180,92,200,delegate{ClearNotificationHistory();});
            ButtonAt(top,"ZAPISZ RAPORT",392,92,180,delegate{SaveTextReport(notificationUiReport,"Notifications");});
            Panel report=Card(p,"OSTATNIE 200 ZDARZEŃ",10,165,950,420);
            notificationUiReport=new TextBox();notificationUiReport.Multiline=true;notificationUiReport.ReadOnly=true;
            notificationUiReport.ScrollBars=ScrollBars.Both;notificationUiReport.WordWrap=false;notificationUiReport.Font=new Font("Consolas",8.5F);
            notificationUiReport.BackColor=Color.FromArgb(7,13,23);notificationUiReport.ForeColor=Color.FromArgb(205,235,245);
            notificationUiReport.Location=new Point(UX(18),UY(45));notificationUiReport.Size=new Size(UX(895),UY(365));report.Controls.Add(notificationUiReport);
            Panel info=Card(p,"ZASOBNIK SYSTEMOWY",10,595,950,110);
            LabelAt(info,"Menu ikony KOMPUTEROWE CENTRUM SERWISU w zasobniku pozwala otworzyć aplikację, radio, powiadomienia i harmonogram. Dymki zależą od ustawień powiadomień Windows.",18,45,900,42);
            RefreshNotificationCenter();
        }

        private void RefreshNotificationCenter()
        {
            if(notificationUiReport==null)return;
            StringBuilder b=new StringBuilder();b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — CENTRUM POWIADOMIEŃ");
            b.AppendLine("Data: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")+" | Zdarzeń: "+notificationHistory.Count);b.AppendLine();
            for(int i=notificationHistory.Count-1;i>=0;i--)
            {
                NotificationRecord r=notificationHistory[i];
                b.AppendLine("["+r.When.ToString("yyyy-MM-dd HH:mm:ss")+"] ["+r.Level+"] "+r.Title);
                b.AppendLine("  "+r.Message);
            }
            if(notificationHistory.Count==0)b.AppendLine("Brak powiadomień.");
            notificationUiReport.Text=b.ToString();
        }

        private void ClearNotificationHistory()
        {
            if(MessageBox.Show("Usunąć lokalną historię powiadomień? Dziennik operacji pozostanie bez zmian.",
                "Wyczyść powiadomienia",MessageBoxButtons.YesNo,MessageBoxIcon.Question,MessageBoxDefaultButton.Button2)!=DialogResult.Yes)return;
            notificationHistory.Clear();SaveNotifications();RefreshNotificationCenter();AppendLog("Wyczyszczono historię powiadomień.");
        }

        // FIX053 — backup schedule: only runs while application is alive and Windows is awake.
        private void LoadBackupSchedule()
        {
            try
            {
                if(!File.Exists(backupSchedulePath))return;
                XmlDocument d=new XmlDocument();d.XmlResolver=null;d.Load(backupSchedulePath);
                XmlNode n=d.SelectSingleNode("/BackupSchedule");if(n==null)return;
                schedulerEnabled=n.Attributes["Enabled"]!=null && n.Attributes["Enabled"].Value=="1";
                schedulerTarget=n.Attributes["Target"]==null?"":n.Attributes["Target"].Value;
                schedulerFrequency=n.Attributes["Frequency"]==null?"Codziennie":n.Attributes["Frequency"].Value;
                schedulerPhysicalConfirmed=n.Attributes["PhysicalConfirmed"]!=null && n.Attributes["PhysicalConfirmed"].Value=="1";
                DateTime t;
                if(DateTime.TryParse(n.Attributes["NextRun"]==null?"":n.Attributes["NextRun"].Value,null,DateTimeStyles.RoundtripKind,out t))schedulerNextRun=t;
                if(DateTime.TryParse(n.Attributes["LastRun"]==null?"":n.Attributes["LastRun"].Value,null,DateTimeStyles.RoundtripKind,out t))schedulerLastRun=t;
            }
            catch(Exception ex){AppendLog("Backup scheduler load error: "+ex.Message);}
        }

        private void SaveBackupScheduleToDisk()
        {
            try
            {
                string dir=Path.GetDirectoryName(backupSchedulePath);if(!Directory.Exists(dir))Directory.CreateDirectory(dir);
                XmlDocument d=new XmlDocument();XmlElement root=d.CreateElement("BackupSchedule");
                root.SetAttribute("Enabled",schedulerEnabled?"1":"0");root.SetAttribute("Target",schedulerTarget??"");
                root.SetAttribute("Frequency",schedulerFrequency??"Codziennie");
                root.SetAttribute("PhysicalConfirmed",schedulerPhysicalConfirmed?"1":"0");
                root.SetAttribute("NextRun",schedulerNextRun==DateTime.MinValue?"":schedulerNextRun.ToString("o"));
                root.SetAttribute("LastRun",schedulerLastRun==DateTime.MinValue?"":schedulerLastRun.ToString("o"));
                d.AppendChild(root);SaveXmlSafely(d,backupSchedulePath,8);
            }
            catch(Exception ex){AppendLog("Backup scheduler save error: "+ex.Message);}
        }

        private DateTime CalculateNextScheduleRun(DateTime from)
        {
            TimeSpan time=schedulerUiTime==null?new TimeSpan(2,0,0):schedulerUiTime.Value.TimeOfDay;
            DateTime candidate=from.Date.Add(time);if(candidate<=from)candidate=candidate.AddDays(1);return candidate;
        }

        private void InitializeBackupSchedulerTimer()
        {
            if(schedulerTimer==null)
            {
                schedulerTimer=new System.Windows.Forms.Timer();schedulerTimer.Interval=30000;
                schedulerTimer.Tick+=delegate{CheckScheduledBackup();};
            }
            if(!schedulerTimer.Enabled)schedulerTimer.Start();
            UpdateBackupSchedulerUiStatus();CheckScheduledBackup();
        }

        private void UpdateBackupSchedulerUiStatus()
        {
            if(schedulerUiStatus==null || schedulerUiStatus.IsDisposed)return;
            if(!schedulerEnabled)schedulerUiStatus.Text="STATUS: harmonogram wyłączony.";
            else schedulerUiStatus.Text="STATUS: WŁĄCZONY | następna kopia: "+
                (schedulerNextRun==DateTime.MinValue?"nie zaplanowano":schedulerNextRun.ToString("yyyy-MM-dd HH:mm"))+" | "+schedulerFrequency;
        }

        private void BuildBackupSchedulerPage()
        {
            if(FindPage("Backup Scheduler PRO")!=null)return;
            Panel p=NewPage("Backup Scheduler PRO","Backup Scheduler PRO");
            Panel target=Card(p,"DOCELOWA LOKALIZACJA KOPII — INNY DYSK FIZYCZNY",10,8,950,150);
            schedulerUiTarget=TextAt(target,18,48,700,26,schedulerTarget);
            ButtonAt(target,"WYBIERZ FOLDER",730,44,185,delegate{
                FolderBrowserDialog d=new FolderBrowserDialog();d.Description="Wybierz folder na innym dysku fizycznym niż Windows.";
                if(d.ShowDialog()==DialogResult.OK)schedulerUiTarget.Text=d.SelectedPath;
            });
            schedulerUiPhysicalConfirm=CheckAt(target,"Potwierdzam, że wybrany nośnik jest fizycznie oddzielny od dysku Windows.",18,91,870,schedulerPhysicalConfirmed);
            LabelAt(target,"Kopia zawiera dane profilu, weryfikację SHA-256 i obraz systemu wbadmin, jeśli jest dostępny.",18,119,900,20);

            Panel options=Card(p,"CZĘSTOTLIWOŚĆ / GODZINA",10,170,950,160);
            schedulerUiEnabled=CheckAt(options,"WŁĄCZ AUTOMATYCZNE KOPIE",18,48,300,schedulerEnabled);
            LabelAt(options,"Powtarzanie",335,48,100,24);
            schedulerUiFrequency=ComboAt(options,new string[]{"Codziennie","Co 7 dni"},440,44,170);
            schedulerUiFrequency.SelectedItem=schedulerFrequency;
            LabelAt(options,"Godzina",625,48,70,24);
            schedulerUiTime=new DateTimePicker();schedulerUiTime.Format=DateTimePickerFormat.Time;schedulerUiTime.ShowUpDown=true;
            schedulerUiTime.Location=new Point(UX(700),UY(44));schedulerUiTime.Size=new Size(UX(150),UY(28));
            if(schedulerNextRun!=DateTime.MinValue)schedulerUiTime.Value=DateTime.Today.Add(schedulerNextRun.TimeOfDay);
            else schedulerUiTime.Value=DateTime.Today.AddHours(2);
            options.Controls.Add(schedulerUiTime);
            ButtonAt(options,"ZAPISZ HARMONOGRAM",18,95,235,delegate{SaveBackupScheduleFromUi();});
            ButtonAt(options,"URUCHOM KOPIĘ TERAZ",265,95,230,delegate{RunScheduledBackup(true);});

            Panel state=Card(p,"STATUS I OSTATNIE WYKONANIE",10,340,950,150);
            schedulerUiStatus=LabelAt(state,"STATUS: odczytywanie...",18,45,900,28);
            LabelAt(state,"Ostatnia kopia: "+(schedulerLastRun==DateTime.MinValue?"brak":schedulerLastRun.ToString("yyyy-MM-dd HH:mm:ss")),18,78,900,24);
            ButtonAt(state,"ODŚWIEŻ STATUS",18,108,190,delegate{UpdateBackupSchedulerUiStatus();});

            Panel rules=Card(p,"WAŻNE OGRANICZENIA",10,500,950,180);
            LabelAt(rules,"• Harmonogram działa tylko, gdy KOMPUTEROWE CENTRUM SERWISU jest uruchomiony (może być w zasobniku), a komputer jest włączony i wybudzony.\r\n• Nie budzi wyłączonego ani uśpionego komputera.\r\n• Backup nie wystartuje, jeśli brakuje administratora, celu lub potwierdzenia oddzielnego dysku.\r\n• Zawsze sprawdzaj wolne miejsce i raport po wykonaniu kopii.",18,45,900,115);
            UpdateBackupSchedulerUiStatus();
        }

        private void SaveBackupScheduleFromUi()
        {
            if(schedulerUiTarget==null || schedulerUiFrequency==null || schedulerUiEnabled==null)return;
            string target=schedulerUiTarget.Text.Trim();bool enabled=schedulerUiEnabled.Checked;
            if(enabled)
            {
                if(!Directory.Exists(target)){MessageBox.Show("Wskaż istniejący folder na dysku kopii.");return;}
                if(!schedulerUiPhysicalConfirm.Checked){MessageBox.Show("Potwierdź, że kopia trafia na inny fizyczny dysk.");return;}
                string root=Path.GetPathRoot(Path.GetFullPath(target));
                string sys=Path.GetPathRoot(Environment.GetFolderPath(Environment.SpecialFolder.System));
                if(String.Equals(root,sys,StringComparison.OrdinalIgnoreCase)){MessageBox.Show("Dysk kopii nie może być dyskiem Windows.");return;}
            }
            schedulerTarget=target;schedulerEnabled=enabled;schedulerPhysicalConfirmed=schedulerUiPhysicalConfirm.Checked;
            schedulerFrequency=Convert.ToString(schedulerUiFrequency.SelectedItem);
            schedulerNextRun=schedulerEnabled?CalculateNextScheduleRun(DateTime.Now):DateTime.MinValue;
            SaveBackupScheduleToDisk();UpdateBackupSchedulerUiStatus();
            AppendLog("Zapisano harmonogram kopii: "+(schedulerEnabled?"włączony":"wyłączony"));
            NotifyUser("INFO","Harmonogram kopii",schedulerEnabled?"Kolejna kopia: "+schedulerNextRun.ToString("yyyy-MM-dd HH:mm"):"Harmonogram został wyłączony.",true);
        }

        private void AdvanceBackupSchedule()
        {
            TimeSpan scheduledTime=schedulerNextRun!=DateTime.MinValue?schedulerNextRun.TimeOfDay:
                (schedulerUiTime==null?new TimeSpan(2,0,0):schedulerUiTime.Value.TimeOfDay);
            DateTime next=DateTime.Now.AddDays(schedulerFrequency=="Co 7 dni"?7:1);
            schedulerNextRun=next.Date.Add(scheduledTime);
        }

        private void CheckScheduledBackup()
        {
            if(!schedulerEnabled || schedulerNextRun==DateTime.MinValue || DateTime.Now<schedulerNextRun)return;
            RunScheduledBackup(false);
        }

        private void RunScheduledBackup(bool manual)
        {
            if(isBusy)
            {
                if(!manual){schedulerNextRun=DateTime.Now.AddMinutes(30);SaveBackupScheduleToDisk();NotifyUser("WARN","Kopia przesunięta","Inna operacja jest w toku. Kopię przesunięto o 30 minut.",true);}
                return;
            }
            string dest=schedulerTarget;
            if(String.IsNullOrWhiteSpace(dest) || !Directory.Exists(dest))
            {
                if(!manual){schedulerNextRun=DateTime.Now.AddHours(6);SaveBackupScheduleToDisk();}
                NotifyUser("ERROR","Brak dysku kopii","Lokalizacja harmonogramu jest niedostępna: "+dest,true);
                if(manual)MessageBox.Show("Lokalizacja kopii jest niedostępna.");return;
            }
            if(!IsAdmin())
            {
                if(!manual){schedulerNextRun=DateTime.Now.AddHours(12);SaveBackupScheduleToDisk();}
                NotifyUser("ERROR","Brak uprawnień administratora","Automatyczny obraz systemu wymaga uruchomienia programu jako administrator.",true);
                if(manual)MessageBox.Show("Uruchom program jako administrator.");return;
            }
            string destRoot=Path.GetPathRoot(Path.GetFullPath(dest)).TrimEnd('\\');
            string sysRoot=Path.GetPathRoot(Environment.GetFolderPath(Environment.SpecialFolder.System)).TrimEnd('\\');
            if(String.Equals(destRoot,sysRoot,StringComparison.OrdinalIgnoreCase))
            {
                if(!manual){schedulerNextRun=DateTime.Now.AddHours(6);SaveBackupScheduleToDisk();}
                NotifyUser("ERROR","Niebezpieczny cel kopii","Dysk kopii jest dyskiem Windows. Operacja została zablokowana.",true);
                if(manual)MessageBox.Show("Dysk kopii nie może być dyskiem Windows.");
                return;
            }
            try
            {
                DriveInfo di=new DriveInfo(destRoot+Path.DirectorySeparatorChar);
                if(!di.IsReady || (di.DriveType!=DriveType.Fixed && di.DriveType!=DriveType.Removable && di.DriveType!=DriveType.Network))
                    throw new IOException("Dysk docelowy nie jest gotowy lub ma nieobsługiwany typ.");
                List<string> sourceIds=GetPhysicalDiskIds(sysRoot);List<string> targetIds=GetPhysicalDiskIds(destRoot);
                if(sourceIds.Count>0 && targetIds.Count>0)
                {
                    foreach(string id in sourceIds)if(targetIds.Contains(id))throw new IOException("Cel kopii jest na tym samym fizycznym dysku co Windows.");
                }
                else if(!schedulerPhysicalConfirmed)throw new IOException("Nie można potwierdzić oddzielnego nośnika. Włącz potwierdzenie w harmonogramie.");
                if(backupBrowserCheck!=null && backupBrowserCheck.Checked)
                {
                    int running=0;string[] names=new string[]{"chrome","msedge","firefox"};
                    foreach(string n in names)try{running+=Process.GetProcessesByName(n).Length;}catch{}
                    if(running>0)throw new IOException("Przeglądarki są uruchomione — zamknij je przed kopią profili.");
                }
                List<BackupRoot> roots=GetBackupRoots();if(roots.Count==0)throw new IOException("Nie wykryto folderów do skopiowania.");
                if(manual && MessageBox.Show("Zostanie uruchomiona pełna kopia danych z SHA-256 oraz obraz systemu wbadmin na wskazanym dysku. Proces może długo obciążać dyski i wymaga miejsca na kopię. Kontynuować?",
                    "Potwierdzenie pełnej kopii",MessageBoxButtons.YesNo,MessageBoxIcon.Warning,MessageBoxDefaultButton.Button2)!=DialogResult.Yes)return;
                string folder=Path.Combine(dest,"NaprawaPC_ScheduledBackup_"+DateTime.Now.ToString("yyyyMMdd_HHmmss"));
                BackupJob job=new BackupJob();job.Destination=folder;job.TargetDrive=destRoot;job.Roots=roots;job.Verify=true;job.SystemDrive=sysRoot;
                AdvanceBackupSchedule();SaveBackupScheduleToDisk();
                worker=new BackgroundWorker();worker.WorkerReportsProgress=true;worker.DoWork+=BackupDoWork;
                worker.ProgressChanged+=WorkerProgress;worker.RunWorkerCompleted+=ScheduledBackupCompleted;
                SetBusy(true,manual?"Trwa ręczna kopia z harmonogramu...":"Trwa zaplanowana kopia...");
                worker.RunWorkerAsync(job);AppendLog("Rozpoczęto kopię: "+folder);
                NotifyUser("INFO","Rozpoczęto kopię",folder,true);
            }
            catch(Exception ex)
            {
                if(!manual){schedulerNextRun=DateTime.Now.AddHours(6);SaveBackupScheduleToDisk();}
                AppendLog("Harmonogram kopii — operacja wstrzymana: "+ex.Message);
                NotifyUser("ERROR","Kopia nie została uruchomiona",ex.Message,true);
                if(manual)MessageBox.Show(ex.Message,"Harmonogram kopii",MessageBoxButtons.OK,MessageBoxIcon.Warning);
            }
        }

        private void ScheduledBackupCompleted(object sender,RunWorkerCompletedEventArgs e)
        {
            SetBusy(false,"");
            if(e.Error!=null)
            {
                AppendLog("Zaplanowana kopia nie powiodła się: "+e.Error.GetBaseException().Message);
                NotifyUser("ERROR","Zaplanowana kopia nie powiodła się",e.Error.GetBaseException().Message,true);return;
            }
            BackupResult r=(BackupResult)e.Result;lastManifest=r.Manifest;SaveConfig();schedulerLastRun=DateTime.Now;SaveBackupScheduleToDisk();
            bool ok=HasVerifiedBackup();
            if(ok)
            {
                AppendLog("Zaplanowana kopia zakończona i zweryfikowana: "+r.Summary);
                NotifyUser("INFO","Kopia zakończona","Kopia plików i obraz systemu zostały potwierdzone. "+r.Folder,true);
            }
            else
            {
                AppendLog("Zaplanowana kopia nie została w pełni zweryfikowana: "+r.Summary);
                NotifyUser("ERROR","Kopia niekompletna","Migracja pozostaje zablokowana. "+r.Folder,true);
            }
            RefreshBackupStatus();UpdateBackupSchedulerUiStatus();
        }

        // Local, deterministic diagnostic rules; no remote AI or unattended repairs.
        private void BuildServiceAssistantPage()
        {
            if(FindPage("AI Service Assistant")!=null)return;
            Panel p=NewPage("AI Service Assistant","AI Service Assistant — analiza lokalna");
            Panel top=Card(p,"WYBIERZ PROBLEM DO ANALIZY",10,8,950,150);
            LabelAt(top,"Analiza lokalna sprawdza stan Windows, kopię i ostatnie błędy. Nie wysyła danych do chmury i nie wykonuje automatycznych napraw.",18,45,900,35);
            assistantUiSymptom=ComboAt(top,new string[]{
                "Wolny komputer / wysokie użycie CPU","BSOD / niebieski ekran","Błędy dysku / SMART / NVMe",
                "Windows Update nie działa","Problem z rozruchem / BCD / EFI","Brak lub błąd sterownika",
                "Migracja / Keep All / instalator","Radio online nie odtwarza","Problem z kopią zapasową","Nieznany problem Windows"
            },18,88,500);
            ButtonAt(top,"ANALIZUJ",535,84,180,delegate{RunServiceAssistant();});
            ButtonAt(top,"ZAPISZ RAPORT",725,84,190,delegate{SaveTextReport(assistantUiReport,"ServiceAssistant");});
            Panel report=Card(p,"WYNIK ANALIZY / PROPOZYCJE",10,165,950,430);
            assistantUiReport=new TextBox();assistantUiReport.Multiline=true;assistantUiReport.ReadOnly=true;
            assistantUiReport.ScrollBars=ScrollBars.Both;assistantUiReport.WordWrap=false;assistantUiReport.Font=new Font("Consolas",8.5F);
            assistantUiReport.BackColor=Color.FromArgb(7,13,23);assistantUiReport.ForeColor=Color.FromArgb(205,235,245);
            assistantUiReport.Location=new Point(UX(18),UY(45));assistantUiReport.Size=new Size(UX(895),UY(375));report.Controls.Add(assistantUiReport);
            Panel note=Card(p,"ZAKRES I BEZPIECZEŃSTWO",10,605,950,105);
            LabelAt(note,"To lokalny asystent regułowy, nie autonomiczna naprawa ani model AI w chmurze. Zalecenia wymagają oceny serwisanta.",18,45,900,42);
            RunServiceAssistant();
        }

        private void RunServiceAssistant()
        {
            if(assistantUiReport==null || assistantUiSymptom==null)return;
            string symptom=Convert.ToString(assistantUiSymptom.SelectedItem);StringBuilder b=new StringBuilder();
            b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — AI SERVICE ASSISTANT");b.AppendLine("Tryb: analiza lokalna / regułowa / offline");
            b.AppendLine("Data: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
            b.AppendLine("Komputer: "+Environment.MachineName);
            b.AppendLine("Windows: "+GetOsCaption()+" | "+GetBuild()+" | "+GetArchitecture());
            b.AppendLine("Problem: "+symptom);b.AppendLine();
            b.AppendLine("KONTEXT:");
            b.AppendLine("Administrator: "+(IsAdmin()?"TAK":"NIE"));
            b.AppendLine("Pełna kopia zweryfikowana: "+(HasVerifiedBackup()?"TAK":"NIE"));
            b.AppendLine("Firmware: "+ReadFirmwareType()+" | Secure Boot: "+ReadSecureBoot()+" | TPM: "+ReadTpmSpec());
            b.AppendLine("Harmonogram kopii: "+(schedulerEnabled?"WŁĄCZONY":"WYŁĄCZONY"));
            b.AppendLine();b.AppendLine("OSTATNIE BŁĘDY DZIENNIKA:");
            int start=Math.Max(0,logHistory.Count-60);bool found=false;
            for(int i=logHistory.Count-1;i>=start;i--)
            {
                string line=logHistory[i];
                if(line.IndexOf("BŁĄD",StringComparison.OrdinalIgnoreCase)>=0 ||
                   line.IndexOf("ERROR",StringComparison.OrdinalIgnoreCase)>=0 ||
                   line.IndexOf("FAIL",StringComparison.OrdinalIgnoreCase)>=0)
                {b.AppendLine(line);found=true;}
            }
            if(!found)b.AppendLine("Brak wpisów oznaczonych BŁĄD/ERROR/FAIL w ostatnich 60 pozycjach.");
            b.AppendLine();b.AppendLine("ZALECENIA:");
            if(!HasVerifiedBackup())b.AppendLine("[WYSOKI PRIORYTET] Brak pełnej zweryfikowanej kopii. Przed zmianami systemu wykonaj obraz na osobnym dysku.");
            if(!IsAdmin())b.AppendLine("[UWAGA] Program nie ma uprawnień administratora; część testów i operacji może być niedostępna.");
            string q=symptom.ToLowerInvariant();
            if(q.Contains("wolny"))
            {
                b.AppendLine("1. Windows Performance Center: sprawdź CPU/RAM i TOP procesów.");
                b.AppendLine("2. Disk Health/NVMe Doctor: sprawdź dostępne SMART i wolne miejsce.");
                b.AppendLine("3. Porównaj obciążenie w stanie bezczynności i po czystym rozruchu.");
            }
            else if(q.Contains("bsod"))
            {
                b.AppendLine("1. Otwórz Analiza BSOD i przejrzyj najnowszy minidump.");
                b.AppendLine("2. Sprawdź sterowniki zmieniane bezpośrednio przed awarią.");
                b.AppendLine("3. Zachowaj pliki .dmp przed czyszczeniem systemu.");
            }
            else if(q.Contains("dysk"))
            {
                b.AppendLine("1. Uruchom Disk Health i NVMe SSD Doctor; brak SMART nie oznacza zdrowego dysku.");
                b.AppendLine("2. Przy objawach awarii ogranicz zapisy i najpierw skopiuj ważne dane.");
                b.AppendLine("3. Porównaj raport z narzędziem producenta dysku.");
            }
            else if(q.Contains("update"))
            {
                b.AppendLine("1. Odczytaj zdarzenia WindowsUpdateClient.");
                b.AppendLine("2. Sprawdź wolne miejsce i uruchom DISM CheckHealth/ScanHealth.");
                b.AppendLine("3. RestoreHealth uruchamiaj dopiero po kopii i sprawdzeniu źródła.");
            }
            else if(q.Contains("rozruch"))
            {
                b.AppendLine("1. Odczytaj BCD i wyeksportuj magazyn przed zmianami.");
                b.AppendLine("2. Sprawdź UEFI/GPT lub Legacy/MBR.");
                b.AppendLine("3. Nie formatuj EFI i nie importuj BCD z innego komputera.");
            }
            else if(q.Contains("sterownik"))
            {
                b.AppendLine("1. Uruchom Driver Compatibility Analyzer i sprawdź kody PnP.");
                b.AppendLine("2. Pobieraj sterowniki wyłącznie od producenta komputera/podzespołu.");
                b.AppendLine("3. Przed aktualizacją wykonaj punkt przywracania i kopię sterowników.");
            }
            else if(q.Contains("migracja"))
            {
                b.AppendLine("1. Uruchom raport gotowości i Migration Planner.");
                b.AppendLine("2. Zweryfikuj edycję, język, architekturę i sterowniki.");
                b.AppendLine("3. Kontynuuj tylko, jeśli rzeczywisty Windows Setup oferuje Keep All.");
            }
            else if(q.Contains("radio"))
            {
                b.AppendLine("1. Sprawdź Radio Browser API w Quality Control.");
                b.AppendLine("2. Wybierz stację MP3/AAC i przetestuj próbkę danych audio.");
                b.AppendLine("3. Jeśli WMP COM nie działa, sprawdź VLC lub otwórz stronę stacji.");
            }
            else if(q.Contains("kopią"))
            {
                b.AppendLine("1. Sprawdź zewnętrzny dysk, wolne miejsce, WMI i uprawnienia administratora.");
                b.AppendLine("2. Sprawdź Backup.xml oraz SystemImage.log.");
                b.AppendLine("3. Potwierdź odczyt przez wbadmin get versions.");
            }
            else
            {
                b.AppendLine("1. Zapisz raport sprzętu i błędów z Dziennika zdarzeń.");
                b.AppendLine("2. Sprawdź dostępność DISM, SFC, CHKDSK, WMI i sterowników.");
                b.AppendLine("3. Nie uruchamiaj naprawy automatycznej bez ustalenia przyczyny i wykonania kopii.");
            }
            b.AppendLine();b.AppendLine("Wskazówki są oparte na regułach i dostępnych danych. Nie potwierdzają usterki i nie gwarantują naprawy.");
            assistantUiReport.Text=b.ToString();AppendLog("AI Service Assistant wykonał lokalną analizę: "+symptom);
        }

        // FIX053 — local offline driver repository: export, inventory and confirmed reinstall.
        private void BuildDriverRepositoryPage()
        {
            if(FindPage("Driver Repository PRO")!=null)return;
            Panel p=NewPage("Driver Repository PRO","Driver Repository PRO — archiwum offline");
            Panel target=Card(p,"LOKALIZACJA ARCHIWUM STEROWNIKÓW",10,8,950,165);
            driverRepoPathBox=TextAt(target,18,47,700,26,Path.Combine(dataRoot,"DriverRepository"));
            ButtonAt(target,"WYBIERZ FOLDER",730,43,185,delegate{
                FolderBrowserDialog d=new FolderBrowserDialog();d.Description="Wybierz folder archiwum sterowników, najlepiej na osobnym dysku fizycznym.";
                if(d.ShowDialog()==DialogResult.OK)driverRepoPathBox.Text=d.SelectedPath;
            });
            driverRepoPhysicalConfirmBox=CheckAt(target,"Potwierdzam, że archiwum znajduje się na nośniku innym niż dysk systemowy.",18,87,850,false);
            ButtonAt(target,"EKSPORTUJ STEROWNIKI",18,119,220,delegate{ExportDriverRepository();});
            ButtonAt(target,"SKANUJ ARCHIWUM",250,119,190,delegate{ScanDriverRepository();});
            ButtonAt(target,"DODAJ / INSTALUJ INF",452,119,220,delegate{InstallDriverRepository();});

            Panel report=Card(p,"ZAWARTOŚĆ REPOZYTORIUM / WYNIKI",10,183,950,400);
            driverRepoReportBox=new TextBox();driverRepoReportBox.Multiline=true;driverRepoReportBox.ReadOnly=true;
            driverRepoReportBox.ScrollBars=ScrollBars.Both;driverRepoReportBox.WordWrap=false;driverRepoReportBox.Font=new Font("Consolas",8.5F);
            driverRepoReportBox.BackColor=Color.FromArgb(7,13,23);driverRepoReportBox.ForeColor=Color.FromArgb(205,235,245);
            driverRepoReportBox.Location=new Point(UX(18),UY(45));driverRepoReportBox.Size=new Size(UX(895),UY(345));report.Controls.Add(driverRepoReportBox);
            Panel info=Card(p,"ZASADY BEZPIECZEŃSTWA",10,593,950,125);
            LabelAt(info,"Eksport zawiera pakiety sterowników aktualnie obecne w Driver Store. Nie gwarantuje zgodności z innym modelem komputera. Instalowanie INF może zmienić sterowniki urządzeń — wykonaj punkt przywracania i używaj pakietów przeznaczonych dla tego sprzętu.",18,45,900,58);
            ScanDriverRepository();
        }

        private void ExportDriverRepository()
        {
            if(driverRepoPathBox==null)return;
            if(!IsAdmin()){MessageBox.Show("Uruchom KOMPUTEROWE CENTRUM SERWISU jako administrator, aby wyeksportować sterowniki.");return;}
            if(GetFamily()!="10" && GetFamily()!="11")
            {MessageBox.Show("PnPUtil /export-driver w tym module jest przeznaczony dla Windows 10/11. Na starszych systemach użyj kopii sterowników producenta.");return;}
            string folder=driverRepoPathBox.Text.Trim();
            if(String.IsNullOrWhiteSpace(folder)){MessageBox.Show("Wskaż folder repozytorium.");return;}
            try
            {
                Directory.CreateDirectory(folder);
                string targetRoot=Path.GetPathRoot(Path.GetFullPath(folder));
                string systemRoot=Path.GetPathRoot(Environment.GetFolderPath(Environment.SpecialFolder.System));
                if(String.Equals(targetRoot,systemRoot,StringComparison.OrdinalIgnoreCase))
                {MessageBox.Show("Archiwum sterowników powinno znajdować się na innym dysku niż Windows.");return;}
                List<string> sourceIds=GetPhysicalDiskIds(systemRoot);List<string> targetIds=GetPhysicalDiskIds(targetRoot);
                if(sourceIds.Count>0 && targetIds.Count>0)
                {
                    foreach(string id in sourceIds)if(targetIds.Contains(id))
                    {MessageBox.Show("WMI wykryło, że archiwum znajduje się na tym samym fizycznym dysku co Windows.");return;}
                }
                else if(driverRepoPhysicalConfirmBox==null || !driverRepoPhysicalConfirmBox.Checked)
                {MessageBox.Show("Nie można potwierdzić oddzielnego dysku. Zaznacz potwierdzenie po sprawdzeniu nośnika.");return;}
                int code;string output=CaptureOutput("pnputil.exe","/export-driver * \""+folder+"\"",out code);
                string log=Path.Combine(folder,"NaprawaPC_DriverRepository_Export_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".txt");
                File.WriteAllText(log,"PNPUTIL /EXPORT-DRIVER\r\nExit: "+code+"\r\n"+output,Encoding.UTF8);
                AppendLog("Eksport repozytorium sterowników: exit="+code+"; "+folder);
                ScanDriverRepository();
                MessageBox.Show("Eksport zakończony. Kod PnPUtil: "+code+"\r\nRaport: "+log,"Driver Repository PRO");
            }
            catch(Exception ex){MessageBox.Show("Eksport sterowników nie powiódł się: "+ex.Message);AppendLog("Driver Repository export error: "+ex.Message);}
        }

        private void ScanDriverRepository()
        {
            if(driverRepoReportBox==null || driverRepoPathBox==null)return;
            string folder=driverRepoPathBox.Text.Trim();StringBuilder b=new StringBuilder();
            b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — DRIVER REPOSITORY PRO");b.AppendLine("Folder: "+folder);b.AppendLine("Data: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));b.AppendLine();
            if(!Directory.Exists(folder)){b.AppendLine("Folder repozytorium jeszcze nie istnieje.");driverRepoReportBox.Text=b.ToString();return;}
            try
            {
                string[] inf=Directory.GetFiles(folder,"*.inf",SearchOption.AllDirectories);long bytes=0;
                foreach(string file in inf)try{bytes+=new FileInfo(file).Length;}catch{}
                b.AppendLine("Pakiety INF: "+inf.Length);b.AppendLine("Łączny rozmiar INF: "+(bytes/1048576.0).ToString("0.0",CultureInfo.InvariantCulture)+" MB");
                b.AppendLine();b.AppendLine("PIERWSZE 250 PLIKÓW:");
                for(int i=0;i<Math.Min(250,inf.Length);i++)
                {FileInfo fi=new FileInfo(inf[i]);b.AppendLine(fi.FullName+" | "+fi.Length+" bytes");}
                if(inf.Length==0)b.AppendLine("Nie znaleziono plików INF. Wykonaj eksport lub skopiuj oficjalne pakiety sterowników.");
            }
            catch(Exception ex){b.AppendLine("Błąd skanowania: "+ex.Message);}
            driverRepoReportBox.Text=b.ToString();
        }

        private void InstallDriverRepository()
        {
            if(driverRepoPathBox==null)return;
            if(!IsAdmin()){MessageBox.Show("Uruchom program jako administrator.");return;}
            if(GetFamily()!="10" && GetFamily()!="11")
            {MessageBox.Show("Instalacja pakietów PnPUtil w tym module wymaga Windows 10/11.");return;}
            string folder=driverRepoPathBox.Text.Trim();
            if(!Directory.Exists(folder)){MessageBox.Show("Folder repozytorium nie istnieje.");return;}
            string[] inf=Directory.GetFiles(folder,"*.inf",SearchOption.AllDirectories);
            if(inf.Length==0){MessageBox.Show("Nie znaleziono plików INF.");return;}
            string prompt="Liczba plików INF: "+inf.Length+"\r\nFolder: "+folder+"\r\n\r\nPnPUtil doda pakiety i spróbuje zainstalować sterowniki pasujące do urządzeń. Nie instaluj archiwum z innego modelu komputera. Kontynuować?";
            if(MessageBox.Show(prompt,"Potwierdź instalację sterowników",MessageBoxButtons.YesNo,MessageBoxIcon.Warning,MessageBoxDefaultButton.Button2)!=DialogResult.Yes)return;
            int code;string output=CaptureOutput("pnputil.exe","/add-driver \""+Path.Combine(folder,"*.inf")+"\" /subdirs /install",out code);
            string log=Path.Combine(dataRoot,"DriverRepository_Install_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".log");
            File.WriteAllText(log,"PNPUTIL /ADD-DRIVER\r\nExit: "+code+"\r\n"+output,Encoding.UTF8);
            AppendLog("Instalacja repozytorium INF: exit="+code+"; log="+log);
            MessageBox.Show("Kod PnPUtil: "+code+"\r\nLog: "+log,"Wynik instalacji sterowników");
        }

        // FIX053 — read-only Wi-Fi diagnostics using built-in netsh.
        private void BuildWifiAnalyzerPage()
        {
            if(FindPage("Wi-Fi Analyzer PRO")!=null)return;
            Panel p=NewPage("Wi-Fi Analyzer PRO","Wi-Fi Analyzer PRO — diagnostyka odczytowa");
            Panel top=Card(p,"SKANOWANIE INTERFEJSÓW / SIECI / STEROWNIKÓW",10,8,950,155);
            LabelAt(top,"Odczyt bieżącego interfejsu, widocznych sieci, BSSID, kanałów, siły sygnału i możliwości sterownika. Moduł nie zapisuje haseł i nie zmienia konfiguracji Wi-Fi.",18,45,900,42);
            ButtonAt(top,"SKANUJ WI-FI",18,97,185,delegate{RefreshWifiAnalyzer();});
            ButtonAt(top,"OTWÓRZ USTAWIENIA",215,97,220,delegate{OpenUrl("ms-settings:network-wifi");});
            ButtonAt(top,"ZAPISZ RAPORT",447,97,180,delegate{SaveTextReport(wifiAnalyzerReportBox,"WifiAnalyzer");});
            Panel result=Card(p,"WYNIKI NETSH WLAN",10,173,950,445);
            wifiAnalyzerReportBox=new TextBox();wifiAnalyzerReportBox.Multiline=true;wifiAnalyzerReportBox.ReadOnly=true;
            wifiAnalyzerReportBox.ScrollBars=ScrollBars.Both;wifiAnalyzerReportBox.WordWrap=false;wifiAnalyzerReportBox.Font=new Font("Consolas",8.3F);
            wifiAnalyzerReportBox.BackColor=Color.FromArgb(7,13,23);wifiAnalyzerReportBox.ForeColor=Color.FromArgb(205,235,245);
            wifiAnalyzerReportBox.Location=new Point(UX(18),UY(45));wifiAnalyzerReportBox.Size=new Size(UX(895),UY(395));result.Controls.Add(wifiAnalyzerReportBox);
            RefreshWifiAnalyzer();
        }

        private void RefreshWifiAnalyzer()
        {
            if(wifiAnalyzerReportBox==null)return;
            StringBuilder b=new StringBuilder();b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — WI-FI ANALYZER PRO");
            b.AppendLine("Data: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));b.AppendLine("Komputer: "+Environment.MachineName);b.AppendLine();
            string[] commands=new string[]{"wlan show interfaces","wlan show networks mode=bssid","wlan show drivers"};
            string[] titles=new string[]{"AKTYWNE INTERFEJSY","WIDOCZNE SIECI / BSSID / KANAŁY","STEROWNIKI I OBSŁUGIWANE TRYBY"};
            for(int i=0;i<commands.Length;i++)
            {
                int code;string output=CaptureOutput("netsh.exe",commands[i],out code);
                b.AppendLine("================ "+titles[i]+" ================");b.AppendLine("netsh "+commands[i]+" | Exit: "+code);b.AppendLine(output);b.AppendLine();
            }
            b.AppendLine("Uwaga: wynik zależy od adaptera, sterownika, usługi WLAN i aktualnego otoczenia radiowego. Skan nie mierzy jakości internetu ani bezpieczeństwa routera.");
            wifiAnalyzerReportBox.Text=b.ToString();AppendLog("Wykonano odczyt Wi-Fi Analyzer PRO.");
        }

        // FIX053 — safe wrapper around Microsoft's optional Windows File Recovery CLI.
        private void BuildWindowsFileRecoveryPage()
        {
            if(FindPage("Windows File Recovery")!=null)return;
            Panel p=NewPage("Windows File Recovery","Windows File Recovery — kreator odzyskiwania");
            Panel source=Card(p,"DYSK ŹRÓDŁOWY / MIEJSCE ODZYSKIWANIA",10,8,950,225);
            LabelAt(source,"Dysk źródłowy",18,45,145,24);
            fileRecoverySourceBox=ComboAt(source,new string[0],170,41,150);
            foreach(DriveInfo drive in DriveInfo.GetDrives())
                try{if(drive.IsReady && drive.DriveType!=DriveType.CDRom)fileRecoverySourceBox.Items.Add(drive.Name.TrimEnd('\\'));}catch{}
            if(fileRecoverySourceBox.Items.Contains(Path.GetPathRoot(Environment.GetFolderPath(Environment.SpecialFolder.System)).TrimEnd('\\')))
                fileRecoverySourceBox.SelectedItem=Path.GetPathRoot(Environment.GetFolderPath(Environment.SpecialFolder.System)).TrimEnd('\\');
            if(fileRecoverySourceBox.SelectedIndex<0 && fileRecoverySourceBox.Items.Count>0)fileRecoverySourceBox.SelectedIndex=0;
            LabelAt(source,"Tryb",340,45,55,24);
            fileRecoveryModeBox=ComboAt(source,new string[]{"Regular — NTFS / ostatnio usunięte","Extensive — głębokie skanowanie"},400,41,330);
            LabelAt(source,"Folder docelowy (inny dysk)",18,88,230,24);
            fileRecoveryDestinationBox=TextAt(source,250,84,480,26,"");
            ButtonAt(source,"WYBIERZ",740,80,175,delegate{
                FolderBrowserDialog d=new FolderBrowserDialog();d.Description="Wskaż folder odzyskiwania na innym fizycznym dysku.";
                if(d.ShowDialog()==DialogResult.OK)fileRecoveryDestinationBox.Text=d.SelectedPath;
            });
            LabelAt(source,"Filtr plików / ścieżka",18,129,190,24);
            fileRecoveryPatternBox=TextAt(source,210,125,520,26,"*.*");
            fileRecoveryPhysicalConfirmBox=CheckAt(source,"Potwierdzam, że cel odzyskiwania znajduje się na innym fizycznym nośniku niż źródło.",18,165,850,false);
            ButtonAt(source,"PRZYGOTUJ / URUCHOM WINFR",18,190,280,delegate{StartWindowsFileRecovery();});
            ButtonAt(source,"INFORMACJE MICROSOFT",310,190,220,delegate{OpenUrl("https://support.microsoft.com/windows");});

            Panel report=Card(p,"STATUS / INSTRUKCJA",10,238,950,260);
            fileRecoveryReportBox=new TextBox();fileRecoveryReportBox.Multiline=true;fileRecoveryReportBox.ReadOnly=true;
            fileRecoveryReportBox.ScrollBars=ScrollBars.Vertical;fileRecoveryReportBox.Font=new Font("Consolas",8.5F);
            fileRecoveryReportBox.BackColor=Color.FromArgb(7,13,23);fileRecoveryReportBox.ForeColor=Color.FromArgb(205,235,245);
            fileRecoveryReportBox.Location=new Point(UX(18),UY(45));fileRecoveryReportBox.Size=new Size(UX(895),UY(215));report.Controls.Add(fileRecoveryReportBox);
            Panel warning=Card(p,"WAŻNE — ODZYSKIWANIE NIE JEST GWARANTOWANE",10,508,950,155);
            LabelAt(warning,"Po utracie danych ogranicz zapisy na dysku źródłowym. Folder odzyskiwania musi znajdować się na innym fizycznym dysku. Windows File Recovery jest osobnym narzędziem Microsoft i może wymagać instalacji. Wynik zależy od systemu plików, nadpisania danych i typu nośnika.",18,45,900,65);
            RefreshFileRecoveryStatus();
        }

        private string FindWinfrExecutable()
        {
            string system=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"winfr.exe");
            if(File.Exists(system))return system;
            int code;string output=CaptureOutput("where.exe","winfr.exe",out code);
            if(code==0)
            {
                foreach(string line in output.Split(new string[]{"\r\n","\n"},StringSplitOptions.RemoveEmptyEntries))
                    if(File.Exists(line.Trim()))return line.Trim();
            }
            return "";
        }

        private void RefreshFileRecoveryStatus()
        {
            if(fileRecoveryReportBox==null)return;
            string exe=FindWinfrExecutable();
            fileRecoveryReportBox.Text="Windows File Recovery (winfr.exe): "+(String.IsNullOrEmpty(exe)?"NIE WYKRYTO":"WYKRYTO: "+exe)+"\r\n\r\n"+
                "Moduł nie wykonuje samodzielnego odzyskiwania. Po potwierdzeniu uruchamia narzędzie Microsoft z wybranym źródłem, celem, trybem i filtrem.\r\n"+
                (String.IsNullOrEmpty(exe)?"Zainstaluj Windows File Recovery z Microsoft Store i ponownie sprawdź.":"Gotowy do skonfigurowania zadania odzyskiwania.");
        }

        private void StartWindowsFileRecovery()
        {
            if(fileRecoverySourceBox==null || fileRecoveryDestinationBox==null || fileRecoveryPatternBox==null)return;
            if(!IsAdmin()){MessageBox.Show("Uruchom program jako administrator, aby uruchomić Windows File Recovery.");return;}
            string exe=FindWinfrExecutable();if(String.IsNullOrEmpty(exe)){MessageBox.Show("Nie znaleziono winfr.exe. Zainstaluj Windows File Recovery z Microsoft Store.");return;}
            string source=Convert.ToString(fileRecoverySourceBox.SelectedItem).TrimEnd('\\');
            string dest=fileRecoveryDestinationBox.Text.Trim();string filter=fileRecoveryPatternBox.Text.Trim();
            if(String.IsNullOrEmpty(source)||source.Length<2||source[1]!=':'){MessageBox.Show("Wybierz poprawny dysk źródłowy.");return;}
            if(!Directory.Exists(dest)){MessageBox.Show("Wskaż istniejący folder docelowy na innym dysku.");return;}
            if(String.IsNullOrWhiteSpace(filter)||filter.Length>120 || Regex.IsMatch(filter,"[&|<>^()%!\"\r\n]"))
            {MessageBox.Show("Filtr jest pusty, zbyt długi lub zawiera niedozwolone znaki powłoki.");return;}
            string destRoot=Path.GetPathRoot(Path.GetFullPath(dest)).TrimEnd('\\');
            if(String.Equals(source,destRoot,StringComparison.OrdinalIgnoreCase)){MessageBox.Show("Źródło i cel muszą być na różnych dyskach.");return;}
            List<string> srcIds=GetPhysicalDiskIds(source+"\\");List<string> dstIds=GetPhysicalDiskIds(destRoot+"\\");
            if(srcIds.Count>0 && dstIds.Count>0)
            {
                foreach(string id in srcIds)if(dstIds.Contains(id)){MessageBox.Show("WMI wykryło ten sam fizyczny dysk źródłowy i docelowy.");return;}
            }
            else if(fileRecoveryPhysicalConfirmBox==null || !fileRecoveryPhysicalConfirmBox.Checked)
            {MessageBox.Show("Nie można ustalić fizycznego dysku. Potwierdź po sprawdzeniu, że cel jest na innym nośniku.");return;}
            string mode=(fileRecoveryModeBox!=null && fileRecoveryModeBox.SelectedIndex==1)?"/extensive":"/regular";
            string args=source+" \""+dest+"\" "+mode+" /n \""+filter+"\"";
            string preview="Narzędzie Microsoft Windows File Recovery zostanie uruchomione z parametrami:\r\n\r\nwinfr.exe "+args+
                "\r\n\r\nOdzyskiwanie zapisuje wyniki w folderze docelowym. Nie zapisuj niczego na dysku źródłowym. Kontynuować na własną odpowiedzialność?";
            if(MessageBox.Show(preview,"Potwierdzenie odzyskiwania danych",MessageBoxButtons.YesNo,MessageBoxIcon.Warning,MessageBoxDefaultButton.Button2)!=DialogResult.Yes)return;
            try
            {
                ProcessStartInfo pi=new ProcessStartInfo();pi.FileName=exe;pi.Arguments=args;pi.WorkingDirectory=dest;pi.UseShellExecute=true;pi.Verb="runas";
                Process.Start(pi);
                if(fileRecoveryReportBox!=null)fileRecoveryReportBox.Text="Uruchomiono Windows File Recovery.\r\nŹródło: "+source+"\r\nCel: "+dest+"\r\nTryb: "+mode+"\r\nFiltr: "+filter+"\r\n\r\nSprawdzaj komunikaty okna winfr. Program nie może zagwarantować odzyskania plików.";
                AppendLog("Uruchomiono Windows File Recovery: "+source+" -> "+dest+"; "+mode);
            }
            catch(Exception ex){MessageBox.Show("Nie udało się uruchomić winfr: "+ex.Message);AppendLog("Windows File Recovery launch error: "+ex.Message);}
        }

        // FIX053 — inventory-based compatibility review. The app never declares compatibility without vendor evidence.
        private void BuildAppCompatibilityPage()
        {
            if(FindPage("App Compatibility Center")!=null)return;
            Panel p=NewPage("App Compatibility Center","App Compatibility Center — audyt programów");
            Panel top=Card(p,"INWENTARYZACJA / WARSTWY ZGODNOŚCI",10,8,950,150);
            LabelAt(top,"Odczytuje zainstalowane aplikacje i istniejące ustawienia trybu zgodności. Nie uruchamia aplikacji, nie zmienia rejestru i nie gwarantuje zgodności z docelowym Windows.",18,45,900,40);
            ButtonAt(top,"SKANUJ PROGRAMY",18,95,205,delegate{ScanAppCompatibility();});
            ButtonAt(top,"OTWÓRZ APLIKACJE",235,95,220,delegate{OpenUrl("ms-settings:appsfeatures");});
            ButtonAt(top,"ZAPISZ RAPORT",467,95,180,delegate{SaveTextReport(compatibilityReportBox,"AppCompatibility");});
            Panel report=Card(p,"WYNIKI / OSTRZEŻENIA / ISTNIEJĄCE OVERRIDES",10,165,950,400);
            compatibilityReportBox=new TextBox();compatibilityReportBox.Multiline=true;compatibilityReportBox.ReadOnly=true;
            compatibilityReportBox.ScrollBars=ScrollBars.Both;compatibilityReportBox.WordWrap=false;compatibilityReportBox.Font=new Font("Consolas",8.3F);
            compatibilityReportBox.BackColor=Color.FromArgb(7,13,23);compatibilityReportBox.ForeColor=Color.FromArgb(205,235,245);
            compatibilityReportBox.Location=new Point(UX(18),UY(45));compatibilityReportBox.Size=new Size(UX(895),UY(350));report.Controls.Add(compatibilityReportBox);
            Panel info=Card(p,"CO OZNACZA WYNIK",10,575,950,125);
            LabelAt(info,"Lista aplikacji nie jest testem uruchomieniowym. Brak wpisu trybu zgodności nie oznacza problemu, a obecny override nie gwarantuje działania na nowszym Windows. Przed migracją sprawdź wsparcie u wydawcy i przygotuj oryginalne instalatory/licencje.",18,45,900,55);
            ScanAppCompatibility();
        }

        private void ScanAppCompatibility()
        {
            if(compatibilityReportBox==null)return;
            StringBuilder b=new StringBuilder();b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — APP COMPATIBILITY CENTER");
            b.AppendLine("System: "+GetOsCaption()+" | build "+GetBuild()+" | arch "+GetArchitecture());
            b.AppendLine("Cel migracji nie został automatycznie potwierdzony — sprawdzaj wsparcie u wydawcy.");b.AppendLine();
            HashSet<string> names=new HashSet<string>(StringComparer.OrdinalIgnoreCase);int appCount=0;
            string[] uninstallPaths=new string[]{
                @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
                @"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"
            };
            RegistryKey[] roots=new RegistryKey[]{Registry.LocalMachine,Registry.CurrentUser};
            foreach(RegistryKey root in roots)
            foreach(string subPath in uninstallPaths)
            {
                try
                {
                    using(RegistryKey branch=root.OpenSubKey(subPath))
                    {
                        if(branch==null)continue;
                        foreach(string sub in branch.GetSubKeyNames())
                        {
                            try
                            {
                                using(RegistryKey app=branch.OpenSubKey(sub))
                                {
                                    if(app==null)continue;
                                    string name=Convert.ToString(app.GetValue("DisplayName"));
                                    if(String.IsNullOrWhiteSpace(name)||!names.Add(name))continue;
                                    string version=Convert.ToString(app.GetValue("DisplayVersion"));
                                    string publisher=Convert.ToString(app.GetValue("Publisher"));
                                    string location=Convert.ToString(app.GetValue("InstallLocation"));
                                    b.AppendLine("[DO WERYFIKACJI] "+name+" | "+version+" | "+publisher);
                                    if(!String.IsNullOrWhiteSpace(location))b.AppendLine("  Lokalizacja: "+location);
                                    appCount++;
                                }
                            }catch{}
                        }
                    }
                }catch{}
            }
            b.AppendLine();b.AppendLine("ISTNIEJĄCE USTAWIENIA APP COMPAT FLAGS — LAYERS:");int overrides=0;
            string[] layerPaths=new string[]{
                @"Software\Microsoft\Windows NT\CurrentVersion\AppCompatFlags\Layers",
                @"Software\Microsoft\Windows NT\CurrentVersion\AppCompatFlags\Layers"
            };
            for(int i=0;i<roots.Length;i++)
            {
                try
                {
                    using(RegistryKey layers=roots[i].OpenSubKey(layerPaths[i]))
                    {
                        if(layers==null)continue;
                        foreach(string value in layers.GetValueNames())
                        {
                            string setting=Convert.ToString(layers.GetValue(value));
                            b.AppendLine(value+" => "+setting);overrides++;
                        }
                    }
                }catch(Exception ex){b.AppendLine("Registry read: "+ex.Message);}
            }
            b.AppendLine();b.AppendLine("Wykryte aplikacje: "+appCount+" | istniejące ustawienia zgodności: "+overrides);
            b.AppendLine("WYNIK: lista inwentaryzacyjna. Status zgodności wymaga testu aplikacji i potwierdzenia wydawcy.");
            compatibilityReportBox.Text=b.ToString();AppendLog("App Compatibility Center: applications="+appCount+"; overrides="+overrides);
        }

        // FIX053 — launches the individual build scripts when running from an extracted source package.
        private void BuildBuildManagerPage()
        {
            if(FindPage("Build Manager PRO")!=null)return;
            Panel p=NewPage("Build Manager PRO","Build Manager PRO — niezależne etapy kompilacji");
            Panel info=Card(p,"ŚRODOWISKO BUDOWANIA FIX053",10,8,950,155);
            LabelAt(info,"Każdy etap jest uruchamiany osobno w oddzielnym oknie CMD. Logi trafiają do dist\\build-logs. Brak Inno Setup 5.6.1 pomija wyłącznie opcjonalny instalator XP.",18,45,900,45);
            buildManagerStatusLabel=LabelAt(info,"ŹRÓDŁO: "+AppDomain.CurrentDomain.BaseDirectory,18,98,900,25);
            Panel actions=Card(p,"URUCHOM POJEDYNCZY ETAP",10,173,950,235);
            ButtonAt(actions,"BUILD PORTABLE",18,48,205,delegate{LaunchBuildScript("BUILD_PORTABLE.cmd");});
            ButtonAt(actions,"INSTALLER WINDOWS 7–11",235,48,245,delegate{LaunchBuildScript("BUILD_INSTALLER_MODERN.cmd");});
            ButtonAt(actions,"INSTALLER XP (OPCJONALNY)",492,48,260,delegate{LaunchBuildScript("BUILD_INSTALLER_XP.cmd");});
            ButtonAt(actions,"WERYFIKUJ WYNIKI",18,105,205,delegate{LaunchBuildScript("VERIFY_BUILD.cmd /partial");});
            ButtonAt(actions,"BUILD ALL",235,105,205,delegate{LaunchBuildScript("BUILD_ALL.cmd");});
            ButtonAt(actions,"MENU BUILD MANAGER",452,105,250,delegate{LaunchBuildScript("BUILD_MANAGER.cmd");});
            Panel logs=Card(p,"LOGI / STATUS",10,418,950,190);
            ButtonAt(logs,"OTWÓRZ FOLDER LOGÓW",18,48,240,delegate{
                string path=Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"dist","build-logs");
                if(Directory.Exists(path))Process.Start("explorer.exe",path);else MessageBox.Show("Folder logów powstanie po uruchomieniu builda ze źródeł.");
            });
            ButtonAt(logs,"OTWÓRZ FOLDER ŹRÓDŁOWY",270,48,255,delegate{Process.Start("explorer.exe",AppDomain.CurrentDomain.BaseDirectory);});
            RefreshBuildManagerStatus();
        }

        private void RefreshBuildManagerStatus()
        {
            if(buildManagerStatusLabel==null)return;
            string root=AppDomain.CurrentDomain.BaseDirectory;
            string[] scripts=new string[]{"BUILD_PORTABLE.cmd","BUILD_INSTALLER_MODERN.cmd","BUILD_INSTALLER_XP.cmd","BUILD_ALL.cmd","VERIFY_BUILD.cmd"};
            int found=0;foreach(string name in scripts)if(File.Exists(Path.Combine(root,name)))found++;
            buildManagerStatusLabel.Text="SKRYPTY BUDOWANIA: "+found+"/"+scripts.Length+" | Folder: "+root;
        }

        private void LaunchBuildScript(string command)
        {
            string root=AppDomain.CurrentDomain.BaseDirectory;
            string[] parts=command.Split(new char[]{' '},2);string script=parts[0];string args=parts.Length>1?parts[1]:"";
            string full=Path.Combine(root,script);
            if(!File.Exists(full))
            {
                MessageBox.Show("Skrypt nie jest dołączony do zainstalowanej/Portable aplikacji. Rozpakuj pełny pakiet źródłowy FIX053 i uruchom BUILD_MANAGER.cmd.\r\n\r\nSzukano: "+full);
                return;
            }
            try
            {
                ProcessStartInfo pi=new ProcessStartInfo();pi.FileName="cmd.exe";
                pi.Arguments="/k \"\""+full+"\""+(String.IsNullOrEmpty(args)?"":" "+args)+"\"";
                pi.WorkingDirectory=root;pi.UseShellExecute=true;Process.Start(pi);
                AppendLog("Uruchomiono etap Build Manager: "+command);
            }
            catch(Exception ex){MessageBox.Show("Nie udało się uruchomić skryptu: "+ex.Message);}
        }

        // FIX053 — Migration Intelligence: route advisory plus the existing strict setup/backup checks.
        private void BuildMigrationIntelligencePage()
        {
            if(FindPage("Migration Intelligence PRO")!=null)return;
            Panel p=NewPage("Migration Intelligence PRO","Centrum migracji Windows — asystent");
            Panel choose=Card(p,"UNIWERSALNY KREATOR MIGRACJI WINDOWS",10,8,950,235);
            LabelAt(choose,"SYSTEM ŹRÓDŁOWY (AUTOMATYCZNIE WYKRYTY): "+GetOsCaption()+"  |  BUILD "+GetBuild()+"  |  "+GetArchitecture()+"  |  "+GetEditionId(),18,43,910,25);
            LabelAt(choose,"System docelowy",18,78,135,22);
            migrationIntelTargetBox=ComboAt(choose,new string[]{"Windows 7","Windows 8","Windows 8.1","Windows 10","Windows 11"},155,74,190);
            if(migrationIntelTargetBox.Items.Contains(savedTarget))migrationIntelTargetBox.SelectedItem=savedTarget;
            LabelAt(choose,"Edycja",360,78,70,22);
            migrationIntelEditionBox=ComboAt(choose,new string[]{"Zachowaj obecną","Home","Pro","Enterprise","Education","LTSC","Workstation"},430,74,180);
            LabelAt(choose,"Architektura",625,78,95,22);
            migrationIntelArchBox=ComboAt(choose,new string[]{"Zachowaj obecną","x64","x86","ARM64"},730,74,180);

            LabelAt(choose,"Kanał / gałąź",18,119,135,22);
            migrationIntelChannelBox=ComboAt(choose,new string[]{"Stable / publiczny","Release Preview","Beta","Dev","Canary"},155,115,190);
            LabelAt(choose,"Język",360,119,70,22);
            migrationIntelLanguageBox=ComboAt(choose,new string[]{"Zgodny z obecnym","Polski (pl-PL)","English (en-US)","Deutsch (de-DE)"},430,115,180);
            LabelAt(choose,"Sposób migracji",625,119,100,22);
            migrationIntelModeBox=ComboAt(choose,new string[]{"Aktualizacja — zachowaj, jeśli Setup oferuje","Czysta instalacja z USB","Migracja etapowa / starszy Windows"},730,115,180);
            ButtonAt(choose,"ANALIZUJ TRASĘ",18,166,205,delegate{RunMigrationIntelligence();});
            ButtonAt(choose,"RAPORT PRZED MIGRACJĄ",235,166,245,delegate{ShowPage("Raport przed migracją");});
            ButtonAt(choose,"PRZEJDŹ DO MIGRACJI",492,166,220,delegate{
                if(migrationIntelTargetBox!=null && targetBox!=null && targetBox.Items.Contains(migrationIntelTargetBox.Text))targetBox.SelectedItem=migrationIntelTargetBox.Text;
                if(migrationIntelEditionBox!=null && migrationEditionBox!=null && migrationEditionBox.Items.Contains(migrationIntelEditionBox.Text))migrationEditionBox.SelectedItem=migrationIntelEditionBox.Text;
                if(migrationIntelArchBox!=null && migrationArchBox!=null && migrationArchBox.Items.Contains(migrationIntelArchBox.Text))migrationArchBox.SelectedItem=migrationIntelArchBox.Text;
                if(migrationIntelLanguageBox!=null && migrationLanguageBox!=null){
                    string lang=migrationIntelLanguageBox.Text;
                    string mapped=lang=="Zgodny z obecnym"?"Taki sam jak obecny":lang;
                    if(migrationLanguageBox.Items.Contains(mapped))migrationLanguageBox.SelectedItem=mapped;
                }
                if(migrationIntelChannelBox!=null && windowsChannelBox!=null){
                    string ch=migrationIntelChannelBox.Text;string mapped=ch=="Stable / publiczny"?"Stable / normalny":(ch=="Dev"?"Experimental (obecnie Dev)":(ch=="Canary"?"Canary (etykieta historyczna)":ch));
                    if(windowsChannelBox.Items.Contains(mapped))windowsChannelBox.SelectedItem=mapped;
                }
                if(migrationIntelModeBox!=null && installationModeBox!=null){
                    string mode=migrationIntelModeBox.Text;
                    installationModeBox.SelectedIndex=mode.StartsWith("Aktualizacja")?0:1;
                }
                ShowPage("Migracja");
            });
            ButtonAt(choose,"OTWÓRZ KATALOG ISO",725,166,190,delegate{ShowPage("Katalog Windows");});

            Panel result=Card(p,"WYNIK ANALIZY / ZALECANA TRASA / WYMAGANIA",10,255,950,390);
            migrationIntelReportBox=new TextBox();migrationIntelReportBox.Multiline=true;migrationIntelReportBox.ReadOnly=true;
            migrationIntelReportBox.ScrollBars=ScrollBars.Both;migrationIntelReportBox.WordWrap=false;migrationIntelReportBox.Font=new Font("Consolas",8.5F);
            migrationIntelReportBox.BackColor=Color.FromArgb(4,16,31);migrationIntelReportBox.ForeColor=Color.FromArgb(225,243,255);
            migrationIntelReportBox.Location=new Point(UX(18),UY(45));migrationIntelReportBox.Size=new Size(UX(895),UY(320));result.Controls.Add(migrationIntelReportBox);
            ButtonAt(result,"ZAPISZ RAPORT",18,337,180,delegate{SaveTextReport(migrationIntelReportBox,"MigrationIntelligence");});
            Panel safety=Card(p,"KEEP ALL / OCHRONA DANYCH",10,658,950,120);
            LabelAt(safety,"Program najpierw tworzy plan. Nie wymusza niedozwolonego downgrade ani zachowania aplikacji. Windows Setup jest ostatecznym źródłem informacji, czy na danej ścieżce, nośniku, edycji, języku i architekturze można wybrać „Zachowaj pliki osobiste i aplikacje”. Migracja Keep All wymaga pełnej zweryfikowanej kopii na osobnym nośniku.",18,45,900,60);
            RunMigrationIntelligence();
        }

        private void RunMigrationIntelligence()
        {
            if(migrationIntelReportBox==null)return;
            string target=migrationIntelTargetBox==null?"Windows 11":migrationIntelTargetBox.Text;
            string sourceFamily=GetFamily();string destFamily=target.Replace("Windows ","");
            StringBuilder b=new StringBuilder();
            b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — INTELIGENTNA MIGRACJA WINDOWS");
            b.AppendLine("Data: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
            b.AppendLine("Źródło: "+GetOsCaption()+" | family="+sourceFamily+" | build="+GetBuild());
            b.AppendLine("Edycja źródłowa: "+GetEditionId()+" | architektura: "+GetArchitecture());
            b.AppendLine("Cel: "+target+" | edycja: "+(migrationIntelEditionBox==null?"Zachowaj obecną":migrationIntelEditionBox.Text)+
                " | architektura: "+(migrationIntelArchBox==null?"Zachowaj obecną":migrationIntelArchBox.Text));
            b.AppendLine("Kanał: "+(migrationIntelChannelBox==null?"Stable / publiczny":migrationIntelChannelBox.Text)+
                " | język: "+(migrationIntelLanguageBox==null?"Zgodny z obecnym":migrationIntelLanguageBox.Text)+
                " | tryb: "+(migrationIntelModeBox==null?"Aktualizacja":migrationIntelModeBox.Text));
            b.AppendLine();b.AppendLine("OCENA TRASY:");
            if(sourceFamily==destFamily)b.AppendLine("[INFO] Ta sama rodzina systemu — sprawdź aktualizację wydania/kompilacji i rzeczywistą ofertę Setup.");
            else if(sourceFamily=="XP" || sourceFamily=="Vista")
            {
                b.AppendLine("[OSTRZEŻENIE] Dla XP/Vista planuj migrację niestandardową lub etapową. Nie zakładaj możliwości zachowania zainstalowanych aplikacji.");
                b.AppendLine("[PLAN] Pełny obraz dysku → eksport danych/licencji/sterowników → czysta instalacja wspieranej wersji → odtworzenie aplikacji i danych.");
            }
            else if(sourceFamily=="7" || sourceFamily=="8" || sourceFamily=="8.1")
            {
                b.AppendLine("[OSTRZEŻENIE] Starsze wydania mogą wymagać instalacji etapowej albo niestandardowej. Nie zakładaj bezpośredniego Keep All.");
                b.AppendLine("[PLAN] Zweryfikuj zgodną ścieżkę według dokumentacji Microsoft, nośnik i opcje zachowania pokazane przez Setup.");
            }
            else if(sourceFamily=="10" && destFamily=="11")
            {
                b.AppendLine("[PLAN] Sprawdź wymagania Windows 11, zgodność CPU, TPM 2.0, Secure Boot, UEFI, pamięć i sterowniki.");
                b.AppendLine("[KEEP ALL] Kontynuuj tylko, jeśli Setup dla wybranego nośnika oferuje zachowanie plików i aplikacji.");
            }
            else b.AppendLine("[INFO] Wymagana weryfikacja konkretnej ścieżki w aktualnej dokumentacji producenta i w rzeczywistym Windows Setup.");
            b.AppendLine();b.AppendLine("KONTROLE KOMPUTERA:");
            b.AppendLine("Administrator: "+(IsAdmin()?"TAK":"NIE"));
            b.AppendLine("Zweryfikowana kopia: "+(HasVerifiedBackup()?"TAK":"NIE — migracja Keep All pozostaje zablokowana"));
            b.AppendLine("Firmware: "+ReadFirmwareType());b.AppendLine("Secure Boot: "+ReadSecureBoot());b.AppendLine("TPM: "+ReadTpmSpec());
            b.AppendLine("Wybrany setup.exe: "+(!String.IsNullOrEmpty(selectedSetup)&&File.Exists(selectedSetup)?selectedSetup:"nie wskazano / brak pliku"));
            try{DriveInfo d=new DriveInfo(Path.GetPathRoot(Environment.GetFolderPath(Environment.SpecialFolder.System)));b.AppendLine("Wolne miejsce dysku systemowego: "+Math.Round(d.AvailableFreeSpace/1073741824.0,1)+" GB");}catch(Exception ex){b.AppendLine("Wolne miejsce: brak odczytu — "+ex.Message);}
            b.AppendLine();b.AppendLine("KONTROLA APLIKACJI I STEROWNIKÓW:");
            b.AppendLine("Użyj App Compatibility Center i Driver Compatibility Analyzer. Obecna lista programów nie jest testem uruchomieniowym.");
            b.AppendLine();b.AppendLine("WYNIK: plan orientacyjny. Nie uruchomiono instalatora ani nie zmieniono systemu.");
            migrationIntelReportBox.Text=b.ToString();AppendLog("Inteligentna migracja: wygenerowano plan dla "+target+".");
        }

        // FIX053 — Backup Recovery ULTIMATE. Verifies the legacy manifest and supports a separate SHA-256 index.
        private void BuildBackupRecoveryUltimatePage()
        {
            if(FindPage("Backup Recovery ULTIMATE")!=null)return;
            Panel p=NewPage("Backup Recovery ULTIMATE","Backup & Recovery ULTIMATE");
            Panel source=Card(p,"WYBIERZ KATALOG KOPII",10,8,950,145);
            backupRecoveryFolderBox=TextAt(source,18,48,690,26,lastManifest==""?"":Path.GetDirectoryName(lastManifest));
            ButtonAt(source,"WYBIERZ FOLDER",720,44,195,delegate{FolderBrowserDialog d=new FolderBrowserDialog();d.Description="Wybierz folder NaprawaPC_Backup zawierający Backup.xml.";if(d.ShowDialog()==DialogResult.OK)backupRecoveryFolderBox.Text=d.SelectedPath;});
            ButtonAt(source,"ANALIZUJ MANIFEST",18,91,210,delegate{InspectBackupRecoveryFolder();});
            ButtonAt(source,"UTWÓRZ INDEKS SHA-256",240,91,245,delegate{RunBackupIntegrityOperation(true);});
            ButtonAt(source,"ZWERYFIKUJ INDEKS",497,91,210,delegate{RunBackupIntegrityOperation(false);});
            Panel report=Card(p,"WERYFIKACJA KOPII / SHA-256 / WBADMIN",10,165,950,420);
            backupRecoveryReportBox=new TextBox();backupRecoveryReportBox.Multiline=true;backupRecoveryReportBox.ReadOnly=true;
            backupRecoveryReportBox.ScrollBars=ScrollBars.Both;backupRecoveryReportBox.WordWrap=false;backupRecoveryReportBox.Font=new Font("Consolas",8.5F);
            backupRecoveryReportBox.BackColor=Color.FromArgb(7,13,23);backupRecoveryReportBox.ForeColor=Color.FromArgb(205,235,245);
            backupRecoveryReportBox.Location=new Point(UX(18),UY(45));backupRecoveryReportBox.Size=new Size(UX(895),UY(350));report.Controls.Add(backupRecoveryReportBox);
            ButtonAt(report,"ZAPISZ RAPORT",18,355,180,delegate{SaveTextReport(backupRecoveryReportBox,"BackupRecovery");});
            Panel caution=Card(p,"ODTWARZANIE OBRAZU SYSTEMU",10,595,950,150);
            LabelAt(caution,"Indeks SHA-256 potwierdza integralność plików względem chwili utworzenia indeksu. Nie potwierdza, że kopia jest bootowalna. Pełne odtworzenie obrazu odbywa się przez WinRE/WinPE i może nadpisać partycje.",18,45,900,52);
            ButtonAt(caution,"INSTRUKCJA PRZYWRACANIA OBRAZU",18,98,290,delegate{ShowImageRestoreGuide();});
            ButtonAt(caution,"URUCHOM WINRE",320,98,180,delegate{RequestWinRERestart();});
            if(!String.IsNullOrEmpty(backupRecoveryFolderBox.Text))InspectBackupRecoveryFolder();
        }

        private void InspectBackupRecoveryFolder()
        {
            if(backupRecoveryFolderBox==null || backupRecoveryReportBox==null)return;
            string folder=backupRecoveryFolderBox.Text.Trim();StringBuilder b=new StringBuilder();
            b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — BACKUP RECOVERY ULTIMATE");b.AppendLine("Folder: "+folder);b.AppendLine("Data audytu: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));b.AppendLine();
            string manifest=Path.Combine(folder,"Backup.xml");
            if(!Directory.Exists(folder)){b.AppendLine("[FAIL] Folder nie istnieje.");backupRecoveryReportBox.Text=b.ToString();return;}
            if(!File.Exists(manifest)){b.AppendLine("[FAIL] Brak Backup.xml — nie rozpoznano manifestu NaprawaPC.");backupRecoveryReportBox.Text=b.ToString();return;}
            try
            {
                XmlDocument d=new XmlDocument();d.XmlResolver=null;d.Load(manifest);XmlElement root=d.DocumentElement;
                if(root==null || root.Name!="NaprawaPCBackup")throw new InvalidDataException("Nieznany format manifestu.");
                string filesOk=root.GetAttribute("FileBackupComplete"),imageOk=root.GetAttribute("SystemImageComplete");
                b.AppendLine("[PASS] Manifest XML można odczytać.");b.AppendLine("Pliki oznaczone jako kompletne: "+filesOk);
                b.AppendLine("Obraz systemu oznaczony jako kompletny: "+imageOk);
                b.AppendLine("Pliki skopiowane: "+root.GetAttribute("FilesCopied")+" | błędy: "+root.GetAttribute("ErrorCount"));
                b.AppendLine("Komputer źródłowy: "+root.GetAttribute("Computer"));b.AppendLine("Data manifestu: "+root.GetAttribute("Created"));
                b.AppendLine("Cel obrazu: "+root.GetAttribute("SystemImageTarget"));b.AppendLine();
                XmlNodeList roots=root.SelectNodes("/NaprawaPCBackup/Roots/Root");int missing=0,present=0;
                foreach(XmlNode n in roots)
                {
                    string rel=n.Attributes["Relative"]==null?"":n.Attributes["Relative"].Value;
                    string source=n.Attributes["Source"]==null?"":n.Attributes["Source"].Value;
                    string path=Path.Combine(folder,rel);
                    if(Directory.Exists(path)){present++;b.AppendLine("[PASS] "+rel+" | źródło: "+source);}
                    else{missing++;b.AppendLine("[FAIL] Brak folderu: "+rel);}
                }
                b.AppendLine();b.AppendLine("Korzenie obecne: "+present+" | brakujące: "+missing);
                string sysLog=Path.Combine(folder,"SystemImage.log");
                b.AppendLine("SystemImage.log: "+(File.Exists(sysLog)?"znaleziono":"brak"));
                string index=Path.Combine(folder,"NaprawaPC_SHA256_INDEX.txt");
                b.AppendLine("Indeks SHA-256: "+(File.Exists(index)?"znaleziono — można uruchomić weryfikację":"nie utworzono"));
                b.AppendLine();b.AppendLine("UWAGA: Manifest to zapis wyniku pierwotnej kopii. Pełną integralność plików można dodatkowo badać indeksem SHA-256 utworzonym na tym folderze.");
                if(filesOk.Equals("True",StringComparison.OrdinalIgnoreCase) && missing==0)b.AppendLine("[INFO] Manifest deklaruje kompletną kopię plików; foldery źródłowe istnieją.");
                else b.AppendLine("[WARN] Kopia plików jest niekompletna lub wymaga ręcznej weryfikacji.");
            }
            catch(Exception ex){b.AppendLine("[FAIL] Nie udało się przeanalizować manifestu: "+ex.Message);}
            backupRecoveryReportBox.Text=b.ToString();AppendLog("Backup Recovery: analiza manifestu "+folder);
        }

        private List<string> CollectBackupFilesWithoutReparsePoints(string root,List<string> warnings)
        {
            List<string> files=new List<string>();
            Stack<string> pending=new Stack<string>();
            pending.Push(Path.GetFullPath(root));
            while(pending.Count>0)
            {
                string current=pending.Pop();
                try
                {
                    DirectoryInfo directory=new DirectoryInfo(current);
                    if((directory.Attributes & FileAttributes.ReparsePoint)==FileAttributes.ReparsePoint)
                    {warnings.Add("Pominięto punkt ponownej analizy: "+current);continue;}
                    foreach(FileInfo file in directory.GetFiles())
                    {
                        try
                        {
                            if((file.Attributes & FileAttributes.ReparsePoint)==FileAttributes.ReparsePoint)
                            {warnings.Add("Pominięto plik-link: "+file.FullName);continue;}
                            files.Add(file.FullName);
                        }
                        catch(Exception ex){warnings.Add("Nie można odczytać metadanych pliku "+file.FullName+": "+ex.Message);}
                    }
                    foreach(DirectoryInfo child in directory.GetDirectories())
                    {
                        try
                        {
                            if((child.Attributes & FileAttributes.ReparsePoint)==FileAttributes.ReparsePoint)
                            {warnings.Add("Pominięto katalog-link: "+child.FullName);continue;}
                            pending.Push(child.FullName);
                        }
                        catch(Exception ex){warnings.Add("Nie można odczytać podkatalogu "+child.FullName+": "+ex.Message);}
                    }
                }
                catch(Exception ex){warnings.Add("Nie można przeskanować "+current+": "+ex.Message);}
            }
            return files;
        }

        private void RunBackupIntegrityOperation(bool createIndex)
        {
            if(backupRecoveryFolderBox==null || backupRecoveryReportBox==null)return;
            if(backupIntegrityWorker!=null && backupIntegrityWorker.IsBusy){MessageBox.Show("Weryfikacja kopii już trwa.");return;}
            string folder=backupRecoveryFolderBox.Text.Trim();if(!Directory.Exists(folder)){MessageBox.Show("Wskaż istniejący folder kopii.");return;}
            string manifest=Path.Combine(folder,"Backup.xml");
            if(!File.Exists(manifest)){MessageBox.Show("W wybranym folderze nie ma Backup.xml. Najpierw wskaż katalog kopii NaprawaPC i sprawdź manifest.");return;}
            backupRecoveryReportBox.Text=createIndex?"Tworzenie indeksu SHA-256. To może potrwać długo...":"Weryfikowanie plików SHA-256. To może potrwać długo...";
            backupIntegrityWorker=new BackgroundWorker();
            backupIntegrityWorker.DoWork+=delegate(object sender,DoWorkEventArgs e)
            {
                object[] a=(object[])e.Argument;string root=(string)a[0];bool create=(bool)a[1];
                string index=Path.Combine(root,"NaprawaPC_SHA256_INDEX.txt");StringBuilder report=new StringBuilder();
                report.AppendLine("KOMPUTEROWE CENTRUM SERWISU — SHA-256 BACKUP INDEX");report.AppendLine("Folder: "+root);report.AppendLine("Data: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
                int good=0,bad=0,missing=0;
                if(create)
                {
                    string temp=index+".new";if(File.Exists(temp))File.Delete(temp);
                    List<string> scanWarnings=new List<string>();
                    List<string> files=CollectBackupFilesWithoutReparsePoints(root,scanWarnings);
                    foreach(string warning in scanWarnings)report.AppendLine("[WARN] "+warning);
                    if(scanWarnings.Count>0)bad+=scanWarnings.Count;
                    using(StreamWriter sw=new StreamWriter(temp,false,new UTF8Encoding(false)))
                    {
                        foreach(string file in files)
                        {
                            if(String.Equals(file,index,StringComparison.OrdinalIgnoreCase) || String.Equals(file,temp,StringComparison.OrdinalIgnoreCase))continue;
                            string rel=file.Substring(root.TrimEnd(Path.DirectorySeparatorChar,Path.AltDirectorySeparatorChar).Length).TrimStart(Path.DirectorySeparatorChar,Path.AltDirectorySeparatorChar);
                            try{sw.WriteLine(HashFile(file)+" *"+rel);good++;}
                            catch(Exception ex){bad++;report.AppendLine("[FAIL] "+rel+" — "+ex.Message);}
                        }
                    }
                    if(bad==0){if(File.Exists(index))File.Delete(index);File.Move(temp,index);report.AppendLine("[PASS] Zapisano indeks SHA-256: "+index);}
                    else{try{File.Delete(temp);}catch{}report.AppendLine("[FAIL] Nie zapisano indeksu — błędy odczytu: "+bad);}
                }
                else
                {
                    if(!File.Exists(index))throw new FileNotFoundException("Brak NaprawaPC_SHA256_INDEX.txt. Najpierw utwórz indeks.",index);
                    foreach(string line in File.ReadAllLines(index,Encoding.UTF8))
                    {
                        if(String.IsNullOrWhiteSpace(line))continue;int split=line.IndexOf(" *",StringComparison.Ordinal);
                        if(split!=64) {bad++;report.AppendLine("[FAIL] Nieprawidłowy wpis indeksu: "+line);continue;}
                        string expected=line.Substring(0,64),rel=line.Substring(split+2);
                        string fullRoot=Path.GetFullPath(root).TrimEnd(Path.DirectorySeparatorChar,Path.AltDirectorySeparatorChar)+Path.DirectorySeparatorChar;
                        string file=Path.GetFullPath(Path.Combine(root,rel));
                        if(!file.StartsWith(fullRoot,StringComparison.OrdinalIgnoreCase))
                        {bad++;report.AppendLine("[INVALID PATH] Wpis wychodzi poza katalog kopii: "+rel);continue;}
                        if(!File.Exists(file)){missing++;report.AppendLine("[MISSING] "+rel);continue;}
                        try{string actual=HashFile(file);if(String.Equals(expected,actual,StringComparison.OrdinalIgnoreCase))good++;else{bad++;report.AppendLine("[HASH MISMATCH] "+rel);}}
                        catch(Exception ex){bad++;report.AppendLine("[READ ERROR] "+rel+" — "+ex.Message);}
                    }
                }
                report.AppendLine();report.AppendLine("WYNIK: zgodne="+good+" | błędne="+bad+" | brakujące="+missing);
                report.AppendLine(create?"Indeks zapisuje stan plików z chwili jego utworzenia.":"PASS tylko wtedy, gdy wszystkie wpisy mają zgodny hash i nie ma brakujących plików.");
                e.Result=report.ToString();
            };
            backupIntegrityWorker.RunWorkerCompleted+=delegate(object sender,RunWorkerCompletedEventArgs e)
            {
                if(backupRecoveryReportBox==null || backupRecoveryReportBox.IsDisposed)return;
                if(e.Error!=null)backupRecoveryReportBox.Text="BŁĄD INDEKSU SHA-256: "+e.Error.GetBaseException().Message;
                else backupRecoveryReportBox.Text=Convert.ToString(e.Result);
                AppendLog(e.Error==null?"Zakończono operację indeksu SHA-256 kopii.":"Błąd audytu SHA-256 kopii: "+e.Error.GetBaseException().Message);
            };
            backupIntegrityWorker.RunWorkerAsync(new object[]{folder,createIndex});
        }

        // FIX053 — deep, factual hardware inventory. Missing sensor values remain explicitly unknown.
        private void BuildHardwareIntelligencePage()
        {
            if(FindPage("Hardware Intelligence PRO")!=null)return;
            Panel p=NewPage("Hardware Intelligence PRO","Hardware Intelligence PRO");
            Panel actions=Card(p,"PEŁNA INWENTARYZACJA SPRZĘTU",10,8,950,135);
            LabelAt(actions,"Odczyty WMI/SMBIOS/PnP: CPU, pamięć, kontrolery graficzne, monitory, płyta, BIOS, dyski i urządzenia z błędami.",18,45,900,34);
            ButtonAt(actions,"SKANUJ SPRZĘT",18,88,190,delegate{RefreshHardwareIntelligence();});
            ButtonAt(actions,"MENEDŻER URZĄDZEŃ",220,88,220,delegate{RunCommand("mmc.exe","devmgmt.msc");});
            ButtonAt(actions,"DXDIAG",452,88,150,delegate{RunCommand("dxdiag.exe","/t \""+Path.Combine(dataRoot,"dxdiag-report.txt")+"\"");});
            ButtonAt(actions,"ZAPISZ RAPORT",612,88,180,delegate{SaveTextReport(hardwareIntelReportBox,"HardwareIntelligence");});
            Panel result=Card(p,"RAPORT SPRZĘTU / MONITORÓW / PNP",10,153,950,500);
            hardwareIntelReportBox=new TextBox();hardwareIntelReportBox.Multiline=true;hardwareIntelReportBox.ReadOnly=true;
            hardwareIntelReportBox.ScrollBars=ScrollBars.Both;hardwareIntelReportBox.WordWrap=false;hardwareIntelReportBox.Font=new Font("Consolas",8.2F);
            hardwareIntelReportBox.BackColor=Color.FromArgb(7,13,23);hardwareIntelReportBox.ForeColor=Color.FromArgb(205,235,245);
            hardwareIntelReportBox.Location=new Point(UX(18),UY(45));hardwareIntelReportBox.Size=new Size(UX(895),UY(430));result.Controls.Add(hardwareIntelReportBox);
            RefreshHardwareIntelligence();
        }

        private void RefreshHardwareIntelligence()
        {
            if(hardwareIntelReportBox==null || hardwareIntelReportBox.IsDisposed)return;
            hardwareIntelReportBox.Text="Odczytywanie WMI/SMBIOS/PnP...";
            BackgroundWorker bw=new BackgroundWorker();
            bw.DoWork+=delegate(object sender,DoWorkEventArgs e)
            {
                StringBuilder b=new StringBuilder();b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — HARDWARE INTELLIGENCE PRO");
                b.AppendLine("Data: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));b.AppendLine("OS: "+GetOsCaption()+" | "+GetBuild()+" | "+GetArchitecture());b.AppendLine();
                HardwareSnapshot h=ReadHardwareSnapshot();
                b.AppendLine("PODSTAWOWE PODZESPOŁY:");b.AppendLine("CPU: "+h.Cpu);b.AppendLine("Rdzenie/wątki: "+h.Cores);b.AppendLine("Obciążenie CPU: "+h.CpuLoad);
                b.AppendLine("RAM: "+h.Ram);b.AppendLine("GPU (wybrany adapter): "+h.Gpu);b.AppendLine("VRAM: "+h.Vram);
                b.AppendLine("Ocena wykrycia fizycznego GPU: "+h.GpuPhysicalStatus);b.AppendLine(h.GpuDetails);b.AppendLine("Temperatura ACPI: "+h.CpuTemperature);
                b.AppendLine("BIOS: "+h.Bios);b.AppendLine("Płyta: "+h.Board);b.AppendLine("Dyski: "+h.Disks);b.AppendLine("Wolumeny: "+h.Drives);
                b.AppendLine("TPM: "+h.Tpm+" | Firmware: "+h.Firmware+" | Secure Boot: "+h.SecureBoot);b.AppendLine();
                b.AppendLine("KONTROLERY GRAFICZNE:");
                try{using(ManagementObjectSearcher q=new ManagementObjectSearcher("SELECT Name,AdapterRAM,DriverVersion,DriverDate,VideoProcessor,CurrentHorizontalResolution,CurrentVerticalResolution,CurrentRefreshRate,PNPDeviceID,AdapterCompatibility,Status FROM Win32_VideoController"))
                    foreach(ManagementObject o in q.Get())
                    {
                        string name=Convert.ToString(o["Name"]);ulong ram=0;try{ram=Convert.ToUInt64(o["AdapterRAM"]);}catch{}
                        string pnp=Convert.ToString(o["PNPDeviceID"]);
                        bool isVirtual=IsVirtualVideoAdapter(name,pnp);
                        b.AppendLine("GPU: "+name+" | klasyfikacja: "+(isVirtual?"WIRTUALNY / ZDALNY":"adapter nieoznaczony jako wirtualny; fizyczność niepotwierdzona"));
                        b.AppendLine("  VRAM WMI: "+(ram>0?Math.Round(ram/1073741824.0,2).ToString("0.00",CultureInfo.InvariantCulture)+" GB (wartość orientacyjna; limit pola WMI)":"brak wiarygodnej wartości"));
                        b.AppendLine("  Producent adaptera: "+Convert.ToString(o["AdapterCompatibility"])+" | Status: "+Convert.ToString(o["Status"]));
                        b.AppendLine("  Driver: "+Convert.ToString(o["DriverVersion"])+" | date: "+Convert.ToString(o["DriverDate"]));
                        b.AppendLine("  VideoProcessor: "+Convert.ToString(o["VideoProcessor"]));
                        b.AppendLine("  Tryb: "+Convert.ToString(o["CurrentHorizontalResolution"])+"x"+Convert.ToString(o["CurrentVerticalResolution"])+" @ "+Convert.ToString(o["CurrentRefreshRate"])+" Hz");
                        b.AppendLine("  PNP: "+Convert.ToString(o["PNPDeviceID"]));
                        if(name.IndexOf("virtual",StringComparison.OrdinalIgnoreCase)>=0 || name.IndexOf("remote",StringComparison.OrdinalIgnoreCase)>=0)
                            b.AppendLine("  [INFO] Adapter może być wirtualny/zdalny; nie zakładaj, że jest to fizyczna karta GPU.");
                    }}catch(Exception ex){b.AppendLine("GPU WMI: "+ex.Message);}
                b.AppendLine();b.AppendLine("MONITORY:");
                try{using(ManagementObjectSearcher q=new ManagementObjectSearcher("SELECT Name,MonitorManufacturer,MonitorType,ScreenHeight,ScreenWidth,PNPDeviceID FROM Win32_DesktopMonitor"))
                    foreach(ManagementObject o in q.Get())b.AppendLine(Convert.ToString(o["Name"])+" | "+Convert.ToString(o["MonitorManufacturer"])+" | "+Convert.ToString(o["MonitorType"])+" | "+Convert.ToString(o["ScreenWidth"])+"x"+Convert.ToString(o["ScreenHeight"])+" | "+Convert.ToString(o["PNPDeviceID"]));}
                catch(Exception ex){b.AppendLine("Monitor WMI: "+ex.Message);}
                b.AppendLine();b.AppendLine("MODUŁY RAM:");
                try{using(ManagementObjectSearcher q=new ManagementObjectSearcher("SELECT BankLabel,DeviceLocator,Capacity,Speed,ConfiguredClockSpeed,Manufacturer,PartNumber,SerialNumber FROM Win32_PhysicalMemory"))
                    foreach(ManagementObject o in q.Get())
                    {
                        double gb=0;try{gb=Convert.ToDouble(o["Capacity"])/1073741824.0;}catch{}
                        b.AppendLine(Convert.ToString(o["DeviceLocator"])+" | "+gb.ToString("0.0",CultureInfo.InvariantCulture)+" GB | "+Convert.ToString(o["Speed"])+" MT/s | configured "+Convert.ToString(o["ConfiguredClockSpeed"])+" | "+Convert.ToString(o["Manufacturer"])+" | "+Convert.ToString(o["PartNumber"]));
                    }}catch(Exception ex){b.AppendLine("RAM module WMI: "+ex.Message);}
                b.AppendLine();b.AppendLine("URZĄDZENIA Z BŁĘDAMI PNP:");int bad=0;
                try{using(ManagementObjectSearcher q=new ManagementObjectSearcher("SELECT Name,ConfigManagerErrorCode,PNPDeviceID FROM Win32_PnPEntity WHERE ConfigManagerErrorCode<>0"))
                    foreach(ManagementObject o in q.Get()){bad++;b.AppendLine("[CODE "+Convert.ToString(o["ConfigManagerErrorCode"])+"] "+Convert.ToString(o["Name"])+" | "+Convert.ToString(o["PNPDeviceID"]));}}
                catch(Exception ex){b.AppendLine("PnP WMI: "+ex.Message);}
                if(bad==0)b.AppendLine("Nie wykryto urządzeń z kodem problemu przez tę klasę WMI; sprawdź także Menedżer urządzeń.");
                b.AppendLine();b.AppendLine("OGRANICZENIA: WMI nie zawsze pokazuje VRAM, fizyczny GPU, model monitora ani temperatury. Brak danych nie oznacza wartości 0 ani poprawnego stanu sprzętu.");
                e.Result=b.ToString();
            };
            bw.RunWorkerCompleted+=delegate(object sender,RunWorkerCompletedEventArgs e)
            {
                if(hardwareIntelReportBox==null || hardwareIntelReportBox.IsDisposed)return;
                hardwareIntelReportBox.Text=e.Error==null?Convert.ToString(e.Result):"Błąd odczytu sprzętu: "+e.Error.GetBaseException().Message;
                AppendLog(e.Error==null?"Hardware Intelligence: inwentaryzacja zakończona.":"Hardware Intelligence: "+e.Error.GetBaseException().Message);
            };
            bw.RunWorkerAsync();
        }

        // FIX053 — local compatibility database, maintained by the technician; no unsupported auto-certification.
        private void BuildWindowsCompatibilityDatabasePage()
        {
            if(FindPage("Windows Compatibility DB")!=null)return;
            Panel p=NewPage("Windows Compatibility DB","Windows Compatibility Database");
            Panel add=Card(p,"DODAJ WPIS DO LOKALNEJ BAZY",10,8,950,205);
            LabelAt(add,"Typ",18,45,50,24);compatibilityDbTypeBox=ComboAt(add,new string[]{"Aplikacja","Sterownik","Urządzenie","Model komputera"},70,41,180);
            LabelAt(add,"Nazwa / model",265,45,120,24);compatibilityDbNameBox=TextAt(add,390,41,505,26,"");
            LabelAt(add,"Producent",18,83,90,24);compatibilityDbVendorBox=TextAt(add,110,79,300,26,"");
            LabelAt(add,"Docelowy Windows",430,83,145,24);compatibilityDbTargetBox=TextAt(add,580,79,315,26,"Windows 11");
            LabelAt(add,"Notatka / wynik testu",18,121,175,24);compatibilityDbNoteBox=TextAt(add,195,117,700,26,"");
            ButtonAt(add,"DODAJ WPIS",18,158,180,delegate{AddCompatibilityDatabaseRecord();});
            ButtonAt(add,"SKANUJ ZAINSTALOWANE PROGRAMY",210,158,300,delegate{ImportInstalledAppsToCompatibilityDb();});
            ButtonAt(add,"EKSPORT CSV",522,158,180,delegate{ExportCompatibilityDatabaseCsv();});
            Panel result=Card(p,"LOKALNA BAZA ZGODNOŚCI / HISTORIA TESTÓW",10,223,950,390);
            compatibilityDbReportBox=new TextBox();compatibilityDbReportBox.Multiline=true;compatibilityDbReportBox.ReadOnly=true;
            compatibilityDbReportBox.ScrollBars=ScrollBars.Both;compatibilityDbReportBox.WordWrap=false;compatibilityDbReportBox.Font=new Font("Consolas",8.5F);
            compatibilityDbReportBox.BackColor=Color.FromArgb(7,13,23);compatibilityDbReportBox.ForeColor=Color.FromArgb(205,235,245);
            compatibilityDbReportBox.Location=new Point(UX(18),UY(45));compatibilityDbReportBox.Size=new Size(UX(895),UY(320));result.Controls.Add(compatibilityDbReportBox);
            ButtonAt(result,"ODŚWIEŻ BAZĘ",18,325,180,delegate{RefreshCompatibilityDatabase();});
            Panel note=Card(p,"WAŻNE",10,623,950,110);
            LabelAt(note,"Baza jest lokalnym rejestrem własnych testów i notatek serwisanta. Wpis nie oznacza oficjalnej certyfikacji producenta ani gwarancji działania na docelowym Windows.",18,45,900,45);
            RefreshCompatibilityDatabase();
        }

        private XmlDocument LoadCompatibilityDatabase()
        {
            XmlDocument d=new XmlDocument();d.XmlResolver=null;
            if(File.Exists(compatibilityDbPath))d.Load(compatibilityDbPath);
            else{XmlElement root=d.CreateElement("CompatibilityDatabase");root.SetAttribute("Version","1");d.AppendChild(root);}
            if(d.DocumentElement==null){XmlElement root=d.CreateElement("CompatibilityDatabase");root.SetAttribute("Version","1");d.AppendChild(root);}
            return d;
        }

        private void AddCompatibilityDatabaseRecord()
        {
            if(compatibilityDbNameBox==null)return;
            string name=compatibilityDbNameBox.Text.Trim();if(name.Length==0){MessageBox.Show("Wpisz nazwę aplikacji, sterownika lub urządzenia.");return;}
            try
            {
                XmlDocument d=LoadCompatibilityDatabase();XmlElement item=d.CreateElement("Record");
                item.SetAttribute("Date",DateTime.Now.ToString("o"));
                AddCaseValue(d,item,"Type",Convert.ToString(compatibilityDbTypeBox.SelectedItem));
                AddCaseValue(d,item,"Name",name);AddCaseValue(d,item,"Vendor",compatibilityDbVendorBox.Text.Trim());
                AddCaseValue(d,item,"Target",compatibilityDbTargetBox.Text.Trim());AddCaseValue(d,item,"Note",compatibilityDbNoteBox.Text.Trim());
                d.DocumentElement.AppendChild(item);string dir=Path.GetDirectoryName(compatibilityDbPath);if(!Directory.Exists(dir))Directory.CreateDirectory(dir);
                SaveXmlSafely(d,compatibilityDbPath,8);AppendLog("Dodano wpis do Windows Compatibility DB: "+name);
                compatibilityDbNameBox.Clear();compatibilityDbNoteBox.Clear();RefreshCompatibilityDatabase();
            }catch(Exception ex){MessageBox.Show("Nie zapisano bazy zgodności: "+ex.Message);}
        }

        private void ImportInstalledAppsToCompatibilityDb()
        {
            if(!IsAdmin() && MessageBox.Show("Skan może nie widzieć wszystkich aplikacji zainstalowanych dla innych użytkowników. Kontynuować?","Inwentaryzacja aplikacji",MessageBoxButtons.YesNo,MessageBoxIcon.Question)!=DialogResult.Yes)return;
            try
            {
                XmlDocument d=LoadCompatibilityDatabase();HashSet<string> existing=new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                foreach(XmlNode n in d.SelectNodes("/CompatibilityDatabase/Record[Type='Aplikacja']"))existing.Add((ReadCompatibilityDatabaseValue(n,"Name")+"|"+ReadCompatibilityDatabaseValue(n,"Vendor")).ToLowerInvariant());
                int added=0;string[] paths=new string[]{@"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",@"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"};
                RegistryKey[] roots=new RegistryKey[]{Registry.LocalMachine,Registry.CurrentUser};
                foreach(RegistryKey root in roots)foreach(string path in paths)
                {
                    try{using(RegistryKey branch=root.OpenSubKey(path))
                        if(branch!=null)foreach(string sub in branch.GetSubKeyNames())try{using(RegistryKey app=branch.OpenSubKey(sub))
                        {
                            if(app==null)continue;string name=Convert.ToString(app.GetValue("DisplayName"));if(String.IsNullOrWhiteSpace(name))continue;
                            string vendor=Convert.ToString(app.GetValue("Publisher"));string key=(name+"|"+vendor).ToLowerInvariant();if(existing.Contains(key))continue;
                            XmlElement item=d.CreateElement("Record");item.SetAttribute("Date",DateTime.Now.ToString("o"));
                            AddCaseValue(d,item,"Type","Aplikacja");AddCaseValue(d,item,"Name",name);AddCaseValue(d,item,"Vendor",vendor);
                            AddCaseValue(d,item,"Target","Nieprzetestowano");AddCaseValue(d,item,"Note","Automatyczna inwentaryzacja; wymaga ręcznej weryfikacji.");d.DocumentElement.AppendChild(item);existing.Add(key);added++;
                        }}catch{}}
                    catch{}
                }
                string dir=Path.GetDirectoryName(compatibilityDbPath);if(!Directory.Exists(dir))Directory.CreateDirectory(dir);SaveXmlSafely(d,compatibilityDbPath,8);
                AppendLog("Dodano do bazy zgodności "+added+" aplikacji do ręcznej weryfikacji.");RefreshCompatibilityDatabase();
            }catch(Exception ex){MessageBox.Show("Skan aplikacji nie powiódł się: "+ex.Message);}
        }

        private string ReadCompatibilityDatabaseValue(XmlNode node,string name)
        {
            XmlNode n=node.SelectSingleNode(name);return n==null?"":n.InnerText;
        }

        private void RefreshCompatibilityDatabase()
        {
            if(compatibilityDbReportBox==null)return;
            try
            {
                XmlDocument d=LoadCompatibilityDatabase();XmlNodeList nodes=d.SelectNodes("/CompatibilityDatabase/Record");
                StringBuilder b=new StringBuilder();b.AppendLine("WINDOWS COMPATIBILITY DATABASE — "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
                b.AppendLine("Plik: "+compatibilityDbPath+" | wpisy: "+nodes.Count);b.AppendLine();
                foreach(XmlNode n in nodes)
                {
                    b.AppendLine("["+ReadCompatibilityDatabaseValue(n,"Type")+"] "+ReadCompatibilityDatabaseValue(n,"Name")+" | "+ReadCompatibilityDatabaseValue(n,"Vendor"));
                    b.AppendLine("  Cel: "+ReadCompatibilityDatabaseValue(n,"Target")+" | Data: "+(n.Attributes["Date"]==null?"":n.Attributes["Date"].Value));
                    b.AppendLine("  Notatka: "+ReadCompatibilityDatabaseValue(n,"Note"));
                }
                if(nodes.Count==0)b.AppendLine("Baza jest pusta. Dodaj wpis lub wykonaj inwentaryzację aplikacji.");
                compatibilityDbReportBox.Text=b.ToString();
            }catch(Exception ex){compatibilityDbReportBox.Text="Błąd odczytu bazy zgodności: "+ex.Message;}
        }

        private void ExportCompatibilityDatabaseCsv()
        {
            try
            {
                XmlDocument d=LoadCompatibilityDatabase();XmlNodeList nodes=d.SelectNodes("/CompatibilityDatabase/Record");
                SaveFileDialog s=new SaveFileDialog();s.Filter="CSV (*.csv)|*.csv";s.FileName="WindowsCompatibilityDB_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".csv";
                if(s.ShowDialog()!=DialogResult.OK)return;
                StringBuilder b=new StringBuilder();b.AppendLine("Typ;Nazwa;Producent;Cel;Data;Notatka");
                foreach(XmlNode n in nodes)
                {
                    string[] vals=new string[]{ReadCompatibilityDatabaseValue(n,"Type"),ReadCompatibilityDatabaseValue(n,"Name"),ReadCompatibilityDatabaseValue(n,"Vendor"),ReadCompatibilityDatabaseValue(n,"Target"),n.Attributes["Date"]==null?"":n.Attributes["Date"].Value,ReadCompatibilityDatabaseValue(n,"Note")};
                    for(int i=0;i<vals.Length;i++)vals[i]="\""+(vals[i]??"").Replace("\"","\"\"")+"\"";
                    b.AppendLine(String.Join(";",vals));
                }
                File.WriteAllText(s.FileName,b.ToString(),new UTF8Encoding(true));AppendLog("Wyeksportowano Windows Compatibility DB: "+s.FileName);
            }catch(Exception ex){MessageBox.Show("Eksport CSV nie powiódł się: "+ex.Message);}
        }

        // FIX053 — boot repair center is deliberately diagnostic-first; destructive repair is not automatic.
        private void BuildUniversalBootRepairPage()
        {
            if(FindPage("Universal Boot Repair")!=null)return;
            Panel p=NewPage("Universal Boot Repair","Universal Boot Repair PRO");
            Panel actions=Card(p,"DIAGNOSTYKA ROZRUCHU / UEFI / BCD / WINRE",10,8,950,150);
            LabelAt(actions,"Odczyt BCD, WinRE, woluminów i typu firmware. Eksport BCD przed zmianą. Naprawa odbywa się z właściwego środowiska WinRE/WinPE.",18,45,900,38);
            ButtonAt(actions,"SKANUJ ROZRUCH",18,95,190,delegate{RefreshUniversalBootReport();});
            ButtonAt(actions,"EKSPORTUJ BCD",220,95,190,delegate{ExportBcdStore();});
            ButtonAt(actions,"URUCHOM WINRE",422,95,190,delegate{RequestWinRERestart();});
            ButtonAt(actions,"ZAPISZ RAPORT",624,95,180,delegate{SaveTextReport(universalBootReportBox,"UniversalBootRepair");});
            Panel result=Card(p,"BCD / REAGENTC / MOUNTVOL",10,165,950,390);
            universalBootReportBox=new TextBox();universalBootReportBox.Multiline=true;universalBootReportBox.ReadOnly=true;
            universalBootReportBox.ScrollBars=ScrollBars.Both;universalBootReportBox.WordWrap=false;universalBootReportBox.Font=new Font("Consolas",8.5F);
            universalBootReportBox.BackColor=Color.FromArgb(7,13,23);universalBootReportBox.ForeColor=Color.FromArgb(205,235,245);
            universalBootReportBox.Location=new Point(UX(18),UY(45));universalBootReportBox.Size=new Size(UX(895),UY(340));result.Controls.Add(universalBootReportBox);
            Panel note=Card(p,"OSTRZEŻENIE",10,565,950,125);
            LabelAt(note,"Nie wykonuj bootrec, bcdboot, formatowania EFI ani usuwania wpisów automatycznie z uruchomionego Windows. Wybór niewłaściwego dysku lub partycji może unieruchomić komputer. Zrób kopię danych i BCD.",18,45,900,55);
            RefreshUniversalBootReport();
        }

        private void RefreshUniversalBootReport()
        {
            if(universalBootReportBox==null)return;StringBuilder b=new StringBuilder();
            b.AppendLine("UNIVERSAL BOOT REPAIR — READ ONLY SCAN");b.AppendLine("OS: "+GetOsCaption()+" | Firmware: "+ReadFirmwareType()+" | Secure Boot: "+ReadSecureBoot());
            b.AppendLine("TPM: "+ReadTpmSpec());b.AppendLine();
            string sys=Environment.GetFolderPath(Environment.SpecialFolder.System);int code;
            b.AppendLine("BCDEDIT /ENUM ALL /V:");b.AppendLine(CaptureExternal(Path.Combine(sys,"bcdedit.exe"),"/enum all /v",out code));b.AppendLine("Exit: "+code);b.AppendLine();
            b.AppendLine("REAGENTC /INFO:");b.AppendLine(CaptureExternal(Path.Combine(sys,"reagentc.exe"),"/info",out code));b.AppendLine("Exit: "+code);b.AppendLine();
            b.AppendLine("MOUNTVOL:");b.AppendLine(CaptureExternal(Path.Combine(sys,"mountvol.exe"),"",out code));b.AppendLine("Exit: "+code);b.AppendLine();
            b.AppendLine("Wynik: zebrano informacje odczytowe. Brak błędów w tych wynikach nie gwarantuje prawidłowego rozruchu.");
            universalBootReportBox.Text=b.ToString();AppendLog("Universal Boot Repair: wykonano skan odczytowy.");
        }

        // FIX053 — official driver vendor pages only; no third-party driver bundles or silent installs.
        private void BuildDriverDownloadCenterPage()
        {
            if(FindPage("Driver Download Center")!=null)return;
            Panel p=NewPage("Driver Download Center","Driver Download Center PRO");
            Panel vendor=Card(p,"WYBIERZ PRODUCENTA / OFICJALNE ŹRÓDŁO",10,8,950,175);
            driverVendorBox=ComboAt(vendor,new string[]{"Intel","AMD","NVIDIA","Realtek","Dell","HP","Lenovo","ASUS","Acer","MSI","GIGABYTE","Microsoft Update Catalog"},18,48,260);
            LabelAt(vendor,"Model / fraza do wyszukania (opcjonalnie)",295,48,300,24);driverSearchBox=TextAt(vendor,295,75,520,26,"");
            ButtonAt(vendor,"OTWÓRZ OFICJALNĄ STRONĘ",18,120,245,delegate{OpenSelectedDriverVendor();});
            ButtonAt(vendor,"SZUKAJ MODELU W CATALOGU",275,120,285,delegate{SearchDriverModelInCatalog();});
            ButtonAt(vendor,"SKANUJ STEROWNIKI",570,120,245,delegate{BuildDriverDownloadInventory();});
            Panel official=Card(p,"SKRÓTY PRODUCENTÓW",10,193,950,140);
            ButtonAt(official,"Intel",18,48,125,delegate{OpenUrl("https://www.intel.com/content/www/us/en/download-center/home.html");});
            ButtonAt(official,"AMD",153,48,125,delegate{OpenUrl("https://www.amd.com/en/support/download/drivers.html");});
            ButtonAt(official,"NVIDIA",288,48,125,delegate{OpenUrl("https://www.nvidia.com/Download/index.aspx");});
            ButtonAt(official,"Microsoft Catalog",423,48,205,delegate{OpenUrl("https://www.catalog.update.microsoft.com/");});
            ButtonAt(official,"Dell / HP / Lenovo",638,48,260,delegate{OpenSelectedDriverVendor();});
            Panel result=Card(p,"WYKRYTY SPRZĘT / STEROWNIKI",10,343,950,310);
            driverDownloadReportBox=new TextBox();driverDownloadReportBox.Multiline=true;driverDownloadReportBox.ReadOnly=true;
            driverDownloadReportBox.ScrollBars=ScrollBars.Both;driverDownloadReportBox.WordWrap=false;driverDownloadReportBox.Font=new Font("Consolas",8.3F);
            driverDownloadReportBox.BackColor=Color.FromArgb(7,13,23);driverDownloadReportBox.ForeColor=Color.FromArgb(205,235,245);
            driverDownloadReportBox.Location=new Point(UX(18),UY(45));driverDownloadReportBox.Size=new Size(UX(895),UY(255));result.Controls.Add(driverDownloadReportBox);
            BuildDriverDownloadInventory();
        }

        private string GetDriverVendorUrl(string vendor)
        {
            switch((vendor??"").Trim())
            {
                case "Intel":return "https://www.intel.com/content/www/us/en/download-center/home.html";
                case "AMD":return "https://www.amd.com/en/support/download/drivers.html";
                case "NVIDIA":return "https://www.nvidia.com/Download/index.aspx";
                case "Realtek":return "https://www.realtek.com/Download/Index?cate_id=194";
                case "Dell":return "https://www.dell.com/support/home";
                case "HP":return "https://support.hp.com/drivers";
                case "Lenovo":return "https://pcsupport.lenovo.com/";
                case "ASUS":return "https://www.asus.com/support/download-center/";
                case "Acer":return "https://www.acer.com/us-en/support/drivers-and-manuals";
                case "MSI":return "https://www.msi.com/support/download";
                case "GIGABYTE":return "https://www.gigabyte.com/Support";
                default:return "https://www.catalog.update.microsoft.com/";
            }
        }

        private void OpenSelectedDriverVendor()
        {
            string vendor=driverVendorBox==null?"Microsoft Update Catalog":Convert.ToString(driverVendorBox.SelectedItem);
            string query=driverSearchBox==null?"":driverSearchBox.Text.Trim();
            string url=GetDriverVendorUrl(vendor);
            OpenUrl(url);AppendLog("Otworzono oficjalne źródło sterowników: "+vendor+(String.IsNullOrEmpty(query)?"":" | model: "+query));
        }

        private void SearchDriverModelInCatalog()
        {
            string query=driverSearchBox==null?"":driverSearchBox.Text.Trim();
            if(String.IsNullOrWhiteSpace(query)){MessageBox.Show("Wpisz model urządzenia lub identyfikator PNP.");return;}
            OpenUrl("https://www.catalog.update.microsoft.com/Search.aspx?q="+Uri.EscapeDataString(query));
            AppendLog("Wyszukano model w Microsoft Update Catalog: "+query);
        }

        private void BuildDriverDownloadInventory()
        {
            if(driverDownloadReportBox==null)return;StringBuilder b=new StringBuilder();
            b.AppendLine("DRIVER DOWNLOAD CENTER — INWENTARYZACJA");b.AppendLine("System: "+GetOsCaption()+" | "+GetArchitecture());b.AppendLine();
            int count=0;
            try{using(ManagementObjectSearcher q=new ManagementObjectSearcher("SELECT Name,Manufacturer,DriverVersion,DriverDate,PNPDeviceID,ConfigManagerErrorCode FROM Win32_PnPEntity"))
                foreach(ManagementObject o in q.Get())
                {
                    string name=Convert.ToString(o["Name"]);if(String.IsNullOrWhiteSpace(name))continue;count++;
                    int err=0;try{err=Convert.ToInt32(o["ConfigManagerErrorCode"]);}catch{}
                    b.AppendLine((err==0?"[OK] ":"[PROBLEM "+err+"] ")+name+" | "+Convert.ToString(o["Manufacturer"]));
                    b.AppendLine("  Driver: "+Convert.ToString(o["DriverVersion"])+" | date: "+Convert.ToString(o["DriverDate"]));
                    b.AppendLine("  PNP: "+Convert.ToString(o["PNPDeviceID"]));
                }}catch(Exception ex){b.AppendLine("WMI: "+ex.Message);}
            b.AppendLine();b.AppendLine("Urządzeń zebrano: "+count);
            b.AppendLine("Program nie pobiera sterowników z przypadkowych repozytoriów i nie instaluje ich po cichu. Otwórz oficjalny portal producenta i zweryfikuj model, identyfikator PNP oraz system docelowy.");
            driverDownloadReportBox.Text=b.ToString();
        }

        // FIX053 — custom service report with customer/work-order fields and HTML/PDF workflow.
        private void BuildServiceReportDesignerPage()
        {
            if(FindPage("Service Report Designer")!=null)return;
            Panel p=NewPage("Service Report Designer","Service Report Designer PRO");
            Panel customer=Card(p,"DANE ZLECENIA / KLIENTA",10,8,950,200);
            LabelAt(customer,"Klient",18,45,70,24);reportCustomerBox=TextAt(customer,90,41,320,26,"");
            LabelAt(customer,"Urządzenie",430,45,100,24);reportDeviceBox=TextAt(customer,535,41,360,26,"");
            LabelAt(customer,"Numer zlecenia",18,83,110,24);reportCaseBox=TextAt(customer,135,79,275,26,"");
            LabelAt(customer,"Technik",430,83,100,24);reportTechnicianBox=TextAt(customer,535,79,360,26,"Technik serwisu");
            LabelAt(customer,"Wykonane czynności / uwagi",18,121,260,24);reportNotesBox=TextAt(customer,18,147,877,26,"");
            ButtonAt(customer,"PODGLĄD RAPORTU",18,177,210,delegate{RefreshServiceReportDesigner();});
            ButtonAt(customer,"ZAPISZ HTML / DRUKUJ PDF",240,177,300,delegate{ExportDesignedServiceReport();});
            Panel preview=Card(p,"PODGLĄD RAPORTU",10,218,950,420);
            reportPreviewBox=new TextBox();reportPreviewBox.Multiline=true;reportPreviewBox.ReadOnly=true;
            reportPreviewBox.ScrollBars=ScrollBars.Both;reportPreviewBox.WordWrap=false;reportPreviewBox.Font=new Font("Consolas",8.5F);
            reportPreviewBox.BackColor=Color.FromArgb(7,13,23);reportPreviewBox.ForeColor=Color.FromArgb(205,235,245);
            reportPreviewBox.Location=new Point(UX(18),UY(45));reportPreviewBox.Size=new Size(UX(895),UY(350));preview.Controls.Add(reportPreviewBox);
            RefreshServiceReportDesigner();
        }

        private string BuildDesignedServiceReport()
        {
            StringBuilder b=new StringBuilder();b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — RAPORT SERWISOWY");
            b.AppendLine("Data: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
            b.AppendLine("Numer zlecenia: "+(reportCaseBox==null?"":reportCaseBox.Text));
            b.AppendLine("Klient: "+(reportCustomerBox==null?"":reportCustomerBox.Text));
            b.AppendLine("Urządzenie: "+(reportDeviceBox==null?"":reportDeviceBox.Text));
            b.AppendLine("Technik: "+(reportTechnicianBox==null?"":reportTechnicianBox.Text));
            b.AppendLine("Opis czynności / uwagi: "+(reportNotesBox==null?"":reportNotesBox.Text));b.AppendLine();
            b.AppendLine("DIAGNOSTYKA KOMPUTERA:");b.AppendLine(BuildServiceReport());
            return b.ToString();
        }

        private void RefreshServiceReportDesigner()
        {
            if(reportPreviewBox!=null)reportPreviewBox.Text=BuildDesignedServiceReport();
        }

        private void ExportDesignedServiceReport()
        {
            string text=BuildDesignedServiceReport();SaveFileDialog d=new SaveFileDialog();d.Filter="Raport HTML (*.html)|*.html";
            d.FileName="Raport_Serwisowy_"+DateTime.Now.ToString("yyyyMMdd_HHmmss")+".html";if(d.ShowDialog()!=DialogResult.OK)return;
            string safe=System.Security.SecurityElement.Escape(text);
            string html="<!doctype html><html><head><meta charset='utf-8'><title>Raport — KOMPUTEROWE CENTRUM SERWISU</title><style>body{font-family:Segoe UI,Arial;color:#16263a;padding:28px}h1{color:#007eae}pre{white-space:pre-wrap;font:10pt Consolas,monospace;border:1px solid #aac;padding:18px}</style></head><body><h1>KOMPUTEROWE CENTRUM SERWISU — RAPORT SERWISOWY</h1><pre>"+safe+"</pre><p>Wydruk: Ctrl+P → Zapisz jako PDF</p></body></html>";
            try
            {
                File.WriteAllText(d.FileName,html,new UTF8Encoding(true));AppendLog("Zapisano projekt raportu: "+d.FileName);
                string[] browsers=new string[]{
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),"Microsoft","Edge","Application","msedge.exe"),
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),"Microsoft","Edge","Application","msedge.exe"),
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),"Google","Chrome","Application","chrome.exe"),
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),"Google","Chrome","Application","chrome.exe")};
                string browser="";foreach(string path in browsers)if(File.Exists(path)){browser=path;break;}
                if(!String.IsNullOrEmpty(browser))
                {
                    string pdf=Path.ChangeExtension(d.FileName,".pdf");
                    try
                    {
                        ProcessStartInfo pi=new ProcessStartInfo(browser,"--headless --disable-gpu --no-pdf-header-footer --print-to-pdf=\""+pdf+"\" \"file:///"+d.FileName.Replace("\\","/")+"\"");
                        pi.UseShellExecute=false;Process proc=Process.Start(pi);proc.WaitForExit(60000);
                        if(File.Exists(pdf)&&new FileInfo(pdf).Length>1000){AppendLog("Wygenerowano PDF raportu serwisowego: "+pdf);MessageBox.Show("Zapisano PDF:\r\n"+pdf);Process.Start("explorer.exe","/select,\""+pdf+"\"");return;}
                    }
                    catch(Exception ex){AppendLog("PDF z przeglądarki nie powiódł się: "+ex.Message);}
                }
                MessageBox.Show("Raport HTML został zapisany. Otworzę go do wydruku — użyj Ctrl+P → Zapisz jako PDF.","Raport serwisowy",MessageBoxButtons.OK,MessageBoxIcon.Information);
                Process.Start(d.FileName);
            }
            catch(Exception ex){MessageBox.Show("Nie zapisano raportu: "+ex.Message);}
        }

        // FIX053 — operation recovery is a history/rollback guide, not an unsafe automatic undo engine.
        private void BuildOperationRecoveryCenterPage()
        {
            if(FindPage("Operation Recovery Center")!=null)return;
            Panel p=NewPage("Operation Recovery Center","Operation Recovery Center PRO");
            Panel actions=Card(p,"HISTORIA / KONFIGURACJA / PUNKTY POWROTU",10,8,950,145);
            LabelAt(actions,"Przegląd zapisanych operacji, manifestu backupu, kopii konfiguracji i dostępnych ścieżek odzyskiwania.",18,45,900,30);
            ButtonAt(actions,"ODŚWIEŻ HISTORIĘ",18,88,190,delegate{RefreshOperationRecoveryCenter();});
            ButtonAt(actions,"KOPIA KONFIGURACJI",220,88,220,delegate{ShowPage("Konfiguracja PRO");});
            ButtonAt(actions,"PRZYWRACANIE PLIKÓW",452,88,220,delegate{ShowPage("Przywracanie");});
            ButtonAt(actions,"ROLLBACK MANAGER",684,88,220,delegate{ShowPage("Rollback Manager");});
            Panel report=Card(p,"OSTATNIE OPERACJE / DOSTĘPNE KOPIE",10,165,950,425);
            operationRecoveryReportBox=new TextBox();operationRecoveryReportBox.Multiline=true;operationRecoveryReportBox.ReadOnly=true;
            operationRecoveryReportBox.ScrollBars=ScrollBars.Both;operationRecoveryReportBox.WordWrap=false;operationRecoveryReportBox.Font=new Font("Consolas",8.5F);
            operationRecoveryReportBox.BackColor=Color.FromArgb(7,13,23);operationRecoveryReportBox.ForeColor=Color.FromArgb(205,235,245);
            operationRecoveryReportBox.Location=new Point(UX(18),UY(45));operationRecoveryReportBox.Size=new Size(UX(895),UY(355));report.Controls.Add(operationRecoveryReportBox);
            ButtonAt(report,"ZAPISZ RAPORT",18,360,180,delegate{SaveTextReport(operationRecoveryReportBox,"OperationRecovery");});
            Panel warning=Card(p,"BEZPIECZEŃSTWO",10,600,950,120);
            LabelAt(warning,"Cofanie zmian jest zależne od rodzaju operacji. Nie każdą zmianę można automatycznie odwrócić. Przed przywróceniem konfiguracji, rejestru lub BCD wykonaj ich osobną kopię i sprawdź, czy dotyczy tego komputera.",18,45,900,55);
            RefreshOperationRecoveryCenter();
        }

        private void RefreshOperationRecoveryCenter()
        {
            if(operationRecoveryReportBox==null)return;StringBuilder b=new StringBuilder();
            b.AppendLine("KOMPUTEROWE CENTRUM SERWISU — OPERATION RECOVERY CENTER");b.AppendLine("Komputer: "+Environment.MachineName+" | "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
            b.AppendLine("Data folder: "+dataRoot);b.AppendLine("Konfiguracja: "+(File.Exists(configPath)?configPath:"settings.xml jeszcze nie istnieje"));
            b.AppendLine("Manifest ostatniej kopii: "+(File.Exists(lastManifest)?lastManifest:"brak / nie wskazano"));
            b.AppendLine("Pełna zweryfikowana kopia według programu: "+(HasVerifiedBackup()?"TAK":"NIE"));
            b.AppendLine();b.AppendLine("KOPIE KONFIGURACJI:");
            try{if(File.Exists(configPath))foreach(string f in Directory.GetFiles(Path.GetDirectoryName(configPath),Path.GetFileName(configPath)+".backup_*.xml"))b.AppendLine(f);}
            catch(Exception ex){b.AppendLine("Błąd listowania konfiguracji: "+ex.Message);}
            b.AppendLine();b.AppendLine("OSTATNIE WPISY DZIENNIKA:");
            int first=Math.Max(0,logHistory.Count-180);for(int i=logHistory.Count-1;i>=first;i--)b.AppendLine(logHistory[i]);
            if(logHistory.Count==0)b.AppendLine("Dziennik jest pusty.");
            b.AppendLine();b.AppendLine("DOSTĘPNE ŚCIEŻKI:");
            b.AppendLine("- Konfiguracja PRO: eksport/import settings.xml z kopią .backup.");
            b.AppendLine("- Przywracanie: scala pliki z manifestu Backup.xml; nadpisanie jest opcjonalne.");
            b.AppendLine("- Boot Manager: eksport BCD przed zmianami.");
            b.AppendLine("- Obraz systemu: odtwarzanie przez WinRE/WinPE, z ryzykiem nadpisania partycji.");
            operationRecoveryReportBox.Text=b.ToString();
        }


        // FIX053 — user-controlled PC-to-PC migration package.
        // Works with local disks, USB drives and reachable SMB/network folders.
        // It deliberately does not claim to clone installed applications or transfer vendor licenses.
        private TextBox pcMigSourceBox, pcMigPackageBox, pcMigDestinationBox, pcMigStatusBox;

        private void BuildPcMigrationTransferPage()
        {
            if(FindPage("Migracja PC PRO")!=null)return;
            Panel p=NewPage("Migracja PC PRO","Migracja danych między komputerami");
            int w=1000;
            if(content!=null && layoutScale>0.1F) w=Math.Max(760,Math.Min(2200,(int)(content.ClientSize.Width/layoutScale)-42));
            Panel intro=Card(p,"MIGRACJA KOMPUTERA — STARY KOMPUTER → NOWY KOMPUTER",10,8,w,112);
            LabelAt(intro,"Przygotuj pakiet na USB, dysku zewnętrznym albo udostępnionym folderze sieciowym. Na nowym komputerze zweryfikuj sumy SHA-256 i przywróć wybrane pliki.",18,43,w-42,42);
            LabelAt(intro,"Obsługiwane ścieżki: dyski lokalne • USB • foldery sieciowe SMB/Wi-Fi/LAN. Bluetooth: użyj Udostępniania w pobliżu Windows do przeniesienia gotowego pakietu.",18,82,w-42,20);

            Panel source=Card(p,"1. KOMPUTER ŹRÓDŁOWY — WYBIERZ DANE",10,132,w,118);
            pcMigSourceBox=TextAt(source,18,46,w-250,28,"");
            ButtonAt(source,"WYBIERZ FOLDER ŹRÓDŁOWY",w-215,42,195,delegate{
                using(FolderBrowserDialog d=new FolderBrowserDialog()){d.Description="Wybierz folder do migracji (np. profil użytkownika lub folder z danymi).";if(d.ShowDialog()==DialogResult.OK)pcMigSourceBox.Text=d.SelectedPath;}
            });
            LabelAt(source,"Wybieraj konkretne foldery, np. Dokumenty, Pulpit, Zdjęcia lub katalog danych aplikacji. Nie zaznaczaj całego C:\\ bez potrzeby.",18,82,w-42,24);

            Panel package=Card(p,"2. PAKIET MIGRACYJNY — USB / LAN / WIFI",10,262,w,148);
            pcMigPackageBox=TextAt(package,18,46,w-250,28,"");
            ButtonAt(package,"WYBIERZ MIEJSCE PAKIETU",w-215,42,195,delegate{
                using(FolderBrowserDialog d=new FolderBrowserDialog()){d.Description="Wybierz folder docelowy pakietu, np. pendrive lub udział sieciowy.";if(d.ShowDialog()==DialogResult.OK)pcMigPackageBox.Text=d.SelectedPath;}
            });
            LabelAt(package,"Na drugim komputerze wskaż ten sam pakiet. Przy transferze sieciowym użyj wcześniej udostępnionego folderu z uprawnieniami zapisu.",18,80,w-42,20);
            ButtonAt(package,"UTWÓRZ PAKIET + SHA-256",18,104,255,delegate{ExportPcMigrationPackage();});

            Panel destination=Card(p,"3. NOWY KOMPUTER — PRZYWRACANIE",10,422,w,148);
            pcMigDestinationBox=TextAt(destination,18,46,w-250,28,"");
            ButtonAt(destination,"WYBIERZ FOLDER DOCELOWY",w-215,42,195,delegate{
                using(FolderBrowserDialog d=new FolderBrowserDialog()){d.Description="Wybierz miejsce przywrócenia danych na nowym komputerze.";if(d.ShowDialog()==DialogResult.OK)pcMigDestinationBox.Text=d.SelectedPath;}
            });
            ButtonAt(destination,"ZWERYFIKUJ PAKIET",18,84,220,delegate{VerifyPcMigrationPackage();});
            ButtonAt(destination,"PRZYWRÓĆ DANE",250,84,220,delegate{ImportPcMigrationPackage();});
            LabelAt(destination,"Przywracanie zachowuje strukturę folderów. Istniejące pliki mogą zostać nadpisane dopiero po wyraźnym potwierdzeniu.",485,87,w-510,34);

            Panel status=Card(p,"DZIENNIK MIGRACJI / OGRANICZENIA",10,582,w,220);
            pcMigStatusBox=TextAt(status,18,43,w-42,155,"Gotowy. Wybierz folder źródłowy i miejsce pakietu.\r\n\r\nWażne: pakiet kopiuje pliki i strukturę folderów. Nie przenosi automatycznie zainstalowanych programów, aktywacji Windows ani licencji powiązanych ze sprzętem/kontem. Część aplikacji wymaga ponownej instalacji lub aktywacji.");
            pcMigStatusBox.Multiline=true;pcMigStatusBox.ReadOnly=true;pcMigStatusBox.ScrollBars=ScrollBars.Vertical;
        }

        private string PcMigrationHash(string path)
        {
            using(SHA256 sha=SHA256.Create())
            using(FileStream fs=new FileStream(path,FileMode.Open,FileAccess.Read,FileShare.Read))
                return BitConverter.ToString(sha.ComputeHash(fs)).Replace("-","").ToLowerInvariant();
        }

        private bool PcMigrationIsWithin(string child,string parent)
        {
            string p=Path.GetFullPath(parent).TrimEnd(Path.DirectorySeparatorChar,Path.AltDirectorySeparatorChar)+Path.DirectorySeparatorChar;
            string c=Path.GetFullPath(child).TrimEnd(Path.DirectorySeparatorChar,Path.AltDirectorySeparatorChar)+Path.DirectorySeparatorChar;
            return c.StartsWith(p,StringComparison.OrdinalIgnoreCase);
        }

        private void PcMigrationWriteStatus(string text)
        {
            if(pcMigStatusBox!=null)pcMigStatusBox.Text=text;
            AppendLog("Migracja komputera: "+text.Replace("\r\n"," | "));
        }

        private List<string> PcMigrationEnumerateFiles(string rootPath)
        {
            List<string> files=new List<string>();
            Stack<string> pending=new Stack<string>();pending.Push(rootPath);
            while(pending.Count>0)
            {
                string dir=pending.Pop();
                foreach(string entry in Directory.GetFileSystemEntries(dir))
                {
                    FileAttributes a=File.GetAttributes(entry);
                    if((a&FileAttributes.ReparsePoint)!=0)continue;
                    if((a&FileAttributes.Directory)!=0)pending.Push(entry);
                    else files.Add(entry);
                }
            }
            files.Sort(StringComparer.OrdinalIgnoreCase);return files;
        }

        private string PcMigrationSafeRelative(string relative)
        {
            if(String.IsNullOrWhiteSpace(relative)||Path.IsPathRooted(relative))throw new InvalidDataException("Ścieżka w manifeście jest pusta lub bezwzględna.");
            string normalized=relative.Replace('/','\\');
            foreach(string part in normalized.Split('\\'))if(part==".."||part=="."||part.Length==0)throw new InvalidDataException("Niedozwolona ścieżka w manifeście: "+relative);
            return normalized;
        }

        private void ExportPcMigrationPackage()
        {
            string source=pcMigSourceBox==null?"":pcMigSourceBox.Text.Trim();
            string target=pcMigPackageBox==null?"":pcMigPackageBox.Text.Trim();
            if(!Directory.Exists(source)||!Directory.Exists(target)){MessageBox.Show("Wskaż istniejący folder źródłowy i miejsce pakietu.");return;}
            source=Path.GetFullPath(source);target=Path.GetFullPath(target);
            if(PcMigrationIsWithin(target,source)){MessageBox.Show("Miejsce pakietu nie może znajdować się wewnątrz folderu źródłowego.");return;}
            string package=Path.Combine(target,"MIGRACJA_PC_"+DateTime.Now.ToString("yyyyMMdd_HHmmss"));
            string payload=Path.Combine(package,"Payload");
            try
            {
                Directory.CreateDirectory(payload);
                List<string> files=PcMigrationEnumerateFiles(source);
                StringBuilder manifest=new StringBuilder();manifest.AppendLine("NEXUS_MIGRATION_MANIFEST_V1");
                int copied=0;long total=0;
                foreach(string file in files)
                {
                    string rel=file.Substring(source.TrimEnd(Path.DirectorySeparatorChar,Path.AltDirectorySeparatorChar).Length).TrimStart(Path.DirectorySeparatorChar,Path.AltDirectorySeparatorChar);
                    rel=PcMigrationSafeRelative(rel);
                    string dest=Path.Combine(payload,rel.Replace('\\',Path.DirectorySeparatorChar));
                    string parent=Path.GetDirectoryName(dest);if(!Directory.Exists(parent))Directory.CreateDirectory(parent);
                    File.Copy(file,dest,false);
                    FileInfo fi=new FileInfo(dest);string hash=PcMigrationHash(dest);
                    manifest.Append(rel.Replace("\t","_")).Append('\t').Append(fi.Length.ToString(CultureInfo.InvariantCulture)).Append('\t').Append(hash).AppendLine();
                    copied++;total+=fi.Length;
                }
                File.WriteAllText(Path.Combine(package,"migration.manifest"),manifest.ToString(),new UTF8Encoding(false));
                File.WriteAllText(Path.Combine(package,"SOURCE_INFO.txt"),
                    "KOMPUTEROWE CENTRUM SERWISU — CENTRUM MIGRACJI I NAPRAW — PAKIET MIGRACYJNY\r\nUtworzono: "+DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")+
                    "\r\nFolder źródłowy: "+source+"\r\nPliki: "+copied+"\r\nRozmiar: "+total+
                    "\r\nIntegralność: SHA-256 każdego pliku\r\nInformacja o licencjach: kopiowane są pliki i konfiguracja; przenoszenie aktywacji zależy od warunków dostawcy oprogramowania.\r\n",Encoding.UTF8);
                pcMigPackageBox.Text=package;
                PcMigrationWriteStatus("PAKIET UTWORZONY\r\nFolder: "+package+"\r\nPliki: "+copied+"\r\nRozmiar: "+total.ToString("N0",CultureInfo.InvariantCulture)+" B\r\nSHA-256: zapisano manifest dla każdego pliku.\r\nPrzenieś cały folder pakietu na nowy komputer.");
                MessageBox.Show("Pakiet migracyjny utworzony.\r\nPliki: "+copied+"\r\nLokalizacja: "+package,"Migracja danych komputera");
            }
            catch(Exception ex){PcMigrationWriteStatus("BŁĄD EKSPORTU\r\n"+ex.GetBaseException().Message);MessageBox.Show(ex.GetBaseException().Message,"Eksport migracji");}
        }

        private bool PcMigrationReadManifest(string package,out List<string[]> entries,out string error)
        {
            entries=new List<string[]>();error="";
            try
            {
                string path=Path.Combine(package,"migration.manifest");
                if(!File.Exists(path))throw new FileNotFoundException("Nie znaleziono migration.manifest.",path);
                string[] lines=File.ReadAllLines(path,Encoding.UTF8);
                if(lines.Length==0||lines[0].Trim()!="NEXUS_MIGRATION_MANIFEST_V1")throw new InvalidDataException("Nieobsługiwana wersja manifestu.");
                HashSet<string> seen=new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                for(int i=1;i<lines.Length;i++)
                {
                    if(String.IsNullOrWhiteSpace(lines[i]))continue;
                    string[] c=lines[i].Split('\t');if(c.Length!=3)throw new InvalidDataException("Błędny wpis manifestu w wierszu "+(i+1)+".");
                    string rel=PcMigrationSafeRelative(c[0]);
                    if(!seen.Add(rel))throw new InvalidDataException("Powtórzona ścieżka w manifeście: "+rel);
                    long len;if(!Int64.TryParse(c[1],NumberStyles.Integer,CultureInfo.InvariantCulture,out len)||len<0)throw new InvalidDataException("Błędny rozmiar pliku: "+rel);
                    if(!Regex.IsMatch(c[2],"^[0-9a-fA-F]{64}$"))throw new InvalidDataException("Błędny SHA-256: "+rel);
                    entries.Add(new string[]{rel,len.ToString(CultureInfo.InvariantCulture),c[2].ToLowerInvariant()});
                }
                return true;
            }
            catch(Exception ex){error=ex.GetBaseException().Message;return false;}
        }

        private bool PcMigrationVerifyPackage(string package,out List<string[]> entries,out string report)
        {
            report="";if(!PcMigrationReadManifest(package,out entries,out report))return false;
            StringBuilder b=new StringBuilder();int ok=0;long total=0;
            foreach(string[] e in entries)
            {
                string file=Path.Combine(package,"Payload",e[0].Replace('\\',Path.DirectorySeparatorChar));
                if(!File.Exists(file)){report="BRAK PLIKU: "+e[0];return false;}
                FileInfo fi=new FileInfo(file);long expected=Int64.Parse(e[1],CultureInfo.InvariantCulture);
                if(fi.Length!=expected){report="NIEZGODNY ROZMIAR: "+e[0];return false;}
                string hash=PcMigrationHash(file);if(!String.Equals(hash,e[2],StringComparison.OrdinalIgnoreCase)){report="NIEZGODNY SHA-256: "+e[0];return false;}
                ok++;total+=fi.Length;
            }
            report="WERYFIKACJA OK\r\nPliki: "+ok+"\r\nRozmiar: "+total.ToString("N0",CultureInfo.InvariantCulture)+" B\r\nWszystkie pliki mają zgodny rozmiar i SHA-256.";
            return true;
        }

        private void VerifyPcMigrationPackage()
        {
            string package=pcMigPackageBox==null?"":pcMigPackageBox.Text.Trim();List<string[]> entries=null;string report="Nie wskazano istniejącego folderu pakietu migracyjnego.";
            if(!Directory.Exists(package)||!PcMigrationVerifyPackage(package,out entries,out report)){PcMigrationWriteStatus("WERYFIKACJA NIEUDANA\r\n"+report);MessageBox.Show(report,"Weryfikacja pakietu",MessageBoxButtons.OK,MessageBoxIcon.Warning);return;}
            PcMigrationWriteStatus(report);MessageBox.Show(report,"Weryfikacja pakietu",MessageBoxButtons.OK,MessageBoxIcon.Information);
        }

        private void ImportPcMigrationPackage()
        {
            string package=pcMigPackageBox==null?"":pcMigPackageBox.Text.Trim();
            string destination=pcMigDestinationBox==null?"":pcMigDestinationBox.Text.Trim();
            if(!Directory.Exists(package)||!Directory.Exists(destination)){MessageBox.Show("Wskaż folder pakietu i istniejący folder docelowy.");return;}
            List<string[]> entries;string report;
            if(!PcMigrationVerifyPackage(package,out entries,out report)){PcMigrationWriteStatus("PRZYWRACANIE ZABLOKOWANE — "+report);MessageBox.Show(report,"Pakiet nie przeszedł kontroli",MessageBoxButtons.OK,MessageBoxIcon.Error);return;}
            if(MessageBox.Show("Pakiet przeszedł kontrolę SHA-256.\r\nLiczba plików: "+entries.Count+
                "\r\n\r\nPliki o identycznych ścieżkach w miejscu docelowym zostaną nadpisane. Kontynuować?","Potwierdź przywracanie",MessageBoxButtons.YesNo,MessageBoxIcon.Warning)!=DialogResult.Yes)return;
            try
            {
                string payload=Path.GetFullPath(Path.Combine(package,"Payload"));
                string destRoot=Path.GetFullPath(destination).TrimEnd(Path.DirectorySeparatorChar,Path.AltDirectorySeparatorChar)+Path.DirectorySeparatorChar;
                int restored=0;
                foreach(string[] e in entries)
                {
                    string rel=PcMigrationSafeRelative(e[0]);
                    string src=Path.GetFullPath(Path.Combine(payload,rel.Replace('\\',Path.DirectorySeparatorChar)));
                    if(!PcMigrationIsWithin(src,payload))throw new InvalidDataException("Ścieżka wykracza poza pakiet: "+rel);
                    string dst=Path.GetFullPath(Path.Combine(destination,rel.Replace('\\',Path.DirectorySeparatorChar)));
                    if(!dst.StartsWith(destRoot,StringComparison.OrdinalIgnoreCase))throw new InvalidDataException("Ścieżka wykracza poza miejsce docelowe: "+rel);
                    string dir=Path.GetDirectoryName(dst);if(!Directory.Exists(dir))Directory.CreateDirectory(dir);
                    File.Copy(src,dst,true);restored++;
                }
                PcMigrationWriteStatus("PRZYWRACANIE ZAKOŃCZONE\r\n"+report+"\r\nPrzywrócono: "+restored+"\r\nCel: "+destination);
                MessageBox.Show("Przywrócono "+restored+" plików.","Migracja danych komputera",MessageBoxButtons.OK,MessageBoxIcon.Information);
            }
            catch(Exception ex){PcMigrationWriteStatus("BŁĄD PRZYWRACANIA\r\n"+ex.GetBaseException().Message);MessageBox.Show(ex.GetBaseException().Message,"Przywracanie migracji");}
        }

    }
}
