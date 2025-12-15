import { ApiProperty } from '@nestjs/swagger';

export class ScanResultDto {
  @ApiProperty({
    description: 'Whether the file is infected',
    example: false,
  })
  isInfected: boolean;

  @ApiProperty({
    description: 'List of detected viruses (empty if clean)',
    example: [],
    type: [String],
  })
  viruses: string[];

  @ApiProperty({
    description: 'File path or filename that was scanned',
    example: 'document.pdf',
  })
  file: string;
}

export class FileScanResponseDto {
  @ApiProperty({
    description: 'Scan status',
    enum: ['clean', 'infected'],
    example: 'clean',
  })
  status: 'clean' | 'infected';

  @ApiProperty({
    description: 'File information',
    example: 'document.pdf',
  })
  file: string;

  @ApiProperty({
    description: 'List of detected viruses (only present if infected)',
    example: [],
    type: [String],
    required: false,
  })
  viruses?: string[];
}

export class BatchScanResponseDto {
  @ApiProperty({
    description: 'Total number of files scanned',
    example: 3,
  })
  total: number;

  @ApiProperty({
    description: 'Number of clean files',
    example: 2,
  })
  clean: number;

  @ApiProperty({
    description: 'Number of infected files',
    example: 1,
  })
  infected: number;

  @ApiProperty({
    description: 'Scan results for each file',
    type: [FileScanResponseDto],
  })
  results: FileScanResponseDto[];
}

export class ClamAVPingResponseDto {
  @ApiProperty({
    description: 'Whether ClamAV daemon is reachable',
    example: true,
  })
  available: boolean;

  @ApiProperty({
    description: 'ClamAV daemon host',
    example: 'localhost',
  })
  host: string;

  @ApiProperty({
    description: 'ClamAV daemon port',
    example: 3310,
  })
  port: number;
}

