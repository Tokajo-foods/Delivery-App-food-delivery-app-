# Reliable local APK / Play AAB build for Windows (Expo SDK 54).
# eas build --local cannot run on Windows. This script uses the local Android SDK.
# Why C:\p? Long Desktop paths break CMake (260-char limit).
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\scripts\build-from-short-path.ps1 -Variant restaurant -Configuration bundle
#   powershell -ExecutionPolicy Bypass -File .\scripts\build-from-short-path.ps1 -Variant restaurant
param(
  [ValidateSet('restaurant', 'delivery')]
  [string]$Variant = 'restaurant',
  [ValidateSet('debug', 'release', 'bundle')]
  [string]$Configuration = 'debug'
)

$ErrorActionPreference = "Stop"
$src = Split-Path -Parent $PSScriptRoot

function New-UploadKeyMaterial([string]$Variant, [string]$JavaHome) {
  $dir = 'C:\tokajo-keys'
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  $jks = Join-Path $dir "$Variant-upload.jks"
  $propsPath = Join-Path $dir "$Variant-upload.properties"
  if ((Test-Path $jks) -and (Test-Path $propsPath)) {
    $map = @{}
    Get-Content $propsPath | ForEach-Object {
      if ($_ -match '^(?<k>[^=]+)=(?<v>.*)$') { $map[$Matches.k] = $Matches.v }
    }
    return @{ File = $jks; Alias = $map.alias; Password = $map.password }
  }
  if ((Test-Path $jks) -or (Test-Path $propsPath)) {
    throw "Upload key in $dir is incomplete. Keep both $Variant-upload.jks and $Variant-upload.properties."
  }
  $chars = (48..57 + 65..90 + 97..122 | ForEach-Object { [char]$_ })
  $pass = -join (1..32 | ForEach-Object { $chars | Get-Random })
  & "$JavaHome\bin\keytool.exe" -genkeypair -v -storetype PKCS12 -keystore $jks -alias upload -keyalg RSA -keysize 2048 -validity 10000 -storepass $pass -keypass $pass -dname "CN=TOKAJO FOODS, O=TOKAJO FOODS, C=IN"
  if ($LASTEXITCODE -ne 0) { throw "keytool failed to create the upload keystore" }
  @("alias=upload", "password=$pass") | Set-Content $propsPath -Encoding ascii
  return @{ File = $jks; Alias = 'upload'; Password = $pass }
}

function Set-ReleaseSigning($GradlePath, $Key) {
  $store = ($Key.File -replace '\\', '/')
  $text = [System.IO.File]::ReadAllText($GradlePath)
  $releaseCfg = @"
        release {
            storeFile file('$store')
            storePassword '$($Key.Password)'
            keyAlias '$($Key.Alias)'
            keyPassword '$($Key.Password)'
        }
"@
  $signed = $text -replace "keyPassword 'android'\r?\n        \}\r?\n    \}", ("keyPassword 'android'`r`n        }`r`n" + $releaseCfg + "`r`n    }")
  $signed = $signed -replace "signingConfig signingConfigs\.debug\r?\n            def enableShrinkResources", "signingConfig signingConfigs.release`r`n            def enableShrinkResources"
  if ($signed -notmatch 'signingConfigs\.release' -or $signed -notmatch 'storeFile file\(') {
    throw "Could not attach the upload keystore to app/build.gradle"
  }
  $utf8 = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($GradlePath, $signed, $utf8)
}

Write-Host "Syncing project to C:\p (avoids Windows path limit)..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path C:\p | Out-Null
robocopy $src C:\p /E /XD .git .expo "android\app\build" "android\app\.cxx" "android\build" "node_modules\.cache" "android\.gradle" | Out-Null

Set-Location C:\p

$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
# Prefer Android Studio JBR (JDK 21); fall back to common JDK installs.
$adoptium = Get-ChildItem "C:\Program Files\Eclipse Adoptium" -Directory -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -like "jdk-17*" } |
  Select-Object -First 1
if (Test-Path "C:\Program Files\Android\Android Studio\jbr") {
  $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
} elseif (Test-Path "C:\Program Files\Java\jdk-17") {
  $env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
} elseif ($adoptium) {
  $env:JAVA_HOME = $adoptium.FullName
} else {
  throw "No suitable JDK found (need Android Studio JBR or JDK 17+)."
}
$env:GRADLE_USER_HOME = "C:\g"
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
$env:CI = "1"
New-Item -ItemType Directory -Force -Path $env:GRADLE_USER_HOME | Out-Null

# Stop leftover Gradle daemons that lock the cache
Get-Process java -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Android Studio*" -or $_.Path -like "*jbr*" } | Out-Null

