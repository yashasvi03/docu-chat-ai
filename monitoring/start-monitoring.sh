#!/bin/bash

# DocuChat AI Monitoring Stack Startup Script for Unix-based systems

echo "=== Starting DocuChat AI Monitoring Stack ==="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create necessary directories
mkdir -p grafana/provisioning/dashboards
mkdir -p grafana/provisioning/datasources

# Start the monitoring stack
docker-compose up -d

echo
echo "=== Monitoring Stack Started ==="
echo
echo "Prometheus: http://localhost:9090"
echo "Grafana: http://localhost:3001 (admin/admin)"
echo "Node Exporter: http://localhost:9100/metrics"
echo "cAdvisor: http://localhost:8080"
echo "PostgreSQL Exporter: http://localhost:9187/metrics"
echo
echo "To stop the monitoring stack, run: docker-compose down"
