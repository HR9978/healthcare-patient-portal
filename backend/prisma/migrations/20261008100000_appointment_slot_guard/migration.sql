CREATE UNIQUE INDEX appointment_doctor_slot_unique
ON "Appointment" ("doctorId", "startsAt")
WHERE status NOT IN ('CANCELLED', 'NO_SHOW');