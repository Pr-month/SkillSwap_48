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
import { ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import type { AuthRequest } from '../auth/auth.types';
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { GetSkillsDto } from './dto/get-skills.dto';
import {
  ApiCreateSkill,
  ApiGetSkills,
  ApiGetSimilarSkills,
  ApiGetSkill,
  ApiUpdateSkill,
  ApiAddFavoriteSkill,
  ApiRemoveFavoriteSkill,
  ApiRemoveSkill,
} from './decorators/skills-swagger.decorator';

@ApiTags('skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @UseGuards(AccessTokenGuard)
  @Post()
  @ApiCreateSkill()
  create(@Body() createSkillDto: CreateSkillDto, @Req() req: AuthRequest) {
    return this.skillsService.create(createSkillDto, req.user.sub);
  }

  @Get()
  @ApiGetSkills()
  findAll(@Query() query: GetSkillsDto) {
    return this.skillsService.findAll(query);
  }

  @UseGuards(AccessTokenGuard)
  @Get(':id/similar')
  @ApiGetSimilarSkills()
  findSimilar(@Param('id', ParseUUIDPipe) id: string) {
    return this.skillsService.findSimilar(id);
  }

  @Get(':id')
  @ApiGetSkill()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.skillsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard)
  @ApiUpdateSkill()
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
  @ApiAddFavoriteSkill()
  addFavorite(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthRequest) {
    return this.skillsService.addFavorite(id, req.user.sub);
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id/favorite')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRemoveFavoriteSkill()
  removeFavorite(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthRequest,
  ) {
    return this.skillsService.removeFavorite(id, req.user.sub);
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRemoveSkill()
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthRequest) {
    return this.skillsService.remove(id, req.user.sub);
  }
}
