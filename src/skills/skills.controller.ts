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
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import type { AuthRequest } from '../auth/auth.types';
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { GetSkillsDto } from './dto/get-skills.dto';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @UseGuards(AccessTokenGuard)
  @Post()
  create(@Body() createSkillDto: CreateSkillDto, @Req() req: AuthRequest) {
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
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSkillDto: UpdateSkillDto,
    @Req() req: AuthRequest,
  ) {
    return this.skillsService.update(id, updateSkillDto, req.user.sub);
  }

  @UseGuards(AccessTokenGuard)
  @Post(':id/favorite')
  @HttpCode(HttpStatus.OK)
  addFavorite(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthRequest) {
    return this.skillsService.addFavorite(id, req.user.sub);
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthRequest) {
    return this.skillsService.remove(id, req.user.sub);
  }
}
