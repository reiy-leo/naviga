/** 从 Chrome/Edge 导出的 Bookmarks.json 导入书签 格式: data.roots.workspaces_v2 */
export async function importBookmarksFromFile(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // 检查是否是有效的书签文件
    if (!data.roots?.workspaces_v2) {
      throw new Error('无效的书签文件格式');
    }

    const workspaces = data.roots.workspaces_v2.children || [];
    let importedCount = 0;

    for (const ws of workspaces) {
      if (ws.type !== 'folder') continue;

      // 检查是否已存在同名工作区
      const existingFolders = await chrome.bookmarks.search({ title: ws.name });
      let parentId;

      const existing = existingFolders.find((f) => f.title === ws.name && !f.url);

      if (existing) {
        parentId = existing.id;
      } else {
        // 创建新的工作区文件夹（在书签栏下）
        const newFolder = await chrome.bookmarks.create({
          parentId: '1', // 书签栏 ID
          title: ws.name,
        });
        parentId = newFolder.id;
      }

      // 导入书签
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
            // 创建子文件夹
            const subFolder = await chrome.bookmarks.create({
              parentId,
              title: item.name,
            });

            // 导入子文件夹中的书签
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
  } catch (error) {
    console.error('Import failed:', error);
    return { success: false, error: error.message };
  }
}
