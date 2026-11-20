#define AppName "NAPRAWA PC FAN CONTROL PRO AI"
#define AppVersion "2.0.5"
#define AppExe "NaprawaPCFanControl.exe"
[Setup]
AppId={{6C59DBAA-5C43-4B17-A75D-CF52E091201A}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher=Naprawa Komputerów i Laptopów
DefaultDirName={autopf}\Naprawa PC Fan Control PRO AI
DefaultGroupName={#AppName}
OutputDir=..\artifacts\installer
OutputBaseFilename=NaprawaPC_FanControl_PRO_AI_2.0.5_FIX007_Setup
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=admin
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
[Files]
Source: "..\artifacts\NaprawaPCFanControl\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExe}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExe}"; Tasks: desktopicon
[Tasks]
Name: "desktopicon"; Description: "Utwórz skrót na pulpicie"; GroupDescription: "Dodatkowe opcje:"
[Run]
Filename: "{app}\{#AppExe}"; Description: "Uruchom program"; Flags: postinstall nowait skipifsilent runascurrentuser