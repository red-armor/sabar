export type Action = {
  abort: () => void;
  back: () => void;
  next: () => void;
  resume: () => void;
};

export type Fn =
  | ((ctx: object, actions: Action) => void)
  | (<T1>(arg1: T1, ctx: object, actions: Action) => void)
  | (<T1, T2>(arg1: T1, arg2: T2, ctx: object, actions: Action) => void)
  | (<T1, T2, T3>(
      arg1: T1,
      arg2: T2,
      arg3: T3,
      ctx: object,
      actions: Action
    ) => void)
  | (<T1, T2, T3, T4>(
      arg1: T1,
      arg2: T2,
      arg3: T3,
      arg4: T4,
      ctx: object,
      actions: Action
    ) => void);

// export type overloadFnType = {
//   <T1>(arg1: T1, ctx: object, actions: Action): void;
//   <T1, T2>(arg1: T1, arg2: T2, ctx: object, actions: Action): void;
//   <T1, T2, T3>(
//     arg1: T1,
//     arg2: T2,
//     arg3: T3,
//     ctx: object,
//     actions: Action
//   ): void;
//   <T1, T2, T3, T4>(
//     arg1: T1,
//     arg2: T2,
//     arg3: T3,
//     arg4: T4,
//     ctx: object,
//     actions: Action
//   ): void;
// };
