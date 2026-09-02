import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { from, mergeMap, Observable } from 'rxjs';
import { AuditLogService } from './audit-log.service';
import { auditRequestContext } from './audit-context';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const ACTION_BY_METHOD: Record<string, string> = {
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
};
const ENTITY_BY_CONTROLLER: Record<string, string> = {
  Auth: 'Account',
  DocumentTypes: 'Document Type',
  MachineTemplates: 'Machine Template',
  Organization: 'Organization',
  Permissions: 'Permission',
  Procurement: 'Procurement Item',
};
const SENSITIVE_KEY = /password|secret|token|authorization|cookie|credential/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function safeValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[nested data omitted]';
  if (typeof value === 'string') return value.length > 500 ? `[string omitted: ${value.length} characters]` : value;
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => safeValue(item, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, SENSITIVE_KEY.test(key) ? '[REDACTED]' : safeValue(item, depth + 1)]));
  }
  return value;
}

function stableUuid(value: string) {
  const hash = createHash('sha256').update(value).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

function entityName(controllerName: string) {
  const controller = controllerName.replace(/Controller$/, '') || 'Application';
  if (ENTITY_BY_CONTROLLER[controller]) return ENTITY_BY_CONTROLLER[controller];
  return controller.endsWith('ies') ? `${controller.slice(0, -3)}y` : controller.endsWith('s') ? controller.slice(0, -1) : controller;
}

@Injectable()
export class MutationAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MutationAuditInterceptor.name);

  constructor(private auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const request = context.switchToHttp().getRequest();
    if (!MUTATION_METHODS.has(request.method) || !request.user?.userId) return next.handle();

    return new Observable((subscriber) =>
      auditRequestContext.run(() =>
        next
          .handle()
          .pipe(
            mergeMap((response) => {
              if (auditRequestContext.wasRecorded()) return from(Promise.resolve(response));
              const candidateId = response?._id ?? response?.id ?? request.params?.id;
              const entityId = typeof candidateId === 'string' && UUID.test(candidateId) ? candidateId : stableUuid(`${request.method}:${request.route?.path ?? request.path}`);
              const entityType = entityName(context.getClass().name);
              return from(
                this.auditLogService
                  .log({
                    action: ACTION_BY_METHOD[request.method] ?? 'update',
                    entityType,
                    entityId,
                    performedBy: request.user.userId,
                    ipAddress: request.ip,
                    newValues: {
                      path: request.originalUrl?.split('?')[0] ?? request.path,
                      params: safeValue(request.params),
                      body: safeValue(request.body),
                    },
                  })
                  .then(() => response)
                  .catch((error) => {
                    this.logger.error(`Failed to record ${request.method} ${request.path}`, error?.stack);
                    throw error;
                  }),
              );
            }),
          )
          .subscribe(subscriber),
      ),
    );
  }
}
