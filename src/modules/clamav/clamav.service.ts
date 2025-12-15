import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as net from 'net';
import * as fs from 'fs/promises';

export interface ClamAVScanResult {
  isInfected: boolean;
  viruses: string[];
  file: string;
}

type ConnectionType = 'tcp' | 'unix';

@Injectable()
export class ClamAVService {
  private readonly logger = new Logger(ClamAVService.name);
  private readonly connectionType: ConnectionType;
  public readonly host: string;
  public readonly port: number;
  private readonly socketPath: string | null;
  private readonly timeout: number;
  private readonly isScanMandatory: boolean;

  constructor(private readonly configService: ConfigService) {
    const hostConfig = this.configService.get<string>('CLAMAV_HOST', 'localhost');
    
    // Detect connection type: unix:/path/to/socket or TCP host
    if (hostConfig.startsWith('unix:')) {
      this.connectionType = 'unix';
      this.socketPath = hostConfig.substring(5); // Remove 'unix:' prefix
      this.host = 'unix socket';
      this.port = 0; // Not used for Unix sockets
      this.logger.log(`ClamAV configured for Unix socket: ${this.socketPath}`);
    } else {
      this.connectionType = 'tcp';
      this.socketPath = null;
      this.host = hostConfig;
      // Parse port as number (environment variables are strings)
      const portValue = this.configService.get<string | number>('CLAMAV_PORT', 3310);
      this.port = typeof portValue === 'string' ? parseInt(portValue, 10) : portValue;
      this.logger.log(`ClamAV configured for TCP: ${this.host}:${this.port}`);
    }
    
    // Parse timeout as number (environment variables are strings)
    const timeoutValue = this.configService.get<string | number>('CLAMAV_TIMEOUT', 5000);
    this.timeout = typeof timeoutValue === 'string' ? parseInt(timeoutValue, 10) : timeoutValue;
    
    // Parse CLAMAV_SCAN: true = mandatory scanning (block on failure), false = optional (bypass on failure)
    const scanConfig = this.configService.get<string>('CLAMAV_SCAN', 'true');
    this.isScanMandatory = scanConfig.toLowerCase() === 'true';
    this.logger.log(`ClamAV scanning mode: ${this.isScanMandatory ? 'MANDATORY' : 'OPTIONAL (bypass on failure)'}`);
  }

  /**
   * Check if scanning is mandatory
   * @returns True if scanning is mandatory (block uploads on scan failure), false if optional (bypass on failure)
   */
  getScanMandatory(): boolean {
    return this.isScanMandatory;
  }

  /**
   * Scan a file from file path
   * @param filePath - Path to the file to scan
   * @returns Scan result with infection status and detected viruses
   */
  async scanFile(filePath: string): Promise<ClamAVScanResult> {
    try {
      // Verify file exists
      await fs.access(filePath);
    } catch (error) {
      throw new BadRequestException(`File not found: ${filePath}`);
    }

    return this.scan(filePath);
  }

