import { Module } from '@nestjs/common';
import { DatabaseIndexService } from './database-index.service';

@Module({
  providers: [DatabaseIndexService],
  exports: [DatabaseIndexService],
})
export class DatabaseModule {}
