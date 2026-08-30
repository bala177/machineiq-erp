import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SequenceEntity } from '../../database/entities/release1.entity';

@Injectable()
export class SequencesService {
  constructor(
    @InjectRepository(SequenceEntity) private sequences: Repository<SequenceEntity>,
    private dataSource: DataSource,
  ) {}

  async next(key: string) {
    return this.dataSource.transaction(async (manager) => {
      const rows = await manager.query(
        `INSERT INTO sequences (key, value) VALUES ($1, 1)
         ON CONFLICT (key) DO UPDATE SET value = sequences.value + 1
         RETURNING value`,
        [key],
      );
      return Number(rows[0].value);
    });
  }
}
