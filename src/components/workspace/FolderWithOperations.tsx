import { Button, Input, Tooltip, toast } from '@heroui/react';
import {
  ArrowDown,
  ArrowUp,
  BookmarkPlus,
  Folder,
  FolderMinus,
  FolderPlus,
  FolderX,
  LayoutGrid,
  LayoutList,
  FolderRoot,
  Sparkles,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { deleteShadow, saveShadow } from '../../db/shadows';
import { useAppStore } from '../../store/useAppStore';
import BookmarkCard from '../bookmark/BookmarkCard';
import { FolderContextMenu } from './FolderContextMenu';

interface FolderWithOperationsProps {
  path: string;
  bookmarks: chrome.bookmarks.BookmarkTreeNode[];
  clickCounts: Record<string, number>;
  workspaceId: string;
  folderId: string;
  isShadow: boolean;
  parentId: string;
  onRefresh?: () => void;
  workspaceColor: string;
}

export function FolderWithOperations({
  path,
  bookmarks,
  clickCounts,
  workspaceId,
  folderId,
  isShadow,
  parentId,
  onRefresh,
  workspaceColor,
}: FolderWithOperationsProps) {
  const { t } = useTranslation();
  const { setFolderViewMode, getFolderViewMode, iconSize, getShadowStyle } = useAppStore();
  const viewMode = getFolderViewMode(path);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const dragOverClassNames = useMemo(() => {
    return `bg-accent-soft-hover`;
  }, [workspaceColor]);

  // 双击编辑状态
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // 右键菜单
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  // 从 path 中提取当前文件夹名（取最后一段）
  const folderName = path.includes(' / ') ? path.split(' / ').pop() : path;

  const handleViewModeChange = (mode: 'list' | 'grid' | 'smart') => {
    setFolderViewMode(path, mode);
  };

  // 新建子文件夹 — 弹出 inline 输入
  const [newSubInput, setNewSubInput] = useState(false);
  const [newSubValue, setNewSubValue] = useState('');
  const newSubInputRef = useRef<HTMLInputElement>(null);

  const handleNewSubFolderClick = () => {
    setNewSubValue('');
    setNewSubInput(true);
  };

  useEffect(() => {
    if (newSubInput && newSubInputRef.current) {
      newSubInputRef.current.focus();
    }
  }, [newSubInput]);

  const handleNewSubConfirm = async () => {
    const trimmed = newSubValue.trim();
    if (trimmed) {
      try {
        await chrome.bookmarks.create({ parentId: folderId, title: trimmed });
        onRefresh?.();
      } catch (err) {
        console.error('Failed to create sub folder:', err);
      }
    }
    setNewSubInput(false);
    setNewSubValue('');
  };

  const handleNewSubKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNewSubConfirm();
    } else if (e.key === 'Escape') {
      setNewSubInput(false);
      setNewSubValue('');
    }
  };

  // 解散文件夹：将子项移到父文件夹（workspaceId），然后删除空文件夹
  const handleDissolve = async () => {
    try {
      const folder = await chrome.bookmarks.get(folderId);
      const resolvedParentId = folder[0]?.parentId || workspaceId;
      const children = await chrome.bookmarks.getChildren(folderId);
      // 将所有子项移到父文件夹
      for (const child of children) {
        await chrome.bookmarks.move(child.id, { parentId: resolvedParentId });
      }
      // 删除空文件夹
      await chrome.bookmarks.remove(folderId);
      onRefresh?.();
    } catch (err) {
      console.error('Failed to dissolve folder:', err);
    }
  };

  // 双击进入编辑
  const handleDoubleClick = () => {
    setEditValue(folderName!);
    setEditing(true);
  };

  // 编辑确认
  const handleEditConfirm = async () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== folderName && folderId) {
      try {
        await chrome.bookmarks.update(folderId, { title: trimmed });
      } catch (err) {
        console.error('Failed to rename folder:', err);
      }
    }
    setEditing(false);
  };

  // 编辑取消
  const handleEditCancel = () => {
    setEditing(false);
  };

  // 编辑输入键盘事件
  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditConfirm();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const handleShadowDelete = async () => {
    // 删除shadow
    console.info('shadow delete', folderId);
    await deleteShadow(folderId);
    // 更新allShadows让当前workspace页面刷新
    onRefresh?.();
  };

  // 自动聚焦编辑输入框
  useEffect(() => {
    if (editing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editing]);

  // 监听 folder-rename 事件
  useEffect(() => {
    const handleRename = (e: CustomEvent<{ folderId: string }>) => {
      if (e.detail?.folderId === folderId) {
        setEditValue(folderName!);
        setEditing(true);
      }
    };
    window.addEventListener('folder-rename', handleRename as EventListener);
    return () => window.removeEventListener('folder-rename', handleRename as EventListener);
  }, [folderId, folderName]);

  // 文件夹顺序
  const handleFolderMoveUp = async (folderId: string, parentId: string) => {
    const children = await chrome.bookmarks.getChildren(parentId);
    const index = children.findIndex((x) => x.id === folderId);
    console.debug('当前文件夹的index', index);
    if (index > 0) {
      try {
        await chrome.bookmarks.move(folderId, {
          index: index - 1,
        });
      } catch (error: any) {
        toast.danger(t('moveFolderFailed'), error);
      }
    } else {
      toast.danger(t('moveAlreadyTop'));
    }
  };

  const handleFolderMoveDown = async (folderId: string, parentId: string) => {
    const children = await chrome.bookmarks.getChildren(parentId);
    const index = children.findIndex((x) => x.id === folderId);
    if (index < children.length - 1) {
      try {
        await chrome.bookmarks.move(folderId, {
          index: index + 2,
        });
      } catch (error: any) {
        toast.danger(t('moveFolderFailed'), error);
      }
    } else {
      toast.danger(t('moveAlreadyBottom'));
    }
  };

  // 右键菜单
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPos({ x: e.clientX, y: e.clientY });
  }, []);

  const closeMenu = useCallback(() => setMenuPos(null), []);

  // 根据 iconSize 计算网格列宽
  const gridColWidth = iconSize === 'small' ? '90px' : iconSize === 'large' ? '148px' : '116px';

  // 智能视图：按点击量排序
  const sortedBookmarks = useMemo(() => {
    if (viewMode !== 'smart') return bookmarks;
    return [...bookmarks].sort((a, b) => {
      const countA = clickCounts[a.id] || 0;
      const countB = clickCounts[b.id] || 0;
      return countB - countA;
    });
  }, [bookmarks, viewMode, clickCounts]);

  // ── 拖拽排序处理 ──
  const handleDragStart = (e: React.DragEvent<Element>, bookmark: chrome.bookmarks.BookmarkTreeNode) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(
      'application/bookmark',
      JSON.stringify({
        id: bookmark.id,
        parentId: bookmark.parentId || '',
        title: bookmark.title,
        url: bookmark.url,
        sourceFolderId: folderId,
        sourcePath: path,
        isShadow: (bookmark as any).shadowing || false,
      }),
    );
  };

  const handleDragEnd = () => {
    setDragOverIndex(null);
    setIsDragOver(false);
  };

  // 文件夹组本身作为放置目标（跨文件夹拖拽）
  const handleGroupDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleGroupDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // 只在真正离开容器时设置
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setDragOverIndex(null);
    }
  };

  const handleGroupDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    setDragOverIndex(null);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/bookmark'));
      if (!data || !data.id) return;

      // 同一文件夹内的排序
      if (data.sourceFolderId === folderId) {
        // 计算放置位置的目标 index
        const targetIndex = dragOverIndex !== null ? dragOverIndex : bookmarks.length - 1;
        const currentIndex = bookmarks.findIndex((b) => b.id === data.id);
        if (currentIndex === targetIndex) return;

        if (data.isShadow) {
          await saveShadow(data.id, {
            parentId: folderId,
            index: targetIndex > currentIndex ? targetIndex + 1 : targetIndex,
          });
        } else {
          // chrome.bookmarks.move 需要目标 parentId 和 index
          await chrome.bookmarks.move(data.id, {
            parentId: folderId,
            index: targetIndex > currentIndex ? targetIndex + 1 : targetIndex,
          });
        }
      } else {
        // 跨文件夹移动
        await chrome.bookmarks.move(data.id, {
          parentId: folderId,
          index: bookmarks.length, // 放到末尾
        });
      }
    } catch (err) {
      console.error('Failed to drag bookmark:', err);
    }
  };

  // 书签项之间的排序指示
  const handleItemDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(index);
  };

  // 渲染书签卡片的通用函数
  const renderBookmarkCard = (bookmark: chrome.bookmarks.BookmarkTreeNode, index: number, isListView: boolean) => {
    return (
      <div
        key={bookmark.id}
        className='relative'
        onDragOver={(e) => handleItemDragOver(e, index)}>
        {dragOverIndex === index && (
          <div
            className={`absolute ${isListView ? 'top-0 right-0 left-0 h-0.5 -translate-y-1' : 'top-0 bottom-0 -left-2 w-0.5'} bg-primary-500 z-10 rounded-full`}
          />
        )}
        <BookmarkCard
          bookmark={bookmark}
          viewMode={isListView ? 'list' : viewMode}
          workspaceColor={workspaceColor}
          draggable
          onDragStart={(e) => handleDragStart(e, bookmark)}
          onDragEnd={handleDragEnd}
        />
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`my-6 rounded-xl pb-3 transition-colors ${isShadow ? getShadowStyle() : ''} ${isDragOver ? dragOverClassNames : ''}`}
      onDragOver={handleGroupDragOver}
      onDragLeave={handleGroupDragLeave}
      onDrop={handleGroupDrop}>
      {/* 路径标题 + 视图切换 */}
      <div className='mb-3 flex items-center gap-2 px-1'>
        <Button
          isIconOnly
          variant='ghost'
          className='hover:text-primary-500 flex-0 rounded-md p-1 text-mist-400 transition-colors hover:bg-mist-100'>
          <Folder size={16} />
        </Button>
        {editing ? (
          <Input
            ref={editInputRef}
            type='text'
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditConfirm}
            onKeyDown={handleEditKeyDown}
            className='text-foreground w-40 rounded-md bg-mist-100 px-2 py-0.5 text-sm font-medium outline-none'
          />
        ) : (
          <span
            className='min-w-0 flex-1 cursor-default truncate text-sm font-medium text-mist-500'
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}>
            {path}
          </span>
        )}
        <span className='flex-0 text-xs text-mist-300'>{bookmarks.length}</span>
        {/* 右侧：文件夹操作 + 视图切换 */}
        <div className='flex flex-0 items-center gap-1'>
          <Tooltip delay={300}>
            <Button
              onPress={() => handleFolderMoveUp(folderId, parentId)}
              isIconOnly
              variant='ghost'
              className='hover:text-primary-500 rounded-md p-1 text-mist-400 transition-colors hover:bg-mist-100'>
              <ArrowUp size={16} />
            </Button>
            <Tooltip.Content
              showArrow
              placement='bottom'>
              <Tooltip.Arrow />
              <p>{t('moveFolderUpward')}</p>
            </Tooltip.Content>
          </Tooltip>
          <Tooltip delay={300}>
            <Button
              onPress={() => handleFolderMoveDown(folderId, parentId)}
              isIconOnly
              variant='ghost'
              className='hover:text-primary-500 rounded-md p-1 text-mist-400 transition-colors hover:bg-mist-100'>
              <ArrowDown size={16} />
            </Button>
            <Tooltip.Content
              showArrow
              placement='bottom'>
              <Tooltip.Arrow />
              <p>{t('moveFolderDownward')}</p>
            </Tooltip.Content>
          </Tooltip>
          {/* 新建书签 */}
          <Tooltip delay={300}>
            <Button
              onClick={() => {
                window.__navigaActions__?.openEditModal(null, null, null, folderId);
              }}
              isIconOnly
              variant='ghost'
              className='hover:text-primary-500 rounded-md p-1 text-mist-400 transition-colors hover:bg-mist-100'>
              <BookmarkPlus size={16} />
            </Button>
            <Tooltip.Content
              showArrow
              placement='bottom'>
              <Tooltip.Arrow />
              <p>{t('newBookmark')}</p>
            </Tooltip.Content>
          </Tooltip>
          {/* 新建子文件夹 */}
          <Tooltip delay={300}>
            <Button
              onClick={handleNewSubFolderClick}
              isIconOnly
              variant='ghost'
              className='hover:text-primary-500 rounded-md p-1 text-mist-400 transition-colors hover:bg-mist-100'>
              <FolderPlus size={16} />
            </Button>
            <Tooltip.Content
              showArrow
              placement='bottom'>
              <Tooltip.Arrow />
              <p>{t('newSubFolder')}</p>
            </Tooltip.Content>
          </Tooltip>
          {/* 新建影子 */}
          {!isShadow && (
            <Tooltip delay={300}>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  window.__navigaActions__?.openMoveModal(
                    { id: folderId },
                    t('createShadowToWorkspace'),
                    'shadowBookmark',
                  );
                }}
                isIconOnly
                variant='ghost'
                className='hover:text-warning-500 hover:bg-warning-50 rounded-md p-1 text-mist-400 transition-colors'>
                <FolderRoot size={16} />
              </Button>
              <Tooltip.Content
                showArrow
                placement='bottom'>
                <Tooltip.Arrow />
                <div className='max-w-xs px-1 py-1.5'>
                  <p className='mb-1 font-semibold'>{t('shadowFolder')}</p>
                  <p className='text-muted text-sm'>{t('shadowFolderHint')}</p>
                </div>
              </Tooltip.Content>
            </Tooltip>
          )}
          {isShadow && (
            <Tooltip delay={300}>
              <Button
                onClick={handleShadowDelete}
                isIconOnly
                variant='ghost'
                className='hover:text-warning-500 hover:bg-warning-50 rounded-md p-1 text-mist-400 transition-colors'>
                <FolderMinus size={16} />
              </Button>
              <Tooltip.Content
                showArrow
                placement='bottom'>
                <Tooltip.Arrow />
                <div className='max-w-lg px-1 py-1.5'>
                  <p className='mb-1 font-semibold'>{t('deleteShadowFolder')}</p>
                  <p className='text-muted text-sm'>{t('deleteShadowFolderHint')}</p>
                </div>
              </Tooltip.Content>
            </Tooltip>
          )}
          {!isShadow && (
            <Tooltip delay={300}>
              <Button
                onClick={handleDissolve}
                isIconOnly
                variant='ghost'
                className='hover:text-warning-500 hover:bg-warning-50 rounded-md p-1 text-mist-400 transition-colors'>
                <FolderMinus size={16} />
              </Button>
              <Tooltip.Content
                showArrow
                placement='bottom'>
                <Tooltip.Arrow />
                <div className='max-w-xs px-1 py-1.5'>
                  <p className='mb-1 font-semibold'>{t('dissolveFolder')}</p>
                  <p className='text-muted text-sm'>{t('dissolveFolderHint')}</p>
                </div>
              </Tooltip.Content>
            </Tooltip>
          )}
          {!isShadow && (
            <Tooltip delay={300}>
              <Button
                onClick={async () => {
                  if (!confirm(t('confirmDeleteFolder'))) return;
                  try {
                    await chrome.bookmarks.removeTree(folderId);
                    onRefresh?.();
                  } catch (err) {
                    console.error('Failed to delete folder:', err);
                  }
                }}
                isIconOnly
                variant='ghost'
                className='hover:text-danger-500 hover:bg-danger-50 rounded-md p-1 text-mist-400 transition-colors'>
                <FolderX size={16} />
              </Button>
              <Tooltip.Content
                showArrow
                placement='bottom'>
                <Tooltip.Arrow />
                <div className='max-w-xs px-1 py-1.5'>
                  <p className='mb-1 font-semibold'>{t('deleteFolder')}</p>
                  <p className='text-muted text-sm'>{t('deleteFolderHint')}</p>
                </div>
              </Tooltip.Content>
            </Tooltip>
          )}
          <div className='flex gap-0.5 rounded-lg bg-mist-100 p-0.5 dark:bg-mist-600'>
            <Tooltip delay={300}>
              <Button
                onClick={() => handleViewModeChange('list')}
                variant='ghost'
                isIconOnly
                className={`rounded-md p-1 transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm dark:bg-mist-500' : ''}`}>
                <LayoutList size={16} />
              </Button>
              <Tooltip.Content
                showArrow
                placement='bottom'>
                <Tooltip.Arrow />
                <p>{t('listView')}</p>
              </Tooltip.Content>
            </Tooltip>
            <Tooltip delay={300}>
              <Button
                onClick={() => handleViewModeChange('grid')}
                isIconOnly
                variant='ghost'
                className={`rounded-md p-1 transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm dark:bg-mist-500' : ''}`}>
                <LayoutGrid size={16} />
              </Button>
              <Tooltip.Content
                showArrow
                placement='bottom'>
                <Tooltip.Arrow />
                <p>{t('gridView')}</p>
              </Tooltip.Content>
            </Tooltip>
            <Tooltip delay={300}>
              <Button
                onClick={() => handleViewModeChange('smart')}
                isIconOnly
                variant='ghost'
                className={`rounded-md p-1 transition-colors ${viewMode === 'smart' ? 'bg-white shadow-sm dark:bg-mist-500' : ''}`}>
                <Sparkles size={16} />
              </Button>
              <Tooltip.Content
                showArrow
                placement='bottom'>
                <Tooltip.Arrow />
                <p>{t('smartView')}</p>
              </Tooltip.Content>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* 新建子文件夹输入框 */}
      {newSubInput && (
        <div className='mb-3 flex items-center gap-2 px-1 pl-7'>
          <FolderPlus
            size={14}
            className='text-primary-500 flex-0'
          />
          <input
            ref={newSubInputRef}
            type='text'
            value={newSubValue}
            onChange={(e) => setNewSubValue(e.target.value)}
            onBlur={handleNewSubConfirm}
            onKeyDown={handleNewSubKeyDown}
            placeholder={t('newSubFolder')}
            className='text-foreground w-48 rounded-md bg-mist-100 px-2 py-1 text-sm outline-none placeholder:text-mist-300'
          />
        </div>
      )}

      {/* 书签列表 */}
      {viewMode === 'list' ? (
        <div className='relative flex flex-col gap-5'>
          {sortedBookmarks.map((bookmark, index) => (
            <div
              key={bookmark.id}
              className='relative'
              onDragOver={(e) => handleItemDragOver(e, index)}>
              {/* 拖拽指示线 */}
              {dragOverIndex === index && (
                <div className='bg-primary-500 absolute top-0 right-0 left-0 z-10 h-0.5 -translate-y-1 rounded-full' />
              )}
              <BookmarkCard
                bookmark={bookmark}
                viewMode='list'
                workspaceColor={workspaceColor}
                draggable
                onDragStart={(e: any) => handleDragStart(e, bookmark)}
                onDragEnd={handleDragEnd}
              />
            </div>
          ))}
          {/* 末尾指示线 */}
          {dragOverIndex === sortedBookmarks.length && <div className='bg-primary-500 h-0.5 rounded-full' />}
        </div>
      ) : (
        <div
          className='relative mx-3 grid gap-5'
          style={{ gridTemplateColumns: `repeat(auto-fill, ${gridColWidth})` }}>
          {sortedBookmarks.map((bookmark, index) => (
            <div
              key={bookmark.id}
              className='relative'
              onDragOver={(e) => handleItemDragOver(e, index)}>
              {dragOverIndex === index && (
                <div className='bg-primary-500 absolute top-0 bottom-0 -left-2 z-10 w-0.5 rounded-full' />
              )}
              <BookmarkCard
                bookmark={bookmark}
                viewMode={viewMode}
                workspaceColor={workspaceColor}
                draggable
                onDragStart={(e: any) => handleDragStart(e, bookmark)}
                onDragEnd={handleDragEnd}
              />
            </div>
          ))}
        </div>
      )}
      {/* 文件夹右键菜单 */}
      {menuPos && (
        <FolderContextMenu
          x={menuPos.x}
          y={menuPos.y}
          folderId={folderId}
          folderTitle={folderName}
          isShadow={isShadow}
          workspaceId={workspaceId}
          onClose={closeMenu}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}
