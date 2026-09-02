import { AsyncLocalStorage } from 'node:async_hooks';

type AuditRequestState = { recorded: boolean };

const auditRequestStorage = new AsyncLocalStorage<AuditRequestState>();

export const auditRequestContext = {
  run<T>(callback: () => T) {
    return auditRequestStorage.run({ recorded: false }, callback);
  },
  markRecorded() {
    const state = auditRequestStorage.getStore();
    if (state) state.recorded = true;
  },
  wasRecorded() {
    return auditRequestStorage.getStore()?.recorded ?? false;
  },
};
