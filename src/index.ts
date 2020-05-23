const noop = () => {};

class Runner {
  public fn: Function;
  public prevSibling: null | Runner;
  public nextSibling: null | Runner;

  public onError: null | Function;
  public onSuccess: null | Function;
  public onFinish: null | Function;

  constructor({ fn }: { fn: Function }) {
    this.prevSibling = null;
    this.nextSibling = null;
    this.fn = fn;

    this.onError = noop;
    this.onSuccess = noop;
    this.onFinish = noop;
  }

  run(options: any[]): void {
    this.fn.apply(
      this,
      options.concat({
        abort: () => {
          if (this.onError) this.onError(new Error('testing'));
        },
        back: () => {
          if (this.prevSibling) this.prevSibling.run(options);
        },
        resume: () => {
          if (this.prevSibling) this.prevSibling.upstream(options);
        },
        next: () => {
          if (this.nextSibling) this.nextSibling.run(options);
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
    else this.fn.apply(this, options);
  }
}

export type useFunction = (args: [], ctx: object, actions: object) => void;

class Sabar {
  public current: null | Runner;
  public ancestor: null | Runner;
  public ctx: object;

  constructor(options?: { ctx: object }) {
    this.current = null;
    this.ancestor = null;
    this.ctx = options ? options.ctx : {};
  }

  use(fn: useFunction) {
    const runner = new Runner({ fn });
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
