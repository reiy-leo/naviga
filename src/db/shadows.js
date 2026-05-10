import Dexie from 'dexie';

/**
 * Naviga Shadows IndexedDB 浏览器端本地数据库
 *
 * 数据库: naviga-data
 *
 * 表: shadows
 */

const DB_NAME = 'naviga-data';

class ShadowsDB extends Dexie {
  constructor() {
    super(DB_NAME);

    this.version(1).stores({
      /**
       * Id: bookmark id parentId: 父文件夹 id type: folder | bookmark title: 标题 url: 书签地址 index: 排序索引 createdAt: 创建时间
       * updatedAt: 更新时间, shadowing 分身的是谁
       */
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

const db = new ShadowsDB();

/**
 * Bookmarks table
 *
 * @type {import('dexie').Table<
 *   {
 *     id: string;
 *     parentId: string;
 *     shadowing: string;
 *     index?: number;
 *     createdAt?: number;
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

/** 获取指定 id 下的所有shadows */
export async function getShadowsOf(id = null) {
  if (id == null) return null;

  const ids = Array.isArray(id) ? id : [id];

  return await shadowsTable.where('parentId').anyOf(ids).sortBy('createdAt');
}

/**
 * 保存/更新 shadow，同时要更新原始bookmark或folder
 *
 * @param {string} id
 * @param {{
 *   shadowing: string;
 *   parentId: string;
 *   index?: number;
 * }} data
 */
export async function saveShadow(id, data) {
  const existing = await shadowsTable.get(id);

  const now = Date.now();

  // 更新shadow
  const record = {
    id,
    shadowing: data.shadowing ?? existing?.shadowing,
    parentId: data.parentId ?? existing?.parentId,
    index: data.index ?? existing?.index ?? 0,
    createdAt: existing?.updatedAt ?? now,
  };
  await shadowsTable.put(record);

  return record;
}

/** 删除指定 bookmark */
export async function deleteShadow(id) {
  await shadowsTable.delete(id);
}

/** 清空全部 bookmarks */
export async function clearAllShadows() {
  await bookmarksTable.clear();
}

export default db;
