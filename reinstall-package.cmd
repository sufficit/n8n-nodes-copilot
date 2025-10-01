@echo off
REM Script to force reinstall n8n-nodes-github-copilot package
REM This clears cache and ensures fresh installation

echo.
echo ========================================
echo  Force Reinstall GitHub Copilot Nodes
echo ========================================
echo.

REM Change to n8n directory (adjust path as needed)
cd /d "%USERPROFILE%\.n8n"

echo [1/4] Removing old package...
call npm uninstall n8n-nodes-github-copilot

echo.
echo [2/4] Clearing npm cache...
call npm cache clean --force

echo.
echo [3/4] Installing latest version...
call npm install n8n-nodes-github-copilot@latest

echo.
echo [4/4] Done! Now restart your n8n instance.
echo.
echo ========================================
echo  Installation Complete!
echo ========================================
echo.
echo IMPORTANT: You MUST restart n8n now:
echo   - Stop n8n (Ctrl+C if running in terminal)
echo   - Start n8n again
echo.
pause
