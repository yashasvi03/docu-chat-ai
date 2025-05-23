# DocuChat AI Monitoring Stack

This directory contains the monitoring setup for the DocuChat AI application. The monitoring stack includes Prometheus, Grafana, Node Exporter, cAdvisor, and PostgreSQL Exporter.

## Components

- **Prometheus**: Time series database for metrics collection
- **Grafana**: Visualization and dashboarding tool
- **Node Exporter**: Exports system metrics (CPU, memory, disk, etc.)
- **cAdvisor**: Container metrics exporter
- **PostgreSQL Exporter**: Exports PostgreSQL metrics

## Setup

### Prerequisites

- Docker and Docker Compose installed
- DocuChat AI application running (for complete monitoring)

### Starting the Monitoring Stack

#### Windows

```bash
cd monitoring
.\start-monitoring.bat
```

#### Linux/macOS

```bash
cd monitoring
chmod +x start-monitoring.sh
./start-monitoring.sh
```

### Accessing the Monitoring Tools

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (default credentials: admin/admin)
- **Node Exporter Metrics**: http://localhost:9100/metrics
- **cAdvisor**: http://localhost:8080
- **PostgreSQL Exporter Metrics**: http://localhost:9187/metrics

## Dashboards

The monitoring stack comes with a pre-configured dashboard for DocuChat AI:

- **DocuChat AI Dashboard**: Provides an overview of the application's performance, including:
  - Backend request rate and duration
  - CPU and memory usage
  - PostgreSQL connections
  - Container memory usage

## Configuration

### Prometheus

The Prometheus configuration is defined in `prometheus.yml`. It includes scrape configurations for:

- Prometheus itself
- DocuChat backend
- DocuChat frontend
- Node Exporter
- cAdvisor
- PostgreSQL Exporter

### Grafana

Grafana is configured with:

- Datasource: Prometheus (automatically provisioned)
- Dashboard: DocuChat AI Dashboard (automatically provisioned)

## Customization

### Adding New Dashboards

1. Create a new dashboard JSON file in `grafana/provisioning/dashboards/`
2. Restart the monitoring stack

### Modifying Prometheus Configuration

1. Edit `prometheus.yml`
2. Restart the monitoring stack or reload the Prometheus configuration:
   ```bash
   curl -X POST http://localhost:9090/-/reload
   ```

## Troubleshooting

### Checking Container Status

```bash
docker-compose ps
```

### Viewing Container Logs

```bash
docker-compose logs prometheus
docker-compose logs grafana
docker-compose logs node-exporter
docker-compose logs cadvisor
docker-compose logs postgres-exporter
```

### Common Issues

- **Network Connectivity**: Ensure that the `app-network` exists and the DocuChat application is running
- **Port Conflicts**: Check if ports 9090, 3001, 9100, 8080, or 9187 are already in use
- **Permission Issues**: Ensure proper permissions for volume mounts

## Maintenance

### Updating Components

1. Update the image versions in `docker-compose.yml`
2. Restart the monitoring stack:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Backing Up Grafana Dashboards

Grafana dashboards can be exported from the Grafana UI and saved to `grafana/provisioning/dashboards/`.

### Cleaning Up

To stop and remove all containers, networks, and volumes:

```bash
docker-compose down -v
```
