@echo off
REM ============================================
REM BusTrack - GitHub Push Instructions
REM ============================================

echo.
echo ========================================
echo   BusTrack - Push to GitHub
echo ========================================
echo.
echo 1. First, you need a GitHub Personal Access Token:
echo    - Go to: https://github.com/settings/tokens
echo    - Click "Generate new token (classic)"
echo    - Check the "repo" scope
echo    - Copy the token
echo.
echo 2. Then run this command in PowerShell:
echo.
echo    cd c:\Users\admin\Desktop\bustrack
echo    node push-to-github.js YOUR_GITHUB_TOKEN_HERE
echo.
echo 3. Replace YOUR_GITHUB_TOKEN_HERE with your actual token
echo.
echo Example:
echo    node push-to-github.js ghp_abcdef1234567890xyz
echo.
echo ========================================
echo.
pause