if (Test-Path C:\p\.env) {
  Get-Content C:\p\.env | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) { return }
    $i = $line.IndexOf("=")
    $k = $line.Substring(0, $i).Trim()
    $v = $line.Substring($i + 1).Trim().Trim('"').Trim("'")
    if ($k) { Set-Item -Path "Env:$k" -Value $v }
  }
}

# Variant must win over anything loaded from .env. It selects the app name,
# Android package, and which role the bundled screens allow.
$env:EXPO_PUBLIC_APP_VARIANT = $Variant
if ($Configuration -eq 'bundle') {
  $profile = if ($Variant -eq 'delivery') { 'production' } else { 'production-restaurant' }
  $eas = Get-Content (Join-Path $src 'eas.json') -Raw | ConvertFrom-Json
  $profileEnv = $eas.build.$profile.env
  if (-not $profileEnv) { throw "eas.json profile '$profile' has no env" }
  foreach ($prop in $profileEnv.PSObject.Properties) {
    Set-Item -Path "Env:$($prop.Name)" -Value ([string]$prop.Value)
  }
  Write-Host "Play bundle uses eas.json profile $profile (https API, not the LAN .env)." -ForegroundColor Cyan
}
Write-Host "API=$env:EXPO_PUBLIC_API_URL maps=$(if ($env:EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) {'set'} else {'MISSING'}) variant=$env:EXPO_PUBLIC_APP_VARIANT" -ForegroundColor Cyan

# Package name is baked at prebuild. Always regenerate so restaurant and delivery do not share one native project.
npx expo prebuild --platform android --clean
if ($LASTEXITCODE -ne 0) { throw "expo prebuild failed $LASTEXITCODE" }

$gp = "C:\p\android\gradle.properties"
$props = Get-Content $gp -Raw
$props = $props -replace "reactNativeArchitectures=.*", "reactNativeArchitectures=arm64-v8a"
$props = $props -replace "newArchEnabled=false", "newArchEnabled=true"
if ($props -notmatch "android.lint.checkReleaseBuilds") { $props += "`nandroid.lint.checkReleaseBuilds=false`n" }
$props = $props -replace "org.gradle.jvmargs=.*", "org.gradle.jvmargs=-Xmx3072m -XX:MaxMetaspaceSize=512m -Dfile.encoding=UTF-8"
Set-Content $gp $props -Encoding utf8

$sdk = ($env:ANDROID_HOME -replace '\\', '/')
Set-Content C:\p\android\local.properties "sdk.dir=$sdk" -Encoding utf8

if ($Configuration -eq 'bundle') {
  $key = New-UploadKeyMaterial -Variant $Variant -JavaHome $env:JAVA_HOME
  Set-ReleaseSigning -GradlePath "C:\p\android\app\build.gradle" -Key $key
}

Set-Location C:\p\android
$gradleTask = if ($Configuration -eq 'bundle') { 'bundleRelease' } elseif ($Configuration -eq 'release') { 'assembleRelease' } else { 'assembleDebug' }
.\gradlew.bat $gradleTask -PreactNativeArchitectures=arm64-v8a --no-daemon
if ($LASTEXITCODE -ne 0) { throw "Gradle failed $LASTEXITCODE" }

if ($Configuration -eq 'bundle') {
  $built = 'C:\p\android\app\build\outputs\bundle\release\app-release.aab'
  $label = if ($Variant -eq 'delivery') { 'TOKAJO-Delivery-release.aab' } else { 'TOKAJO-Restaurant-release.aab' }
  $readyLabel = 'AAB READY'
  $installHint = 'Upload this file in Play Console. It is not installed with adb.'
} else {
  $apkFolder = if ($Configuration -eq 'release') { 'release' } else { 'debug' }
  $apkFile = if ($Configuration -eq 'release') { 'app-release.apk' } else { 'app-debug.apk' }
  $built = "C:\p\android\app\build\outputs\apk\$apkFolder\$apkFile"
  $kind = if ($Configuration -eq 'release') { 'release' } else { 'dev' }
  $label = if ($Variant -eq 'delivery') { "TOKAJO-Delivery-$kind.apk" } else { "TOKAJO-Restaurant-$kind.apk" }
  $readyLabel = 'APK READY'
}
$dest = Join-Path $src $label
if ($Configuration -ne 'bundle') {
  $installHint = "Install: adb install -r `"$dest`""
}
Copy-Item $built $dest -Force
Copy-Item $built (Join-Path 'C:\p' $label) -Force

Write-Host ""
Write-Host "${readyLabel}:" -ForegroundColor Green
Write-Host "  $dest"
Write-Host $installHint
if ($Configuration -eq 'bundle') {
  Write-Host "Upload key backup (keep this folder): C:\tokajo-keys" -ForegroundColor Yellow
}
