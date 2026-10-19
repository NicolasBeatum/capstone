import {
  emptyPlanner,
  parsePlanner,
  parsePlannerJson,
  type PlannerDocument,
  type PlannerPersistence,
} from '../application/plannerStore.ts';
export interface PlannerSqlite {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string): Promise<T | null>;
  getAllAsync<T>(sql: string): Promise<T[]>;
  runAsync(sql: string, ...params: (string | number)[]): Promise<unknown>;
  withExclusiveTransactionAsync(action: (tx: PlannerSqlite) => Promise<void>): Promise<void>;
}
export async function createPlannerSqlitePersistence(
  db: PlannerSqlite,
  remove: () => Promise<void>,
  close?: () => Promise<void>,
): Promise<PlannerPersistence> {
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS planner_state (id INTEGER PRIMARY KEY CHECK(id=1),content TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS planner_activity (id TEXT PRIMARY KEY,content TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS planner_receipt (id TEXT PRIMARY KEY,content TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS planner_import (id TEXT PRIMARY KEY);`,
  );
  async function read(tx: PlannerSqlite): Promise<PlannerDocument> {
    const state = await tx.getFirstAsync<{ content: string }>(
      'SELECT content FROM planner_state WHERE id=1',
    );
    const contents = async (table: string) =>
      (await tx.getAllAsync<{ content: string }>(`SELECT content FROM ${table}`)).map((r) =>
        parsePlannerJson(r.content)
      );
    return parsePlanner({
      ...(state ? parsePlannerJson(state.content) as object : emptyPlanner()),
      activities: await contents('planner_activity'),
      receipts: await contents('planner_receipt'),
      imports: (await tx.getAllAsync<{ id: string }>('SELECT id FROM planner_import')).map((r) =>
        r.id
      ),
    });
  }
  return {
    async read() {
      let result = emptyPlanner();
      await db.withExclusiveTransactionAsync(async (tx) => {
        result = await read(tx);
      });
      return result;
    },
    async update(transform) {
      let result = emptyPlanner();
      await db.withExclusiveTransactionAsync(async (tx) => {
        result = parsePlanner(transform(await read(tx)));
        const { activities, receipts, imports, ...state } = result;
        await tx.runAsync(
          'INSERT OR REPLACE INTO planner_state(id,content) VALUES(1,?)',
          JSON.stringify(state),
        );
        await tx.execAsync(
          'DELETE FROM planner_activity; DELETE FROM planner_receipt; DELETE FROM planner_import;',
        );
        for (const item of activities) {
          await tx.runAsync(
            'INSERT INTO planner_activity(id,content) VALUES(?,?)',
            item.id,
            JSON.stringify(item),
          );
        }
        for (const item of receipts) {
          await tx.runAsync(
            'INSERT INTO planner_receipt(id,content) VALUES(?,?)',
            item.requestId,
            JSON.stringify(item),
          );
        }
        for (const item of imports) {
          await tx.runAsync('INSERT INTO planner_import(id) VALUES(?)', item);
        }
      });
      return result;
    },
    remove,
    close,
  };
}
export async function unlockPlannerDatabase(
  db: Pick<PlannerSqlite, 'execAsync' | 'getFirstAsync'>,
  key: string,
): Promise<void> {
  if (!/^[a-f0-9]{64}$/i.test(key)) {
    throw new Error('No se pudo leer la clave cifrada del horario.');
  }
  const cipher = await db.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version;');
  if (!cipher?.cipher_version) {
    throw new Error('El horario necesita un development build Android con SQLCipher.');
  }
  await db.execAsync(`PRAGMA key = "x'${key}'";`);
  await db.getFirstAsync('SELECT count(*) FROM sqlite_master;');
}
