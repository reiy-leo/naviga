import Dexie from 'dexie';

/**
 * Naviga Bookmarks IndexedDB 浏览器端本地数据库
 *
 * 数据库: naviga-data
 *
 * 表: bookmarks
 */

const DB_NAME = 'naviga-data';

class BookmarksDB extends Dexie {
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

/**
 * Bookmarks table
 *
 * @type {import('dexie').Table<
 *   {
 *     id: string;
 *     parentId?: string;
 *     title?: string;
 *     url?: string;
 *     index?: number;
 *     createdAt?: number;
 *     updatedAt?: number;
 *   },
 *   string
 * >}
 */
const bookmarksTable = db.table('bookmarks');

/** 获取指定 bookmark */
export async function getBookmark(id) {
  return (await bookmarksTable.get(id)) || null;
}

/** 获取全部 bookmarks */
export async function getAllBookmarks() {
  return await bookmarksTable.toArray();
}

/** 获取指定 parentId 下的 bookmarks */
export async function getBookmarksByParent(parentId = null) {
  if (parentId === null) {
    return await bookmarksTable.filter((item) => !item.parentId).sortBy('index');
  }

  return await bookmarksTable.where('parentId').equals(parentId).sortBy('index');
}

/**
 * 保存/更新 bookmark
 *
 * @param {string} id
 * @param {{
 *   parentId?: string;
 *   type?: 'folder' | 'bookmark';
 *   title?: string;
 *   url?: string;
 *   index?: number;
 * }} data
 */
export async function saveBookmark(id, data) {
  const existing = await bookmarksTable.get(id);

  const now = Date.now();

  const record = {
    id,
    parentId: data.parentId ?? existing?.parentId ?? null,
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
export async function deleteBookmark(id) {
  await bookmarksTable.delete(id);
}

/**
 * 获取文件夹及其所有子项（递归）
 *
 * 返回: [ folder, child1, child2, ... ]
 */
export async function getWithAllDescendents(id) {
  const result = [];

  async function traverse(parentId) {
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

export async function getSubTree(id) {
  const items = await getWithAllDescendents(id);

  if (!items.length) return null;

  const map = new Map(items.map((item) => [item.id, { ...item, children: [] }]));

  let root = null;

  for (const item of items) {
    const node = map.get(item.id);

    if (item.id === id) {
      root = node;
      continue;
    }

    map.get(item.parentId)?.children.push(node);
  }

  function cleanup(node) {
    if (!node.children.length) {
      delete node.children;
      return;
    }

    node.children.forEach(cleanup);
  }

  cleanup(root);

  return root;
}

/** 删除文件夹及其所有子项（递归） */
export async function deleteFolder(id) {
  const items = await getFolder(id);

  if (!items.length) {
    return;
  }

  const ids = items.map((item) => item.id);

  await bookmarksTable.bulkDelete(ids);

  return ids;
}

/** 批量插入/更新 */
export async function saveBookmarks(bookmarks = []) {
  const now = Date.now();

  const records = bookmarks.map((item) => ({
    ...item,
    createdAt: item.createdAt ?? now,
    updatedAt: now,
  }));

  await bookmarksTable.bulkPut(records);

  return records;
}

/** 清空全部 bookmarks */
export async function clearAllBookmarks() {
  await bookmarksTable.clear();
}

export default db;
