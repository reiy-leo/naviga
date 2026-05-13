/** 从 Chrome/Edge 导出的 Bookmarks.json 导入书签 格式: data.roots.workspaces_v2 */

interface BookmarkItem {
  type: string;
  name?: string;
  url?: string;
  children?: BookmarkItem[];
}

interface ImportResult {
  success: boolean;
  count?: number;
  error?: string;
}

export async function importBookmarksFromFile(file: File): Promise<ImportResult> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.roots?.workspaces_v2) {
      throw new Error('无效的书签文件格式');
    }

    const workspaces = data.roots.workspaces_v2.children || [];
    let importedCount = 0;

    for (const ws of workspaces) {
      if (ws.type !== 'folder') continue;

      const existingFolders = await chrome.bookmarks.search({ title: ws.name });
      let parentId: string;

      const existing = existingFolders.find((f: chrome.bookmarks.BookmarkTreeNode) => f.title === ws.name && !f.url);

      if (existing) {
        parentId = existing.id;
      } else {
        const newFolder = await chrome.bookmarks.create({
          parentId: '1',
          title: ws.name,
        });
        parentId = newFolder.id;
      }

      if (ws.children) {
        for (const item of ws.children) {
          if (item.type === 'url') {
            await chrome.bookmarks.create({
              parentId,
              title: item.name || item.url,
              url: item.url,
            });
            importedCount++;
          } else if (item.type === 'folder') {
            const subFolder = await chrome.bookmarks.create({
              parentId,
              title: item.name,
            });

            if (item.children) {
              for (const subItem of item.children) {
                if (subItem.type === 'url') {
                  await chrome.bookmarks.create({
                    parentId: subFolder.id,
                    title: subItem.name || subItem.url,
                    url: subItem.url,
                  });
                  importedCount++;
                }
              }
            }
          }
        }
      }
    }

    return { success: true, count: importedCount };
  } catch (error: any) {
    console.error('Import failed:', error);
    return { success: false, error: error.message };
  }
}
