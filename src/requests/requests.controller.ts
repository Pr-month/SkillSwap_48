import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import type { AuthRequest } from '../auth/auth.types';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestsService } from './requests.service';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @UseGuards(AccessTokenGuard)
  @Post()
  create(@Body() dto: CreateRequestDto, @Req() req: AuthRequest) {
    return this.requestsService.create(dto, req.user.sub);
  }

  @UseGuards(AccessTokenGuard)
  @Get('incoming')
  findIncoming(@Req() req: AuthRequest) {
    return this.requestsService.findIncoming(req.user.sub);
  }

  @UseGuards(AccessTokenGuard)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRequestDto,
    @Req() req: AuthRequest,
  ) {
    return this.requestsService.update(id, dto, req.user.sub);
  }
}
