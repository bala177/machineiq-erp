import { Role } from '../common/enums';
import { RolesGuard } from './roles.guard';

describe('RolesGuard configurable roles', () => {
  const context = (role: string) => ({
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
  }) as any;

  it('accepts a matching fixed persona', () => {
    const reflector = { getAllAndOverride: (key: string) => key === 'roles' ? [Role.ADMIN] : undefined } as any;
    expect(new RolesGuard(reflector).canActivate(context('admin'))).toBe(true);
  });

  it('lets a custom role continue only when a permission guard is declared', () => {
    const reflector = { getAllAndOverride: (key: string) => key === 'roles' ? [Role.ADMIN] : ['foundation.manage'] } as any;
    expect(new RolesGuard(reflector).canActivate(context('operations_lead'))).toBe(true);
  });

  it('rejects a custom role from fixed-role-only routes', () => {
    const reflector = { getAllAndOverride: (key: string) => key === 'roles' ? [Role.ADMIN] : undefined } as any;
    expect(new RolesGuard(reflector).canActivate(context('operations_lead'))).toBe(false);
  });
});
