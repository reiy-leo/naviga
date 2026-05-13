import type { ReactNode } from 'react';

import EditBookmarkModal from '@cpn/bookmark/EditBookmarkModal';
import MoveToWorkspaceModal from '@cpn/bookmark/MoveToWorkspaceModal';
import NavBar from '@cpn/layout/NavBar';
import SettingsModal from '@cpn/layout/SettingsModal';
import AllView from '@cpn/workspace/AllView';
import WorkspaceView from '@cpn/workspace/WorkspaceView';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import { useBookmarks } from '@/hooks/useBookmarks';
import i18n from '@/i18n';
import { useAppStore } from '@/store/useAppStore';

// 扩展 Window 接口以包含自定义属性
declare global {
  interface Window {
    __navigaActions?: {
      openEditModal: (bookmark: any, parentBookmark?: any, subBookmark?: any, targetFolderId?: string) => void;
      openMoveModal: (bookmark: any, title: string, moveType: string) => void;
    };
  }
}

function App(): ReactNode {
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
    startupMode,
    lastWorkspace,
    startupWorkspace,
  } = useAppStore();

  const { t } = useTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState('general');

  const [editBookmark, setEditBookmark] = useState<any>(null);
  const [editParentBookmark, setEditParentBookmark] = useState<any>(null);
  const [editSubBookmark, setEditSubBookmark] = useState<any>(null);
  const [editTargetFolderId, setEditTargetFolderId] = useState<string | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);

  const [moveBookmark, setMoveBookmark] = useState<any>(null);
  const [moveTitle, setMoveTitle] = useState<string | null>(null);
  const [moveType, setMoveType] = useState<string | null>(null);
  const [moveModalOpen, setMoveModalOpen] = useState(false);

  const openEditModal = useCallback(
    (bookmark: any, parentBookmark?: any, subBookmark?: any, targetFolderId?: string) => {
      setEditBookmark(bookmark);
      setEditParentBookmark(parentBookmark || null);
      setEditSubBookmark(subBookmark || null);
      setEditTargetFolderId(targetFolderId || null);
      setEditModalOpen(true);
    },
    [],
  );

  const openMoveModal = useCallback((bookmark: any, title: string, moveType: string) => {
    setMoveBookmark(bookmark);
    setMoveTitle(title);
    setMoveType(moveType);
    setMoveModalOpen(true);
  }, []);

  useEffect(() => {
    window.__navigaActions = { openEditModal, openMoveModal };
    return () => {
      delete window.__navigaActions;
    };
  }, [openEditModal, openMoveModal]);

  const [initialized, setInitialized] = useState(false);

  useBookmarks();

  useEffect(() => {
    const init = async () => {
      await initFromChromeStorage();
      await loadFaviconCache();
      await initWorkspaces();
      await fetchTabFavicons();
      if (startupMode === 'openLastWorkspace' && lastWorkspace) {
        setCurrentWorkspace(lastWorkspace);
      } else if (startupMode === 'openSpecificWorkspace' && startupWorkspace) {
        setCurrentWorkspace(startupWorkspace);
      }
      setInitialized(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      const listener = (message: any) => {
        if (message.type === 'tabFaviconsUpdated') {
          fetchTabFavicons();
        }
      };
      chrome.runtime.onMessage.addListener(listener);
      return () => chrome.runtime.onMessage.removeListener(listener);
    }
  }, [fetchTabFavicons]);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }

    root.setAttribute('data-background', background || 'default');

    if (iconSize) {
      root.setAttribute('data-icon-size', iconSize);
    }

    if (language) {
      root.setAttribute('lang', language);
      if (i18n.language !== language) {
        i18n.changeLanguage(language);
      }
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
          {t('loading')}
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
        {currentWorkspace === 'all' ? (
          <AllView />
        ) : (
          <Suspense fallback={<div>Loading data from IndexedDB...</div>}>
            <WorkspaceView workspaceId={currentWorkspace} />
          </Suspense>
        )}
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

      {moveModalOpen && moveBookmark && moveTitle && moveType && (
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
            const { initWorkspaces } = useAppStore.getState();
            initWorkspaces();
          }}
        />
      )}
    </div>
  );
}

export default App;
