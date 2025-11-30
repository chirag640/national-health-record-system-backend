import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Consent, ConsentSchema } from './schemas/consent.schema';
import { ConsentController } from './consent.controller';
import { ConsentService } from './consent.service';
import { ConsentRepository } from './consent.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: Consent.name, schema: ConsentSchema }])],
  controllers: [ConsentController],
  providers: [ConsentService, ConsentRepository],
  exports: [ConsentService],
})
export class ConsentModule {}
