@echo off
echo ========================================
echo   ARE Public Gallery: Publishing...
echo ========================================

echo [1/3] Running gallery update script...
node update_gallery.js

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] update_gallery.js failed.
    pause
    exit /b %ERRORLEVEL%
)

echo [2/3] Staging and Committing changes...
git add .
git commit -m "Auto update gallery: %DATE% %TIME%"

echo [3/3] Pushing to GitHub...
git push origin main

echo ========================================
echo   Done! Your gallery is now live.
echo ========================================
pause
