#define MyAppName "NAPRAWA PC FAN CONTROL PRO AI"
#define MyAppVersion "1.0.0"
#define MyAppExeName "NAPRAWA_PC_FAN_CONTROL_PRO_AI.exe"

[Setup]
AppId={{BA04D83C-70E2-47CC-8B8D-B4C3D5C10001}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
DefaultDirName={autopf}\NAPRAWA PC FAN CONTROL PRO AI
DefaultGroupName={#MyAppName}
OutputDir=installer
OutputBaseFilename=NAPRAWA_PC_FAN_CONTROL_PRO_AI_SETUP_FIX001
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=admin
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
UninstallDisplayIcon={app}\{#MyAppExeName}

[Files]
Source: "publish\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Uruchom program"; Flags: postinstall nowait
