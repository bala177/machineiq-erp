import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SequenceEntity } from '../../database/entities/release1.entity';
import { SequencesService } from './sequences.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SequenceEntity])],
  providers: [SequencesService],
  exports: [SequencesService],
})
export class SequencesModule {}
