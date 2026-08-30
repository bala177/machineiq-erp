import 'reflect-metadata';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter';

function makeHost(url = '/api/test', method = 'GET') {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const request = { url, method };
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
    response,
  };
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('returns the correct status and message for an HttpException', () => {
    const host = makeHost();
    filter.catch(new HttpException('Not found', HttpStatus.NOT_FOUND), host as any);
    expect(host.response.status).toHaveBeenCalledWith(404);
    expect(host.response.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, message: 'Not found' }),
    );
  });

  it('returns 500 and a generic message for an unknown error — never exposes internals', () => {
    const host = makeHost();
    filter.catch(new Error('DB connection timeout — secret config: password=hunter2'), host as any);
    expect(host.response.status).toHaveBeenCalledWith(500);
    const jsonArg = (host.response.json as jest.Mock).mock.calls[0][0];
    expect(jsonArg.statusCode).toBe(500);
    expect(jsonArg.message).toBe('Internal server error');
    // Must not leak the internal error message to the client
    expect(JSON.stringify(jsonArg)).not.toContain('hunter2');
    expect(JSON.stringify(jsonArg)).not.toContain('DB connection');
  });

  it('logs the real error server-side', () => {
    const logSpy = jest.spyOn(Logger.prototype, 'error');
    const host = makeHost();
    const realError = new Error('Real internal detail');
    filter.catch(realError, host as any);
    expect(logSpy).toHaveBeenCalled();
  });

  it('includes the request path in the response', () => {
    const host = makeHost('/api/projects');
    filter.catch(new HttpException('Forbidden', HttpStatus.FORBIDDEN), host as any);
    const jsonArg = (host.response.json as jest.Mock).mock.calls[0][0];
    expect(jsonArg.path).toBe('/api/projects');
  });

  it('handles a thrown string without crashing', () => {
    const host = makeHost();
    expect(() => filter.catch('some string error', host as any)).not.toThrow();
    expect(host.response.status).toHaveBeenCalledWith(500);
  });
});
