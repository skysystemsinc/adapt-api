import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserRequestsService } from '../services/user-requests.service';
import { CreateUserRequestDto } from '../dto/create-user-request.dto';
import { ReviewUserRequestDto } from '../dto/review-user-request.dto';
import { UserRequestResponseDto } from '../dto/user-request-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { Permissions } from '../../rbac/constants/permissions.constants';

@ApiTags('User Requests')
@Controller('admin/users/user-requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permissions.MANAGE_USER_REQUESTS)
@ApiBearerAuth('JWT-auth')
export class UserRequestsController {
  constructor(private readonly userRequestsService: UserRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a user request for approval' })
  @ApiBody({ type: CreateUserRequestDto })
  @ApiResponse({
    status: 201,
    description: 'User request created successfully',
    type: UserRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Bad request (duplicate email, pending request exists, etc.)' })
  async create(
    @Body() createUserRequestDto: CreateUserRequestDto,
    @Request() req: any,
  ): Promise<UserRequestResponseDto> {
    const requestedBy = req.user?.id;
    return this.userRequestsService.create(createUserRequestDto, requestedBy);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user requests' })
  @ApiResponse({
    status: 200,
    description: 'List of all user requests',
    type: [UserRequestResponseDto],
  })
  async findAll(): Promise<UserRequestResponseDto[]> {
    return this.userRequestsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user request by ID' })
  @ApiParam({ name: 'id', description: 'User Request ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'User request details',
    type: UserRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User request not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserRequestResponseDto> {
    return this.userRequestsService.findOne(id);
  }

  @Put(':id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review (approve/reject) a user request' })
  @ApiParam({ name: 'id', description: 'User Request ID (UUID)' })
  @ApiBody({ type: ReviewUserRequestDto })
  @ApiResponse({
    status: 200,
    description: 'User request reviewed successfully',
    type: UserRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User request not found' })
  @ApiResponse({ status: 400, description: 'Request already reviewed' })
  async review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() reviewDto: ReviewUserRequestDto,
    @Request() req: any,
  ): Promise<UserRequestResponseDto> {
    const reviewedBy = req.user?.id;
    return this.userRequestsService.review(id, reviewDto, reviewedBy);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a user request' })
  @ApiParam({ name: 'id', description: 'User Request ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'User request deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User request not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete non-pending request' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.userRequestsService.remove(id);
  }
}
