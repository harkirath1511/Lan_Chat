@REM ----------------------------------------------------------------------------
@REM Maven Wrapper Script for Windows
@REM ----------------------------------------------------------------------------
@echo off
setlocal

rem Ensure JAVA_HOME points to Java 21+ if jdk-24 is present
if exist "C:\Program Files\Java\jdk-24" (
    if not defined JAVA_HOME (
        set "JAVA_HOME=C:\Program Files\Java\jdk-24"
    ) else if not exist "%JAVA_HOME%\bin\javac.exe" (
        set "JAVA_HOME=C:\Program Files\Java\jdk-24"
    )
)

set "POM_ARG="
if not exist "pom.xml" (
    if exist "%~dp0pom.xml" (
        set POM_ARG=-f "%~dp0pom.xml"
    )
)

rem 1. Check if mvn is on PATH
where mvn >nul 2>nul
if %ERRORLEVEL% equ 0 (
    call mvn %POM_ARG% %*
    goto :done
)

rem 2. Check MAVEN_HOME
if defined MAVEN_HOME (
    if exist "%MAVEN_HOME%\bin\mvn.cmd" (
        call "%MAVEN_HOME%\bin\mvn.cmd" %POM_ARG% %*
        goto :done
    )
)

rem 3. Check IntelliJ IDEA bundled Maven
if exist "C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2024.2.4\plugins\maven\lib\maven3\bin\mvn.cmd" (
    call "C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2024.2.4\plugins\maven\lib\maven3\bin\mvn.cmd" %POM_ARG% %*
    goto :done
)

for /d %%D in ("C:\Program Files\JetBrains\IntelliJ IDEA*") do (
    if exist "%%D\plugins\maven\lib\maven3\bin\mvn.cmd" (
        call "%%D\plugins\maven\lib\maven3\bin\mvn.cmd" %POM_ARG% %*
        goto :done
    )
)

echo Error: Maven not found on PATH or in known JetBrains installations.
echo Please install Maven or add it to PATH.
exit /b 1

:done
exit /b %ERRORLEVEL%

