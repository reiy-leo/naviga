import { Button } from '@heroui/react';
import { Link2, Star, Pencil, X } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '../../store/useAppStore';

/** 获取子书签 favicon URL 优先级：faviconCache(base64) → tabFavicons → domain/favicon.ico */
function getSubFavicon(url, faviconCache = {}, tabFavicons = {}) {
  try {
    const domain = new URL(url).origin;
    // 1. 从indexdb中获取缓存
    if (faviconCache[domain]?.favicon) return faviconCache[domain].favicon;
    // 2. 从打开的tabs中获取
    if (tabFavicons[domain]) return tabFavicons[domain];
    // 3. 默认favicon地址
    return `${domain}/favicon.ico`;
  } catch {
    return null;
  }
}

function calcPlacement(triggerRect, subsCount) {
  const vpW = window.innerWidth;
  const vpH = window.innerHeight;
  const estW = 260;
  const estH = 40 + subsCount * 36;
  const gap = 6;

  const cx = triggerRect.left + triggerRect.width / 2;
  const cy = triggerRect.top + triggerRect.height / 2;

  const spaces = {
    bottom: vpH - triggerRect.bottom - gap,
    top: triggerRect.top - gap,
    right: vpW - triggerRect.right - gap,
    left: triggerRect.left - gap,
  };

  const candidates = Object.entries(spaces)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1]);

  const vertFirst = ['bottom', 'top'];
  const best =
    candidates.find(([dir]) => {
      if (vertFirst.includes(dir)) return spaces[dir] >= estH;
      return spaces[dir] >= estW;
    }) || candidates[0];

  const placement = best ? best[0] : 'bottom';

  let offset = {};
  switch (placement) {
    case 'bottom':
      offset = {
        left: Math.max(8, Math.min(cx - estW / 2, vpW - estW - 8)) - triggerRect.left,
        top: triggerRect.height + gap,
      };
      break;
    case 'top':
      offset = {
        left: Math.max(8, Math.min(cx - estW / 2, vpW - estW - 8)) - triggerRect.left,
        top: -estH - gap,
      };
      break;
    case 'right':
      offset = {
        left: triggerRect.width + gap,
        top: Math.max(8, Math.min(cy - estH / 2, vpH - estH - 8)) - triggerRect.top,
      };
      break;
    case 'left':
      offset = {
        left: -estW - gap,
        top: Math.max(8, Math.min(cy - estH / 2, vpH - estH - 8)) - triggerRect.top,
      };
      break;
  }

  return { placement, offset };
}

export function SubBookmarkListItem({ item, parentId, faviconCache, tabFavicons, removeSubBookmark, onClose }) {
  const { t } = useTranslation();
  const [subFav, setSubFav] = useState(null);

  const handleSubFav = (e, sub) => {
    e.stopPropagation();
  };

  const handleSubClick = (e, url) => {
    e.stopPropagation();
    window.open(url, '_blank');
    onClose();
  };

  const handleSubDelete = (e, subId) => {
    e.stopPropagation();
    removeSubBookmark(parentId, subId);
  };

  const handleSubEdit = (e, sub) => {
    e.stopPropagation();
    window.__navigaActions?.openEditModal(null, { id: parentId }, sub, null);
    onClose();
  };

  useEffect(() => {
    setSubFav(getSubFavicon(item.url, faviconCache, tabFavicons));
  }, [item.url]);

  return (
    <div
      className='flex cursor-pointer rounded-sm transition-colors hover:bg-mist-100'
      key={item.id}
      onClick={(e) => handleSubClick(e, item.url)}>
      <div className='flex flex-1 grow flex-row items-center text-xs'>
        {subFav ? (
          <img
            src={subFav}
            alt=''
            className='m-2 mx-2 my-2 h-6 w-6 rounded-md object-contain'
            onError={(e) => {
              console.error('favicon load error for', item.url, e);
              setSubFav(null);
            }}
          />
        ) : (
          <Link2
            size={16}
            className='m-2 mx-2 my-2 rounded-md text-mist-400'
          />
        )}
        {item.title}
      </div>
      <div className='flex flex-row items-center px-2'>
        <Button
          variant='ghost'
          size='sm'
          className='rounded-lg text-sm transition-colors hover:bg-mist-200 dark:hover:bg-mist-400'
          onClick={(e) => handleSubEdit(e, item)}
          title={t('edit')}>
          <Pencil
            size={11}
            className='text-mist-700 dark:text-mist-200'
          />
        </Button>
        <Button
          variant='ghost'
          size='sm'
          className='rounded-lg text-sm transition-colors hover:bg-red-200 dark:hover:bg-red-700'
          onClick={(e) => handleSubDelete(e, item.id)}
          title={t('delete')}>
          <X
            size={11}
            className='text-red-700 dark:text-red-300'
          />
        </Button>
      </div>
    </div>
  );
}

export function SubBookmarkList({ parentId, faviconCache, tabFavicons, onClose, triggerRef }) {
  const { removeSubBookmark, subBookmarks } = useAppStore();
  const { t } = useTranslation();
  const subs = subBookmarks[parentId] || [];

  const { placement, offset } = useMemo(() => {
    if (!triggerRef?.current) return { placement: 'bottom', offset: { left: 0, top: 0 } };
    const rect = triggerRef.current.getBoundingClientRect();
    return calcPlacement(rect, subs.length);
  }, [subs.length]);

  if (subs.length === 0) return null;

  return (
    <div
      className='bg-content1 animate-slide-down absolute z-9999 max-w-sm min-w-3xs rounded-xl border border-mist-200 p-2 shadow-lg'
      style={{ left: offset.left, top: offset.top }}
      onClick={(e) => e.stopPropagation()}>
      {subs.map((sub, subIndex) => {
        return (
          <SubBookmarkListItem
            key={`${parentId}-${sub.id}`}
            parentId={parentId}
            item={sub}
            faviconCache={faviconCache}
            tabFavicons={tabFavicons}
            removeSubBookmark={removeSubBookmark}
            onClose={onClose}
          />
        );
      })}
    </div>
  );
}
