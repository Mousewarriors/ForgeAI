# One-time setup: generates a ForgeAI icon and creates a desktop shortcut
# that launches the app silently via scripts\launch-forgeai.vbs.
$ErrorActionPreference = "Stop"
$scriptsDir = "C:\ForgeAI\scripts"
$icoPath = Join-Path $scriptsDir "forgeai.ico"

# --- 1. Draw the icon: violet→pink gradient rounded square with a white F ---
Add-Type -AssemblyName System.Drawing

$size = 256
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$margin = 10
$rect = New-Object System.Drawing.Rectangle $margin, $margin, ($size - 2 * $margin), ($size - 2 * $margin)
$radius = 56
$d = $radius * 2

$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
$path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
$path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
$path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
$path.CloseFigure()

$colorA = [System.Drawing.Color]::FromArgb(255, 124, 58, 237)   # violet
$colorB = [System.Drawing.Color]::FromArgb(255, 236, 72, 153)   # pink
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $colorA, $colorB, 45.0)
$g.FillPath($brush, $path)

# subtle inner highlight
$hlRect = New-Object System.Drawing.Rectangle $margin, $margin, ($size - 2 * $margin), ([int](($size - 2 * $margin) / 2))
$hlBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $hlRect,
    [System.Drawing.Color]::FromArgb(70, 255, 255, 255),
    [System.Drawing.Color]::FromArgb(0, 255, 255, 255),
    90.0
)
$hlPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$hlPath.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
$hlPath.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
$hlPath.AddLine($rect.Right, $rect.Y + $size / 2, $rect.X, $rect.Y + $size / 2)
$hlPath.CloseFigure()
$g.FillPath($hlBrush, $hlPath)

$fmt = New-Object System.Drawing.StringFormat
$fmt.Alignment = [System.Drawing.StringAlignment]::Center
$fmt.LineAlignment = [System.Drawing.StringAlignment]::Center
$font = New-Object System.Drawing.Font("Segoe UI", 124, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$textRect = New-Object System.Drawing.RectangleF 0, 4, $size, $size
$g.DrawString("F", $font, [System.Drawing.Brushes]::White, $textRect, $fmt)
$g.Dispose()

# --- 2. Wrap the PNG in an .ico container (PNG-in-ICO, Vista+) ---
$ms = New-Object System.IO.MemoryStream
$bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$png = $ms.ToArray()
$ms.Dispose()
$bmp.Dispose()

$fs = [System.IO.File]::Create($icoPath)
$bw = New-Object System.IO.BinaryWriter $fs
$bw.Write([uint16]0)            # reserved
$bw.Write([uint16]1)            # type: icon
$bw.Write([uint16]1)            # image count
$bw.Write([byte]0)              # width  (0 = 256)
$bw.Write([byte]0)              # height (0 = 256)
$bw.Write([byte]0)              # palette
$bw.Write([byte]0)              # reserved
$bw.Write([uint16]1)            # planes
$bw.Write([uint16]32)           # bpp
$bw.Write([uint32]$png.Length)  # data size
$bw.Write([uint32]22)           # data offset
$bw.Write($png)
$bw.Close()
$fs.Close()

# --- 3. Create the desktop shortcut ---
$desktop = [Environment]::GetFolderPath("Desktop")
$ws = New-Object -ComObject WScript.Shell
$shortcut = $ws.CreateShortcut((Join-Path $desktop "ForgeAI.lnk"))
$shortcut.TargetPath = "$env:WINDIR\System32\wscript.exe"
$shortcut.Arguments = '"C:\ForgeAI\scripts\launch-forgeai.vbs"'
$shortcut.WorkingDirectory = "C:\ForgeAI"
$shortcut.IconLocation = "$icoPath,0"
$shortcut.Description = "ForgeAI - AI app builder"
$shortcut.Save()

Write-Host "Done! 'ForgeAI' shortcut created on your desktop." -ForegroundColor Green
Write-Host "Double-click it to start the server (if needed) and open the app."
