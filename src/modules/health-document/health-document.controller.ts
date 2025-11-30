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
import { HealthDocumentService } from './health-document.service';
import { CreateHealthDocumentDto } from './dto/create-health-document.dto';
import { UpdateHealthDocumentDto } from './dto/update-health-document.dto';
import { HealthDocumentOutputDto } from './dto/health-document-output.dto';

@Controller('healthdocuments')
export class HealthDocumentController {
  constructor(private readonly healthDocumentService: HealthDocumentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateHealthDocumentDto): Promise<HealthDocumentOutputDto> {
    return this.healthDocumentService.create(dto);
  }

  @Get()
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.healthDocumentService.findAll(page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<HealthDocumentOutputDto> {
    return this.healthDocumentService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHealthDocumentDto,
  ): Promise<HealthDocumentOutputDto> {
    return this.healthDocumentService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.healthDocumentService.remove(id);
  }
}
