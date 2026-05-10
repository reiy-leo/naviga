import { useState, useEffect, useCallback } from 'react';

import EditBookmarkModal from './components/bookmark/EditBookmarkModal';
import MoveToWorkspaceModal from './components/bookmark/MoveToWorkspaceModal';
import NavBar from './components/layout/NavBar';
import SettingsModal from './components/layout/SettingsModal';
import AllView from './components/workspace/AllView';
import WorkspaceView from './components/workspace/WorkspaceView';
import { useBookmarks } from './hooks/useBookmarks';
import i18n from './i18n/i18n';
import { useAppStore } from './store/useAppStore';

function App() {
  const {
    currentWorkspace,
    initWorkspaces,
    initFromChromeStorage,
    loadFaviconCache,
    fetchTabFavicons,
    setCurrentWorkspace,
    theme,
    background,
    iconSize,
    language,
  } = useAppStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState('general');

  const [editBookmark, setEditBookmark] = useState(null);
  const [editParentBookmark, setEditParentBookmark] = useState(null);
  const [editSubBookmark, setEditSubBookmark] = useState(null);
  const [editTargetFolderId, setEditTargetFolderId] = useState(null);

  const [editModalOpen, setEditModalOpen] = useState(false);

  const [moveBookmark, setMoveBookmark] = useState(null);
  const [moveTitle, setMoveTitle] = useState(null);
  const [moveType, setMoveType] = useState(null);
  const [moveModalOpen, setMoveModalOpen] = useState(false);

  // 全局回调，供书签菜单直接调用（避免 window 事件链路不稳定）
  const openEditModal = useCallback((bookmark, parentBookmark, subBookmark, targetFolderId) => {
    setEditBookmark(bookmark);
    setEditParentBookmark(parentBookmark || null);
    setEditSubBookmark(subBookmark || null);
    setEditTargetFolderId(targetFolderId || null);
    setEditModalOpen(true);
  }, []);

  const openMoveModal = useCallback((bookmark, title, moveType) => {
    setMoveBookmark(bookmark);
    setMoveTitle(title);
    setMoveType(moveType);
    setMoveModalOpen(true);
  }, []);

  // 挂载到全局供子组件调用
  useEffect(() => {
    window.__navigaActions = { openEditModal, openMoveModal };
    return () => {
      delete window.__navigaActions;
    };
  }, [openEditModal, openMoveModal]);

  const [initialized, setInitialized] = useState(false);

  useBookmarks();

  // 初始化：从 Chrome Storage 恢复状态
  useEffect(() => {
    const init = async () => {
      await initFromChromeStorage();
      await loadFaviconCache();
      await initWorkspaces();
      // 获取 tabs favicon 数据
      await fetchTabFavicons();
      // 应用启动模式
      const { startupMode, lastWorkspace, startupWorkspace } = useAppStore.getState();
      if (startupMode === 'openLastWorkspace' && lastWorkspace) {
        setCurrentWorkspace(lastWorkspace);
      } else if (startupMode === 'openSpecificWorkspace' && startupWorkspace) {
        setCurrentWorkspace(startupWorkspace);
      }
      // 'homepage' 模式保持默认 'all'
      setInitialized(true);
    };
    init();
  }, []);

  // 监听 background 发来的 tab favicon 更新通知
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      const listener = (message) => {
        if (message.type === 'tabFaviconsUpdated') {
          fetchTabFavicons();
        }
      };
      chrome.runtime.onMessage.addListener(listener);
      return () => chrome.runtime.onMessage.removeListener(listener);
    }
  }, [fetchTabFavicons]);

  // 应用主题设置
  useEffect(() => {
    const root = document.documentElement;

    // 应用主题
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }

    // 应用背景
    root.setAttribute('data-background', background || 'default');

    // 应用图标大小
    if (iconSize) {
      root.setAttribute('data-icon-size', iconSize);
    }

    // 应用语言
    if (language) {
      root.setAttribute('lang', language);
      // 切换 i18n 语言
      if (i18n.language !== language) {
        i18n.changeLanguage(language);
      }
      // 设置页面标题（使用指定语言的翻译）
      document.title = i18n.t('newTabPage', { lng: language });
    }
  }, [theme, background, iconSize, language]);

  const handleEditSave = () => {
    setEditModalOpen(false);
    setEditBookmark(null);
    setEditParentBookmark(null);
    setEditSubBookmark(null);
    setEditTargetFolderId(null);
  };

  if (!initialized) {
    return (
      <div className='app loading'>
        <div className='flex items-center gap-3 text-mist-500'>
          <div className='border-t-primary-500 h-5 w-5 animate-spin rounded-full border-2 border-mist-300' />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className='app'>
      <NavBar
        onSettingsClick={() => {
          setSettingsDefaultTab('general');
          setSettingsOpen(true);
        }}
        onLogoClick={() => {
          setSettingsDefaultTab('about');
          setSettingsOpen(true);
        }}
      />

      <main id='main-content'>
        {currentWorkspace === 'all' ? <AllView /> : <WorkspaceView workspaceId={currentWorkspace} />}
      </main>

      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          defaultTab={settingsDefaultTab}
        />
      )}

      {editModalOpen && (
        <EditBookmarkModal
          bookmark={editBookmark}
          parentBookmark={editParentBookmark}
          subBookmark={editSubBookmark}
          targetFolderId={editTargetFolderId}
          onClose={() => {
            setEditModalOpen(false);
            setEditBookmark(null);
            setEditParentBookmark(null);
            setEditSubBookmark(null);
            setEditTargetFolderId(null);
          }}
          onSave={handleEditSave}
        />
      )}

      {moveModalOpen && (
        <MoveToWorkspaceModal
          bookmark={moveBookmark}
          title={moveTitle}
          moveType={moveType}
          currentWorkspaceId={currentWorkspace}
          onClose={() => {
            setMoveModalOpen(false);
            setMoveTitle(null);
            setMoveBookmark(null);
          }}
          onComplete={() => {
            // 移动完成后刷新书签列表
            const { initWorkspaces } = useAppStore.getState();
            initWorkspaces();
          }}
        />
      )}
    </div>
  );
}

export default App;
