import { Controller, Get} from '@nestjs/common';
import { AuthorityLevelService } from './authority-level.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthorityLevelResponseDto } from './dto/authority-level-response.dto';

@ApiTags('Authority Level')
@Controller('authority-level')
export class AuthorityLevelController {
  constructor(private readonly authorityLevelService: AuthorityLevelService) {}

  @ApiOperation({ summary: 'Get all authority levels' })
  @ApiResponse({ status: 200, description: 'Get all authority levels', type: [AuthorityLevelResponseDto] })
  @Get()
  findAll(): Promise<AuthorityLevelResponseDto[]> {
    return this.authorityLevelService.findAll();
  }
}
