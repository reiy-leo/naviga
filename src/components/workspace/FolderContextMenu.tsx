import { Button } from '@heroui/react';
import { BookmarkPlus, FolderMinus, FolderPlus, FolderX, Pencil } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { deleteShadow } from '../../db/shadows';

interface FolderContextMenuProps {
  x: number;
  y: number;
  folderId: string;
  folderTitle?: string;
  isShadow: boolean;
  workspaceId: string;
  onClose: () => void;
  onRefresh?: () => void;
}

export function FolderContextMenu({
  x,
  y,
  folderId,
  isShadow,
  workspaceId,
  onClose,
  onRefresh,
}: FolderContextMenuProps) {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);

  const menuWidth = 180;
  const menuHeight = 260;
  let adjustedX = x;
  let adjustedY = y;
  if (adjustedX + menuWidth > window.innerWidth) adjustedX = window.innerWidth - menuWidth - 8;
  if (adjustedY + menuHeight > window.innerHeight) adjustedY = window.innerHeight - menuHeight - 8;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      onClose();
    };
    const handleContextMenu = (e: MouseEvent) => {
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

  // 重命名（触发双击编辑）
  const handleRename = () => {
    onClose();
    // 通过 CustomEvent 通知 FolderGroup 进入编辑模式
    window.dispatchEvent(new CustomEvent('folder-rename', { detail: { folderId } }));
  };

  const handleShadowDelete = async () => {
    // 删除shadow
    console.info('shadow delete', folderId);
    await deleteShadow(folderId);
    // 更新allShadows让当前workspace页面刷新
    onRefresh?.();
  };

  // 新建子文件夹
  const handleNewSubFolder = async () => {
    onClose();
    try {
      await chrome.bookmarks.create({
        parentId: folderId,
        title: t('newFolder'),
      });
      onRefresh?.();
    } catch (err) {
      console.error('Failed to create sub folder:', err);
    }
  };

  // 新建书签
  const handleNewBookmark = () => {
    onClose();
    // 打开编辑弹窗，指定父文件夹
    window.dispatchEvent(new CustomEvent('add-bookmark-to-folder', { detail: { folderId } }));
  };

  // 解散文件夹：将子项移到父文件夹（workspaceId），然后删除空文件夹
  const handleDissolve = async () => {
    onClose();
    try {
      const folder = await chrome.bookmarks.get(folderId);
      const parentId = folder[0]?.parentId || workspaceId;
      const children = await chrome.bookmarks.getChildren(folderId);
      // 将所有子项移到父文件夹
      for (const child of children) {
        await chrome.bookmarks.move(child.id, { parentId });
      }
      // 删除空文件夹
      await chrome.bookmarks.remove(folderId);
      onRefresh?.();
    } catch (err) {
      console.error('Failed to dissolve folder:', err);
    }
  };

  // 删除文件夹：递归删除文件夹及其所有子项
  const handleDelete = async () => {
    onClose();
    if (!confirm(t('confirmDeleteFolder'))) return;
    try {
      await chrome.bookmarks.removeTree(folderId);
      onRefresh?.();
    } catch (err) {
      console.error('Failed to delete folder:', err);
    }
  };

  return (
    <div
      ref={menuRef}
      className='bg-content1 animate-slide-down fixed z-9999 max-w-55 min-w-45 rounded-xl border border-mist-200 py-1 shadow-lg'
      style={{ left: adjustedX, top: adjustedY }}
      onClick={(e) => e.stopPropagation()}>
      {!isShadow && (
        <Button
          className='hover:bg-accent w-full place-content-start rounded-none px-4 py-2.5 text-sm transition-colors'
          variant='ghost'
          onClick={handleRename}>
          <Pencil
            size={16}
            className='text-mist-400'
          />
          {t('rename')}
        </Button>
      )}
      <Button
        className='hover:bg-accent w-full place-content-start rounded-none px-4 py-2.5 text-sm transition-colors'
        variant='ghost'
        onClick={handleNewBookmark}>
        <BookmarkPlus
          size={16}
          className='text-mist-400'
        />
        {t('newBookmark')}
      </Button>
      <Button
        className='hover:bg-accent w-full place-content-start rounded-none px-4 py-2.5 text-sm transition-colors'
        variant='ghost'
        onClick={handleNewSubFolder}>
        <FolderPlus
          size={16}
          className='text-mist-400'
        />
        {t('newSubFolder')}
      </Button>
      <div className='my-1 border-t border-mist-200' />
      {!isShadow && (
        <Button
          className='hover:bg-accent w-full place-content-start rounded-none px-4 py-2.5 text-sm transition-colors'
          variant='ghost'
          onClick={handleDissolve}>
          <FolderMinus
            size={16}
            className='text-warning-500'
          />
          {t('dissolveFolder')}
        </Button>
      )}
      {!isShadow && (
        <Button
          className='hover:bg-danger-50 text-danger-500 w-full place-content-start rounded-none px-4 py-2.5 text-sm transition-colors'
          variant='ghost'
          onClick={handleDelete}>
          <FolderX size={16} />
          {t('deleteFolder')}
        </Button>
      )}
      {isShadow && (
        <Button
          className='hover:bg-danger-50 text-danger-500 w-full place-content-start rounded-none px-4 py-2.5 text-sm transition-colors'
          variant='ghost'
          onClick={handleShadowDelete}>
          <FolderX size={16} />
          {t('deleteShadowFolder')}
        </Button>
      )}
    </div>
  );
}