  /**
   * Scan a file from buffer
   * @param buffer - File buffer to scan
   * @param filename - Optional filename for logging
   * @returns Scan result with infection status and detected viruses
   */
  async scanBuffer(buffer: Buffer, filename?: string): Promise<ClamAVScanResult> {
    // Create a temporary file for scanning
    const tempPath = `/tmp/clamav_scan_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    try {
      // Write buffer to temporary file
      await fs.writeFile(tempPath, buffer);
      
      // Scan the temporary file
      const result = await this.scan(tempPath);
      
      // Clean up temporary file
      await fs.unlink(tempPath).catch((err) => {
        this.logger.warn(`Failed to delete temporary file ${tempPath}: ${err.message}`);
      });
      
      // Update filename in result if provided
      if (filename) {
        result.file = filename;
      }
      
      return result;
    } catch (error) {
      // Clean up temporary file on error
      await fs.unlink(tempPath).catch(() => {
        // Ignore cleanup errors
      });
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error(`Error scanning buffer: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to scan file: ${error.message}`);
    }
  }

  /**
   * Internal method to establish connection to ClamAV daemon
   * Supports both TCP and Unix socket connections
   * @param socket - The socket to connect
   */
  private connectSocket(socket: net.Socket): void {
    if (this.connectionType === 'unix') {
      if (!this.socketPath) {
        throw new BadRequestException('Unix socket path is not configured');
      }
      socket.connect(this.socketPath);
    } else {
      socket.connect(this.port, this.host);
    }
  }

  /**
   * Get connection description for logging
   * @returns Human-readable connection description
   */
  private getConnectionDescription(): string {
    if (this.connectionType === 'unix') {
      return `Unix socket: ${this.socketPath}`;
    }
    return `${this.host}:${this.port}`;
  }

  /**
   * Internal method to perform the actual scan via ClamAV daemon
   * @param filePath - Path to the file to scan
   * @returns Scan result
   */
  private async scan(filePath: string): Promise<ClamAVScanResult> {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      let response = '';
      let isResolved = false;
      let commandSent = false;

      // Set timeout
      socket.setTimeout(this.timeout);

      socket.on('connect', () => {
        this.logger.debug(`Connected to ClamAV daemon at ${this.getConnectionDescription()}`);
        
        // Small delay to ensure connection is fully established
        setTimeout(() => {
          if (!commandSent && !isResolved) {
            commandSent = true;
            // Send SCAN command - ClamAV expects nSCAN for null-terminated response
            const command = `nSCAN ${filePath}\n`;
            this.logger.debug(`Sending command: ${command.trim()}`);
            socket.write(command);
          }
        }, 100);
      });

      socket.on('data', (data: Buffer) => {
        response += data.toString();
        this.logger.debug(`Received data: ${data.toString().substring(0, 100)}`);
        
        // ClamAV responses may end with \0, but connection might close first
        // Check if we have a complete response (ends with ERROR, FOUND, or OK)
        const hasCompleteResponse = response.includes('\0') || 
          response.includes('ERROR') || 
          response.includes('FOUND') || 
          response.includes(': OK');
        
        if (hasCompleteResponse && !isResolved) {
          isResolved = true;
          socket.destroy();
          try {
            const result = this.parseResponse(response, filePath);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }
      });

      socket.on('timeout', () => {
        if (!isResolved) {
          isResolved = true;
          socket.destroy();
          this.logger.error(`ClamAV scan timeout for file: ${filePath}`);
          reject(new BadRequestException('ClamAV scan timeout'));
        }
      });

      socket.on('error', (error: Error) => {
        if (!isResolved) {
          isResolved = true;
          const errorMessage = error.message || error.toString() || 'Unknown error';
          const connectionDesc = this.getConnectionDescription();
          const detailedError = `Failed to connect to ClamAV daemon at ${connectionDesc}. ${errorMessage}. Please ensure ClamAV daemon is running.`;
          this.logger.error(detailedError, error.stack);
          reject(new BadRequestException(detailedError));
        }
      });

      socket.on('close', (hadError: boolean) => {
        if (!isResolved) {
          isResolved = true;
          // ClamAV closes the connection after sending response - this is normal
          // If we already sent the command and got a response, try to parse it
          if (commandSent && response.length > 0) {
            try {
              const result = this.parseResponse(response, filePath);
              resolve(result);
              return;
            } catch (error) {
              // If parsing fails, include the response in the error
              this.logger.error(`Failed to parse ClamAV response: ${response.substring(0, 500)}`);
              if (error instanceof BadRequestException) {
                reject(error);
              } else {
                reject(new BadRequestException(`ClamAV response parsing failed: ${error.message}. Response: ${response.substring(0, 200)}`));
              }
              return;
            }
          }
          
          // If we got here, something went wrong
          if (hadError) {
            this.logger.error(`ClamAV connection closed with error for file: ${filePath}`);
            reject(new BadRequestException('ClamAV connection closed with error'));
          } else if (!commandSent) {
            this.logger.error(`ClamAV connection closed before command sent for file: ${filePath}`);
            reject(new BadRequestException('ClamAV connection closed before command could be sent'));
          } else {
            // Command was sent but no response received
            this.logger.error(`ClamAV connection closed without response for file: ${filePath}`);
            reject(new BadRequestException('ClamAV connection closed without sending a response'));
          }
        }
      });

      // Connect to ClamAV daemon (TCP or Unix socket)
      try {
        this.connectSocket(socket);
      } catch (error) {
        if (!isResolved) {
          isResolved = true;
          reject(error);
        }
      }
    });
  }

  /**
   * Parse ClamAV response
   * @param response - Raw response from ClamAV
   * @param filePath - Path to the scanned file
   * @returns Parsed scan result
   */
  private parseResponse(response: string, filePath: string): ClamAVScanResult {
    // Remove null terminator and trim
    const cleanedResponse = response.replace(/\0/g, '').trim();
    
    // ClamAV response format:
    // OK: filepath (no virus found)
    // filepath: VIRUS_NAME FOUND (virus found)
    // filepath: ERROR (error occurred)
    
    const lines = cleanedResponse.split('\n').filter(line => line.trim());
    
    const result: ClamAVScanResult = {
      isInfected: false,
      viruses: [],
      file: filePath,
    };

    for (const line of lines) {
      // Check for OK status
      if (line.includes(': OK')) {
        continue; // File is clean
      }

      // Check for virus found
      const virusMatch = line.match(/:\s+(.+?)\s+FOUND$/);
      if (virusMatch) {
        result.isInfected = true;
        result.viruses.push(virusMatch[1].trim());
        continue;
      }

      // Check for error
      if (line.includes(': ERROR')) {
        this.logger.warn(`ClamAV scan error for ${filePath}: ${line}`);
        throw new BadRequestException(`ClamAV scan error: ${line}`);
      }
    }

    return result;
  }

  /**
   * Check if ClamAV daemon is available
   * @returns True if daemon is reachable, false otherwise
   */
  async ping(): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let isResolved = false;

      socket.setTimeout(2000);

      socket.on('connect', () => {
        if (!isResolved) {
          isResolved = true;
          socket.destroy();
          resolve(true);
        }
      });

      socket.on('timeout', () => {
        if (!isResolved) {
          isResolved = true;
          socket.destroy();
          resolve(false);
        }
      });

      socket.on('error', () => {
        if (!isResolved) {
          isResolved = true;
          resolve(false);
        }
      });

      // Connect to ClamAV daemon (TCP or Unix socket)
      try {
        this.connectSocket(socket);
      } catch (error) {
        if (!isResolved) {
          isResolved = true;
          resolve(false);
        }
      }
    });
  }
}

