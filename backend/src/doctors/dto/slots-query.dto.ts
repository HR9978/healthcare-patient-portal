import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class SlotsQueryDto {
  @ApiProperty({ example: '2026-10-12', description: 'Clinic-local date, YYYY-MM-DD' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  date!: string;
}
