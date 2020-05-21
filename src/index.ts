const noop = () => {}

class Runner {
  public fn: Function
  public prevSibling: null | Runner
  public nextSibling: null | Runner

  public onError: null | Function
  public onSuccess: null | Function
  public onFinish: null | Function

  constructor({ fn } : {
    fn: Function
  }) {
    this.prevSibling = null
    this.nextSibling = null
    this.fn = fn

    this.onError = noop
    this.onSuccess = noop
    this.onFinish = noop
  }

  run(args: any[], ctx: object): void {
    this.fn(args, ctx, {
      abort: () => {
        if (this.onError) this.onError(new Error('testing'))
      },
      back: () => {
        if (this.prevSibling) this.prevSibling.run(args, ctx)
      },
      resume: () => {
        if (this.prevSibling) this.prevSibling.upstream(args, ctx)
      },
      next: () => {
        if (this.nextSibling) this.nextSibling.run(args, ctx)
      }
    })
  }

  setPrevSibling(runner: Runner) {
    this.prevSibling = runner
  }

  setNextSibling(runner: Runner) {
    this.nextSibling = runner
  }

  upstream(args: any[], ctx: object): void {
    if (this.prevSibling) this.prevSibling.upstream(args, ctx)
    else this.fn(args, ctx)
  }
}

export type useFunction = (args: [], ctx: object, actions: object) => void

class Sabar {
  public current: null | Runner
  public ancestor: null | Runner
  public ctx: object

  constructor() {
    this.current = null
    this.ancestor = null
    this.ctx = {}
  }

  use(fn: useFunction) {
    const runner = new Runner({ fn })
    if (!this.ancestor) {
      this.ancestor = runner
    }

    if (this.current) {
      this.current.setNextSibling(runner)
      runner.setPrevSibling(this.current)
    }

    this.current = runner
  }

  start(...args: any[]) {
    if (this.ancestor) this.ancestor.run(args, this.ctx)
  }
}

export default Sabar

const pay = new Sabar()

pay.use((args, ctx, actions) => {
  console.log('args ', args, ctx, actions)
})

pay.start('hello')