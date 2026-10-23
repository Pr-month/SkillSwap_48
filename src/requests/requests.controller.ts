import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import type { AuthRequest } from '../auth/auth.types';
import {
  ApiCreateRequest,
  ApiGetIncomingRequests,
  ApiGetOutgoingRequests,
} from './decorators/requests-swagger.decorator';
import { CreateRequestDto } from './dto/create-request.dto';
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
}
