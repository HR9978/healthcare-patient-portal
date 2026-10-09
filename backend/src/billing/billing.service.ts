import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { PrismaService } from '../prisma/prisma.service';

const invoiceInclude = {
  patient: {
    select: { user: { select: { firstName: true, lastName: true } } },
  },
  appointment: {
    select: {
      id: true,
      status: true,
      startsAt: true,
      doctor: {
        select: {
          specialty: { select: { name: true } },
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  },
} satisfies Prisma.InvoiceInclude;

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Patients see their own invoices; admins see all of them. */
  listInvoices(user: AuthUser) {
    let where: Prisma.InvoiceWhereInput;
    if (user.role === Role.PATIENT) {
      where = { patient: { userId: user.id } };
    } else if (user.role === Role.ADMIN) {
      where = {};
    } else {
      throw new ForbiddenException('You do not have access to billing data');
    }

    return this.prisma.invoice.findMany({
      where,
      include: invoiceInclude,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
