import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
