import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  // TODO: После создания Category заменить на связь ManyToOne
  //@ManyToOne(() => Category, { nullable: false })
  //@JoinColumn({ name: 'category_id' }) вместо @Column({ name: 'category_id', type: 'uuid' })
  @Column({ name: 'category_id', type: 'uuid' })
  category!: string;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  images!: string[];

  @ManyToOne(() => User, (user) => user.skills)
  @JoinColumn({ name: 'owner_id' })
  owner!: User;
}
