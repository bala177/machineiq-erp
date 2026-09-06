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
  let service: FeedbackService;

  beforeEach(() => {
    jest.clearAllMocks();
    config.get.mockReturnValue('true');
    service = new FeedbackService(repository as any, config as any, audit as any);
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
});
