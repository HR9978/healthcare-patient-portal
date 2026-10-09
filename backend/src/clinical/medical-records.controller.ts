import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ClinicalService } from './clinical.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';

@ApiTags('clinical')
@ApiBearerAuth()
@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly clinical: ClinicalService) {}

  @Roles(Role.DOCTOR)
  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateMedicalRecordDto,
    @Req() req: Request,
  ) {
    return this.clinical.createRecord(user, dto, req.ip);
  }

  @Roles(Role.PATIENT, Role.DOCTOR)
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.clinical.listRecords(user);
  }
}
