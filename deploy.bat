@echo off
REM DocuChat AI Deployment Script for Windows
REM This script automates the deployment process for the DocuChat AI application

setlocal enabledelayedexpansion

REM Default values
set ENVIRONMENT=staging

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :end_parse_args
if "%~1"=="-e" (
    set ENVIRONMENT=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--environment" (
    set ENVIRONMENT=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="-h" (
    call :show_help
    exit /b 0
)
if "%~1"=="--help" (
    call :show_help
    exit /b 0
)
echo Unknown option: %~1
call :show_help
exit /b 1

:end_parse_args

REM Validate environment
if not "%ENVIRONMENT%"=="staging" if not "%ENVIRONMENT%"=="production" (
    echo Error: Environment must be either 'staging' or 'production'
    exit /b 1
)

echo === DocuChat AI Deployment ===
echo Environment: %ENVIRONMENT%
echo ===========================

REM Load environment variables
if exist .env.%ENVIRONMENT% (
    echo Loading environment variables from .env.%ENVIRONMENT%
    for /f "tokens=*" %%a in (.env.%ENVIRONMENT%) do (
        set %%a
    )
) else (
    echo Warning: .env.%ENVIRONMENT% file not found
)

REM Run tests
echo Running tests...
call npm test
if %ERRORLEVEL% neq 0 (
    echo Error: Tests failed. Deployment aborted.
    exit /b 1
)

REM Build the application
echo Building application...
call npm run build

REM Build Docker image
echo Building Docker image...
set IMAGE_NAME=docuchat-ai
for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /format:list') do set datetime=%%a
set IMAGE_TAG=%datetime:~0,14%

docker build -t %IMAGE_NAME%:%IMAGE_TAG% -t %IMAGE_NAME%:latest .

REM Push to container registry if specified
if defined CONTAINER_REGISTRY (
    echo Pushing to container registry: %CONTAINER_REGISTRY%
    docker tag %IMAGE_NAME%:%IMAGE_TAG% %CONTAINER_REGISTRY%/%IMAGE_NAME%:%IMAGE_TAG%
    docker tag %IMAGE_NAME%:latest %CONTAINER_REGISTRY%/%IMAGE_NAME%:latest
    docker push %CONTAINER_REGISTRY%/%IMAGE_NAME%:%IMAGE_TAG%
    docker push %CONTAINER_REGISTRY%/%IMAGE_NAME%:latest
)

REM Deploy based on environment
if "%ENVIRONMENT%"=="production" (
    echo Deploying to production...
    
    REM Add production-specific deployment steps here
    REM For example:
    REM - Connect to production server
    REM - Pull the latest Docker image
    REM - Update environment variables
    REM - Restart services
    
    echo Production deployment completed
) else (
    echo Deploying to staging...
    
    REM Add staging-specific deployment steps here
    REM For example:
    REM - Connect to staging server
    REM - Pull the latest Docker image
    REM - Update environment variables
    REM - Restart services
    
    echo Staging deployment completed
)

echo === Deployment Completed ===
echo Environment: %ENVIRONMENT%
echo Image: %IMAGE_NAME%:%IMAGE_TAG%
echo Timestamp: %date% %time%
echo ===========================

exit /b 0

:show_help
echo DocuChat AI Deployment Script
echo Usage: deploy.bat [OPTIONS]
echo.
echo Options:
echo   -e, --environment ENV   Specify deployment environment (staging or production)
echo   -h, --help              Show this help message
echo.
echo Example:
echo   deploy.bat --environment staging
exit /b 0
