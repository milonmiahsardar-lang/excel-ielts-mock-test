declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): { get(...args: (string | number | null)[]): Record<string, unknown> | undefined; all(...args: (string | number | null)[]): Record<string, unknown>[]; run(...args: (string | number | null)[]): { changes: number | bigint } };
  }
}
