import { Module } from '@nestjs/common';
import { ClinicalService } from './clinical.service';
import { MedicalRecordsController } from './medical-records.controller';
import { PrescriptionsController } from './prescriptions.controller';

@Module({
  controllers: [MedicalRecordsController, PrescriptionsController],
  providers: [ClinicalService],
})
export class ClinicalModule {}
