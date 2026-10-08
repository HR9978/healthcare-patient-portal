import { Module } from '@nestjs/common';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { SpecialtiesController } from './specialties.controller';

@Module({
  controllers: [DoctorsController, SpecialtiesController],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
