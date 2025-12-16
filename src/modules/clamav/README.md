# ClamAV Integration

This module provides centralized ClamAV antivirus scanning for the NestJS application.

## Features

- **Automatic File Scanning**: All file uploads are automatically scanned via ClamAV
- **Buffer Scanning**: Scan files from memory buffers without saving to disk first
- **File Path Scanning**: Scan files already saved to disk
- **Batch Scanning**: Support for scanning multiple files in parallel
- **Health Check**: Ping endpoint to verify ClamAV daemon availability
- **Error Handling**: Graceful error handling with proper logging

## Configuration

Set the following environment variables in your `.env` file:

### TCP Connection (Default)

```env
CLAMAV_HOST=localhost      # ClamAV daemon host (default: localhost)
CLAMAV_PORT=3310          # ClamAV daemon port (default: 3310)
CLAMAV_TIMEOUT=5000       # Scan timeout in milliseconds (default: 5000)
CLAMAV_SCAN=true          # Scanning mode: true = mandatory, false = optional (default: true)
```

### Unix Socket Connection

For Unix socket connections, use the `unix:` prefix in `CLAMAV_HOST`:

```env
CLAMAV_HOST=unix:/var/run/clamav/clamd.ctl    # Unix socket path
CLAMAV_PORT=3310                              # Ignored for Unix sockets
CLAMAV_TIMEOUT=5000                           # Scan timeout in milliseconds
CLAMAV_SCAN=true                              # Scanning mode: true = mandatory, false = optional
```

**Note:** When using Unix sockets, `CLAMAV_PORT` is ignored. The service automatically detects the connection type based on the `unix:` prefix.

### Scanning Mode (`CLAMAV_SCAN`)

- **`CLAMAV_SCAN=true`** (Default): **Mandatory Scanning**
  - Files are always scanned
  - If ClamAV is unavailable or scan fails → **Upload is BLOCKED**
  - Use in production for maximum security

- **`CLAMAV_SCAN=false`**: **Optional Scanning**
  - Files are scanned when ClamAV is available
  - If ClamAV is unavailable or scan fails → **Upload is ALLOWED** (bypass)
  - Use in development or when ClamAV might be temporarily unavailable
  - **Note:** Infected files are ALWAYS rejected, regardless of this setting

## Usage

### Automatic Scanning in Uploads

The `UploadsService` automatically scans all uploaded files before saving them. If a file is infected, the upload is rejected with a clear error message.

### Manual Scanning

```typescript
import { ClamAVService } from './modules/clamav/clamav.service';

// Scan from buffer
const result = await clamAVService.scanBuffer(fileBuffer, 'filename.pdf');

if (result.isInfected) {
  console.log('Virus detected:', result.viruses);
} else {
  console.log('File is clean');
}

// Scan from file path
const result = await clamAVService.scanFile('/path/to/file.pdf');
```

### API Endpoints

#### Health Check
```
GET /clamav/ping
```

Returns:
```json
{
  "available": true,
  "host": "localhost",
  "port": 3310
}
```

#### Single File Scan
```
POST /uploads/scan
Content-Type: multipart/form-data

file: <file>
```

Returns:
```json
{
  "status": "clean",
  "file": "document.pdf"
}
```

Or if infected:
```json
{
  "status": "infected",
  "file": "document.pdf",
  "viruses": ["EICAR-Test-File"]
}
```

#### Batch File Scan
```
POST /uploads/scan/batch
Content-Type: multipart/form-data

files: <file1>, <file2>, <file3>
```

Returns:
```json
{
  "total": 3,
  "clean": 2,
  "infected": 1,
  "results": [
    { "status": "clean", "file": "file1.pdf" },
    { "status": "clean", "file": "file2.pdf" },
    { "status": "infected", "file": "file3.pdf", "viruses": ["EICAR-Test-File"] }
  ]
}
```

## Testing with EICAR

The EICAR test file is a standard test file used to verify antivirus software is working correctly. It's not a real virus, but antivirus software should detect it.

### Creating EICAR Test File

```bash
echo 'X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*' > eicar.txt
```

Upload this file to test the ClamAV integration. It should be detected and rejected.

## Future Enhancements

### Async Queue-Based Scanning

For high-volume applications, consider implementing a queue-based scanning system:

```typescript
// Example: Using Bull queue for async scanning
@Injectable()
export class ClamAVQueueService {
  constructor(
    private readonly queue: Queue,
    private readonly clamAVService: ClamAVService,
  ) {}

  async scanAsync(fileId: string, filePath: string) {
    await this.queue.add('scan-file', { fileId, filePath });
  }
}
```

### Enhanced Logging

Add structured logging for audit trails:

```typescript
this.logger.log({
  event: 'file_scanned',
  file: filename,
  result: scanResult.isInfected ? 'infected' : 'clean',
  viruses: scanResult.viruses,
  timestamp: new Date().toISOString(),
});
```

### Batch Processing Optimization

For very large batches, consider:
- Processing files in chunks
- Using a worker pool for parallel scanning
- Implementing rate limiting to avoid overwhelming ClamAV daemon

## Error Handling

The service handles various error scenarios:

- **ClamAV Unavailable**: Logs error but may allow upload (configurable)
- **Scan Timeout**: Throws `BadRequestException` with timeout message
- **Connection Errors**: Throws `BadRequestException` with connection details
- **File Not Found**: Throws `BadRequestException` when scanning file paths

## Security Considerations

1. **Temporary Files**: Files are written to `/tmp` for buffer scanning and automatically cleaned up
2. **File Path Validation**: All file paths are validated to prevent directory traversal
3. **Error Messages**: Error messages don't expose sensitive system information
4. **Timeout Protection**: Scan operations have configurable timeouts to prevent hanging

## Troubleshooting

### ClamAV Daemon Not Reachable

1. Verify ClamAV is running: `systemctl status clamav-daemon` (Linux)
2. Check firewall rules allow connection to port 3310
3. Verify `CLAMAV_HOST` and `CLAMAV_PORT` environment variables
4. Test connection: `telnet localhost 3310`

### Scan Timeouts

1. Increase `CLAMAV_TIMEOUT` environment variable
2. Check ClamAV daemon performance and load
3. Consider implementing async scanning for large files

### False Positives

If legitimate files are being flagged:
1. Review ClamAV signature database version
2. Update ClamAV: `freshclam` (Linux)
3. Consider adding file type exceptions (implement custom logic)

