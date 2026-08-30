import 'reflect-metadata';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { Task } from '../../schemas/task.schema';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DatabaseId } from '../../database/postgres-document.types';
import { getPgModelToken } from '../../database/postgres-document.module';

function makeModel(docs: any[] = []) {
  return {
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(docs),
    }),
    findOne: jest.fn().mockResolvedValue(null),
    findByIdAndUpdate: jest.fn().mockResolvedValue(null),
    findOneAndUpdate: jest.fn().mockResolvedValue(null),
  };
}

const auditStub = { log: jest.fn().mockResolvedValue(undefined) };
const notifStub = { create: jest.fn().mockResolvedValue(undefined) };

describe('TasksService — NoSQL injection guards', () => {
  let service: TasksService;
  let model: ReturnType<typeof makeModel>;

  beforeEach(async () => {
    model = makeModel();
    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getPgModelToken(Task.name), useValue: model },
        { provide: AuditLogService, useValue: auditStub },
        { provide: NotificationsService, useValue: notifStub },
      ],
    }).compile();
    service = module.get(TasksService);
    jest.clearAllMocks();
  });

  it('ignores an invalid status value', async () => {
    await service.findAll({ status: '{ $ne: null }' as any });
    const filter = model.find.mock.calls[0][0];
    expect(filter.status).toBeUndefined();
  });

  it('accepts a valid TaskStatus value', async () => {
    await service.findAll({ status: 'in_progress' });
    const filter = model.find.mock.calls[0][0];
    expect(filter.status).toBe('in_progress');
  });

  it('ignores an invalid priority value', async () => {
    await service.findAll({ priority: '{ $gt: "" }' as any });
    const filter = model.find.mock.calls[0][0];
    expect(filter.priority).toBeUndefined();
  });

  it('accepts a valid Priority value', async () => {
    await service.findAll({ priority: 'high' });
    const filter = model.find.mock.calls[0][0];
    expect(filter.priority).toBe('high');
  });

  it('ignores a non-ObjectId projectId', async () => {
    await service.findAll({ projectId: '../../../etc/passwd' });
    const filter = model.find.mock.calls[0][0];
    expect(filter.projectId).toBeUndefined();
  });

  it('accepts a valid ObjectId projectId', async () => {
    const id = new DatabaseId().toHexString();
    await service.findAll({ projectId: id });
    const filter = model.find.mock.calls[0][0];
    expect(filter.projectId).toBeDefined();
  });

  it('always includes deletedAt: null in the filter', async () => {
    await service.findAll({});
    const filter = model.find.mock.calls[0][0];
    expect(filter.deletedAt).toBe(null);
  });

  it('throws NotFoundException for a non-ObjectId in findById', async () => {
    await expect(service.findById('bad-id')).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException for a non-ObjectId in update', async () => {
    await expect(service.update('bad-id', {}, 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException for a non-ObjectId in softDelete', async () => {
    await expect(service.softDelete('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
  });
});
