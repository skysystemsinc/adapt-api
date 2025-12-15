# ClamAV Setup Guide

## Installation

### macOS (using Homebrew)

```bash
# Install ClamAV
brew install clamav

# Start ClamAV daemon
brew services start clamav

# Or run manually
clamd
```

### Linux (Ubuntu/Debian)

```bash
# Install ClamAV
sudo apt-get update
sudo apt-get install clamav clamav-daemon

# Start ClamAV daemon
sudo systemctl start clamav-daemon
sudo systemctl enable clamav-daemon

# Update virus definitions
sudo freshclam
```

### Linux (CentOS/RHEL)

```bash
# Install ClamAV
sudo yum install epel-release
sudo yum install clamav clamav-update clamd

# Start ClamAV daemon
sudo systemctl start clamd
sudo systemctl enable clamd

# Update virus definitions
sudo freshclam
```

## Configuration

### Environment Variables

Add to your `.env` file:

```env
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
CLAMAV_TIMEOUT=5000
```

### ClamAV Configuration File

Location: `/usr/local/etc/clamav/clamd.conf` (macOS) or `/etc/clamav/clamd.conf` (Linux)

Ensure these settings are configured:

```conf
# TCP port
TCPSocket 3310

# Bind to localhost
TCPAddr 127.0.0.1

# Allow connections
LocalSocket /tmp/clamd.socket
```

## Verify Installation

### Check if ClamAV daemon is running

**macOS:**
```bash
brew services list | grep clamav
```

**Linux:**
```bash
sudo systemctl status clamav-daemon
# or
sudo systemctl status clamd
```

### Test connection

```bash
# Test TCP connection
telnet localhost 3310

# Or use netcat
nc -zv localhost 3310
```

### Update virus definitions

```bash
# macOS
freshclam

# Linux
sudo freshclam
```

## Troubleshooting

### ClamAV daemon not starting

1. Check if port 3310 is already in use:
   ```bash
   lsof -i :3310
   ```

2. Check ClamAV logs:
   - macOS: `~/Library/Logs/Homebrew/clamav/`
   - Linux: `/var/log/clamav/clamav.log`

3. Verify configuration:
   ```bash
   clamd --config-check
   ```

### Connection refused errors

1. Ensure ClamAV daemon is running
2. Check firewall settings
3. Verify `CLAMAV_HOST` and `CLAMAV_PORT` in `.env` match ClamAV configuration
4. Try connecting manually: `telnet localhost 3310`

### Permission errors

On Linux, you may need to add your user to the `clamav` group:
```bash
sudo usermod -aG clamav $USER
```

## Quick Start (macOS)

```bash
# 1. Install
brew install clamav

# 2. Start daemon
brew services start clamav

# 3. Update virus definitions
freshclam

# 4. Verify it's running
brew services list | grep clamav

# 5. Test connection
telnet localhost 3310
```

## Docker Alternative

If you prefer to run ClamAV in Docker:

```bash
docker run -d \
  --name clamav \
  -p 3310:3310 \
  clamav/clamav:latest \
  clamd
```

Then update `.env`:
```env
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
```

## Testing

Once ClamAV is running, test the integration:

1. Check health: `GET /clamav/ping`
2. Upload EICAR test file through `/super-admin/settings`
3. Should be rejected with virus detection message

