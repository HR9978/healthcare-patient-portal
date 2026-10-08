import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsUUID()
  doctorId!: string;

  @ApiProperty({
    example: '2026-10-12T04:00:00.000Z',
    description: 'The startsAt value of a slot returned by GET /doctors/:id/slots',
  })
  @IsISO8601()
  startsAt!: string;

  @ApiPropertyOptional({ example: 'Follow-up for chest pain' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
