import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DoctorQueryDto } from './dto/doctor-query.dto';
import {
  clinicLocalToUtc,
  clinicOffsetMinutes,
  MINUTE_MS,
  parseDateString,
  parseTimeToMinutes,
  SLOT_FREEING_STATUSES,
} from './slots.util';

const MAX_DAYS_AHEAD = 90;
const DAY_MS = 24 * 60 * MINUTE_MS;

const doctorSelect = {
  id: true,
  bio: true,
  yearsExperience: true,
  consultationFee: true,
  specialty: { select: { id: true, name: true } },
  user: { select: { firstName: true, lastName: true } },
} satisfies Prisma.DoctorSelect;

type DoctorRow = Prisma.DoctorGetPayload<{ select: typeof doctorSelect }>;

function toDto(doctor: DoctorRow) {
  return {
    id: doctor.id,
    firstName: doctor.user.firstName,
    lastName: doctor.user.lastName,
    specialty: doctor.specialty,
    bio: doctor.bio,
    yearsExperience: doctor.yearsExperience,
    consultationFee: Number(doctor.consultationFee),
  };
}

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  listSpecialties() {
    return this.prisma.specialty.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  async findAll(query: DoctorQueryDto) {
    const tokens = (query.search ?? '').split(/\s+/).filter(Boolean);

    const where: Prisma.DoctorWhereInput = {
      specialtyId: query.specialtyId,
      user: {
        isActive: true,
        // Every word typed must match the first or last name.
        AND: tokens.map((token) => ({
          OR: [
            { firstName: { contains: token, mode: 'insensitive' } },
            { lastName: { contains: token, mode: 'insensitive' } },
          ],
        })),
      },
    };

    const doctors = await this.prisma.doctor.findMany({
      where,
      select: doctorSelect,
      orderBy: { user: { lastName: 'asc' } },
    });
    return doctors.map(toDto);
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findFirst({
      where: { id, user: { isActive: true } },
      select: doctorSelect,
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    return toDto(doctor);
  }

  /** Generates the doctor's slots for one clinic-local date and marks which are free. */
  async getSlots(doctorId: string, dateString: string) {
    const parts = parseDateString(dateString);
    if (!parts) {
      throw new BadRequestException('date must be a valid YYYY-MM-DD date');
    }
    await this.findOne(doctorId);

    const dayStart = clinicLocalToUtc(parts.year, parts.month, parts.day, 0);
    const dayEnd = new Date(dayStart.getTime() + DAY_MS);
    const now = new Date();

    if (dayEnd <= now) {
      throw new BadRequestException('Date is in the past');
    }
    if (dayStart.getTime() - now.getTime() > MAX_DAYS_AHEAD * DAY_MS) {
      throw new BadRequestException(
        `Appointments can only be booked up to ${MAX_DAYS_AHEAD} days ahead`,
      );
    }

    const [schedules, booked] = await Promise.all([
      this.prisma.schedule.findMany({
        where: { doctorId, dayOfWeek: parts.dayOfWeek, isActive: true },
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.appointment.findMany({
        where: {
          doctorId,
          startsAt: { gte: dayStart, lt: dayEnd },
          status: { notIn: SLOT_FREEING_STATUSES },
        },
        select: { startsAt: true },
      }),
    ]);

    const bookedTimes = new Set(booked.map((b) => b.startsAt.getTime()));
    const slots: { startsAt: string; endsAt: string; available: boolean }[] = [];

    for (const schedule of schedules) {
      if (schedule.slotMinutes <= 0) {
        continue;
      }
      const start = parseTimeToMinutes(schedule.startTime);
      const end = parseTimeToMinutes(schedule.endTime);

      for (let t = start; t + schedule.slotMinutes <= end; t += schedule.slotMinutes) {
        const startsAt = clinicLocalToUtc(parts.year, parts.month, parts.day, t);
        const endsAt = new Date(startsAt.getTime() + schedule.slotMinutes * MINUTE_MS);
        slots.push({
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          available: startsAt > now && !bookedTimes.has(startsAt.getTime()),
        });
      }
    }

    return {
      doctorId,
      date: dateString,
      timezoneOffsetMinutes: clinicOffsetMinutes(),
      slots,
    };
  }
}
