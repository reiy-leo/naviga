// workspaces
// id parentId emoji color text createdAt modifiedAt

import Dexie from 'dexie';

/** Naviga Workspaces IndexedDB */

const DB_NAME = 'naviga-data';

class WorkspacesDB extends Dexie {
  constructor() {
    super(DB_NAME);

    this.version(1).stores({
      workspaces: 'id, parentId',
    });
  }
}

const db = new WorkspacesDB();

/**
 * Workspaces table
 *
 * @type {import('dexie').Table<
 *   {
 *     id: string;
 *     parentId?: string;
 *     emoji?: string;
 *     color?: string;
 *     text?: string;
 *     createdAt?: number;
 *     modifiedAt?: number;
 *   },
 *   string
 * >}
 */
const workspacesTable = db.table('workspaces');

/** 获取单个 workspace */
export async function getWorkspace(id) {
  return (await workspacesTable.get(id)) || null;
}

/**
 * 添加 workspace
 *
 * @param {{
 *   id: string;
 *   parentId?: string;
 *   emoji?: string;
 *   color?: string;
 *   text?: string;
 * }} data
 */
export async function addWorkspace(data) {
  const now = Date.now();

  const record = {
    id: data.id,
    parentId: data.parentId ?? null,
    emoji: data.emoji ?? '',
    color: data.color ?? '',
    text: data.text ?? '',
    createdAt: now,
    modifiedAt: now,
  };

  await workspacesTable.add(record);

  return record;
}

/** 修改 workspace */
export async function updateWorkspace(id, data) {
  const existing = await workspacesTable.get(id);

  if (!existing) {
    return null;
  }

  const record = {
    ...existing,
    ...data,
    modifiedAt: Date.now(),
  };

  await workspacesTable.put(record);

  return record;
}

/** 删除 workspace */
export async function deleteWorkspace(id) {
  await workspacesTable.delete(id);
}

export default db;
