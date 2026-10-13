import { IsIn } from 'class-validator';
import { RequestStatus } from '../requests.enums';

export class UpdateRequestDto {
  @IsIn([RequestStatus.ACCEPTED, RequestStatus.REJECTED])
  status!: RequestStatus.ACCEPTED | RequestStatus.REJECTED;
}
