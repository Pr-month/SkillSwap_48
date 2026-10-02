import { Exclude } from 'class-transformer';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Gender, UserRole } from '../users.enums';
import { Skill } from '../../skills/entities/skill.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 254, unique: true })
  email!: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'text' })
  about!: string;

  @Column({ type: 'date' })
  birthdate!: string;

  @Column({ type: 'varchar', length: 100 })
  city!: string;

  @Column({ type: 'enum', enum: Gender })
  gender!: Gender;

  @Column({ type: 'text' })
  avatar!: string;

  @OneToMany(() => Skill, (skill) => skill.owner)
  skills!: Skill[];

  // TODO: Когда появится Category переделать связь и тип
  //@ManyToMany(() => Category)
  //@JoinTable()
  wantToLearn!: string[];

  @ManyToMany(() => Skill)
  @JoinTable({
    name: 'user_favorite_skills',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'skill_id',
      referencedColumnName: 'id',
    },
  })
  favoriteSkills!: Skill[];

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Exclude()
  @Column({ type: 'text', nullable: true })
  refreshToken!: string | null;
}
