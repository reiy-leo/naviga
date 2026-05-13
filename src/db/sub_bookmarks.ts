// sub_bookmarks
// id parentId title index dateCreated dateModified url? note

import Dexie from 'dexie';

/** Naviga Sub Bookmarks IndexedDB */

const DB_NAME = 'naviga-data';

interface SubBookmarkRecord {
  id: string;
  parentId: string;
  title: string;
  index: number;
  dateCreated: number;
  dateModified: number;
  url?: string;
  note?: string;
}

class SubBookmarksDB extends Dexie {
  sub_bookmarks!: Dexie.Table<SubBookmarkRecord, string>;

  constructor() {
    super(DB_NAME);

    this.version(1).stores({
      sub_bookmarks: 'id, parentId',
    });
  }
}

const db = new SubBookmarksDB();

const subBookmarksTable = db.table<SubBookmarkRecord, string>('sub_bookmarks');

/** 获取单个 sub bookmark */
export async function getSubBookmark(id: string): Promise<SubBookmarkRecord | null> {
  return (await subBookmarksTable.get(id)) || null;
}

/** 添加 sub bookmark */
export async function addSubBookmark(data: {
  id: string;
  parentId: string;
  title: string;
  index?: number;
  url?: string;
  note?: string;
}): Promise<SubBookmarkRecord> {
  const now = Date.now();

  const record: SubBookmarkRecord = {
    id: data.id,
    parentId: data.parentId,
    title: data.title,
    index: data.index ?? 0,
    url: data.url ?? '',
    note: data.note ?? '',
    dateCreated: now,
    dateModified: now,
  };

  await subBookmarksTable.add(record);
  return record;
}

/** 修改 sub bookmark */
export async function updateSubBookmark(
  id: string,
  data: Partial<SubBookmarkRecord>
): Promise<SubBookmarkRecord | null> {
  const existing = await subBookmarksTable.get(id);

  if (!existing) {
    return null;
  }

  const record: SubBookmarkRecord = {
    ...existing,
    ...data,
    dateModified: Date.now(),
  };

  await subBookmarksTable.put(record);
  return record;
}

/** 删除 sub bookmark */
export async function deleteSubBookmark(id: string): Promise<void> {
  await subBookmarksTable.delete(id);
}

export default db;
