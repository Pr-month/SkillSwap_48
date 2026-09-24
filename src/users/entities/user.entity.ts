import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Gender, UserRole } from '../users.enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 254, unique: true })
  email!: string;

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

  // TODO: Когда появится Skill переделать связь и тип
  //@OneToMany(() => Skill, (skill) => skill.user) //
  skills!: string[];

  // TODO: Когда появится Category переделать связь и тип
  //@ManyToMany(() => Category)
  //@JoinTable()
  wantToLearn!: string[];

  // TODO: Когда появится Skill переделать связь и тип
  //@ManyToMany(() => Skill)
  //@JoinTable()
  favoriteSkills!: string[];

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Column({ type: 'text', nullable: true })
  refreshToken!: string;
}
