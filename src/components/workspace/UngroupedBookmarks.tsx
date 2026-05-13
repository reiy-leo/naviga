import { Button, Tooltip } from '@heroui/react';
import { LayoutList, LayoutGrid, Sparkles, FolderOpen } from 'lucide-react';
import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '../../store/useAppStore';
import BookmarkCard from '../bookmark/BookmarkCard';

interface UngroupedBookmarksProps {
  workspaceId: string;
  directBookmarks: chrome.bookmarks.BookmarkTreeNode[];
  workspaceColor: string;
}

function UngroupedBookmarks({ workspaceId, directBookmarks, workspaceColor }: UngroupedBookmarksProps) {
  const { t } = useTranslation();
  const { setFolderViewMode, getFolderViewMode, iconSize, clickCounts } = useAppStore();

  // 拖拽状态
  const [isDirectDragOver, setIsDirectDragOver] = useState(false);
  const [directDragOverIndex, setDirectDragOverIndex] = useState<number | null>(null);
  const directContainerRef = useRef<HTMLDivElement>(null);

  // 直接书签的视图模式（持久化）
  const directViewMode = getFolderViewMode(`__direct_${workspaceId}`);
  const setDirectViewMode = (mode: 'list' | 'grid' | 'smart') => setFolderViewMode(`__direct_${workspaceId}`, mode);

  // 直接书签的智能排序
  const sortedDirectBookmarks = useMemo(() => {
    if (directViewMode !== 'smart') return directBookmarks;
    return [...directBookmarks].sort((a, b) => {
      const countA = clickCounts[a.id] || 0;
      const countB = clickCounts[b.id] || 0;
      return countB - countA;
    });
  }, [directBookmarks, directViewMode, clickCounts]);

  // ── 直接书签区域拖拽处理 ──
  const handleDirectDragStart = (e: any, bookmark: chrome.bookmarks.BookmarkTreeNode) => {
    e.dataTransfer.effectAllowed = 'move';
    const data = {
      id: bookmark.id,
      parentId: bookmark.parentId || workspaceId,
      title: bookmark.title,
      url: bookmark.url,
      sourceFolderId: workspaceId,
      sourcePath: '__direct',
      isShadow: !!(bookmark as any).shadowing || false,
    };

    e.dataTransfer.setData('application/bookmark', JSON.stringify(data));
  };

  const handleDirectDragEnd = () => {
    setDirectDragOverIndex(null);
    setIsDirectDragOver(false);
  };

  const handleDirectDragOver = (e: any) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDirectDragOver(true);
  };

  const handleDirectDragLeave = (e: any) => {
    if (directContainerRef.current && !directContainerRef.current.contains(e.relatedTarget as Node)) {
      setIsDirectDragOver(false);
      setDirectDragOverIndex(null);
    }
  };

  const handleDirectDrop = async (e: any) => {
    e.preventDefault();
    setIsDirectDragOver(false);
    setDirectDragOverIndex(null);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/bookmark'));
      if (!data || !data.id) return;

      // 移到工作区根目录
      await chrome.bookmarks.move(data.id, {
        parentId: workspaceId,
        index: directBookmarks.length,
      });
    } catch (err) {
      console.error('Failed to move bookmark:', err);
    }
  };

  const handleDirectItemDragOver = (e: any, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDirectDragOverIndex(index);
  };

  // 直接书签区域也用动态列宽
  const directGridColWidth = iconSize === 'small' ? '90px' : iconSize === 'large' ? '148px' : '116px';

  return (
    <div
      ref={directContainerRef}
      className={`mb-6 rounded-xl transition-colors ${isDirectDragOver ? 'bg-primary-500/5 ring-primary-500/20 ring-1' : ''}`}
      onDragOver={handleDirectDragOver}
      onDragLeave={handleDirectDragLeave}
      onDrop={handleDirectDrop}>
      <div className='mb-3 flex items-center gap-2 px-1'>
        <Button
          isIconOnly
          variant='ghost'
          className='hover:text-primary-500 flex-0 rounded-md p-1 text-mist-400 transition-colors hover:bg-mist-100'>
          <FolderOpen size={16} />
        </Button>
        <span className='flex-1 text-sm font-medium text-mist-500'>{t('ungrouped_bookmarks')}</span>
        <span className='mr-2 flex-0 text-xs text-mist-400'>{directBookmarks.length}</span>
        <div className='flex flex-0 gap-0.5 rounded-lg bg-mist-100 p-0.5 dark:bg-mist-600'>
          <Tooltip delay={300}>
            <Button
              isIconOnly
              variant='ghost'
              onClick={() => setDirectViewMode('list')}
              className={`rounded-md p-1 transition-colors ${directViewMode === 'list' ? 'bg-white shadow-sm dark:bg-mist-500' : ''}`}>
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
              onClick={() => setDirectViewMode('grid')}
              isIconOnly
              variant='ghost'
              className={`rounded-md p-1 transition-colors ${directViewMode === 'grid' ? 'bg-white shadow-sm dark:bg-mist-500' : ''}`}>
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
              onClick={() => setDirectViewMode('smart')}
              variant='ghost'
              isIconOnly
              className={`rounded-md p-1 transition-colors ${directViewMode === 'smart' ? 'bg-white shadow-sm dark:bg-mist-500' : ''}`}>
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
      {directViewMode === 'list' ? (
        <div className='relative flex flex-col gap-2'>
          {sortedDirectBookmarks.map((bookmark, index) => (
            <div
              key={bookmark.id}
              className='relative'
              onDragOver={(e: any) => handleDirectItemDragOver(e, index)}>
              {directDragOverIndex === index && (
                <div className='bg-primary-500 absolute top-0 right-0 left-0 z-10 h-0.5 -translate-y-1 rounded-full' />
              )}
              <BookmarkCard
                bookmark={bookmark}
                viewMode='list'
                workspaceColor={workspaceColor}
                draggable
                onDragStart={(e: any) => handleDirectDragStart(e, bookmark)}
                onDragEnd={handleDirectDragEnd}
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          className='grid gap-3'
          style={{
            gridTemplateColumns: `repeat(auto-fill, ${directGridColWidth})`,
          }}>
          {sortedDirectBookmarks.map((bookmark, index) => (
            <div
              key={bookmark.id}
              className='relative'
              onDragOver={(e: any) => handleDirectItemDragOver(e, index)}>
              <BookmarkCard
                bookmark={bookmark}
                viewMode={directViewMode}
                workspaceColor={workspaceColor}
                draggable
                onDragStart={(e: any) => handleDirectDragStart(e, bookmark)}
                onDragEnd={handleDirectDragEnd}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UngroupedBookmarks;
