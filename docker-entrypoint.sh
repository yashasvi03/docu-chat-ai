#!/bin/sh

# Start the backend server
cd /app/backend
node src/index.js &

# Start the frontend server
cd /app/frontend
npm start &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
