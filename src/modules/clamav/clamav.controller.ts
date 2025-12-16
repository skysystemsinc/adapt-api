import { Controller, Get, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClamAVService } from './clamav.service';
import { ClamAVPingResponseDto } from './dto/scan-result.dto';

@ApiTags('ClamAV')
@Controller('clamav')
export class ClamAVController {
  constructor(private readonly clamAVService: ClamAVService) {}

  @Get('ping')
  @ApiOperation({ summary: 'Check if ClamAV daemon is reachable' })
  @ApiResponse({
    status: 200,
    description: 'ClamAV daemon status',
    type: ClamAVPingResponseDto,
  })
  async ping(): Promise<ClamAVPingResponseDto> {
    try {
      const isAvailable = await this.clamAVService.ping();
      
      // For Unix sockets, port will be 0, so we need to handle it differently
      // The DTO expects host and port, so we'll provide appropriate values
      return {
        available: isAvailable,
        host: this.clamAVService.host,
        port: this.clamAVService.port || 0, // 0 for Unix sockets
      };
    } catch (error) {
      throw new BadRequestException(`Failed to check ClamAV status: ${error.message}`);
    }
  }
}

