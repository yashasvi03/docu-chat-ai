#!/bin/bash

# DocuChat AI Deployment Script
# This script automates the deployment process for the DocuChat AI application

# Exit on error
set -e

# Display help message
show_help() {
  echo "DocuChat AI Deployment Script"
  echo "Usage: ./deploy.sh [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  -e, --environment ENV   Specify deployment environment (staging or production)"
  echo "  -h, --help              Show this help message"
  echo ""
  echo "Example:"
  echo "  ./deploy.sh --environment staging"
}

# Default values
ENVIRONMENT="staging"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -e|--environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
  echo "Error: Environment must be either 'staging' or 'production'"
  exit 1
fi

echo "=== DocuChat AI Deployment ==="
echo "Environment: $ENVIRONMENT"
echo "==========================="

# Load environment variables
if [[ -f ".env.$ENVIRONMENT" ]]; then
  echo "Loading environment variables from .env.$ENVIRONMENT"
  export $(grep -v '^#' .env.$ENVIRONMENT | xargs)
else
  echo "Warning: .env.$ENVIRONMENT file not found"
fi

# Run tests
echo "Running tests..."
npm test

# Check if tests passed
if [[ $? -ne 0 ]]; then
  echo "Error: Tests failed. Deployment aborted."
  exit 1
fi

# Build the application
echo "Building application..."
npm run build

# Build Docker image
echo "Building Docker image..."
IMAGE_NAME="docuchat-ai"
IMAGE_TAG="$(date +%Y%m%d%H%M%S)"

docker build -t $IMAGE_NAME:$IMAGE_TAG -t $IMAGE_NAME:latest .

# Push to container registry if specified
if [[ -n "$CONTAINER_REGISTRY" ]]; then
  echo "Pushing to container registry: $CONTAINER_REGISTRY"
  docker tag $IMAGE_NAME:$IMAGE_TAG $CONTAINER_REGISTRY/$IMAGE_NAME:$IMAGE_TAG
  docker tag $IMAGE_NAME:latest $CONTAINER_REGISTRY/$IMAGE_NAME:latest
  docker push $CONTAINER_REGISTRY/$IMAGE_NAME:$IMAGE_TAG
  docker push $CONTAINER_REGISTRY/$IMAGE_NAME:latest
fi

# Deploy based on environment
if [[ "$ENVIRONMENT" == "production" ]]; then
  echo "Deploying to production..."
  
  # Add production-specific deployment steps here
  # For example:
  # - SSH into production server
  # - Pull the latest Docker image
  # - Update environment variables
  # - Restart services
  
  echo "Production deployment completed"
else
  echo "Deploying to staging..."
  
  # Add staging-specific deployment steps here
  # For example:
  # - SSH into staging server
  # - Pull the latest Docker image
  # - Update environment variables
  # - Restart services
  
  echo "Staging deployment completed"
fi

echo "=== Deployment Completed ==="
echo "Environment: $ENVIRONMENT"
echo "Image: $IMAGE_NAME:$IMAGE_TAG"
echo "Timestamp: $(date)"
echo "==========================="
