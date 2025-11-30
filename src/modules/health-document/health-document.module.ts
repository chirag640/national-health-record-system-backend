import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthDocument, HealthDocumentSchema } from './schemas/health-document.schema';
import { HealthDocumentController } from './health-document.controller';
import { HealthDocumentService } from './health-document.service';
import { HealthDocumentRepository } from './health-document.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HealthDocument.name, schema: HealthDocumentSchema }]),
  ],
  controllers: [HealthDocumentController],
  providers: [HealthDocumentService, HealthDocumentRepository],
  exports: [HealthDocumentService],
})
export class HealthDocumentModule {}
