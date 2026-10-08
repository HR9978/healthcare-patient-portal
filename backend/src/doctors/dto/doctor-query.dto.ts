import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class DoctorQueryDto {
  @ApiPropertyOptional({ description: 'Filter by specialty id' })
  @IsOptional()
  @IsUUID()
  specialtyId?: string;

  @ApiPropertyOptional({ description: 'Search by doctor name' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  search?: string;
}
