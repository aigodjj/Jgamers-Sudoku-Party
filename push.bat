@echo off
setlocal
title JGamers Sudoku Party - Git Push

echo ==========================================
echo   JGamers Sudoku Party - GitHub Push
echo ==========================================
echo.

REM Always run Git from the folder containing this BAT file.
cd /d "%~dp0"

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo [ERROR] This BAT file is not inside your Git project folder.
    echo Move push.bat to the project root, next to package.json.
    echo.
    pause
    exit /b 1
)

echo Current branch:
git branch --show-current
echo.
echo Files changed:
git status --short
echo.

set /p "confirm=Continue and push these changes to GitHub? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Cancelled. No changes were pushed.
    pause
    exit /b 0
)

echo.
echo [1/3] Adding changes...
git add -A
if errorlevel 1 (
    echo [ERROR] git add failed.
    pause
    exit /b 1
)

git diff --cached --quiet
if not errorlevel 1 (
    echo No staged changes to commit. Nothing to push.
    pause
    exit /b 0
)

echo.
set /p "commitmsg=Commit message (Enter for 'Update game'): "
if "%commitmsg%"=="" set "commitmsg=Update game"

echo.
echo [2/3] Creating commit...
git commit -m "%commitmsg%"
if errorlevel 1 (
    echo [ERROR] Commit failed. Check the message above.
    pause
    exit /b 1
)

echo.
echo [3/3] Pushing current branch to origin...
git push origin HEAD
if errorlevel 1 (
    echo.
    echo [ERROR] Push failed. Your commit is saved locally.
    echo Read the Git error above; do not use force push.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   Push successful!
echo   If Vercel is connected to this branch,
echo   a deployment should start automatically.
echo ==========================================
echo.
pause
