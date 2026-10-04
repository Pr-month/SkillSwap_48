import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import type { JwtPayload } from '../auth/auth.types';
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { GetSkillsDto } from './dto/get-skills.dto';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';

interface RequestWithUser extends Request {
  user: { sub: number; email: string };
}

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @UseGuards(AccessTokenGuard)
  @Post()
  create(
    @Body() createSkillDto: CreateSkillDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.skillsService.create(createSkillDto, req.user.sub);
  }

  @Get()
  findAll(@Query() query: GetSkillsDto) {
    return this.skillsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.skillsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard)
  update(
    @Param('id') id: string,
    @Body() updateSkillDto: UpdateSkillDto,
    @Req() req: RequestWithUser,
  ) {
    return this.skillsService.update(+id, updateSkillDto, req.user.sub);
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.skillsService.remove(id, req.user.sub);
  }
}
