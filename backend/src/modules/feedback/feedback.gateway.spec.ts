import { FeedbackGateway } from './feedback.gateway';

describe('FeedbackGateway', () => {
  const jwt = { verify: jest.fn() };
  let gateway: FeedbackGateway;
  let emit: jest.Mock;
  let to: jest.Mock;

  const socket = (token?: string) => ({
    handshake: { auth: token ? { token } : {}, query: {} },
    join: jest.fn(),
    disconnect: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    emit = jest.fn();
    to = jest.fn().mockReturnValue({ emit });
    gateway = new FeedbackGateway(jwt as any);
    gateway.server = { to } as any;
  });

  it('disconnects a client that presents no token', () => {
    const client = socket();

    gateway.handleConnection(client as any);

    expect(client.disconnect).toHaveBeenCalledWith(true);
    expect(client.join).not.toHaveBeenCalled();
  });

  it('disconnects a client whose token does not verify', () => {
    jwt.verify.mockImplementation(() => { throw new Error('invalid signature'); });
    const client = socket('forged-token');

    gateway.handleConnection(client as any);

    expect(client.disconnect).toHaveBeenCalledWith(true);
    expect(client.join).not.toHaveBeenCalled();
  });

  it('keeps a non-admin out of the admin room', () => {
    jwt.verify.mockReturnValue({ sub: 'user-7', role: 'designer' });
    const client = socket('valid-token');

    gateway.handleConnection(client as any);

    expect(client.join).toHaveBeenCalledWith('feedback:user:user-7');
    expect(client.join).not.toHaveBeenCalledWith('feedback:admins');
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('puts an admin in the admin room as well as their own', () => {
    jwt.verify.mockReturnValue({ sub: 'admin-1', role: 'admin' });
    const client = socket('valid-token');

    gateway.handleConnection(client as any);

    expect(client.join).toHaveBeenCalledWith('feedback:user:admin-1');
    expect(client.join).toHaveBeenCalledWith('feedback:admins');
  });

  it('signals admins without carrying any feedback content', () => {
    gateway.signalAdmins();

    expect(to).toHaveBeenCalledWith('feedback:admins');
    expect(emit).toHaveBeenCalledWith('feedback:changed', { scope: 'admin' });
  });

  it('signals a single submitter in their own room', () => {
    gateway.signalUser('user-7');

    expect(to).toHaveBeenCalledWith('feedback:user:user-7');
    expect(emit).toHaveBeenCalledWith('feedback:changed', { scope: 'mine' });
  });

  it('ignores a signal for a missing submitter', () => {
    gateway.signalUser('');

    expect(to).not.toHaveBeenCalled();
  });
});
