import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { DoctorQueryDto } from './dto/doctor-query.dto';
import { SlotsQueryDto } from './dto/slots-query.dto';

@ApiTags('doctors')
@ApiBearerAuth()
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctors: DoctorsService) {}

  @Get()
  findAll(@Query() query: DoctorQueryDto) {
    return this.doctors.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctors.findOne(id);
  }

  @Get(':id/slots')
  slots(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: SlotsQueryDto,
  ) {
    return this.doctors.getSlots(id, query.date);
  }
}
