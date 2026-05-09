import { Button, Tooltip } from '@heroui/react';
import { FolderPlus, BookmarkPlus } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useBookmarks } from '../../hooks/useBookmarks';
import { useAppStore } from '../../store/useAppStore';
import { FolderWithOperations } from './FolderWithOperations';
import UngroupedBookmarks from './UngroupedBookmarks';

/** 递归展平书签树，为每个书签记录完整文件夹路径 返回: groups (Map<pathString, [bookmarks]>) + directBookmarks 同时返回 folderIdMap (pathString → folderId) 用于跨文件夹移动 */
function flattenBookmarks(items, parentPath = [], parentFolderIds = []) {
  const groups = new Map();
  const directBookmarks = [];
  const folderIdMap = new Map(); // pathString → folderId (最深层的子文件夹 ID)

  for (const item of items) {
    if (item.url) {
      if (parentPath.length > 0) {
        const pathKey = parentPath.join(' / ');
        if (!groups.has(pathKey)) groups.set(pathKey, []);
        groups.get(pathKey).push({
          ...item,
          parentId: parentFolderIds[parentFolderIds.length - 1],
        });
        // 记录路径到文件夹 ID 的映射
        folderIdMap.set(pathKey, parentFolderIds[parentFolderIds.length - 1]);
      } else {
        directBookmarks.push({
          ...item,
          parentId: parentFolderIds[parentFolderIds.length - 1] || item.parentId,
        });
      }
    } else if (item.children !== undefined) {
      // 这是一个子文件夹
      const subPath = [...parentPath, item.title];
      const subFolderIds = [...parentFolderIds, item.id];
      // 记录此文件夹的路径和 ID
      folderIdMap.set(subPath.join(' / '), item.id);
      const sub = flattenBookmarks(item.children, subPath, subFolderIds);
      for (const [path, bookmarks] of sub.groups) {
        if (!groups.has(path)) groups.set(path, []);
        groups.get(path).push(...bookmarks);
      }
      directBookmarks.push(...sub.directBookmarks);
      // 合并 folderIdMap
      for (const [k, v] of sub.folderIdMap) {
        folderIdMap.set(k, v);
      }
      // 空文件夹也要显示：如果此文件夹在 groups 中不存在（没有子书签），则添加空数组
      const subPathKey = subPath.join(' / ');
      if (!groups.has(subPathKey)) {
        groups.set(subPathKey, []);
      }
    }
  }

  return { groups, directBookmarks, folderIdMap };
}

