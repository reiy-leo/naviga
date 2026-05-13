import Dexie from 'dexie';
import type { FaviconRecord } from '../types';

/** Naviga Favicon IndexedDB 浏览器端本地数据库 */

const DB_NAME = 'naviga-data';

class FaviconDB extends Dexie {
  favicons!: Dexie.Table<FaviconRecord & { domain: string; updatedAt: number }, string>;

  constructor() {
    super(DB_NAME);

    this.version(1).stores({
      favicons: 'domain, updatedAt',
    });
  }
}

const db = new FaviconDB();

const faviconsTable = db.table<FaviconRecord & { domain: string; updatedAt: number }, string>('favicons');

/** 获取指定 domain 的完整记录 */
export async function getFavicon(domain: string): Promise<(FaviconRecord & { domain: string }) | undefined> {
  return await faviconsTable.get(domain);
}

/** 保存/更新 favicon 记录 */
export async function saveFavicon(domain: string, data: Partial<FaviconRecord>): Promise<FaviconRecord & { domain: string }> {
  const existing = await faviconsTable.get(domain);

  const record = {
    domain,
    name: data.name || existing?.name || '',
    favicon: data.favicon!,
    favIconUrl: data.favIconUrl || existing?.favIconUrl || '',
    url: data.url || existing?.url || '',
    updatedAt: Date.now(),
  };

  await faviconsTable.put(record);
  return record;
}

/** 删除指定 domain 的记录 */
export async function deleteFavicon(domain: string): Promise<void> {
  await faviconsTable.delete(domain);
}

/** 获取所有 favicon 记录 */
export async function getAllFavicons(): Promise<Record<string, FaviconRecord>> {
  const records = await faviconsTable.toArray();
  const map: Record<string, FaviconRecord> = {};

  for (const record of records) {
    if (record.favicon) {
      map[record.domain] = {
        favicon: record.favicon,
        favIconUrl: record.favIconUrl || '',
        name: record.name || '',
        url: record.url || '',
      };
    }
  }

  return map;
}

/** 清除所有 favicon 记录 */
export async function clearAllFavicons(): Promise<void> {
  await faviconsTable.clear();
}

export default db;
