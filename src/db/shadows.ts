import Dexie from 'dexie';

import { ShadowBookmark } from '@/types';
/**
 * Naviga Shadows IndexedDB 浏览器端本地数据库
 *
 * 数据库: naviga-data
 *
 * 表: shadows
 */

const DB_NAME = 'naviga-data';

class ShadowsDB extends Dexie {
  shadows!: Dexie.Table<ShadowBookmark, string>;

  constructor() {
    super(DB_NAME);

    this.version(1).stores({
      shadows: 'id, parentId, shadowing',
    });

    this.on('versionchange', () => {
      this.close();
    });

    this.on('blocked', () => {
      console.warn('DB upgrade blocked');
    });
  }
}

const db = new ShadowsDB();

const shadowsTable = db.table<ShadowBookmark, string>('shadows');

/** 获取指定 shadow */
export async function getShadow(id: string): Promise<ShadowBookmark | null> {
  return (await shadowsTable.get(id)) || null;
}

/** 获取全部 shadows */
export async function getAllshadows(): Promise<ShadowBookmark[]> {
  return await shadowsTable.toArray();
}

/** 获取指定 id 下的所有shadows */
export async function getShadowsOf(id: string | string[] | null): Promise<ShadowBookmark[]> {
  if (id == null) return [];

  const ids = Array.isArray(id) ? id : [id];
  return await shadowsTable.where('parentId').anyOf(ids).sortBy('createdAt');
}

/** 保存/更新 shadow */
export async function saveShadow(id: string, data: Partial<ShadowBookmark>): Promise<ShadowBookmark> {
  const existed = await shadowsTable.get(id);
  const now = Date.now();

  const record: ShadowBookmark = {
    id,
    shadowing: data?.shadowing ?? existed?.shadowing ?? '',
    parentId: data?.parentId ?? existed?.parentId ?? '',
    index: data?.index ?? existed?.index ?? 0,
    createdAt: existed?.createdAt ?? now,
    UpdatedAt: now ?? existed?.createdAt,
  };

  await shadowsTable.put(record);
  return record;
}

/** 删除指定 shadow */
export async function deleteShadow(id: string): Promise<void> {
  await shadowsTable.delete(id);
}

/** 清空全部 shadows */
export async function clearAllShadows(): Promise<void> {
  await shadowsTable.clear();
}

export default db;
