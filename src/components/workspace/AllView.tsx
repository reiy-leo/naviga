import { Tooltip } from '@heroui/react/tooltip';
import { LayoutList, LayoutGrid, Star, Clock, Sparkles } from 'lucide-react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useBookmarks } from '../../hooks/useBookmarks';
import { useAppStore } from '../../store/useAppStore';
import BookmarkCard from '../bookmark/BookmarkCard';

/** 递归收集所有书签（含嵌套子文件夹内的） */
function collectAllBookmarks(items: any[], result: any[] = []): any[] {
  for (const item of items) {
    if (item.url) {
      result.push(item);
    } else if (item.children) {
      collectAllBookmarks(item.children, result);
    }
  }
  return result;
}

/** 分区视图切换器 */
interface SectionViewToggleProps {
  viewMode: string;
  onViewModeChange: (mode: string) => void;
}

function SectionViewToggle({ viewMode, onViewModeChange }: SectionViewToggleProps) {
  const { t } = useTranslation();
  return (
    <div className='flex flex-0 gap-0.5 rounded-lg bg-gray-100/50 p-0.5'>
      <Tooltip>
        <Tooltip.Trigger>
          <button
            onClick={() => onViewModeChange('list')}
            className={`rounded-md p-1 transition-colors ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}>
            <LayoutList size={14} />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <p>{t('listView')}</p>
        </Tooltip.Content>
      </Tooltip>
      <Tooltip>
        <Tooltip.Trigger>
          <button
            onClick={() => onViewModeChange('grid')}
            className={`rounded-md p-1 transition-colors ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}>
            <LayoutGrid size={14} />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <p>{t('gridView')}</p>
        </Tooltip.Content>
      </Tooltip>
      <Tooltip>
        <Tooltip.Trigger>
          <button
            onClick={() => onViewModeChange('smart')}
            className={`rounded-md p-1 transition-colors ${viewMode === 'smart' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}>
            <Sparkles size={14} />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <p>{t('smartView')}</p>
        </Tooltip.Content>
      </Tooltip>
    </div>
  );
}

export default function AllView() {
  const { bookmarks, loading } = useBookmarks();
  const { workspaces, clickCounts, favorites, setFolderViewMode, getFolderViewMode, iconSize } = useAppStore();

  const favViewMode = getFolderViewMode('__all_favorites');
  const freqViewMode = getFolderViewMode('__all_frequent');
  const setFavViewMode = (mode: string) => setFolderViewMode('__all_favorites', mode);
  const setFreqViewMode = (mode: string) => setFolderViewMode('__all_frequent', mode);

  const [allBookmarks, setAllBookmarks] = useState<any[]>([]);

  const buildAllBookmarks = useCallback(async () => {
    if (loading || !workspaces.length) {
      setAllBookmarks([]);
      return;
    }
    try {
      const result: any[] = [];
      for (const ws of workspaces) {
        const subTree = await chrome.bookmarks.getSubTree(ws.id);
        const children = subTree[0]?.children || [];
        collectAllBookmarks(children, result);
      }
      setAllBookmarks(result);
    } catch (err) {
      console.error('Failed to collect all bookmarks:', err);
      const flat: any[] = [];
      for (const wsId of Object.keys(bookmarks)) {
        flat.push(...(bookmarks[wsId] || []));
      }
      setAllBookmarks(flat);
    }
  }, [loading, workspaces, bookmarks]);

  useEffect(() => {
    buildAllBookmarks();
  }, [buildAllBookmarks]);

  const favoriteBookmarks = useMemo(() => {
    if (favorites.length === 0) return [];
    const favSet = new Set(favorites);
    return allBookmarks.filter((b) => favSet.has(b.id));
  }, [allBookmarks, favorites]);

  const frequentBookmarks = useMemo(() => {
    const favSet = new Set(favorites);
    return [...allBookmarks]
      .filter((b) => !favSet.has(b.id) && (clickCounts[b.id] || 0) > 0)
      .sort((a, b) => (clickCounts[b.id] || 0) - (clickCounts[a.id] || 0))
      .slice(0, 20);
  }, [allBookmarks, clickCounts, favorites]);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <div className='text-gray-500'>加载中...</div>
      </div>
    );
  }

  const gridColWidth = iconSize === 'small' ? '90px' : iconSize === 'large' ? '148px' : '116px';

  const hasContent = favoriteBookmarks.length > 0 || frequentBookmarks.length > 0;

  const renderBookmarks = (list: any[], viewMode: string) => {
    if (list.length === 0) return null;
    const sorted =
      viewMode === 'smart' ? [...list].sort((a, b) => (clickCounts[b.id] || 0) - (clickCounts[a.id] || 0)) : list;

    if (viewMode === 'list') {
      return (
        <div className='flex flex-col gap-2'>
          {sorted.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              viewMode='list'
            />
          ))}
        </div>
      );
    }
    return (
      <div
        className='grid gap-3'
        style={{ gridTemplateColumns: `repeat(auto-fill, ${gridColWidth})` }}>
        {sorted.map((bookmark) => (
          <div key={bookmark.id}>
            <BookmarkCard
              bookmark={bookmark}
              viewMode={viewMode}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className='animate-fade-in'>
      <div className='mb-8 flex items-center justify-between'>
        <h2 className='text-2xl font-semibold'>收藏与常访问</h2>
      </div>

      {favoriteBookmarks.length > 0 && (
        <div className='mb-8'>
          <div className='mb-4 flex items-center gap-2 px-1'>
            <Star
              size={16}
              className='text-warning-500 fill-warning-500'
            />
            <span className='text-sm font-medium text-gray-500'>收藏</span>
            <span className='text-xs text-gray-400'>{favoriteBookmarks.length}</span>
            <div className='flex-1' />
            <SectionViewToggle
              viewMode={favViewMode}
              onViewModeChange={setFavViewMode}
            />
          </div>
          {renderBookmarks(favoriteBookmarks, favViewMode)}
        </div>
      )}

      {favoriteBookmarks.length > 0 && frequentBookmarks.length > 0 && (
        <div className='my-8 border-t border-gray-200' />
      )}

      {frequentBookmarks.length > 0 && (
        <div className='mb-8'>
          <div className='mb-4 flex items-center gap-2 px-1'>
            <Clock
              size={16}
              className='text-gray-400'
            />
            <span className='text-sm font-medium text-gray-500'>常访问</span>
            <span className='text-xs text-gray-400'>{frequentBookmarks.length}</span>
            <div className='flex-1' />
            <SectionViewToggle
              viewMode={freqViewMode}
              onViewModeChange={setFreqViewMode}
            />
          </div>
          {renderBookmarks(frequentBookmarks, freqViewMode)}
        </div>
      )}

      {!hasContent && (
        <div className='py-20 text-center text-gray-500'>
          <p className='mb-2 text-lg'>暂无收藏或常访问</p>
          <p className='text-sm'>右键点击书签可添加收藏，点击书签会记录访问频率</p>
        </div>
      )}
    </div>
  );
}
