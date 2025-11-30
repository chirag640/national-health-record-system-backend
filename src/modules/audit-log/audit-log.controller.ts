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
import { AuditLogService } from './audit-log.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';
import { AuditLogOutputDto } from './dto/audit-log-output.dto';

@Controller('auditlogs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAuditLogDto): Promise<AuditLogOutputDto> {
    return this.auditLogService.create(dto);
  }

  @Get()
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.auditLogService.findAll(page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<AuditLogOutputDto> {
    return this.auditLogService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAuditLogDto): Promise<AuditLogOutputDto> {
    return this.auditLogService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.auditLogService.remove(id);
  }
}
