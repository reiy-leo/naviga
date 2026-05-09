import Dexie from 'dexie';

/** Naviga Favicon IndexedDB 浏览器端本地数据库 */

const DB_NAME = 'naviga-data';

class FaviconDB extends Dexie {
  constructor() {
    super(DB_NAME);

    this.version(1).stores({
      favicons: 'domain, updatedAt',
    });
  }
}

const db = new FaviconDB();

/**
 * Favicons table
 *
 * @type {import('dexie').Table<
 *   {
 *     domain: string;
 *     name: string;
 *     favicon: string;
 *     favIconUrl: string;
 *     url: string;
 *     updatedAt: number;
 *   },
 *   string
 * >}
 */
const faviconsTable = db.table('favicons');

/** 获取指定 domain 的完整记录 */
export async function getFavicon(domain) {
  return (await faviconsTable.get(domain)) || null;
}

/**
 * 保存/更新 favicon 记录
 *
 * @param {string} domain
 * @param {{
 *   name?: string;
 *   favicon: string;
 *   favIconUrl?: string;
 *   url?: string;
 * }} data
 */
export async function saveFavicon(domain, data) {
  const existing = await faviconsTable.get(domain);

  const record = {
    domain,
    name: data.name || existing?.name || '',
    favicon: data.favicon,
    favIconUrl: data.favIconUrl || existing?.favIconUrl || '',
    url: data.url || existing?.url || '',
    updatedAt: Date.now(),
  };

  await faviconsTable.put(record);

  return record;
}

/** 删除指定 domain 的记录 */
export async function deleteFavicon(domain) {
  await faviconsTable.delete(domain);
}

/**
 * 获取所有 favicon 记录
 *
 * 返回: { [domain]: { favicon, favIconUrl, name, url } }
 */
export async function getAllFavicons() {
  const records = await faviconsTable.toArray();

  const map = {};

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
export async function clearAllFavicons() {
  await faviconsTable.clear();
}

export default db;
