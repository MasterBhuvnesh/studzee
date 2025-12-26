// bun.d.ts - Type declarations for Bun runtime
declare module 'bun:test' {
  export interface MockFunction<
    T extends (...args: any[]) => any = (...args: any[]) => any,
  > {
    (...args: Parameters<T>): ReturnType<T>;
    mockClear(): void;
    mockReset(): void;
    mockRestore(): void;
    mockImplementation(fn: T): void;
    mockImplementationOnce(fn: T): void;
    mockReturnValue(value: ReturnType<T>): void;
    mockReturnValueOnce(value: ReturnType<T>): void;
    mockResolvedValue(value: Awaited<ReturnType<T>>): void;
    mockResolvedValueOnce(value: Awaited<ReturnType<T>>): void;
    mockRejectedValue(value: any): void;
    mockRejectedValueOnce(value: any): void;
    mock: {
      calls: Parameters<T>[];
      results: Array<{ type: 'return' | 'throw'; value: any }>;
      instances: any[];
    };
  }

  export interface TestContext {
    name: string;
    skip(): void;
    todo(): void;
    only(): void;
  }

  export interface BeforeEachContext {
    name: string;
  }

  export interface AfterEachContext {
    name: string;
  }

  export interface Matchers<T> {
    toBe(expected: T): void;
    toEqual(expected: T): void;
    toStrictEqual(expected: T): void;
    toBeCloseTo(expected: number, precision?: number): void;
    toBeDefined(): void;
    toBeUndefined(): void;
    toBeNull(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeInstanceOf(expected: any): void;
    toContain(expected: any): void;
    toContainEqual(expected: any): void;
    toHaveLength(expected: number): void;
    toHaveProperty(keyPath: string | string[], value?: any): void;
    toMatch(expected: string | RegExp): void;
    toMatchObject(expected: Record<string, any>): void;
    toThrow(expected?: string | RegExp | Error): void;
    toThrowError(expected?: string | RegExp | Error): void;
    toHaveBeenCalled(): void;
    toHaveBeenCalledTimes(expected: number): void;
    toHaveBeenCalledWith(...args: any[]): void;
    toHaveBeenLastCalledWith(...args: any[]): void;
    toHaveBeenNthCalledWith(nthCall: number, ...args: any[]): void;
    toHaveReturnedWith(expected: any): void;
    toHaveLastReturnedWith(expected: any): void;
    toHaveNthReturnedWith(nthCall: number, expected: any): void;
    resolves: Matchers<Awaited<T>>;
    rejects: Matchers<any>;
    not: Matchers<T>;
  }

  export interface Expect {
    <T>(actual: T): Matchers<T>;
    extend(matchers: Record<string, any>): void;
    anything(): any;
    any(constructor: any): any;
    arrayContaining(array: any[]): any;
    objectContaining(object: Record<string, any>): any;
    stringContaining(string: string): any;
    stringMatching(regexp: string | RegExp): any;
  }

  export const expect: Expect;

  export function describe(name: string, fn: () => void): void;
  export function describe(name: string, fn: () => Promise<void>): void;

  export function it(
    name: string,
    fn: (ctx: TestContext) => void | Promise<void>,
  ): void;
  export function it(name: string, fn: () => void | Promise<void>): void;

  export function test(
    name: string,
    fn: (ctx: TestContext) => void | Promise<void>,
  ): void;
  export function test(name: string, fn: () => void | Promise<void>): void;

  export function beforeEach(
    fn: (ctx: BeforeEachContext) => void | Promise<void>,
  ): void;
  export function beforeEach(fn: () => void | Promise<void>): void;

  export function afterEach(
    fn: (ctx: AfterEachContext) => void | Promise<void>,
  ): void;
  export function afterEach(fn: () => void | Promise<void>): void;

  export function beforeAll(fn: () => void | Promise<void>): void;
  export function afterAll(fn: () => void | Promise<void>): void;

  export function mock<
    T extends (...args: any[]) => any = (...args: any[]) => any,
  >(): MockFunction<T>;

  // Aliases
  export { describe as suite, it as test };
}
