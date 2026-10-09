import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Prisma, Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';

const doctorInfo = {
  select: {
    id: true,
    specialty: { select: { name: true } },
    user: { select: { firstName: true, lastName: true } },
  },
} satisfies { select: Prisma.DoctorSelect };

const recordInclude = {
  doctor: doctorInfo,
  patient: {
    select: {
      id: true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
  appointment: { select: { id: true, startsAt: true } },
  prescriptions: { orderBy: { issuedAt: 'asc' } },
} satisfies Prisma.MedicalRecordInclude;

const prescriptionInclude = {
  doctor: doctorInfo,
} satisfies Prisma.PrescriptionInclude;

@Injectable()
export class ClinicalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * A doctor completes a confirmed appointment: the visit record, its prescriptions
   * and the COMPLETED status are saved together or not at all.
   */
  async createRecord(user: AuthUser, dto: CreateMedicalRecordDto, ip?: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: user.id },
    });
    if (!doctor) {
      throw new ForbiddenException('Only doctors can create medical records');
    }

    // Looking up by doctorId too means a doctor can only touch their own appointments.
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: dto.appointmentId, doctorId: doctor.id },
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException(
        'Only confirmed (paid) appointments can be completed',
      );
    }

    try {
      const record = await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.appointment.updateMany({
          where: { id: appointment.id, status: AppointmentStatus.CONFIRMED },
          data: { status: AppointmentStatus.COMPLETED },
        });
        if (claimed.count === 0) {
          throw new ConflictException('This appointment was already completed');
        }

        return tx.medicalRecord.create({
          data: {
            patientId: appointment.patientId,
            doctorId: doctor.id,
            appointmentId: appointment.id,
            diagnosis: dto.diagnosis,
            symptoms: dto.symptoms,
            treatment: dto.treatment,
            notes: dto.notes,
            prescriptions: {
              create: (dto.prescriptions ?? []).map((p) => ({
                patientId: appointment.patientId,
                doctorId: doctor.id,
                medication: p.medication,
                dosage: p.dosage,
                frequency: p.frequency,
                durationDays: p.durationDays,
                instructions: p.instructions,
              })),
            },
          },
          include: recordInclude,
        });
      });

      await this.audit.log({
        userId: user.id,
        action: 'MEDICAL_RECORD_CREATED',
        entity: 'MedicalRecord',
        entityId: record.id,
        ip,
        metadata: { prescriptions: record.prescriptions.length },
      });
      return record;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A record already exists for this appointment');
      }
      throw error;
    }
  }

  /** Patients see their own records, doctors see the ones they wrote. */
  listRecords(user: AuthUser) {
    return this.prisma.medicalRecord.findMany({
      where: this.ownerFilter(user),
      include: recordInclude,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  listPrescriptions(user: AuthUser) {
    return this.prisma.prescription.findMany({
      where: this.ownerFilter(user),
      include: prescriptionInclude,
      orderBy: { issuedAt: 'desc' },
      take: 100,
    });
  }

  private ownerFilter(user: AuthUser) {
    if (user.role === Role.PATIENT) {
      return { patient: { userId: user.id } };
    }
    if (user.role === Role.DOCTOR) {
      return { doctor: { userId: user.id } };
    }
    // Admins deliberately have no access to clinical data.
    throw new ForbiddenException('You do not have access to clinical data');
  }
}
