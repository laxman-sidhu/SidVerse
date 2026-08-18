@echo off
REM ============================================================
REM  update-gallery-and-hero.bat
REM
REM  Regenerates BOTH index files in one go:
REM     gallery\  ->  gallery-index.json   (the album page)
REM     hero\     ->  hero-index.json      (the fan on the front page)
REM
REM  This file lives in modules\travel\assets\, next to those two
REM  folders. Drop pictures into either one and double-click this.
REM  Add as many hero pictures as you like: past four the fan
REM  becomes a scroller and shows every one of them.
REM
REM  Then commit and push, same as before.
REM ============================================================
setlocal enabledelayedexpansion

REM Anchor to this script's own folder, so it works from anywhere.
cd /d "%~dp0"

call :BUILD gallery gallery-index.json
call :BUILD hero    hero-index.json

echo.
echo Done.
echo   gallery-index.json  - !GALLERY_COUNT! file(s^)
echo   hero-index.json     - !HERO_COUNT! file(s^)
echo.
echo Now commit and push to GitHub.
echo.
pause
endlocal
goto :eof


REM ---- :BUILD <folder> <output json> -------------------------
REM Writes {"files":[ ... ]} listing every supported file in the
REM folder. A leading comma goes before every entry except the
REM first, so there is never a trailing comma to break the JSON.
:BUILD
set "SRC=%~1"
set "OUT=%~2"
set "COUNT=0"

if not exist "%SRC%\" (
  echo   Skipped %SRC%\ - folder not found.
  > "%OUT%" echo {"files":[]}
  goto :eof
)

> "%OUT%" echo {"files":[

set "FIRST=1"
for %%F in ("%SRC%\*.jpg" "%SRC%\*.jpeg" "%SRC%\*.png" "%SRC%\*.gif" "%SRC%\*.webp" "%SRC%\*.avif" "%SRC%\*.mp4" "%SRC%\*.webm" "%SRC%\*.mov" "%SRC%\*.m4v") do (
  if exist "%%~fF" (
    set /a COUNT+=1
    if defined FIRST (
      set "FIRST="
      >> "%OUT%" echo   "%%~nxF"
    ) else (
      >> "%OUT%" echo   ,"%%~nxF"
    )
  )
)

>> "%OUT%" echo ]}

if /i "%SRC%"=="gallery" set "GALLERY_COUNT=%COUNT%"
if /i "%SRC%"=="hero"    set "HERO_COUNT=%COUNT%"
goto :eof
