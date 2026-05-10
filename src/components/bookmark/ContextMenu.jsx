import { Button } from '@heroui/react';
import { BookmarkPlus, Folder, Pencil, RefreshCw, Star, StarOff, Trash2, SquareDashed } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '../../store/useAppStore';

export function ContextMenu({ x, y, isShadow, bookmark, isFav, onClose }) {
  const { t } = useTranslation();
  const { toggleFavorite } = useAppStore();
  const menuRef = useRef(null);

  const menuWidth = 180;
  const menuHeight = 240;
  let adjustedX = x;
  let adjustedY = y;
  if (adjustedX + menuWidth > window.innerWidth) adjustedX = window.innerWidth - menuWidth - 8;
  if (adjustedY + menuHeight > window.innerHeight) adjustedY = window.innerHeight - menuHeight - 8;

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      onClose();
    };
    const handleContextMenu = (e) => {
      e.preventDefault();
      onClose();
    };
    const handleScroll = () => onClose();
    const timer = setTimeout(() => {
      window.addEventListener('click', handleClick);
      window.addEventListener('contextmenu', handleContextMenu);
      window.addEventListener('scroll', handleScroll, true);
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className='bg-content1 animate-slide-down fixed z-9999 max-w-55 min-w-45 rounded-md border border-mist-200 py-1 shadow-lg'
      style={{ left: adjustedX, top: adjustedY }}
      onClick={(e) => e.stopPropagation()}>
      <Button
        className='w-full place-content-start rounded-none px-4 py-2.5 text-sm text-mist-950 transition-colors hover:bg-mist-100'
        variant='ghost'
        onClick={() => {
          toggleFavorite(bookmark.id);
          onClose();
        }}>
        {isFav ? (
          <StarOff
            size={16}
            className='text-yellow-500'
          />
        ) : (
          <Star
            size={16}
            className='text-mist-400'
          />
        )}
        <span>{isFav ? t('unfavorite') : t('favorite')}</span>
      </Button>

      {/* 编辑书签 */}
      <Button
        className='w-full place-content-start rounded-none px-4 py-2.5 text-sm text-mist-950 transition-colors hover:bg-mist-100'
        variant='ghost'
        onClick={() => {
          window.__navigaActions?.openEditModal(bookmark, null, null, null);
          onClose();
        }}>
        <Pencil
          size={16}
          className='text-mist-400'
        />
        <span>{t('edit')}</span>
      </Button>

      {/* 添加子书签 */}
      <Button
        className='w-full place-content-start rounded-none px-4 py-2.5 text-sm text-mist-950 transition-colors hover:bg-mist-100'
        variant='ghost'
        onClick={() => {
          window.__navigaActions?.openEditModal(null, bookmark, null, null);
          onClose();
        }}>
        <BookmarkPlus
          size={16}
          className='text-mist-400'
        />
        <span>{t('addSubBookmark')}</span>
      </Button>

      <Button
        className='w-full place-content-start rounded-none px-4 py-2.5 text-sm text-mist-950 transition-colors hover:bg-mist-100'
        variant='ghost'
        onClick={() => {
          window.dispatchEvent(new CustomEvent('refresh-icon', { detail: bookmark }));
          onClose();
        }}>
        <RefreshCw
          size={16}
          className='text-mist-400'
        />
        <span>{t('refreshIcon')}</span>
      </Button>

      <div className='my-1 border-t border-mist-200' />

      <Button
        className='w-full place-content-start rounded-none px-4 py-2.5 text-sm text-mist-950 transition-colors hover:bg-mist-100'
        variant='ghost'
        onClick={(e) => {
          e.stopPropagation();
          window.__navigaActions?.openMoveModal(bookmark, t('moveToWorkspace'), 'moveBookmark');
          onClose();
        }}>
        <Folder
          size={16}
          className='text-mist-400'
        />
        <span>{t('moveToWorkspace')}</span>
      </Button>
      {!isShadow && (
        <Button
          className='w-full place-content-start rounded-none px-4 py-2.5 text-sm text-mist-950 transition-colors hover:bg-mist-100'
          variant='ghost'
          onClick={(e) => {
            e.stopPropagation();
            window.__navigaActions?.openMoveModal(bookmark, t('createShadowToWorkspace'), 'shadowBookmark');
            onClose();
          }}>
          <SquareDashed
            size={16}
            className='text-mist-400'
          />
          <span>{t('createShadow')}</span>
        </Button>
      )}

      <Button
        className='w-full place-content-start rounded-none px-4 py-2.5 text-sm text-red-950 transition-colors hover:bg-red-50'
        variant='ghost'
        onClick={() => {
          if (confirm(t('confirmDelete'))) {
            chrome.bookmarks.remove(bookmark.id);
          }
          onClose();
        }}>
        <Trash2 size={16} />
        <span>{t('delete')}</span>
      </Button>
    </div>
  );
}
