@echo off
echo === Codex Setup ===
echo.

if not defined OPENAI_API_KEY (
  echo OPENAI_API_KEY not found in environment.
  echo.
  echo 1. Get your key from: https://platform.openai.com/api-keys
  echo 2. Set it permanently:
  echo    [System Settings] -^> [Environment Variables] -^> New User Variable
  echo    Name : OPENAI_API_KEY
  echo    Value: sk-...your-key...
  echo.
  echo Or run this in your terminal before using codex:
  echo    $env:OPENAI_API_KEY="sk-...your-key..."
  echo.
  pause
  exit /b 1
)

echo OPENAI_API_KEY found.
echo Testing codex...
codex --version
if %errorlevel% neq 0 (
  echo.
  echo codex not found. Install it:
  echo    npm install -g @openai/codex
  pause
  exit /b 1
)

echo.
echo Codex is ready. Usage:
echo    npm run codex -- "your prompt here"
echo    codex "your prompt here"
pause
