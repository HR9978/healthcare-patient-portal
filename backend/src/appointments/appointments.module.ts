import { Module } from '@nestjs/common';
import { AppointmentExpiryService } from './appointment-expiry.service';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentExpiryService],
})
export class AppointmentsModule {}
