// src/requests/dto/update-request-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsIn } from 'class-validator';
import { RequestStatus } from '../requests.enums';

export class UpdateRequestStatusDto {
  @ApiProperty({
    enum: [RequestStatus.ACCEPTED, RequestStatus.REJECTED],
    example: RequestStatus.ACCEPTED,
    description: 'Новый статус заявки (только accepted или rejected)',
  })
  @IsEnum(RequestStatus)
  @IsIn([RequestStatus.ACCEPTED, RequestStatus.REJECTED])
  status!: RequestStatus.ACCEPTED | RequestStatus.REJECTED;
}