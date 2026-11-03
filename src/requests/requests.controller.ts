// src/requests/requests.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import type { AuthRequest } from '../auth/auth.types';
import {
  ApiCreateRequest,
  ApiDeleteRequest,
  ApiGetIncomingRequests,
  ApiGetOutgoingRequests,
  ApiUpdateRequestStatus,
} from './decorators/requests-swagger.decorator';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { RequestsService } from './requests.service';

@ApiTags('requests')
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @ApiCreateRequest()
  @UseGuards(AccessTokenGuard)
  @Post()
  create(@Body() dto: CreateRequestDto, @Req() req: AuthRequest) {
    return this.requestsService.create(dto, req.user.sub);
  }

  @ApiGetIncomingRequests()
  @UseGuards(AccessTokenGuard)
  @Get('incoming')
  findIncoming(@Req() req: AuthRequest) {
    return this.requestsService.findIncoming(req.user.sub);
  }

  @ApiGetOutgoingRequests()
  @UseGuards(AccessTokenGuard)
  @Get('outgoing')
  findOutgoing(@Req() req: AuthRequest) {
    return this.requestsService.findOutgoing(req.user.sub);
  }

  @ApiUpdateRequestStatus()
  @UseGuards(AccessTokenGuard)
  @Patch(':id')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRequestStatusDto,
    @Req() req: AuthRequest,
  ) {
    return this.requestsService.updateStatus(id, dto, req.user.sub);
  }

  @ApiDeleteRequest()
  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthRequest) {
    return this.requestsService.remove(id, req.user.sub, req.user.role);
  }
}