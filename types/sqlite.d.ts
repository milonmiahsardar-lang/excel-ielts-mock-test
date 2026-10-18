declare module "node:sqlite" {
  export function backup(database:DatabaseSync,path:string,options?:{rate?:number}):Promise<number>;
  export class DatabaseSync {
    constructor(path: string, options?: {readOnly?:boolean});
    close():void;
    exec(sql: string): void;
    prepare(sql: string): { iterate(...args:(string | number | null)[]):IterableIterator<Record<string,unknown>>; get(...args: (string | number | null)[]): Record<string, unknown> | undefined; all(...args: (string | number | null)[]): Record<string, unknown>[]; run(...args: (string | number | null)[]): { changes: number | bigint } };
  }
}
