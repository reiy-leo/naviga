import { useState, useEffect } from 'react'
import NavBar from './components/layout/NavBar'
import SettingsModal from './components/layout/SettingsModal'
import WorkspaceView from './components/workspace/WorkspaceView'
import AllView from './components/workspace/AllView'
import EditBookmarkModal from './components/bookmark/EditBookmarkModal'
import { useAppStore } from './store/useAppStore'
import { useBookmarks } from './hooks/useBookmarks'

function App() {
  const { 
    workspaces, currentWorkspace, initWorkspaces, initFromChromeStorage, loadFaviconCache,
    fetchTabFavicons, setCurrentWorkspace,
    theme, background, iconSize, language
  } = useAppStore()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsDefaultTab, setSettingsDefaultTab] = useState('general')
  const [editBookmark, setEditBookmark] = useState(null)
  const [editParentBookmark, setEditParentBookmark] = useState(null)
  const [editSubBookmark, setEditSubBookmark] = useState(null)
  const [editTargetFolderId, setEditTargetFolderId] = useState(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [initialized, setInitialized] = useState(false)
  
  useBookmarks()
  
  // 初始化：从 Chrome Storage 恢复状态
  useEffect(() => {
    const init = async () => {
      await initFromChromeStorage()
      await loadFaviconCache()
      await initWorkspaces()
      // 获取 tabs favicon 数据
      await fetchTabFavicons()
      // 应用启动模式
      const { startupMode, lastWorkspace, startupWorkspace } = useAppStore.getState()
      if (startupMode === 'last' && lastWorkspace) {
        setCurrentWorkspace(lastWorkspace)
      } else if (startupMode === 'specific' && startupWorkspace) {
        setCurrentWorkspace(startupWorkspace)
      }
      // 'homepage' 模式保持默认 'all'
      setInitialized(true)
    }
    init()
  }, [])
  
  // 监听 background 发来的 tab favicon 更新通知
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      const listener = (message) => {
        if (message.type === 'tabFaviconsUpdated') {
          fetchTabFavicons()
        }
      }
      chrome.runtime.onMessage.addListener(listener)
      return () => chrome.runtime.onMessage.removeListener(listener)
    }
  }, [fetchTabFavicons])
  
  // 应用主题设置
  useEffect(() => {
    const root = document.documentElement
    
    // 应用主题
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }
    
    // 应用背景
    root.setAttribute('data-background', background || 'default')
    
    // 应用图标大小
    if (iconSize) {
      root.setAttribute('data-icon-size', iconSize)
    }
    
    // 应用语言
    if (language) {
      root.setAttribute('lang', language)
    }
  }, [theme, background, iconSize, language])
  
  // 监听编辑书签事件
  useEffect(() => {
    const handleEditBookmark = (e) => {
      setEditBookmark(e.detail)
      setEditParentBookmark(null)
      setEditSubBookmark(null)
      setEditModalOpen(true)
    }
    
    const handleAddBookmark = () => {
      setEditBookmark(null)
      setEditParentBookmark(null)
      setEditSubBookmark(null)
      setEditTargetFolderId(null)
      setEditModalOpen(true)
    }
    
    const handleAddBookmarkToFolder = (e) => {
      setEditBookmark(null)
      setEditParentBookmark(null)
      setEditSubBookmark(null)
      setEditTargetFolderId(e.detail?.folderId || null)
      setEditModalOpen(true)
    }
    
    const handleAddSubBookmark = (e) => {
      setEditBookmark(null)
      setEditParentBookmark(e.detail)
      setEditSubBookmark(null)
      setEditModalOpen(true)
    }
    
    const handleEditSubBookmark = (e) => {
      setEditBookmark(null)
      setEditParentBookmark(e.detail.parentId ? { id: e.detail.parentId } : null)
      setEditSubBookmark(e.detail.subBookmark)
      setEditModalOpen(true)
    }
    
    window.addEventListener('edit-bookmark', handleEditBookmark)
    window.addEventListener('add-bookmark', handleAddBookmark)
    window.addEventListener('add-bookmark-to-folder', handleAddBookmarkToFolder)
    window.addEventListener('add-sub-bookmark', handleAddSubBookmark)
    window.addEventListener('edit-sub-bookmark', handleEditSubBookmark)
    
    return () => {
      window.removeEventListener('edit-bookmark', handleEditBookmark)
      window.removeEventListener('add-bookmark', handleAddBookmark)
      window.removeEventListener('add-bookmark-to-folder', handleAddBookmarkToFolder)
      window.removeEventListener('add-sub-bookmark', handleAddSubBookmark)
      window.removeEventListener('edit-sub-bookmark', handleEditSubBookmark)
    }
  }, [])
  
  const handleEditSave = () => {
    setEditModalOpen(false)
    setEditBookmark(null)
    setEditParentBookmark(null)
    setEditSubBookmark(null)
    setEditTargetFolderId(null)
  }
  
  if (!initialized) {
    return (
      <div className="app loading">
        <div className="flex items-center gap-3 text-default-500">
          <div className="w-5 h-5 border-2 border-default-300 border-t-primary-500 rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    )
  }
  
  return (
    <div className="app">
      <NavBar 
        onSettingsClick={() => { setSettingsDefaultTab('general'); setSettingsOpen(true) }}
        onLogoClick={() => { setSettingsDefaultTab('about'); setSettingsOpen(true) }}
        onAddBookmark={() => window.dispatchEvent(new Event('add-bookmark'))}
      />
      
      <main id="main-content">
        {currentWorkspace === 'all' ? (
          <AllView />
        ) : (
          <WorkspaceView workspaceId={currentWorkspace} />
        )}
      </main>
      
      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} defaultTab={settingsDefaultTab} />
      )}
      
      {editModalOpen && (
        <EditBookmarkModal
          bookmark={editBookmark}
          parentBookmark={editParentBookmark}
          subBookmark={editSubBookmark}
          targetFolderId={editTargetFolderId}
          onClose={() => {
            setEditModalOpen(false)
            setEditBookmark(null)
            setEditParentBookmark(null)
            setEditSubBookmark(null)
            setEditTargetFolderId(null)
          }}
          onSave={handleEditSave}
        />
      )}
    </div>
  )
}

export default App
