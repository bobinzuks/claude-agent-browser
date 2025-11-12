/**
 * Database Migrations Index
 * Placeholder for future database migration scripts
 */

export interface Migration {
  version: number;
  name: string;
  up: (db: any) => void;
  down: (db: any) => void;
}

export interface Database {
  exec(sql: string): any;
  run(sql: string, params?: any[]): any;
}

export const migrations: Migration[] = [];

export default migrations;
