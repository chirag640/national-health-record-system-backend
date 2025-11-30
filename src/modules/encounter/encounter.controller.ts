import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { EncounterService } from './encounter.service';
import { CreateEncounterDto } from './dto/create-encounter.dto';
import { UpdateEncounterDto } from './dto/update-encounter.dto';
import { EncounterOutputDto } from './dto/encounter-output.dto';

@Controller('encounters')
export class EncounterController {
  constructor(private readonly encounterService: EncounterService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateEncounterDto): Promise<EncounterOutputDto> {
    return this.encounterService.create(dto);
  }

  @Get()
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.encounterService.findAll(page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<EncounterOutputDto> {
    return this.encounterService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEncounterDto): Promise<EncounterOutputDto> {
    return this.encounterService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.encounterService.remove(id);
  }
}
