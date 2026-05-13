import Dexie from 'dexie';

import type { FaviconItem } from '@/types';

const DB_NAME = 'naviga-data';

class FaviconsDB extends Dexie {
  favicons!: Dexie.Table<FaviconItem, string>;

  constructor() {
    super(DB_NAME);

    this.version(1).stores({
      bookmarks: 'id, updatedAt',
    });

    // 当前连接被新版本要求关闭
    this.on('versionchange', () => {
      this.close();
    });

    // 升级被其他连接阻塞
    this.on('blocked', () => {});
  }
}

const db = new FaviconsDB();

const faviconsTable = db.table<FaviconItem, string>('favicons');

export async function getFavicon(domain: string): Promise<FaviconItem | null> {
  return (await faviconsTable.get(domain)) || null;
}

export async function saveFavicon(
  domain: string,
  data: Pick<FaviconItem, 'favicon' | 'favIconUrl'> & Partial<FaviconItem>,
): Promise<FaviconItem> {
  const existing = await faviconsTable.get(domain);
  const record: FaviconItem = {
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

export async function deleteFavicon(domain: string): Promise<void> {
  await faviconsTable.delete(domain);
}

export async function getAllFavicons(): Promise<FaviconItem[]> {
  return await faviconsTable.toArray();
}

export async function clearAllFavicons(): Promise<void> {
  await faviconsTable.clear();
}
