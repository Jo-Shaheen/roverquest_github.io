@echo off
cd /d "%~dp0"
set "NODE_EXE=node"
where node >nul 2>nul
if errorlevel 1 (
  if exist "%APPDATA%\fnm\node-versions\v22.22.0\installation\node.exe" (
    set "NODE_EXE=%APPDATA%\fnm\node-versions\v22.22.0\installation\node.exe"
  ) else if exist "%ProgramFiles%\nodejs\node.exe" (
    set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
  ) else (
    echo Node.js is required. Install Node.js and run this file again.
    pause
    exit /b 1
  )
)
start "RoverQuest: Beyond the Silent Machines" http://127.0.0.1:4173/index.html
"%NODE_EXE%" tools/serve.mjs
pause
