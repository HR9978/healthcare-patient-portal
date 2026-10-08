import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AppointmentStatus,
  InvoiceStatus,
  Prisma,
  Role,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import {
  MINUTE_MS,
  parseTimeToMinutes,
  SLOT_FREEING_STATUSES,
  utcToClinicParts,
} from '../doctors/slots.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

const appointmentInclude = {
  doctor: {
    select: {
      id: true,
      specialty: { select: { name: true } },
      user: { select: { firstName: true, lastName: true } },
    },
  },
  patient: {
    select: {
      id: true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
  room: { select: { name: true } },
  invoice: { select: { id: true, amount: true, status: true } },
} satisfies Prisma.AppointmentInclude;

const CANCELLABLE: AppointmentStatus[] = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
];

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(user: AuthUser, dto: CreateAppointmentDto, ip?: string) {
    const startsAt = new Date(dto.startsAt);
    if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() % MINUTE_MS !== 0) {
      throw new BadRequestException('startsAt must be a valid time without seconds');
    }
    if (startsAt <= new Date()) {
      throw new BadRequestException('Cannot book a slot in the past');
    }

    const patient = await this.prisma.patient.findUnique({
      where: { userId: user.id },
    });
    if (!patient) {
      throw new ForbiddenException('Only patients can book appointments');
    }

    const doctor = await this.prisma.doctor.findFirst({
      where: { id: dto.doctorId, user: { isActive: true } },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // The requested time must line up exactly with a slot from the doctor's schedule.
    const local = utcToClinicParts(startsAt);
    const schedules = await this.prisma.schedule.findMany({
      where: { doctorId: doctor.id, dayOfWeek: local.dayOfWeek, isActive: true },
    });
    const schedule = schedules.find((s) => {
      const start = parseTimeToMinutes(s.startTime);
      const end = parseTimeToMinutes(s.endTime);
      return (
        s.slotMinutes > 0 &&
        local.minutes >= start &&
        local.minutes + s.slotMinutes <= end &&
        (local.minutes - start) % s.slotMinutes === 0
      );
    });
    if (!schedule) {
      throw new BadRequestException(
        'This time is not an available slot for the selected doctor',
      );
    }
    const endsAt = new Date(startsAt.getTime() + schedule.slotMinutes * MINUTE_MS);

    // A patient cannot be in two places at once.
    const clash = await this.prisma.appointment.findFirst({
      where: {
        patientId: patient.id,
        status: { notIn: SLOT_FREEING_STATUSES },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });
    if (clash) {
      throw new ConflictException('You already have an appointment at this time');
    }

    try {
      // Appointment + invoice are created together or not at all.
      const created = await this.prisma.$transaction(async (tx) => {
        const appointment = await tx.appointment.create({
          data: {
            doctorId: doctor.id,
            patientId: patient.id,
            roomId: schedule.roomId,
            startsAt,
            endsAt,
            reason: dto.reason,
            status: AppointmentStatus.PENDING,
          },
        });
        await tx.invoice.create({
          data: {
            patientId: patient.id,
            appointmentId: appointment.id,
            amount: doctor.consultationFee,
            status: InvoiceStatus.PENDING,
          },
        });
        return appointment;
      });

      await this.audit.log({
        userId: user.id,
        action: 'APPOINTMENT_CREATED',
        entity: 'Appointment',
        entityId: created.id,
        ip,
      });
      return this.prisma.appointment.findUniqueOrThrow({
        where: { id: created.id },
        include: appointmentInclude,
      });
    } catch (error) {
      // The partial unique index (doctorId + startsAt) rejected a simultaneous booking.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This slot was just booked by someone else. Please choose another time.',
        );
      }
      throw error;
    }
  }

  /** Patients see their own, doctors see theirs, admins see everything. */
  findAllForUser(user: AuthUser) {
    const where: Prisma.AppointmentWhereInput =
      user.role === Role.PATIENT
        ? { patient: { userId: user.id } }
        : user.role === Role.DOCTOR
          ? { doctor: { userId: user.id } }
          : {};

    return this.prisma.appointment.findMany({
      where,
      include: appointmentInclude,
      orderBy: { startsAt: 'desc' },
      take: 100,
    });
  }

  async cancel(user: AuthUser, id: string, ip?: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { select: { userId: true } },
        doctor: { select: { userId: true } },
      },
    });

    const allowed =
      appointment &&
      (user.role === Role.ADMIN ||
        appointment.patient.userId === user.id ||
        appointment.doctor.userId === user.id);
    // Same response whether it doesn't exist or isn't yours.
    if (!appointment || !allowed) {
      throw new NotFoundException('Appointment not found');
    }

    if (!CANCELLABLE.includes(appointment.status)) {
      throw new BadRequestException('Only upcoming appointments can be cancelled');
    }
    if (appointment.startsAt <= new Date()) {
      throw new BadRequestException('Past appointments cannot be cancelled');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
      include: appointmentInclude,
    });

    await this.audit.log({
      userId: user.id,
      action: 'APPOINTMENT_CANCELLED',
      entity: 'Appointment',
      entityId: id,
      ip,
    });
    return updated;
  }
}