function WorkspaceView({ workspaceId }) {
  const { t } = useTranslation();
  const { bookmarks, loading } = useBookmarks();
  const { workspaces, wsMeta, clickCounts, ungroupedBookmarkPosition } = useAppStore();

  const workspace = workspaces.find((w) => w.id === workspaceId);
  const workspaceItems = bookmarks[workspaceId] || [];

  // 递归获取完整子树并展平
  const [flatData, setFlatData] = useState({
    groups: new Map(),
    directBookmarks: [],
    folderIdMap: new Map(),
  });
  const [flattening, setFlattening] = useState(false);

  const buildFlatData = useCallback(async () => {
    if (!workspaceId || workspaceItems.length === 0) {
      setFlatData({
        groups: new Map(),
        directBookmarks: [],
        folderIdMap: new Map(),
      });
      return;
    }

    // 仅首次加载显示 loading，后续刷新不闪烁
    if (flatData.groups.size === 0 && flatData.directBookmarks.length === 0) {
      setFlattening(true);
    }
    try {
      const subTree = await chrome.bookmarks.getSubTree(workspaceId);
      const rootChildren = subTree[0]?.children || [];
      const result = flattenBookmarks(rootChildren, [], [workspaceId]);
      setFlatData(result);
    } catch (err) {
      console.error('Failed to flatten bookmarks tree:', err);
      const folders = workspaceItems.filter((item) => !item.url);
      const directBookmarks = workspaceItems.filter((item) => item.url).map((b) => ({ ...b, parentId: workspaceId }));
      const groups = new Map();
      const folderIdMap = new Map();
      for (const folder of folders) {
        groups.set(
          folder.title,
          (folder.children || []).map((b) => ({ ...b, parentId: folder.id })),
        );
        folderIdMap.set(folder.title, folder.id);
      }
      setFlatData({ groups, directBookmarks, folderIdMap });
    } finally {
      setFlattening(false);
    }
  }, [workspaceId, workspaceItems]);

  useEffect(() => {
    buildFlatData();
  }, [buildFlatData]);

  const { groups, directBookmarks, folderIdMap } = flatData;

  // ── 工作区标题区域作为放置目标（拖拽到工作区根） ──
  const [wsTitleDragOver, setWsTitleDragOver] = useState(false);

  // 在工作区下新建文件夹（inline 输入）— hooks 必须在早返回之前
  const [newFolderInput, setNewFolderInput] = useState(false);
  const [newFolderValue, setNewFolderValue] = useState('');
  const newFolderInputRef = useRef(null);

  const handleNewFolderClick = () => {
    setNewFolderValue('');
    setNewFolderInput(true);
  };

  useEffect(() => {
    if (newFolderInput && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [newFolderInput]);

  const handleNewFolderConfirm = async () => {
    const trimmed = newFolderValue.trim();
    if (trimmed) {
      try {
        await chrome.bookmarks.create({
          parentId: workspaceId,
          title: trimmed,
        });
        buildFlatData();
      } catch (err) {
        console.error('Failed to create folder:', err);
      }
    }
    setNewFolderInput(false);
    setNewFolderValue('');
  };

  const handleNewFolderKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNewFolderConfirm();
    } else if (e.key === 'Escape') {
      setNewFolderInput(false);
      setNewFolderValue('');
    }
  };

  const handleWsTitleDrop = async (e) => {
    e.preventDefault();
    setWsTitleDragOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/bookmark'));
      if (!data || !data.id) return;
      await chrome.bookmarks.move(data.id, {
        parentId: workspaceId,
        index: 0,
      });
    } catch (err) {
      console.error('Failed to move bookmark:', err);
    }
  };

  if (loading || flattening) {
    return (
      <div className='flex items-center justify-center py-20'>
        <div className='text-mist-500'>加载中...</div>
      </div>
    );
  }

  const wsColor = wsMeta[workspaceId]?.color || '#6366f1';
  const hasContent = groups.size > 0 || directBookmarks.length > 0;

  return (
    <div className='animate-fade-in'>
      {/* 工作区标题 - 可作为拖拽目标 */}
      {workspace && (
        <div
          className={`mb-8 flex items-center gap-3 rounded-md px-1 py-3 transition-colors`}
          onDragOver={(e) => {
            e.preventDefault();
            setWsTitleDragOver(true);
          }}
          onDragLeave={() => setWsTitleDragOver(false)}
          onDrop={handleWsTitleDrop}>
          <span className='flex-none text-4xl'>{wsMeta[workspaceId]?.emoji || '📁'}</span>
          <div className='flex flex-1'>
            <h2
              className='flex-1 text-3xl font-semibold'
              style={{ color: wsColor }}>
              {wsMeta[workspaceId]?.text || workspace.title}
            </h2>
            <div className='flex flex-0 items-center gap-1'>
              <Tooltip delay={300}>
                <Button
                  isIconOnly
                  variant='ghost'
                  onPress={() => window.__navigaActions?.openEditModal(null, null, null, null)}
                  onClick={() => window.__navigaActions?.openEditModal(null, null, null, null)}
                  className='rounded-md'>
                  <BookmarkPlus size={20} />
                </Button>
                <Tooltip.Content
                  showArrow
                  placement='top'>
                  <Tooltip.Arrow />
                  <p>{t('addBookmark')}</p>
                </Tooltip.Content>
              </Tooltip>
              <Tooltip delay={300}>
                <Button
                  isIconOnly
                  variant='ghost'
                  onClick={handleNewFolderClick}
                  className='rounded-md'>
                  <FolderPlus size={20} />
                </Button>
                <Tooltip.Content
                  showArrow
                  placement='top'>
                  <Tooltip.Arrow />
                  <p>{t('newFolder')}</p>
                </Tooltip.Content>
              </Tooltip>
            </div>
          </div>
          {wsTitleDragOver && <span className='text-primary-500 ml-2 animate-pulse text-sm'>放到此处</span>}
        </div>
      )}

      {/* 新建文件夹输入框（工作区级别） */}
      {newFolderInput && (
        <div className='mb-4 flex items-center gap-2 px-1'>
          <FolderPlus
            size={16}
            className='text-primary-500 flex-0'
          />
          <input
            ref={newFolderInputRef}
            type='text'
            value={newFolderValue}
            onChange={(e) => setNewFolderValue(e.target.value)}
            onBlur={handleNewFolderConfirm}
            onKeyDown={handleNewFolderKeyDown}
            placeholder={t('newFolder')}
            className='text-foreground focus:ring-primary-500 w-56 rounded-lg bg-mist-100 px-3 py-1.5 text-sm outline-none placeholder:text-mist-300 focus:ring-1'
          />
        </div>
      )}

      {/* 直接书签（不属于任何子文件夹）- 未分组置顶 */}
      {directBookmarks.length > 0 && ungroupedBookmarkPosition === 'ungroup_top' && (
        <UngroupedBookmarks
          workspaceId={workspaceId}
          workspaceColor={wsColor}
          directBookmarks={directBookmarks}
        />
      )}

      {/* 按路径分组的书签 - 每组独立视图模式 + 拖拽支持 */}
      {Array.from(groups.entries()).map(([path, pathBookmarks]) => (
        <FolderWithOperations
          key={path}
          path={path}
          bookmarks={pathBookmarks}
          clickCounts={clickCounts}
          workspaceId={workspaceId}
          folderId={folderIdMap.get(path)}
          allFolderIds={folderIdMap}
          onRefresh={buildFlatData}
          workspaceColor={wsColor}
        />
      ))}

      {directBookmarks.length > 0 && ungroupedBookmarkPosition === 'ungroup_bottom' && (
        <UngroupedBookmarks
          workspaceId={workspaceId}
          workspaceColor={wsColor}
          directBookmarks={directBookmarks}
        />
      )}

      {!hasContent && (
        <div className='py-20 text-center text-mist-500'>
          <p className='mb-2 text-lg'>暂无书签或文件夹</p>
          <p className='text-sm'>右键点击页面可添加书签或文件夹</p>
        </div>
      )}
    </div>
  );
}

export default WorkspaceView;
