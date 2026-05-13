import Dexie from 'dexie';

import type { BookmarkItem } from '../types';

const DB_NAME = 'naviga-data';

class BookmarksDB extends Dexie {
  bookmarks!: Dexie.Table<BookmarkItem, string>;

  constructor() {
    super(DB_NAME);

    this.version(1).stores({
      bookmarks: 'id, parentId',
    });

    this.on('versionchange', () => {
      this.close();
    });

    this.on('blocked', () => {});
  }
}

const db = new BookmarksDB();

const bookmarksTable = db.table<BookmarkItem, string>('bookmarks');

export async function getBookmark(id: string): Promise<BookmarkItem | null> {
  return (await bookmarksTable.get(id)) || null;
}

export async function getAllBookmarks(): Promise<BookmarkItem[]> {
  return await bookmarksTable.toArray();
}

export async function getBookmarksByParent(parentId: string | null = null): Promise<BookmarkItem[]> {
  if (parentId === null) {
    return await bookmarksTable.filter((item: BookmarkItem) => !item.parentId).sortBy('index');
  }

  return await bookmarksTable.where('parentId').equals(parentId).sortBy('index');
}

export async function saveBookmark(id: string, data: Partial<BookmarkItem>): Promise<BookmarkItem> {
  const existing = await bookmarksTable.get(id);
  const now = Date.now();

  const record: BookmarkItem = {
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

export async function deleteBookmark(id: string): Promise<void> {
  await bookmarksTable.delete(id);
}

export async function getWithAllDescendents(id: string): Promise<BookmarkItem[]> {
  const result: BookmarkItem[] = [];

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

function cleanupBookmarkChildren(node: BookmarkItem): void {
  // 只删除书签上的children，不删除folder上的children
  if (node.url && (!node.children || node.children.length === 0)) {
    delete node.children;
    return;
  }
  node.children?.forEach(cleanupBookmarkChildren);
}

export async function getSubTree({ id }: { id: string }): Promise<BookmarkItem | null> {
  const items = await getWithAllDescendents(id);

  if (!items.length) return null;

  const map = new Map(items.map((item) => [item.id, { ...item, children: [] as BookmarkItem[] }]));
  let root: BookmarkItem | null = null;

  for (const item of items) {
    const node = map.get(item.id);
    if (!node) continue;

    if (item.id === id) {
      root = node;
      continue;
    }
    if (item?.parentId) {
      const parent = map.get(item.parentId);
      if (parent) {
        parent.children.push(node);
      }
    }
  }

  if (root) {
    // 删除书签（而不是文件夹）上的children属性
    cleanupBookmarkChildren(root);
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

/** 清空全部 bookmarks */
export async function clearAllBookmarks(): Promise<void> {
  await bookmarksTable.clear();
}

export default db;
