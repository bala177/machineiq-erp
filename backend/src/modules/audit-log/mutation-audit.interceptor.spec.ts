import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { MutationAuditInterceptor } from './mutation-audit.interceptor';
import { auditRequestContext } from './audit-context';

describe('MutationAuditInterceptor', () => {
  it('records a successful mutation and redacts credentials', async () => {
    const auditLogService = { log: jest.fn().mockResolvedValue({}) };
    const interceptor = new MutationAuditInterceptor(auditLogService as any);
    const request = {
      method: 'POST',
      path: '/users',
      originalUrl: '/api/users',
      ip: '127.0.0.1',
      user: { userId: '11111111-1111-4111-a111-111111111111' },
      route: { path: '/users' },
      params: {},
      body: { email: 'user@example.com', password: 'Secret123!' },
    };
    const context = {
      getType: () => 'http',
      getClass: () => ({ name: 'UsersController' }),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    const next = { handle: () => of({ _id: '22222222-2222-4222-a222-222222222222' }) } as CallHandler;

    await lastValueFrom(interceptor.intercept(context, next));

    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create',
        entityType: 'User',
        entityId: '22222222-2222-4222-a222-222222222222',
        newValues: expect.objectContaining({ body: { email: 'user@example.com', password: '[REDACTED]' } }),
      }),
    );
  });

  it('does not audit read requests', async () => {
    const auditLogService = { log: jest.fn() };
    const interceptor = new MutationAuditInterceptor(auditLogService as any);
    const request = { method: 'GET', path: '/users', user: { userId: 'user-id' } };
    const context = {
      getType: () => 'http',
      getClass: () => ({ name: 'UsersController' }),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    await lastValueFrom(interceptor.intercept(context, { handle: () => of([]) } as CallHandler));
    expect(auditLogService.log).not.toHaveBeenCalled();
  });

  it('does not duplicate a domain audit record', async () => {
    const auditLogService = { log: jest.fn() };
    const interceptor = new MutationAuditInterceptor(auditLogService as any);
    const request = { method: 'PATCH', path: '/tasks/id', user: { userId: 'user-id' }, params: { id: 'record-id' }, body: {} };
    const context = {
      getType: () => 'http',
      getClass: () => ({ name: 'TasksController' }),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    const next = {
      handle: () => {
        auditRequestContext.markRecorded();
        return of({});
      },
    } as CallHandler;
    await lastValueFrom(interceptor.intercept(context, next));
    expect(auditLogService.log).not.toHaveBeenCalled();
  });
});
