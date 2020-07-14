import Sabar from '../src';

testUse(true);
testUse(false);

function testUse(useOne: boolean) {
  const prefix = useOne ? '[useOne]:' : '[useMultiple]:';
  describe(`${prefix} Test actions`, () => {
    it('next middleware will not be triggered automatically', () => {
      const job = new Sabar();
      const mockCallback1 = jest.fn((str, ctx) => {
        ctx.result = `${str}_mock1`;
      });
      const mockCallback2 = jest.fn((str, ctx) => {
        ctx.result = `${str}_mock2`;
      });
      if (useOne) {
        job.use(mockCallback1);
        job.use(mockCallback2);
      } else {
        job.use(mockCallback1, mockCallback2);
      }

      job.start('first');

      expect(mockCallback1.mock.calls.length).toBe(1);
      expect(mockCallback2.mock.calls.length).toBe(0);
    });

    it('`next` to trigger next middleware', () => {
      const job = new Sabar();
      const mockCallback1 = jest.fn((str, ctx, actions) => {
        ctx.result = `${str}_mock1`;
        actions.next();
      });
      const mockCallback2 = jest.fn((str, ctx) => {
        ctx.result = `${str}_mock2`;
      });

      if (useOne) {
        job.use(mockCallback1);
        job.use(mockCallback2);
      } else {
        job.use(mockCallback1, mockCallback2);
      }

      job.start('first');

      expect(mockCallback1.mock.calls.length).toBe(1);
      expect(mockCallback2.mock.calls.length).toBe(1);
    });

    it('`back` to re-run from last middleware', () => {
      const job = new Sabar();
      let falsy = false;
      const mockCallback1 = jest.fn((str, ctx, actions) => {
        ctx.result = `${str}_mock1`;
        actions.next();
      });
      const mockCallback2 = jest.fn((str, ctx, actions) => {
        ctx.result = `${str}_mock2`;
        if (!falsy) {
          falsy = true; // should be placed before action.back(), or will go into loop
          actions.back();
          return;
        }
        actions.next();
      });

      if (useOne) {
        job.use(mockCallback1);
        job.use(mockCallback2);
      } else {
        job.use(mockCallback1, mockCallback2);
      }

      job.start('first');

      expect(mockCallback1.mock.calls.length).toBe(2);
      expect(mockCallback2.mock.calls.length).toBe(2);
    });

    it('`resume` to re-run from ancestor', () => {
      const job = new Sabar({ ctx: { a: 1 } });
      let falsy = false;

      const mockCallback1 = jest.fn((...args) => {
        const length = args.length;
        const actions = args[length - 1];
        actions.next();
      });

      const mockCallback2 = jest.fn((...args) => {
        const length = args.length;
        const actions = args[length - 1];
        actions.next();
      });

      const mockCallback3 = jest.fn((...args) => {
        const length = args.length;
        const actions = args[length - 1];
        if (falsy) actions.next();
        else {
          falsy = true;
          actions.resume();
        }
      });

      const mockCallback4 = jest.fn((...args) => {
        const length = args.length;
        const actions = args[length - 1];
        actions.next();
      });

      if (useOne) {
        job.use(mockCallback1);
        job.use(mockCallback2);
        job.use(mockCallback3);
        job.use(mockCallback4);
      } else {
        job.use(mockCallback1, mockCallback2, mockCallback3, mockCallback4);
      }
      job.start();

      expect(mockCallback1.mock.calls.length).toBe(2);
      expect(mockCallback2.mock.calls.length).toBe(2);
      expect(mockCallback3.mock.calls.length).toBe(2);
      expect(mockCallback4.mock.calls.length).toBe(1);
    });
  });

  describe(`${prefix} Basic functionalities`, () => {
    it('middleware will be called after `start`', () => {
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

    it('`start` with no args', () => {
      const job = new Sabar({
        ctx: { result: '' },
      });
      const mockCallback1 = jest.fn((ctx, actions) => {
        ctx.result = `mock1`;
        actions.next();
      });
      const mockCallback2 = jest.fn(ctx => {
        ctx.result = `mock2`;
      });

      if (useOne) {
        job.use(mockCallback1);
        job.use(mockCallback2);
      } else {
        job.use(mockCallback1, mockCallback2);
      }

      job.start();

      expect(mockCallback1.mock.calls.length).toBe(1);
      expect(mockCallback2.mock.calls.length).toBe(1);
    });

    it('Basically, the first parameter should be with same value', () => {
      const job = new Sabar();
      const mockCallback1 = jest.fn((str, ctx, actions) => {
        ctx.result = `${str}_mock1`;
        actions.next();
      });
      const mockCallback2 = jest.fn((str, ctx, actions) => {
        ctx.result = `${str}_mock2`;
        actions.next();
      });
      const mockCallback3 = jest.fn((str, ctx) => {
        ctx.result = `${str}_mock3`;
      });

      if (useOne) {
        job.use(mockCallback1);
        job.use(mockCallback2);
        job.use(mockCallback3);
      } else {
        job.use(mockCallback1, mockCallback2, mockCallback3);
      }
      job.start('first');

      const args1 = mockCallback1.mock.calls[0] as any[];
      const args2 = mockCallback2.mock.calls[0] as any[];
      const args3 = mockCallback3.mock.calls[0] as any[];
      expect(args1[0]).toEqual('first');
      expect(args2[0]).toEqual('first');
      expect(args3[0]).toEqual('first');
    });

    it('ctx is shared by middleware', () => {
      const job = new Sabar({
        ctx: { result: {} },
      });
      const mockCallback1 = jest.fn((str, ctx, actions) => {
        ctx.result.first = `${str}_mock1`;
        actions.next();
      });
      const mockCallback2 = jest.fn((str, ctx, actions) => {
        ctx.result.second = `${str}_mock2`;
        actions.next();
      });
      const mockCallback3 = jest.fn((str, ctx) => {
        ctx.result.third = `${str}_mock3`;
      });

      if (useOne) {
        job.use(mockCallback1);
        job.use(mockCallback2);
        job.use(mockCallback3);
      } else {
        job.use(mockCallback1, mockCallback2, mockCallback3);
      }
      job.start('first');

      const args1 = mockCallback1.mock.calls[0] as any[];
      const args2 = mockCallback2.mock.calls[0] as any[];
      const args3 = mockCallback3.mock.calls[0] as any[];
      expect(args1[1]).toEqual({
        result: {
          first: 'first_mock1',
          second: 'first_mock2',
          third: 'first_mock3',
        },
      });
      expect(args2[1]).toEqual({
        result: {
          first: 'first_mock1',
          second: 'first_mock2',
          third: 'first_mock3',
        },
      });
      expect(args3[1]).toEqual({
        result: {
          first: 'first_mock1',
          second: 'first_mock2',
          third: 'first_mock3',
        },
      });
    });
  });

  describe(`${prefix} args`, () => {
    it('fn is not last chain function and with two params', () => {
      const job = new Sabar({
        ctx: { result: {} },
      });
      const mockCallback1 = jest.fn((str, ctx, actions) => {
        ctx.result.first = `${str}_mock1`;
        actions.next();
      });
      const mockCallback2 = jest.fn((ctx, actions) => {
        ctx.result.second = `mock2`;
        actions.next();
      });
      const mockCallback3 = jest.fn((str, ctx) => {
        ctx.result.third = `${str}_mock3`;
      });

      if (useOne) {
        job.use(mockCallback1);
        job.use(mockCallback2);
        job.use(mockCallback3);
      } else {
        job.use(mockCallback1, mockCallback2, mockCallback3);
      }
      job.start('first');

      const args1 = mockCallback1.mock.calls[0] as any[];
      const args2 = mockCallback2.mock.calls[0] as any[];
      const args3 = mockCallback3.mock.calls[0] as any[];
      expect(args1[1]).toEqual({
        result: {
          first: 'first_mock1',
          second: 'mock2',
          third: 'first_mock3',
        },
      });
      expect(args2[0]).toEqual({
        result: {
          first: 'first_mock1',
          second: 'mock2',
          third: 'first_mock3',
        },
      });
      const keys = Object.keys(args2[1]);

      expect(keys).toEqual(['abort', 'back', 'resume', 'next']);

      expect(args3[1]).toEqual({
        result: {
          first: 'first_mock1',
          second: 'mock2',
          third: 'first_mock3',
        },
      });
    });

    it('fn is not last chain function and with one param', () => {
      const job = new Sabar({
        ctx: { result: {} },
      });
      const mockCallback1 = jest.fn((str, ctx, actions) => {
        ctx.result.first = `${str}_mock1`;
        actions.next();
      });
      const mockCallback2 = jest.fn(actions => {
        actions.next();
      });
      const mockCallback3 = jest.fn((str, ctx) => {
        ctx.result.third = `${str}_mock3`;
      });

      if (useOne) {
        job.use(mockCallback1);
        job.use(mockCallback2);
        job.use(mockCallback3);
      } else {
        job.use(mockCallback1, mockCallback2, mockCallback3);
      }
      job.start('first');

      const args1 = mockCallback1.mock.calls[0] as any[];
      const args2 = mockCallback2.mock.calls[0] as any[];
      const args3 = mockCallback3.mock.calls[0] as any[];
      expect(args1[1]).toEqual({
        result: {
          first: 'first_mock1',
          third: 'first_mock3',
        },
      });
      const keys = Object.keys(args2[0]);
      expect(keys).toEqual(['abort', 'back', 'resume', 'next']);

      expect(args3[1]).toEqual({
        result: {
          first: 'first_mock1',
          third: 'first_mock3',
        },
      });
    });

    it('fn is the last chain function and with one param, its value should be context', () => {
      const job = new Sabar({
        ctx: { result: {} },
      });
      const mockCallback1 = jest.fn((str, ctx, actions) => {
        ctx.result.first = `${str}_mock1`;
        actions.next();
      });
      const mockCallback2 = jest.fn(actions => {
        actions.next();
      });

      const mockCallback3 = jest.fn(str => {});

      if (useOne) {
        job.use(mockCallback1);
        job.use(mockCallback2);
        job.use(mockCallback3);
      } else {
        job.use(mockCallback1, mockCallback2, mockCallback3);
      }
      job.start('first');

      const args1 = mockCallback1.mock.calls[0] as any[];
      const args2 = mockCallback2.mock.calls[0] as any[];
      const args3 = mockCallback3.mock.calls[0] as any[];
      expect(args1[1]).toEqual({
        result: {
          first: 'first_mock1',
        },
      });
      const keys = Object.keys(args2[0]);
      expect(keys).toEqual(['abort', 'back', 'resume', 'next']);

      expect(args3[0]).toEqual({ result: { first: 'first_mock1' } });
    });

    it('fn is the last chain function and with two params', () => {
      const job = new Sabar({
        ctx: { result: {} },
      });
      const mockCallback1 = jest.fn((str, ctx, actions) => {
        ctx.result.first = `${str}_mock1`;
        actions.next();
      });
      const mockCallback2 = jest.fn(actions => {
        actions.next();
      });
      const mockCallback3 = jest.fn((str, ctx) => {
        ctx.result.third = `${str}_mock3`;
      });

      if (useOne) {
        job.use(mockCallback1);
        job.use(mockCallback2);
        job.use(mockCallback3);
      } else {
        job.use(mockCallback1, mockCallback2, mockCallback3);
      }
      job.start('first');

      const args1 = mockCallback1.mock.calls[0] as any[];
      const args2 = mockCallback2.mock.calls[0] as any[];
      const args3 = mockCallback3.mock.calls[0] as any[];
      expect(args1[1]).toEqual({
        result: {
          first: 'first_mock1',
          third: 'first_mock3',
        },
      });
      const keys = Object.keys(args2[0]);
      expect(keys).toEqual(['abort', 'back', 'resume', 'next']);
      expect(args3[0]).toEqual('first');

      expect(args3[1]).toEqual({
        result: {
          first: 'first_mock1',
          third: 'first_mock3',
        },
      });
    });
  });

  describe(`${prefix} return value`, () => {
    it('Basically, `ctx` will be return after start', () => {
      const job = new Sabar({
        ctx: { result: {} },
      });
      const mockCallback1 = jest.fn((str, ctx, actions) => {
        ctx.result.first = `${str}_mock1`;
        actions.next();
      });
      const mockCallback2 = jest.fn(actions => {
        actions.next();
      });
      const mockCallback3 = jest.fn((str, ctx) => {
        ctx.result.third = `${str}_mock3`;
      });

      if (useOne) {
        job.use(mockCallback1);
        job.use(mockCallback2);
        job.use(mockCallback3);
      } else {
        job.use(mockCallback1, mockCallback2, mockCallback3);
      }
      const result = job.start('first');
      expect(result).toEqual({
        result: {
          first: 'first_mock1',
          third: 'first_mock3',
        },
      });
    });
  });

  describe(`${prefix} throw error`, () => {
    it('try catch exception on sync mode', () => {
      const job = new Sabar({
        ctx: {
          result: {},
          name: 'job',
        },
      });
      const mockCallback1 = jest.fn((str, ctx, actions) => {
        ctx.result.first = `${str}_mock1`;
        actions.next();
      });
      const mockCallback2 = jest.fn(actions => {
        throw new Error('error in callback2');
        // eslint-disable-next-line
        actions.next();
      });
      const mockCallback3 = jest.fn((str, ctx, actions) => {
        ctx.result.third = `${str}_mock3`;
        actions.next();
      });

      expect(() => {
        if (useOne) {
          job.use(mockCallback1);
          job.use(mockCallback2);
          job.use(mockCallback3);
        } else {
          job.use(mockCallback1, mockCallback2, mockCallback3);
        }
        job.start('first');
      }).toThrowError('error in callback2');
    });
  });

  describe(`${prefix} use Sabar object`, () => {
    it('Basically, sabar as use arg', () => {
      const job = new Sabar({
        ctx: {
          result: {},
          name: 'job',
        },
      });
      const mockCallback1 = jest.fn((str, ctx, actions) => {
        ctx.result.first = `${str}_mock1`;
        actions.next();
      });
      const mockCallback2 = jest.fn(actions => {
        actions.next();
      });
      const mockCallback3 = jest.fn((str, ctx, actions) => {
        ctx.result.third = `${str}_mock3`;
        actions.next();
      });

      const mockCallback4 = jest.fn((str, ctx) => {
        ctx.result.forth = `${str}_mock4`;
      });

      const nextJob = new Sabar({
        ctx: {
          result: {},
          name: 'nextJob',
        },
      });

      if (useOne) {
        job.use(mockCallback1);
        job.use(mockCallback2);
        job.use(mockCallback3);

        nextJob.use(job);
        nextJob.use(mockCallback4);
      } else {
        job.use(mockCallback1, mockCallback2, mockCallback3);
        nextJob.use(job, mockCallback4);
      }
      const result = job.start('first');
      const nextResult = nextJob.start('first');

      expect(result).toEqual({
        name: 'job',
        result: {
          first: 'first_mock1',
          third: 'first_mock3',
        },
      });

      expect(nextResult).toEqual({
        name: 'nextJob',
        result: {
          first: 'first_mock1',
          third: 'first_mock3',
          forth: 'first_mock4',
        },
      });
    });
  });
}
