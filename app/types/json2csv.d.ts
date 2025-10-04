declare module 'json2csv' {
  export function parse<T = any>(data: T | T[], opts?: any): string;
}
