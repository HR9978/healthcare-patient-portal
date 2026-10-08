import { PrismaClient, Role,Room } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'Demo@1234';

const doctors = [
  { email: 'dr.carter@example.com', firstName: 'Emily', lastName: 'Carter', specialty: 'Cardiology', license: 'DEMO-1001', years: 12, fee: 120, bio: 'Demo cardiologist profile.' },
  { email: 'dr.nguyen@example.com', firstName: 'Daniel', lastName: 'Nguyen', specialty: 'Dermatology', license: 'DEMO-1002', years: 8, fee: 90, bio: 'Demo dermatologist profile.' },
  { email: 'dr.patel@example.com', firstName: 'Priya', lastName: 'Patel', specialty: 'Pediatrics', license: 'DEMO-1003', years: 15, fee: 80, bio: 'Demo pediatrician profile.' },
  { email: 'dr.silva@example.com', firstName: 'Marco', lastName: 'Silva', specialty: 'Neurology', license: 'DEMO-1004', years: 10, fee: 150, bio: 'Demo neurologist profile.' },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash,
      role: Role.ADMIN,
      firstName: 'Alex',
      lastName: 'Admin',
    },
  });

  // Specialties
  const specialtyIds: Record<string, string> = {};
  for (const name of [...new Set(doctors.map((d) => d.specialty))]) {
    const specialty = await prisma.specialty.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    specialtyIds[name] = specialty.id;
  }

  // Rooms
  const rooms:Room[] = [];
  for (const name of ['Room 101', 'Room 102', 'Room 103', 'Room 104']) {
    rooms.push(
      await prisma.room.upsert({
        where: { name },
        update: {},
        create: { name, floor: '1' },
      }),
    );
  }

  // Doctors + weekly schedule (Mon–Fri, 09:00–17:00, 30-minute slots)
  for (const [index, d] of doctors.entries()) {
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        email: d.email,
        passwordHash,
        role: Role.DOCTOR,
        firstName: d.firstName,
        lastName: d.lastName,
        doctor: {
          create: {
            specialtyId: specialtyIds[d.specialty],
            licenseNumber: d.license,
            bio: d.bio,
            yearsExperience: d.years,
            consultationFee: d.fee,
          },
        },
      },
      include: { doctor: true },
    });

    if (user.doctor) {
      const existing = await prisma.schedule.count({
        where: { doctorId: user.doctor.id },
      });
      if (existing === 0) {
        await prisma.schedule.createMany({
          data: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
            doctorId: user.doctor!.id,
            roomId: rooms[index % rooms.length].id,
            dayOfWeek,
            startTime: '09:00',
            endTime: '17:00',
            slotMinutes: 30,
          })),
        });
      }
    }
  }

  // Patients
  const patients = [
    { email: 'patient@example.com', firstName: 'Sam', lastName: 'Patient' },
    { email: 'patient2@example.com', firstName: 'Riley', lastName: 'Rivera' },
  ];
  for (const p of patients) {
    await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        ...p,
        passwordHash,
        role: Role.PATIENT,
        patient: { create: {} },
      },
    });
  }

  console.log('Seed complete. Demo logins (password for all: %s):', DEMO_PASSWORD);
  console.log('  admin@example.com');
  console.log('  patient@example.com, patient2@example.com');
  doctors.forEach((d) => console.log('  ' + d.email));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
