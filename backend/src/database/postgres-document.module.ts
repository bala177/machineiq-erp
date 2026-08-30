import { DynamicModule, Inject, Module, Provider } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RuntimeDocumentEntity } from './entities/runtime-document.entity';
import { PgDocumentModel } from './postgres-document.model';

export interface PgModelDefinition { name: string; schema?: unknown }

export const getPgModelToken = (name: string) => `PG_DOCUMENT_MODEL:${name}`;
export const InjectPgModel = (name: string): ParameterDecorator => Inject(getPgModelToken(name));

@Module({})
export class PgDocumentModule {
  static forFeature(definitions: PgModelDefinition[]): DynamicModule {
    const providers: Provider[] = definitions.map(({ name }) => ({
      provide: getPgModelToken(name),
      useFactory: (repository: Repository<RuntimeDocumentEntity>, dataSource: DataSource) =>
        new PgDocumentModel(repository, dataSource, name),
      inject: [getRepositoryToken(RuntimeDocumentEntity), DataSource],
    }));

    return {
      module: PgDocumentModule,
      imports: [TypeOrmModule.forFeature([RuntimeDocumentEntity])],
      providers,
      exports: providers,
    };
  }
}
