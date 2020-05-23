import Sabar from '../src';

describe('first', () => {
  it('one middleware', () => {
    const job = new Sabar();
    const mockCallback = jest.fn(() => {});

    job.use(mockCallback);
    job.start('first');

    expect(mockCallback.mock.calls.length).toBe(1);
    expect(mockCallback.mock.calls[0].length).toBe(3);
    const args = mockCallback.mock.calls[0] as any[];
    expect(args[0]).toEqual('first');
    expect(args[1]).toEqual({});
  });

  it('one middleware', () => {
    const job = new Sabar();
    const mockCallback1 = jest.fn((str, ctx) => {
      ctx.result = `${str}_mock1`;
    });
    const mockCallback2 = jest.fn((str, ctx) => {
      ctx.result = `${str}_mock2`;
    });

    job.use(mockCallback1);
    job.use(mockCallback2);
    job.start('first');

    expect(mockCallback1.mock.calls.length).toBe(1);
    expect(mockCallback2.mock.calls.length).toBe(1);
  });
});
