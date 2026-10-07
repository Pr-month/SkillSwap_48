import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Skill } from './entities/skill.entity';
import { User } from '../users/entities/user.entity';
import { FilesModule } from '../files/files.module';
import { SkillsService } from './skills.service';
import { SkillsController } from './skills.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Skill, User]), FilesModule],
  controllers: [SkillsController],
  providers: [SkillsService],
})
export class SkillsModule {}
