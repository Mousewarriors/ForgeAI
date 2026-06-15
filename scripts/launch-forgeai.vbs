' Silent wrapper so no console window flashes when launching ForgeAI.
Set sh = CreateObject("WScript.Shell")
sh.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""C:\ForgeAI\scripts\launch-forgeai.ps1""", 0, False
