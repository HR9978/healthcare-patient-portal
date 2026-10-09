import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentStatus, InvoiceStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_HOLD_MINUTES = 15;

/** Releases slots whose patient never completed payment. */
@Injectable()
export class AppointmentExpiryService {
  private readonly logger = new Logger(AppointmentExpiryService.name);
  private readonly holdMinutes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    config: ConfigService,
  ) {
    this.holdMinutes =
      Number(config.get('BOOKING_HOLD_MINUTES')) || DEFAULT_HOLD_MINUTES;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async releaseExpiredHolds(): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - this.holdMinutes * 60_000);
      const expired = await this.prisma.appointment.findMany({
        where: { status: AppointmentStatus.PENDING, createdAt: { lt: cutoff } },
        select: { id: true },
      });
      if (expired.length === 0) {
        return;
      }

      const ids = expired.map((a) => a.id);
      // Conditions repeat the status checks so a payment that lands meanwhile wins.
      await this.prisma.$transaction([
        this.prisma.appointment.updateMany({
          where: { id: { in: ids }, status: AppointmentStatus.PENDING },
          data: { status: AppointmentStatus.CANCELLED },
        }),
        this.prisma.invoice.updateMany({
          where: { appointmentId: { in: ids }, status: InvoiceStatus.PENDING },
          data: { status: InvoiceStatus.FAILED },
        }),
      ]);

      await this.audit.log({
        action: 'BOOKING_HOLDS_EXPIRED',
        entity: 'Appointment',
        metadata: { count: ids.length },
      });
      this.logger.log(`Released ${ids.length} expired booking hold(s)`);
    } catch (error) {
      this.logger.error('Failed to release expired holds', error as Error);
    }
  }
}
