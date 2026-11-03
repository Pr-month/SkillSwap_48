// src/cities/entities/city.entity.ts
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('cities')
export class City {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  district!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subject!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  lat!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  lon!: number | null;

  @Column({ type: 'int', nullable: true })
  population!: number | null;

  @OneToMany(() => User, (user) => user.city)
  users!: User[];
}