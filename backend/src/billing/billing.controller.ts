import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { BillingService } from './billing.service';

@ApiTags('billing')
@ApiBearerAuth()
@Controller('invoices')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Roles(Role.PATIENT, Role.ADMIN)
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.billing.listInvoices(user);
  }
}
