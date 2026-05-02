import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Chrome Storage 适配器
const chromeStorage = {
  getItem: (name) => {
    // 在 Chrome Extension 环境中，我们无法同步读取
    // 返回 null 让 Zustand 使用默认值
    // 数据会通过 initFromChromeStorage 异步恢复
    if (typeof chrome !== 'undefined' && chrome.storage) {
      return null
    }
    // 开发环境使用 localStorage
    const item = localStorage.getItem(name)
    return item ? JSON.parse(item) : null
  },
  setItem: (name, value) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ [name]: value })
    } else {
      localStorage.setItem(name, JSON.stringify(value))
    }
  },
  removeItem: (name) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.remove([name])
    } else {
      localStorage.removeItem(name)
    }
  },
}

export const useAppStore = create(
  persist(
    (set, get) => ({
      // 辅助函数：从名称中提取 emoji 和文本
      parseWorkspaceTitle: (title) => {
        if (!title) return { emoji: null, text: '' }
        
        // \p{Extended_Pictographic} 只匹配图形化 emoji，不会误匹配数字、#、*
        // 支持 ZWJ 序列 (👨‍👩‍👧) 和变体选择器 (❤️)
        const emojiRegex = /^((?:\p{Extended_Pictographic}(?:\uFE0F?|\u200D(?:\p{Extended_Pictographic}|\p{Emoji_Component}))*)+)/u
        const match = title.match(emojiRegex)
        
        if (match && match[1]) {
          const emoji = match[1]
          // 去除 emoji 后的前导空白和分隔符
          const text = title.slice(emoji.length).replace(/^[\s\-—–·|:：]+/, '').trim()
          if (text) {
            return { emoji, text }
          }
          // 如果去掉 emoji 后没有文字，整个 title 作为 text
          return { emoji, text: title }
        }
        
        return { emoji: null, text: title }
      },
      // 主题设置
      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      // 背景预设
      background: 'default',
      setBackground: (background) => set({ background }),

      // 图标大小
      iconSize: 'medium',
      setIconSize: (iconSize) => set({ iconSize }),

      // 标签显示
      tabDisplay: 'both',
      setTabDisplay: (tabDisplay) => set({ tabDisplay }),

      // 显示标签栏
      showTabBar: true,
      setShowTabBar: (showTabBar) => set({ showTabBar }),
      
      // 默认工作区
      defaultWorkspace: 'all',
      setDefaultWorkspace: (defaultWorkspace) => set({ defaultWorkspace }),

      // 启动时行为: 'homepage' | 'last' | 'specific'
      startupMode: 'homepage',
      setStartupMode: (startupMode) => set({ startupMode }),

      // 启动时打开的指定工作区
      startupWorkspace: 'all',
      setStartupWorkspace: (startupWorkspace) => set({ startupWorkspace }),

      // 上次打开的工作区（自动记录）
      lastWorkspace: 'all',

      // 语言
      language: 'zh',
      setLanguage: (language) => set({ language }),

      // 当前工作区
      currentWorkspace: 'all',
      setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace, lastWorkspace: currentWorkspace }),

      // 工作区列表
      workspaces: [],
      setWorkspaces: (workspaces) => set({ workspaces }),

      // 获取工作区的默认颜色
      getDefaultColorForWorkspace: (workspaceId) => {
        const colors = ['#4285f4', '#ea4335', '#fbbc04', '#34a853', '#ff6d01', '#46bdc6', '#7b61ff', '#f538a0']
        const index = parseInt(workspaceId) % colors.length
        return colors[Math.abs(index)] || colors[0]
      },
      
      // 初始化工作区
      initWorkspaces: async () => {
        try {
          const tree = await chrome.bookmarks.getTree()
          const bar = tree[0].children.find((n) => n.id === '1')
          if (bar && bar.children) {
            const workspaces = bar.children
              .filter((n) => n.url === undefined)
              .map((folder) => ({
                id: folder.id,
                title: folder.title,
                children: folder.children || [],
              }))
            
            // 解析 workspace 标题，但尊重用户手动设置的 emoji/text
            const currentMeta = get().wsMeta
            const updates = {}
            for (const ws of workspaces) {
              const parsed = get().parseWorkspaceTitle(ws.title)
              const existing = currentMeta[ws.id]
              updates[ws.id] = { 
                ...existing,
                // 仅在用户未手动设置时才从书签标题解析
                emoji: existing?.emoji || parsed.emoji || '📁',
                text: existing?.text || parsed.text || ws.title,
                color: existing?.color || get().getDefaultColorForWorkspace(ws.id)
              }
            }
            
            set({ 
              workspaces,
              wsMeta: { ...currentMeta, ...updates }
            })
          }
        } catch (error) {
          console.error('Failed to init workspaces:', error)
        }
      },

      // 工作区元数据
      wsMeta: {},
      setWsMeta: (wsMeta) => set({ wsMeta }),
      updateWsMeta: (folderId, meta) =>
        set((state) => ({
          wsMeta: { ...state.wsMeta, [folderId]: meta },
        })),

      // 收藏的书签 ID 集合
      favorites: [],
      setFavorites: (favorites) => set({ favorites }),
      toggleFavorite: (bookmarkId) =>
        set((state) => {
          const isFav = state.favorites.includes(bookmarkId)
          return {
            favorites: isFav
              ? state.favorites.filter((id) => id !== bookmarkId)
              : [...state.favorites, bookmarkId],
          }
        }),
      isFavorite: (bookmarkId) => get().favorites.includes(bookmarkId),

      // 每个文件夹的视图模式持久化 { pathKey: 'list'|'grid'|'smart' }
      folderViewModes: {},
      setFolderViewMode: (pathKey, mode) =>
        set((state) => ({
          folderViewModes: { ...state.folderViewModes, [pathKey]: mode },
        })),
      getFolderViewMode: (pathKey) => get().folderViewModes[pathKey] || 'grid',

      // 点击计数
      clickCounts: {},
      setClickCounts: (clickCounts) => set({ clickCounts }),
      incrementClickCount: (bookmarkId) =>
        set((state) => {
          const current = state.clickCounts[bookmarkId] || 0
          return {
            clickCounts: { ...state.clickCounts, [bookmarkId]: current + 1 },
          }
        }),

      // 子书签
      subBookmarks: {},
      setSubBookmarks: (subBookmarks) => set({ subBookmarks }),
      // 生成子书签稳定 ID
      generateSubId: () => Date.now().toString(36) + Math.random().toString(36).slice(2),
      addSubBookmark: (parentId, subBookmark) =>
        set((state) => {
          const current = state.subBookmarks[parentId] || []
          if (current.length >= 5) return state
          // 确保 subBookmark 有稳定 ID
          const withId = { ...subBookmark, id: subBookmark.id || state.generateSubId() }
          return {
            subBookmarks: {
              ...state.subBookmarks,
              [parentId]: [...current, withId],
            },
          }
        }),
      removeSubBookmark: (parentId, subId) =>
        set((state) => {
          const current = state.subBookmarks[parentId] || []
          const updated = current.filter((sub) => sub.id !== subId)
          return {
            subBookmarks: {
              ...state.subBookmarks,
              [parentId]: updated,
            },
          }
        }),
      updateSubBookmark: (parentId, subId, data) =>
        set((state) => {
          const current = state.subBookmarks[parentId] || []
          const updated = current.map((sub) =>
            sub.id === subId ? { ...sub, ...data } : sub
          )
          return {
            subBookmarks: {
              ...state.subBookmarks,
              [parentId]: updated,
            },
          }
        }),

      // GitHub 配置
      githubPat: '',
      setGithubPat: (githubPat) => set({ githubPat }),
      githubGistUrl: '',
      setGithubGistUrl: (githubGistUrl) => set({ githubGistUrl }),

      // Favicon 缓存 { domain: dataUrl } — 独立存储到 chrome.storage.local
      faviconCache: {},
      setFaviconCache: (faviconCache) => set({ faviconCache }),
      getFaviconCache: (domain) => get().faviconCache[domain] || null,
      setFaviconForDomain: (domain, dataUrl) => {
        const updated = { ...get().faviconCache, [domain]: dataUrl }
        set({ faviconCache: updated })
        // 持久化到 chrome.storage.local（独立 key，避免撑大主 storage）
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ 'naviga-favicons': updated })
        }
      },
      clearFaviconForDomain: (domain) => {
        const updated = { ...get().faviconCache }
        delete updated[domain]
        set({ faviconCache: updated })
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ 'naviga-favicons': updated })
        }
      },
      loadFaviconCache: async () => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          try {
            const result = await chrome.storage.local.get('naviga-favicons')
            if (result['naviga-favicons']) {
              set({ faviconCache: result['naviga-favicons'] })
            }
          } catch (err) {
            console.error('Failed to load favicon cache:', err)
          }
        }
      },

      // 从 Chrome Storage 初始化
      initFromChromeStorage: async () => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          try {
            const result = await chrome.storage.local.get('naviga-storage')
            if (result['naviga-storage']) {
              const stored = result['naviga-storage']
              // 恢复各个状态
              if (stored.state) {
                set({
                  theme: stored.state.theme || 'dark',
                  background: stored.state.background || 'default',
                  iconSize: stored.state.iconSize || 'medium',
                  tabDisplay: stored.state.tabDisplay || 'both',
                  showTabBar: stored.state.showTabBar !== false,
                  defaultWorkspace: stored.state.defaultWorkspace || 'all',
                  startupMode: stored.state.startupMode || 'homepage',
                  startupWorkspace: stored.state.startupWorkspace || 'all',
                  lastWorkspace: stored.state.lastWorkspace || 'all',
                  language: stored.state.language || 'zh',
                  wsMeta: stored.state.wsMeta || {},
                  clickCounts: stored.state.clickCounts || {},
                  subBookmarks: stored.state.subBookmarks || {},
                  favorites: stored.state.favorites || [],
                  folderViewModes: stored.state.folderViewModes || {},
                  githubPat: stored.state.githubPat || stored.state.githubToken || '',
                  githubGistUrl: stored.state.githubGistUrl || stored.state.githubGistId || '',
                })
              }
            }
          } catch (error) {
            console.error('Failed to load from chrome storage:', error)
          }
        }
      },
    }),
    {
      name: 'naviga-storage',
      storage: chromeStorage,
      partialize: (state) => ({
        theme: state.theme,
        background: state.background,
        iconSize: state.iconSize,
        tabDisplay: state.tabDisplay,
        showTabBar: state.showTabBar,
        defaultWorkspace: state.defaultWorkspace,
        startupMode: state.startupMode,
        startupWorkspace: state.startupWorkspace,
        lastWorkspace: state.lastWorkspace,
        language: state.language,
        wsMeta: state.wsMeta,
        clickCounts: state.clickCounts,
        subBookmarks: state.subBookmarks,
        favorites: state.favorites,
        folderViewModes: state.folderViewModes,
        githubPat: state.githubPat,
        githubGistUrl: state.githubGistUrl,
      }),
      skipHydration: true, // 我们手动处理 hydration
    }
  )
)
