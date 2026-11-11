@echo off
setlocal
cd /d "%~dp0study"
if errorlevel 1 goto failed

rem Local study defaults. Existing environment variables take priority.
rem Generate a fresh local demo key instead of storing a fixed key.
if not defined JWT_SECRET (
    for /f "delims=" %%K in ('powershell -NoProfile -Command "$keyBytes = New-Object byte[] 48; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($keyBytes); [Convert]::ToBase64String($keyBytes)"') do set "JWT_SECRET=%%K"
)
if not defined JWT_SECRET (
    echo Could not generate a local JWT key. Set JWT_SECRET and try again.
    goto failed
)
if not defined JWT_ACCESS_EXPIRATION set "JWT_ACCESS_EXPIRATION=3600"
if not defined GRADLE_USER_HOME set "GRADLE_USER_HOME=%USERPROFILE%\.gradle"

echo Starting study server: http://localhost:8080
echo Demo database is temporary. Press Ctrl+C to stop.
call gradlew.bat bootRun --args="--spring.profiles.active=demo"
if errorlevel 1 goto failed
exit /b 0

:failed
echo Server failed to start. Check the error above.
pause
exit /b 1
