import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Category } from '../../categories/entities/category.entity';
import { User } from '../../users/entities/user.entity';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @ManyToOne(() => Category, (category) => category.skills, {
    nullable: false,
  })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  images!: string[];

  @ManyToOne(() => User, (user) => user.skills)
  @JoinColumn({ name: 'owner_id' })
  owner!: User;
}
