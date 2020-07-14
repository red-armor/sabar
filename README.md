# sabar

_A tiny middleware combiner has `back`, `next`, `abort` and `resume` actions_

## Motivation

A action could split into minor action, and every minor action has a connection. such as trigger next one if success, retry from last step, or restart from beginning..

For this purpose, every minor task should comply with a semantically pattern. In `sabar`, the last two params will be `ctx` and `actions`

## Install

```bash
npm i sabar
```

## Simple example

```js
import Sabar from 'sabar'

const payment = new Sabar()

const validateIdentity = (user, ctx, actions) => {
  const falsy = validate(use.identity)
  if (falsy) actions.next()
  else actions.resume()
}

const validateAccount = (user, ctx, actions) => {
  const falsy = isAfford(use.account)
  if (falsy) actions.next()
  else action.resume()
}

payment.use(validateIdentity)
payment.use(validateAccount)

const user = {
  identify: { name: 'charlie' },
  account: 100,
}
payment.start(user)
```

## Usage

### Sabar({ ctx: object, onError?: Function, onSuccess?: Function, onFinish?: Function })

| Property | Description | Type | Required|
| -------- | ----------- | ---- | --- |
| ctx  | Initial value of `ctx` and default as `{}`. It will be shared between middleware | object | no|
| onError  | Triggered when `abort` function is invoked | Function | no|
| onSuccess  | Triggered when there is no `nextSibling` of current running middleware | Function | no|
| onFinish  | Trigger when `onError` or `onSuccess` is invoked | Function | no|

#### Provide initial ctx value

```js
const payment = new Sabar({ ctx: { paymentMethod: 'visa' }})
```

#### use(...args: Sabar | <...T>(...args: [...T, ctx, actions])[] => void)

`use` is to register `fn` to `sabar` instance. `fn` is an variadic function with `ctx` and `actions` tailing params.

```js
const payment = new Sabar({ ctx: { paymentMethod: 'visa' }})

const validateAddress = (args, ctx, actions) => {
  const { location, name } = args
  if (!isValidAddress({ location, name })) {
    return actions.abort()
  }

  actions.next()
}

const validateCard = (args, ctx, actions) => {
  const { cardNumber } = args
  if (!isValidCard({ cardNumber })) {
    return actions.abort()
  }

  actions.next()
}

const applyPayment = payment.use(
  validateAddress,
  validateCard,
)
```

`arg` could be a Sabar object. In this condition, Sabar will copy middleware from arg object.

```js
const job = new Sabar()
job.use(fn)

const nextJob = new Sabar()
nextJob.use(job)

job.start()
nextJob.start()
```

#### start(...args: array[])

`start` will make actions begin running. It `args` will be passing between middleware as heading params.

```js
const job = new Sabar()
job.use(fn)

job.start()
```

### actions

| Property | Description |
| -------- | ----------- |
| next  |  Trigger next middleware |
| back  |  Rerun from last middleware |
| abort  |  Stop middleware running |
| resume  |  Rerun from beginning |