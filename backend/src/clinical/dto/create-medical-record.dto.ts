import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class PrescriptionItemDto {
  @ApiProperty({ example: 'Amoxicillin' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  medication!: string;

  @ApiProperty({ example: '500 mg' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  dosage!: string;

  @ApiProperty({ example: 'Three times a day' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  frequency!: string;

  @ApiProperty({ example: 7 })
  @IsInt()
  @Min(1)
  @Max(365)
  durationDays!: number;

  @ApiPropertyOptional({ example: 'Take with food' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructions?: string;
}

export class CreateMedicalRecordDto {
  @ApiProperty()
  @IsUUID()
  appointmentId!: string;

  @ApiProperty({ example: 'Seasonal allergic rhinitis (demo)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  diagnosis!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  symptoms?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  treatment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ type: [PrescriptionItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  prescriptions?: PrescriptionItemDto[];
}
