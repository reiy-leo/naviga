// workspaces
// id parentId emoji color text createdAt modifiedAt

import Dexie from 'dexie';

/** Naviga Workspaces IndexedDB */

const DB_NAME = 'naviga-data';

interface Workspace {
  id: string;
  parentId: string | null;
  emoji: string;
  color: string;
  text: string;
  createdAt: number;
  modifiedAt: number;
}

class WorkspacesDB extends Dexie {
  workspaces!: Dexie.Table<Workspace, string>;

  constructor() {
    super(DB_NAME);

    this.version(1).stores({
      workspaces: 'id, parentId',
    });
  }
}

const db = new WorkspacesDB();

const workspacesTable = db.table<Workspace, string>('workspaces');

/** 获取单个 workspace */
export async function getWorkspace(id: string): Promise<Workspace | null> {
  return (await workspacesTable.get(id)) || null;
}

/** 添加 workspace */
export async function addWorkspace(data: {
  id: string;
  parentId?: string;
  emoji?: string;
  color?: string;
  text?: string;
}): Promise<Workspace> {
  const now = Date.now();

  const record: Workspace = {
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
export async function updateWorkspace(id: string, data: Partial<Workspace>): Promise<Workspace | null> {
  const existing = await workspacesTable.get(id);

  if (!existing) {
    return null;
  }

  const record: Workspace = {
    ...existing,
    ...data,
    modifiedAt: Date.now(),
  };

  await workspacesTable.put(record);
  return record;
}

/** 删除 workspace */
export async function deleteWorkspace(id: string): Promise<void> {
  await workspacesTable.delete(id);
}

export default db;
