import { isFunction } from './utils';

class Runner {
  public fn: Function;
  public ancestor: null | Runner;
  public prevSibling: null | Runner;
  public nextSibling: null | Runner;

  public onError: undefined | Function;
  public onSuccess: undefined | Function;
  public onFinish: undefined | Function;

  constructor({
    fn,
    ancestor,
    onError,
    onSuccess,
    onFinish,
  }: {
    fn: Function;
    ancestor: null | Runner;
    onError?: Function;
    onSuccess?: Function;
    onFinish?: Function;
  }) {
    this.prevSibling = null;
    this.nextSibling = null;
    this.fn = fn;
    this.ancestor = ancestor;

    this.onError = onError;
    this.onSuccess = onSuccess;
    this.onFinish = onFinish;
  }

  run(options: any[]): void {
    const len = this.fn.length;
    let args = options.concat({
      abort: () => {
        if (isFunction(this.onError)) (this.onError as Function)();
        if (isFunction(this.onFinish)) (this.onFinish as Function)();
      },
      back: () => {
        if (this.prevSibling) this.prevSibling.run(options);
      },
      resume: () => {
        if (this.prevSibling) this.prevSibling.upstream(options);
      },
      next: () => {
        if (this.nextSibling) {
          this.nextSibling.run(options);
          return;
        }

        if (isFunction(this.onSuccess)) (this.onSuccess as Function)();
        if (isFunction(this.onFinish)) (this.onFinish as Function)();
      },
    });

    if (this.nextSibling) {
      // If `fn` is not the last function:
      //   1. fn require 2 params, then `callee` will be not passing in.
      //   2. fn require 1 params, then only `actions` will be passing in
      if (len === 2) args = args.slice(-2);
      if (len === 1) args = args.slice(-1);
    } else {
      // If `fn` is the last function:
      //   1. `actions` will not be append to `args`
      if (len === 2 || len === 1) args = args.slice(0, -1);
    }
    this.fn.apply(this, args);
  }

  setPrevSibling(runner: Runner) {
    this.prevSibling = runner;
  }

  setNextSibling(runner: Runner) {
    this.nextSibling = runner;
  }

  upstream(options: any[]): void {
    if (this.prevSibling) this.prevSibling.upstream(options);
    else this.run(options);
  }
}

export type actions = {
  abort: () => void;
  back: () => void;
  next: () => void;
  resume: () => void;
};

export type fnType =
  | ((ctx: object, actions: actions) => void)
  | (<T1>(arg1: T1, ctx: object, actions: actions) => void)
  | (<T1, T2>(arg1: T1, arg2: T2, ctx: object, actions: actions) => void)
  | (<T1, T2, T3>(
      arg1: T1,
      arg2: T2,
      arg3: T3,
      ctx: object,
      actions: actions
    ) => void)
  | (<T1, T2, T3, T4>(
      arg1: T1,
      arg2: T2,
      arg3: T3,
      arg4: T4,
      ctx: object,
      actions: actions
    ) => void);

// export type overloadFnType = {
//   <T1>(arg1: T1, ctx: object, actions: actions): void;
//   <T1, T2>(arg1: T1, arg2: T2, ctx: object, actions: actions): void;
//   <T1, T2, T3>(
//     arg1: T1,
//     arg2: T2,
//     arg3: T3,
//     ctx: object,
//     actions: actions
//   ): void;
//   <T1, T2, T3, T4>(
//     arg1: T1,
//     arg2: T2,
//     arg3: T3,
//     arg4: T4,
//     ctx: object,
//     actions: actions
//   ): void;
// };

class Sabar {
  public current: null | Runner;
  public ancestor: null | Runner;
  public ctx: object | Function;

  constructor(options?: { ctx: object }) {
    this.current = null;
    this.ancestor = null;
    this.ctx = options ? options.ctx : {};
  }

  // private useOne<T1>(
  //   fn: (arg1: T1, ctx: object, actions: actions) => void
  // ): void;
  // private useOne<T1, T2>(
  //   fn: (arg1: T1, arg2: T2, ctx: object, actions: actions) => void
  // ): void;
  // private useOne<T1, T2, T3>(
  //   fn: (arg1: T1, arg2: T2, arg3: T3, ctx: object, actions: actions) => void
  // ): void;
  // private useOne<T1, T2, T3, T4>(
  //   fn: (
  //     arg1: T1,
  //     arg2: T2,
  //     arg3: T3,
  //     arg4: T4,
  //     ctx: object,
  //     actions: actions
  //   ) => void
  // ): void;
  private useOne(fn: fnType): void {
    const runner = new Runner({ fn, ancestor: this.ancestor });
    if (!this.ancestor) {
      this.ancestor = runner;
    }

    if (this.current) {
      this.current.setNextSibling(runner);
      runner.setPrevSibling(this.current);
    }

    this.current = runner;
  }

  public use(...args: fnType[]): void {
    args.forEach(fn => this.useOne(fn));
  }

  public start(...args: any[]): object {
    let contextArg = this.ctx;
    if (typeof contextArg === 'function')
      contextArg = (this.ctx as Function).call(null);

    if (this.ancestor) this.ancestor.run(args.concat(contextArg));
    return contextArg;
  }
}

export default Sabar;
