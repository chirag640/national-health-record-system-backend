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
import { ConsentService } from './consent.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';
import { ConsentOutputDto } from './dto/consent-output.dto';

@Controller('consents')
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateConsentDto): Promise<ConsentOutputDto> {
    return this.consentService.create(dto);
  }

  @Get()
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.consentService.findAll(page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ConsentOutputDto> {
    return this.consentService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateConsentDto): Promise<ConsentOutputDto> {
    return this.consentService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.consentService.remove(id);
  }
}
