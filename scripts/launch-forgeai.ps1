# ForgeAI launcher — starts the dev server if it isn't running, then opens
# the app in a chromeless Edge app window (falls back to default browser).
$ErrorActionPreference = "SilentlyContinue"
$root = "C:\ForgeAI"
$url = "http://localhost:3000"

function Test-ForgePort {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $async = $client.BeginConnect("127.0.0.1", 3000, $null, $null)
        $ok = $async.AsyncWaitHandle.WaitOne(500)
        if ($ok -and $client.Connected) {
            $client.EndConnect($async)
            $client.Close()
            return $true
        }
        $client.Close()
        return $false
    } catch {
        return $false
    }
}

if (-not (Test-ForgePort)) {
    Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c title ForgeAI dev server && npm run dev" `
        -WorkingDirectory $root -WindowStyle Minimized

    $deadline = (Get-Date).AddSeconds(90)
    while (-not (Test-ForgePort) -and (Get-Date) -lt $deadline) {
        Start-Sleep -Milliseconds 700
    }
}

$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) {
    $edge = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
}

if (Test-Path $edge) {
    # --app gives a clean, chromeless window so ForgeAI feels like a native app
    Start-Process -FilePath $edge -ArgumentList "--app=$url", "--window-size=1500,940"
} else {
    Start-Process $url
}
