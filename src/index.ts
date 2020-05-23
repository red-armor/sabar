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
    this.fn.apply(
      this,
      options.concat({
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
      })
    );
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

class Sabar {
  public current: null | Runner;
  public ancestor: null | Runner;
  public ctx: object;

  constructor(options?: { ctx: object }) {
    this.current = null;
    this.ancestor = null;
    this.ctx = options ? options.ctx : {};
  }

  use(fn) {
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

  start(...args: any[]) {
    if (this.ancestor) this.ancestor.run(args.concat(this.ctx));
  }
}

export default Sabar;
