import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const BCRYPT_ROUNDS = 12;

/** Empty string clears an optional field. */
const orNull = (value: string) => (value === '' ? null : value);

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  get(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        patient: {
          select: {
            dateOfBirth: true,
            gender: true,
            address: true,
            emergencyContact: true,
            insuranceNumber: true,
          },
        },
      },
    });
  }

  async update(user: AuthUser, dto: UpdateProfileDto, ip?: string) {
    const userData: Prisma.UserUpdateInput = {};
    if (dto.firstName !== undefined) userData.firstName = dto.firstName;
    if (dto.lastName !== undefined) userData.lastName = dto.lastName;
    if (dto.phone !== undefined) userData.phone = orNull(dto.phone);

    const patientData: Prisma.PatientUpdateInput = {};
    if (user.role === Role.PATIENT) {
      if (dto.dateOfBirth !== undefined) {
        const dob = new Date(dto.dateOfBirth);
        if (dob > new Date()) {
          throw new BadRequestException('Date of birth cannot be in the future');
        }
        patientData.dateOfBirth = dob;
      }
      if (dto.gender !== undefined) patientData.gender = orNull(dto.gender);
      if (dto.address !== undefined) patientData.address = orNull(dto.address);
      if (dto.emergencyContact !== undefined) {
        patientData.emergencyContact = orNull(dto.emergencyContact);
      }
      if (dto.insuranceNumber !== undefined) {
        patientData.insuranceNumber = orNull(dto.insuranceNumber);
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: userData });
      if (user.role === Role.PATIENT) {
        await tx.patient.update({ where: { userId: user.id }, data: patientData });
      }
    });

    // Log that a change happened, never the values themselves.
    await this.audit.log({
      userId: user.id,
      action: 'PROFILE_UPDATED',
      entity: 'User',
      entityId: user.id,
      ip,
    });
    return this.get(user.id);
  }

  /** Changing the password signs the user out everywhere by revoking refresh tokens. */
  async changePassword(user: AuthUser, dto: ChangePasswordDto, ip?: string) {
    const record = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    // 400 rather than 401: a 401 would make the web app try to refresh its session.
    const correct = await bcrypt.compare(dto.currentPassword, record.passwordHash);
    if (!correct) {
      throw new BadRequestException('Current password is incorrect');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different from the current one');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      this.prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.audit.log({
      userId: user.id,
      action: 'PASSWORD_CHANGED',
      entity: 'User',
      entityId: user.id,
      ip,
    });
  }
}
