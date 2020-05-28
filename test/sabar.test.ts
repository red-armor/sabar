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
}
