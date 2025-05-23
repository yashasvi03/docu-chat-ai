@echo off
REM DocuChat AI Monitoring Stack Startup Script for Windows

echo === Starting DocuChat AI Monitoring Stack ===

REM Check if Docker is running
docker info > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Create necessary directories
if not exist "grafana\provisioning\dashboards" mkdir "grafana\provisioning\dashboards"
if not exist "grafana\provisioning\datasources" mkdir "grafana\provisioning\datasources"

REM Start the monitoring stack
docker-compose up -d

echo.
echo === Monitoring Stack Started ===
echo.
echo Prometheus: http://localhost:9090
echo Grafana: http://localhost:3001 (admin/admin)
echo Node Exporter: http://localhost:9100/metrics
echo cAdvisor: http://localhost:8080
echo PostgreSQL Exporter: http://localhost:9187/metrics
echo.
echo To stop the monitoring stack, run: docker-compose down
