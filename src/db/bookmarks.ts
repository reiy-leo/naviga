import Dexie from 'dexie';

import type { Bookmark } from '../types';

/**
 * Naviga Bookmarks IndexedDB 浏览器端本地数据库
 *
 * 数据库: naviga-data
 *
 * 表: bookmarks
 */

const DB_NAME = 'naviga-data';

class BookmarksDB extends Dexie {
  bookmarks!: Dexie.Table<Bookmark, string>;

  constructor() {
    super(DB_NAME);

    this.version(1).stores({
      /**
       * Id: bookmark id parentId: 父文件夹 id type: folder | bookmark title: 标题 url: 书签地址 index: 排序索引 createdAt: 创建时间
       * updatedAt: 更新时间
       */
      bookmarks: 'id, parentId',
    });

    // 当前连接被新版本要求关闭
    this.on('versionchange', () => {
      this.close();
    });

    // 升级被其他连接阻塞
    this.on('blocked', () => {
      console.warn('DB upgrade blocked');
    });
  }
}

const db = new BookmarksDB();

const bookmarksTable = db.table<Bookmark, string>('bookmarks');

/** 获取指定 bookmark */
export async function getBookmark(id: string): Promise<Bookmark | null> {
  return (await bookmarksTable.get(id)) || null;
}

/** 获取全部 bookmarks */
export async function getAllBookmarks(): Promise<Bookmark[]> {
  return await bookmarksTable.toArray();
}

/** 获取指定 parentId 下的 bookmarks */
export async function getBookmarksByParent(parentId: string | null = null): Promise<Bookmark[]> {
  if (parentId === null) {
    return await bookmarksTable.filter((item: Bookmark) => !item.parentId).sortBy('index');
  }

  return await bookmarksTable.where('parentId').equals(parentId).sortBy('index');
}

/** 保存/更新 bookmark */
export async function saveBookmark(id: string, data: Partial<Bookmark>): Promise<Bookmark> {
  const existing = await bookmarksTable.get(id);
  const now = Date.now();

  const record: Bookmark = {
    id,
    parentId: data.parentId ?? existing?.parentId ?? null,
    syncing: true,
    title: data.title ?? existing?.title ?? '',
    url: data.url ?? existing?.url ?? '',
    index: data.index ?? existing?.index ?? 0,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await bookmarksTable.put(record);
  return record;
}

/** 删除指定 bookmark */
export async function deleteBookmark(id: string): Promise<void> {
  await bookmarksTable.delete(id);
}

/** 获取文件夹及其所有子项（递归） */
export async function getWithAllDescendents(id: string): Promise<Bookmark[]> {
  const result: Bookmark[] = [];

  async function traverse(parentId: string): Promise<void> {
    const children = await bookmarksTable.where('parentId').equals(parentId).toArray();
    if (children.length === 0) return;

    for (const item of children) {
      result.push(item);
      await traverse(item.id);
    }
  }

  const rootFolder = await bookmarksTable.get(id);
  if (!rootFolder) return [];
  result.push(rootFolder);

  await traverse(id);
  return result;
}

export async function getSubTree(id: string): Promise<Bookmark | null> {
  const items = await getWithAllDescendents(id);

  if (!items.length) return null;

  const map = new Map(items.map((item) => [item.id, { ...item, children: [] as Bookmark[] }]));
  let root: Bookmark | null = null;

  for (const item of items) {
    const node = map.get(item.id);
    if (!node) continue;

    if (item.id === id) {
      root = node;
      continue;
    }

    const parent = map.get(item.parentId!);
    if (parent) {
      parent.children.push(node);
    }
  }

  function cleanup(node: Bookmark): void {
    if (!node.children || node.children.length === 0) {
      delete node.children;
      return;
    }
    node.children.forEach(cleanup);
  }

  if (root) {
    cleanup(root);
  }

  return root;
}

/** 删除文件夹及其所有子项（递归） */
export async function deleteFolder(id: string): Promise<string[]> {
  const items = await getWithAllDescendents(id);

  if (!items.length) {
    return [];
  }

  const ids = items.map((item) => item.id);
  await bookmarksTable.bulkDelete(ids);
  return ids;
}

/** 批量插入/更新 */
export async function saveBookmarks(bookmarks: Partial<Bookmark>[]): Promise<Bookmark[]> {
  const now = Date.now();

  const records: Bookmark[] = bookmarks.map(
    (item) =>
      ({
        ...item,
        id: item.id!,
        createdAt: item.createdAt ?? now,
        updatedAt: now,
      }) as Bookmark,
  );

  await bookmarksTable.bulkPut(records);
  return records;
}

/** 清空全部 bookmarks */
export async function clearAllBookmarks(): Promise<void> {
  await bookmarksTable.clear();
}

export default db;
