#define MyAppName "KOMPUTEROWE CENTRUM SERWISU"
#define MyAppVersion "1.0.0.74"
#define MyAppPublisher "Serwis komputerowy"
#define MyAppExeName "KomputeroweCentrumSerwisu.exe"

[Setup]
AppId={{F6A4B4D8-7D02-4BA9-9C3D-2C99B1D5C014}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={pf}\Komputerowe Centrum Serwisu
DefaultGroupName=KOMPUTEROWE CENTRUM SERWISU
DisableProgramGroupPage=yes
UsePreviousAppDir=yes
PrivilegesRequired=admin
UninstallDisplayName={#MyAppName}
UninstallDisplayIcon={app}\{#MyAppExeName}
SetupIconFile=NaprawaPC.ico
WizardImageFile=InstallerWizard.bmp
WizardSmallImageFile=InstallerSmall.bmp
OutputDir=dist\installers
Compression=lzma
SolidCompression=yes
WizardStyle=classic
CloseApplications=yes
RestartApplications=no
Uninstallable=yes
CreateUninstallRegKey=yes
VersionInfoVersion=1.0.0.74
VersionInfoProductVersion=1.0.0.74
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppName} Installer
VersionInfoProductName={#MyAppName}
SetupLogging=yes
MinVersion=5.1.2600sp3
OutputBaseFilename=KomputeroweCentrumSerwisu_FIX139_INSTALATOR_XP

[Languages]
Name: "polish"; MessagesFile: "compiler:Languages\Polish.isl"

[Types]
Name: "full"; Description: "Pełna instalacja"; Flags: iscustom
Name: "compact"; Description: "Instalacja kompaktowa"

[Components]
Name: "core"; Description: "KOMPUTEROWE CENTRUM SERWISU"; Types: full compact; Flags: fixed
Name: "docs"; Description: "Dokumentacja i CHANGELOG"; Types: full

[Tasks]
Name: "desktopicon"; Description: "Utwórz skrót na pulpicie"; GroupDescription: "Dodatkowe skróty:"; Flags: unchecked

[InstallDelete]
Type: files; Name: "{commonprograms}\NAPRAWA PC - Windows Version Switcher PRO.lnk"
Type: files; Name: "{commondesktop}\NAPRAWA PC - Windows Version Switcher PRO.lnk"
Type: files; Name: "{commonprograms}\NaprawaPC Windows Version Switcher PRO.lnk"
Type: files; Name: "{commondesktop}\NaprawaPC Windows Version Switcher PRO.lnk"
Type: files; Name: "{commonprograms}\Naprawa PC\NAPRAWA PC - CENTRUM MIGRACJI I NAPRAW.lnk"
Type: files; Name: "{commondesktop}\NAPRAWA PC - CENTRUM MIGRACJI I NAPRAW.lnk"
Type: files; Name: "{commonprograms}\NAPRAWA PC - CENTRUM MIGRACJI I NAPRAW FIX031.lnk"
Type: files; Name: "{commondesktop}\NAPRAWA PC - CENTRUM MIGRACJI I NAPRAW FIX031.lnk"
Type: files; Name: "{commonprograms}\Naprawa PC\Windows Version Switcher PRO.lnk"
Type: files; Name: "{commondesktop}\Windows Version Switcher PRO.lnk"
Type: files; Name: "{commonprograms}\KOMPUTEROWE CENTRUM SERWISU.lnk"
Type: files; Name: "{commondesktop}\KOMPUTEROWE CENTRUM SERWISU.lnk"

[Files]
Source: "dist\setup-files\KomputeroweCentrumSerwisu.exe"; DestDir: "{app}"; Flags: ignoreversion; Components: core
Source: "NaprawaPC.ico"; DestDir: "{app}"; Flags: ignoreversion; Components: core
Source: "CentrumMigracjiHero.png"; DestDir: "{app}"; Flags: ignoreversion; Components: core
Source: "dist\setup-files\README.txt"; DestDir: "{app}\docs"; Flags: ignoreversion; Components: docs
Source: "dist\setup-files\INSTRUKCJA.txt"; DestDir: "{app}\docs"; Flags: ignoreversion; Components: docs
Source: "dist\setup-files\CHANGELOG.txt"; DestDir: "{app}\docs"; Flags: ignoreversion; Components: docs
Source: "dist\setup-files\VERSION.txt"; DestDir: "{app}\docs"; Flags: ignoreversion; Components: docs

[Icons]
Name: "{group}\KOMPUTEROWE CENTRUM SERWISU"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\NaprawaPC.ico"; IconIndex: 0
Name: "{commondesktop}\KOMPUTEROWE CENTRUM SERWISU"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon; WorkingDir: "{app}"; IconFilename: "{app}\NaprawaPC.ico"; IconIndex: 0

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Uruchom KOMPUTEROWE CENTRUM SERWISU FIX139"; Flags: postinstall nowait skipifsilent runascurrentuser

[Code]
function IsDotNetFullAt(RootKey: Integer; SubKey: string): Boolean;
var
  InstallValue: Cardinal;
  ReleaseValue: Cardinal;
  VersionValue: string;
begin
  Result := False;
  InstallValue := 0;
  ReleaseValue := 0;
  VersionValue := '';
  if RegQueryDWordValue(RootKey, SubKey, 'Install', InstallValue) and (InstallValue = 1) then
    Result := True;
  if not Result then
    if RegQueryDWordValue(RootKey, SubKey, 'Release', ReleaseValue) and (ReleaseValue > 0) then
      Result := True;
  if not Result then
    if RegQueryStringValue(RootKey, SubKey, 'Version', VersionValue) and (Pos('4.', VersionValue) = 1) then
      Result := True;
end;

function IsDotNet4FullInstalled(): Boolean;
begin
  Result := IsDotNetFullAt(HKLM, 'SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full');
  if not Result then
    Result := IsDotNetFullAt(HKLM, 'SOFTWARE\WOW6432Node\Microsoft\NET Framework Setup\NDP\v4\Full');
end;

function InitializeSetup(): Boolean;
var
  ErrorCode: Integer;
begin
  Result := IsDotNet4FullInstalled();
  if Result then
    Log('KCS_PREREQUISITE_OK: .NET Framework 4 Full detected using Install, Release or Version registry data.')
  else
  begin
    Log('KCS_PREREQUISITE_MISSING: .NET Framework 4 Full was not detected in either registry path. Setup initialization is cancelled.');
    MsgBox('Nie wykryto pełnego .NET Framework 4 lub nowszego. Instalator nie może kontynuować, dopóki wymagana platforma nie będzie dostępna.'#13#10#13#10'Oficjalna strona: https://dotnet.microsoft.com/download/dotnet-framework', mbError, MB_OK);
    if MsgBox('Otworzyć oficjalną stronę .NET Framework?', mbConfirmation, MB_YESNO) = IDYES then
      ShellExec('open', 'https://dotnet.microsoft.com/download/dotnet-framework', '', '', SW_SHOWNORMAL, ewNoWait, ErrorCode);
  end;
end;

var
  BrandPage: TWizardPage;
  BrandTitle: TNewStaticText;
  BrandSubtitle: TNewStaticText;
  BrandMemo: TNewMemo;
  RiskPage: TWizardPage;
  RiskMemo: TNewMemo;
  RiskCheck: TNewCheckBox;

procedure InitializeWizard();
begin
  WizardForm.Color := $061326;
  WizardForm.Font.Name := 'Segoe UI';
  WizardForm.Font.Color := $EAF7FF;
  WizardForm.WelcomeLabel1.Caption := 'KOMPUTEROWE CENTRUM SERWISU';
  WizardForm.WelcomeLabel1.Font.Size := 16;
  WizardForm.WelcomeLabel1.Font.Color := $EAF7FF;
  WizardForm.WelcomeLabel2.Caption := 'Migracja danych i systemu Windows, kopie zapasowe, diagnostyka oraz naprawa komputera.';
  WizardForm.WelcomeLabel2.Font.Color := $B8DDEF;
  WizardForm.FinishedLabel.Font.Color := $EAF7FF;
  WizardForm.FinishedLabel.Caption := 'Instalacja zakończona. KOMPUTEROWE CENTRUM SERWISU jest gotowe.';
  WizardForm.FinishedHeadingLabel.Caption := 'Gotowe — FIX139 zainstalowany';
  WizardForm.FinishedHeadingLabel.Font.Color := $46DFFF;
  WizardForm.RunList.Color := $07182C;
  WizardForm.RunList.Font.Color := $EAF7FF;
  WizardForm.NextButton.Font.Name := 'Segoe UI';
  WizardForm.BackButton.Font.Name := 'Segoe UI';
  WizardForm.CancelButton.Font.Name := 'Segoe UI';
  WizardForm.MainPanel.Color := $061326;
  WizardForm.WelcomePage.Color := $061326;
  WizardForm.InnerPage.Color := $061326;
  WizardForm.FinishedPage.Color := $061326;
  WizardForm.LicensePage.Color := $061326;
  WizardForm.ReadyPage.Color := $061326;
  WizardForm.InstallingPage.Color := $061326;
  WizardForm.PageNameLabel.Font.Color := $46DFFF;
  WizardForm.PageDescriptionLabel.Font.Color := $B8DDEF;
  WizardForm.BeveledLabel.Font.Color := $92BBD6;
  WizardForm.StatusLabel.Font.Color := $EAF7FF;
  WizardForm.FilenameLabel.Font.Color := $EAF7FF;
  WizardForm.FinishedHeadingLabel.Font.Color := $46DFFF;
  WizardForm.ReadyLabel.Font.Color := $EAF7FF;
  WizardForm.ReadyMemo.Color := $07182C;
  WizardForm.ReadyMemo.Font.Color := $EAF7FF;
  WizardForm.LicenseMemo.Color := $07182C;
  WizardForm.LicenseMemo.Font.Color := $EAF7FF;
  WizardForm.InfoBeforeMemo.Color := $07182C;
  WizardForm.InfoBeforeMemo.Font.Color := $EAF7FF;
  WizardForm.TasksList.Color := $07182C;
  WizardForm.TasksList.Font.Color := $EAF7FF;
  WizardForm.ComponentsList.Color := $07182C;
  WizardForm.ComponentsList.Font.Color := $EAF7FF;
  WizardForm.TypesCombo.Color := $07182C;
  WizardForm.TypesCombo.Font.Color := $EAF7FF;
  BrandPage := CreateCustomPage(wpWelcome,
    'KOMPUTEROWE CENTRUM SERWISU',
    'Nowy wygląd, centrum migracji Windows i narzędzia serwisowe.');
  BrandPage.Surface.Color := $061326;

  BrandTitle := TNewStaticText.Create(WizardForm);
  BrandTitle.Parent := BrandPage.Surface;
  BrandTitle.Left := 0;
  BrandTitle.Top := 0;
  BrandTitle.Width := BrandPage.SurfaceWidth;
  BrandTitle.Height := ScaleY(42);
  BrandTitle.Caption := 'KOMPUTEROWE CENTRUM SERWISU';
  BrandTitle.Font.Name := 'Segoe UI';
  BrandTitle.Font.Size := 17;
  BrandTitle.Font.Style := [fsBold];
  BrandTitle.Font.Color := $46DFFF;

  BrandSubtitle := TNewStaticText.Create(WizardForm);
  BrandSubtitle.Parent := BrandPage.Surface;
  BrandSubtitle.Left := 0;
  BrandSubtitle.Top := ScaleY(48);
  BrandSubtitle.Width := BrandPage.SurfaceWidth;
  BrandSubtitle.Height := ScaleY(34);
  BrandSubtitle.Caption := 'Kompletny pakiet do planowania migracji, instalacji i naprawy Windows.';
  BrandSubtitle.Font.Name := 'Segoe UI';
  BrandSubtitle.Font.Size := 10;
  BrandSubtitle.Font.Color := $D9F4FF;

  BrandMemo := TNewMemo.Create(WizardForm);
  BrandMemo.Parent := BrandPage.Surface;
  BrandMemo.Left := 0;
  BrandMemo.Top := ScaleY(92);
  BrandMemo.Width := BrandPage.SurfaceWidth;
  BrandMemo.Height := ScaleY(210);
  BrandMemo.ReadOnly := True;
  BrandMemo.Color := $07182C;
  BrandMemo.Font.Name := 'Segoe UI';
  BrandMemo.Font.Size := 10;
  BrandMemo.Font.Color := $EAF7FF;
  BrandMemo.ScrollBars := ssVertical;
  BrandMemo.Text :=
    'CO ZAWIERA CENTRUM MIGRACJI I NAPRAW?'#13#10#13#10 +
    '• Centrum migracji Windows — wybór systemu docelowego, edycji, kanału, języka i trybu.'#13#10 +
    '• Windows Installation Manager — oficjalne ISO, kontrola obrazu i kreator nośnika USB.'#13#10 +
    '• Backup & Recovery — kopie danych, SHA-256, obrazy systemu i procedury przywracania.'#13#10 +
    '• Hardware Intelligence — diagnostyka CPU, GPU, RAM, dysków, UEFI i Secure Boot.'#13#10 +
    '• Narzędzia serwisowe — sterowniki, naprawa Windows, raporty, zadania i kontrola jakości.'#13#10 +
    '• Radio Online — polskie rozgłośnie domyślnie; przełącznik otwiera katalog światowy.'#13#10#13#10 +
    'Wygląd CENTRUM MIGRACJI I NAPRAW jest stosowany w całej aplikacji, a nie tylko na pulpicie.';

  RiskPage := CreateCustomPage(BrandPage.ID,
    'Ważne ostrzeżenie — używasz na własną odpowiedzialność',
    'Przeczytaj ostrzeżenie i zaznacz potwierdzenie, aby kontynuować instalację.');

  RiskMemo := TNewMemo.Create(WizardForm);
  RiskMemo.Parent := RiskPage.Surface;
  RiskMemo.Left := 0;
  RiskMemo.Top := 0;
  RiskMemo.Width := RiskPage.SurfaceWidth;
  RiskMemo.Height := ScaleY(185);
  RiskMemo.ReadOnly := True;
  RiskMemo.Color := $07182C;
  RiskMemo.Font.Name := 'Segoe UI';
  RiskMemo.Font.Color := $EAF7FF;
  RiskMemo.ScrollBars := ssVertical;
  RiskMemo.Text :=
    'KOMPUTEROWE CENTRUM SERWISU wykonuje operacje administracyjne dotyczące Windows, rejestru, sterowników, rozruchu, kopii zapasowych i instalacji systemu.'#13#10#13#10 +
    'Błędny wybór ISO, edycji, dysku, partycji, sterownika lub ustawień może spowodować utratę danych, uszkodzenie systemu albo brak możliwości uruchomienia komputera.'#13#10#13#10 +
    'Obejścia wymagań Windows 11 są eksperymentalne i nie gwarantują zgodności sprzętu, działania ani aktualizacji. Nie są wspierane przez Microsoft.'#13#10#13#10 +
    'Wykonaj i sprawdź pełną kopię obrazu systemu na osobnym fizycznym nośniku. Przed każdą operacją sprawdzaj wybrany system, ISO, dysk i partycję. W razie wątpliwości anuluj.'#13#10#13#10 +
    'Program nie jest produktem Microsoft. Korzystasz z niego na własną odpowiedzialność. W zakresie dopuszczalnym prawem autor nie odpowiada za utratę danych, uszkodzenie systemu, sprzętu ani skutki niewłaściwego użycia.';

  RiskCheck := TNewCheckBox.Create(WizardForm);
  RiskCheck.Parent := RiskPage.Surface;
  RiskCheck.Left := 0;
  RiskCheck.Top := RiskMemo.Top + RiskMemo.Height + ScaleY(18);
  RiskCheck.Width := RiskPage.SurfaceWidth;
  RiskCheck.Caption := 'Zapoznałem(-am) się z ostrzeżeniem i akceptuję używanie programu na własną odpowiedzialność.';
  RiskCheck.Checked := False;
  RiskCheck.Font.Name := 'Segoe UI';
  RiskCheck.Font.Color := $EAF7FF;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  if CurPageID = RiskPage.ID then
  begin
    if not RiskCheck.Checked then
    begin
      MsgBox('Aby kontynuować instalację, przeczytaj ostrzeżenie i zaznacz pole akceptacji ryzyka.',
        mbError, MB_OK);
      Result := False;
    end;
  end;
end;
