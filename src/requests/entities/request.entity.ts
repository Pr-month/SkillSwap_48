import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Skill } from '../../skills/entities/skill.entity';
import { User } from '../../users/entities/user.entity';
import { RequestStatus } from '../requests.enums';

@Entity('requests')
export class Request {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender!: User;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'receiver_id' })
  receiver!: User;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status!: RequestStatus;

  @ManyToOne(() => Skill, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'offered_skill_id' })
  offeredSkill!: Skill;

  @ManyToOne(() => Skill, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requested_skill_id' })
  requestedSkill!: Skill;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead!: boolean;
}
