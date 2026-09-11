import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FeedbackService } from './feedback.service';

describe('FeedbackService', () => {
  const repository = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ _id: 'feedback-id', createdAt: new Date(), ...value })),
    find: jest.fn(), count: jest.fn(), createQueryBuilder: jest.fn(),
  };
  const config = { get: jest.fn() };
  const audit = { log: jest.fn() };
  const gateway = { signalAdmins: jest.fn(), signalUser: jest.fn() };
  let service: FeedbackService;

  beforeEach(() => {
    jest.clearAllMocks();
    config.get.mockReturnValue('true');
    service = new FeedbackService(repository as any, config as any, audit as any, gateway as any);
  });

  it('is disabled by default and hides submission routes', async () => {
    config.get.mockImplementation((_key: string, fallback: string) => fallback);
    expect(service.isEnabled()).toBe(false);
    await expect(service.create({} as any, 'user-id')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('stores only safe API error metadata and writes an audit event', async () => {
    await service.create({
      type: 'broken', urgency: 'blocking', message: 'The save action failed', contactAllowed: true, pagePath: '/items?secret=yes',
      recentApiError: { path: '/items?token=secret', status: 500, message: 'Failure', at: '2026-09-06T12:00:00Z', body: { password: 'never-store' } },
    }, 'user-id');
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-id', status: 'new', recentApiError: { path: '/items', status: 500, message: 'Failure', at: '2026-09-06T12:00:00Z' },
    }));
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'create', entityType: 'feedback', performedBy: 'user-id' }));
  });

  it('rejects unsupported screenshot content', async () => {
    await expect(service.create({ type: 'broken', urgency: 'minor', message: 'Broken export', contactAllowed: false, pagePath: '/items', screenshotDataUrl: 'data:text/html;base64,PHNjcmlwdD4=' }, 'user-id')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects screenshots larger than two megabytes', async () => {
    const image = `data:image/png;base64,${'A'.repeat(2_800_000)}`;
    await expect(service.create({ type: 'broken', urgency: 'minor', message: 'Broken export', contactAllowed: false, pagePath: '/items', screenshotDataUrl: image }, 'user-id')).rejects.toThrow('2 MB');
  });

  it('orders the joined admin inbox through a selected alias that pagination can resolve', async () => {
    const qb = {
      addSelect: jest.fn(), leftJoinAndSelect: jest.fn(), orderBy: jest.fn(), addOrderBy: jest.fn(),
      andWhere: jest.fn(), take: jest.fn(), getMany: jest.fn().mockResolvedValue([]),
    };
    Object.values(qb).forEach((method) => {
      if (method !== qb.getMany) method.mockReturnValue(qb);
    });
    repository.createQueryBuilder.mockReturnValue(qb);

    await service.adminList({});

    expect(qb.addSelect).toHaveBeenCalledWith(expect.stringContaining('CASE WHEN feedback.urgency'), 'urgency_rank');
    expect(qb.orderBy).toHaveBeenCalledWith('urgency_rank', 'ASC');
    expect(qb.take).toHaveBeenCalledWith(250);
  });

  it('filters the admin inbox by target release', async () => {
    const qb = {
      addSelect: jest.fn(), leftJoinAndSelect: jest.fn(), orderBy: jest.fn(), addOrderBy: jest.fn(),
      andWhere: jest.fn(), take: jest.fn(), getMany: jest.fn().mockResolvedValue([]),
    };
    Object.values(qb).forEach((method) => { if (method !== qb.getMany) method.mockReturnValue(qb); });
    repository.createQueryBuilder.mockReturnValue(qb);
    await service.adminList({ targetRelease: '2.2.0' });
    expect(qb.andWhere).toHaveBeenCalledWith('LOWER(feedback.targetRelease) = LOWER(:targetRelease)', { targetRelease: '2.2.0' });
  });

  it('requires a release for planned work and a client response before closure', async () => {
    const entity = { _id: 'feedback-id', status: 'reviewing', targetRelease: null, customerResponse: null };
    const qb = { addSelect: jest.fn(), where: jest.fn(), getOne: jest.fn().mockResolvedValue(entity) };
    qb.addSelect.mockReturnValue(qb); qb.where.mockReturnValue(qb); repository.createQueryBuilder.mockReturnValue(qb);
    await expect(service.update('feedback-id', { status: 'planned' }, 'admin-id')).rejects.toThrow('Assign a target release');
    await expect(service.update('feedback-id', { status: 'fixed' }, 'admin-id')).rejects.toThrow('customer-visible response');
  });

  it('tells every admin that a new report arrived', async () => {
    await service.create({ type: 'broken', urgency: 'minor', message: 'Export fails', contactAllowed: true, pagePath: '/items' }, 'user-id');

    expect(gateway.signalAdmins).toHaveBeenCalledTimes(1);
  });

  it('tells the admins and the submitter when triage changes an item', async () => {
    const entity = { _id: 'feedback-id', status: 'new', userId: 'user-7', targetRelease: null, customerResponse: null };
    const qb = { addSelect: jest.fn(), where: jest.fn(), getOne: jest.fn().mockResolvedValue(entity) };
    qb.addSelect.mockReturnValue(qb); qb.where.mockReturnValue(qb); repository.createQueryBuilder.mockReturnValue(qb);

    await service.update('feedback-id', { status: 'reviewing' }, 'admin-id');

    expect(gateway.signalAdmins).toHaveBeenCalledTimes(1);
    expect(gateway.signalUser).toHaveBeenCalledWith('user-7');
  });

  it('leaves everyone unsignalled when triage is rejected', async () => {
    const entity = { _id: 'feedback-id', status: 'reviewing', userId: 'user-7', targetRelease: null, customerResponse: null };
    const qb = { addSelect: jest.fn(), where: jest.fn(), getOne: jest.fn().mockResolvedValue(entity) };
    qb.addSelect.mockReturnValue(qb); qb.where.mockReturnValue(qb); repository.createQueryBuilder.mockReturnValue(qb);

    await expect(service.update('feedback-id', { status: 'planned' }, 'admin-id')).rejects.toThrow('Assign a target release');

    expect(gateway.signalAdmins).not.toHaveBeenCalled();
    expect(gateway.signalUser).not.toHaveBeenCalled();
  });

  it('counts new, open blocking, and planned work for the inbox tiles', async () => {
    repository.count.mockResolvedValueOnce(4).mockResolvedValueOnce(2).mockResolvedValueOnce(7);

    await expect(service.count()).resolves.toEqual({ new: 4, blocking: 2, planned: 7 });
  });
});
