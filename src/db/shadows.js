import Dexie from 'dexie';

/**
 * Naviga Shadows IndexedDB 浏览器端本地数据库
 *
 * 数据库: naviga-data
 *
 * 表: shadows
 */

const DB_NAME = 'naviga-data';

class BookmarksDB extends Dexie {
  constructor() {
    super(DB_NAME);

    this.version(1).stores({
      /** Id: bookmark id parentId: 父文件夹 id type: folder | bookmark title: 标题 url: 书签地址 index: 排序索引 createdAt: 创建时间 updatedAt: 更新时间, shadowing 分身的是谁 */
      shadows: 'id, parentId, shadowing',
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
 *     parentId: string;
 *     shadowing: string;
 *     type?: 'folder' | 'bookmark';
 *     title?: string;
 *     url?: string;
 *     index?: number;
 *     createdAt?: number;
 *     updatedAt?: number;
 *   },
 *   string
 * >}
 */
const shadowsTable = db.table('shadows');

/** 获取指定 shadow */
export async function getShadow(id) {
  return (await shadowsTable.get(id)) || null;
}

/** 获取全部 shadows */
export async function getAllshadows() {
  return await shadowsTable.toArray();
}

/** 获取指定 shadowing 下的 shadows */
export async function getShadowsOf(shadowing = null) {
  if (shadowing === null) {
    return [];
  }

  return await shadowsTable.where('shadowing').equals(shadowing).sortBy('createdAt');
}

/**
 * 保存/更新 shadow，同时要更新原始bookmark或folder
 *
 * @param {string} id
 * @param {{
 *   parentId?: string;
 *   title?: string;
 *   url?: string;
 *   index?: number;
 * }} shadowing
 * @param {{
 *   shadowing: string;
 *   parentId: string;
 *   title: string;
 *   url: string;
 *   index?: number;
 * }} data
 */
export async function saveShadow(id, shadowing, data) {
  const existing = await shadowsTable.get(id);

  const now = Date.now();

  // 更新shadow
  const record = {
    id,
    shadowing: data.shadowing ?? existing?.shadowing,
    parentId: data.parentId ?? existing?.parentId,
    title: data.title ?? existing?.title ?? shadowing?.title,
    url: data.url ?? existing?.url ?? shadowing?.url,
    index: data.index ?? existing?.index ?? 0,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await shadowsTable.put(record);

  return record;
}

/** 删除指定 bookmark */
export async function deleteShadow(id) {
  await shadowsTable.delete(id);
}

/**
 * 获取文件夹及其所有子项（递归）
 *
 * 返回: [ folder, child1, child2, ... ]
 */
export async function getFolder(shadowing_id) {
  const result = [];

  async function traverse(parentId) {
    const children = await shadowsTable.where('parentId').equals(parentId).toArray();

    // 没有子项则停止递归
    if (children.length === 0) {
      return;
    }

    for (const item of children) {
      result.push(item);

      // 继续递归检查该 item 是否还有子项
      await traverse(item.id);
    }
  }

  // 获取根 folder
  const rootFolder = await shadowsTable.get(id);

  if (!rootFolder) {
    return [];
  }

  result.push(rootFolder);

  // 获取所有 descendants
  await traverse(id);

  return result;
}

export async function getFolderAsTree(id) {
  const items = await getFolder(id);

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
