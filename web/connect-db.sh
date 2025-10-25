#!/bin/bash
# Database Connection Helper Script

echo "=== JobPrep Database Connection Helper ==="
echo ""
echo "Choose your connection method:"
echo "1) SSH Tunnel to Synology (recommended for development)"
echo "2) Direct connection to Synology (requires remote access enabled)"
echo "3) Local MySQL (requires setup)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
  1)
    echo ""
    echo "Creating SSH tunnel to Synology..."
    echo "Command: ssh -L 3307:10.214.19.39:3307 ernestpenajr@pena-cloud.network"
    echo ""
    echo "After connecting, update .env.local to use:"
    echo "DATABASE_URL=mysql://ernestpenajr:%24268RedDragons@localhost:3307/JOBPREP"
    echo ""
    echo "Press Ctrl+C to stop the tunnel when done."
    echo ""
    ssh -L 3307:10.214.19.39:3307 ernestpenajr@pena-cloud.network
    ;;
  2)
    echo ""
    echo "Using direct connection to Synology..."
    echo "Make sure remote access is enabled on your Synology NAS!"
    echo ""
    echo "Update .env.local to use:"
    echo "DATABASE_URL=mysql://ernestpenajr:%24268RedDragons@pena-cloud.network:3307/JOBPREP"
    ;;
  3)
    echo ""
    echo "Local MySQL setup required."
    echo "Run: mysql_secure_installation"
    echo "Then create database and user manually."
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac
