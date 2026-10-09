import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const PAYMENT_METHODS = ['CARD', 'INSURANCE'] as const;

/** Mock payment: only the chosen method is sent. Card details never reach the API. */
export class PayAppointmentDto {
  @ApiProperty({ enum: PAYMENT_METHODS, example: 'CARD' })
  @IsIn(PAYMENT_METHODS)
  method!: (typeof PAYMENT_METHODS)[number];
}
