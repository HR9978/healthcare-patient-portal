import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ClinicalService } from './clinical.service';

@ApiTags('clinical')
@ApiBearerAuth()
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly clinical: ClinicalService) {}

  @Roles(Role.PATIENT, Role.DOCTOR)
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.clinical.listPrescriptions(user);
  }
}
