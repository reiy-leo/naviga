import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { saveBookmark, clearAllBookmarks } from '../db/bookmarks';
import { getAllFavicons, saveFavicon, deleteFavicon, getFavicon } from '../db/favicons';

// 模块级去重：跟踪正在请求的 favicon domain，避免重复请求
const fetchingDomains = new Set();

// Chrome Storage 适配器
const chromeStorage = {
  getItem: (name) => {
    // 在 Chrome Extension 环境中，我们无法同步读取
    // 返回 null 让 Zustand 使用默认值
    // 数据会通过 initFromChromeStorage 异步恢复
    if (typeof chrome !== 'undefined' && chrome.storage) {
      return null;
    }
    // 开发环境使用 localStorage
    const item = localStorage.getItem(name);
    return item ? JSON.parse(item) : null;
  },
  setItem: (name, value) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ [name]: value });
    } else {
      localStorage.setItem(name, JSON.stringify(value));
    }
  },
  removeItem: (name) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.remove([name]);
    } else {
      localStorage.removeItem(name);
    }
  },
};

export const useAppStore = create(
  persist(
    (set, get) => ({
      // 辅助函数：从名称中提取 emoji 和文本
      parseWorkspaceTitle: (title) => {
        if (!title) return { emoji: null, text: '' };

        // \p{Extended_Pictographic} 只匹配图形化 emoji，不会误匹配数字、#、*
        // 支持 ZWJ 序列 (👨‍👩‍👧) 和变体选择器 (❤️)
        const emojiRegex =
          /^((?:\p{Extended_Pictographic}(?:\uFE0F?|\u200D(?:\p{Extended_Pictographic}|\p{Emoji_Component}))*)+)/u;
        const match = title.match(emojiRegex);

        if (match && match[1]) {
          const emoji = match[1];
          // 去除 emoji 后的前导空白和分隔符
          const text = title
            .slice(emoji.length)
            .replace(/^[\s\-—–·|:：]+/, '')
            .trim();
          if (text) {
            return { emoji, text };
          }
          // 如果去掉 emoji 后没有文字，整个 title 作为 text
          return { emoji, text: title };
        }

        return { emoji: null, text: title };
      },
      // 主题设置
      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      shadowStyleColor: 'violet',
      setShadowStyleColor: (shadowStyleColor) => set({ shadowStyleColor }),
      shadowStyleBorder: 'dashed',
      setShadowStyleBorder: (shadowStyleBorder) => set({ shadowStyleBorder }),
      getShadowStyle: () => {
        return `${get().shadowStyleBorder === 'double' ? 'border-4' : 'border-2'} border-${get().shadowStyleColor}-500/60 bg-${get().shadowStyleColor}-500/10 border-${get().shadowStyleBorder}`;
      },

      maxSubBookmarks: 5, // 每个书签的最大子书签数量
      setMaxSubBookmarks: (max) => set({ maxSubBookmarks: max }),

      bookmarkCardRadius: 'md',
      setBookmarkCardRadius: (radius) => set({ bookmarkCardRadius: radius }),

      // 是否通过chrome.bookmarks API与浏览器同步
      syncWithBrowser: false,
      setSyncWithBrowser: (syncWithBrowser) => set({ syncWithBrowser }),

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

      navbarIconSize: 'nbi_sm',
      setNavbarIconSize: (navbarIconSize) => set({ navbarIconSize }),

      // 默认工作区
      defaultWorkspace: 'all',
      setDefaultWorkspace: (defaultWorkspace) => set({ defaultWorkspace }),

      // 默认工作区图标
      defaultWorkspaceEmoji: '🗂️',
      setDefaultWorkspaceEmoji: (emoji) => set({ defaultWorkspaceEmoji: emoji }),

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

      // 书签圆角大小
      cardRoundSize: 'card_small',
      setCardRoundSize: (cardRoundSize) => set({ cardRoundSize }),

      // 未分组书签位置
      ungroupedBookmarkPosition: 'ungroup_top',
      setUngroupedBookmarkPosition: (ungroupedBookmarkPosition) => set({ ungroupedBookmarkPosition }),

      // 工作区列表
      workspaces: [],
      setWorkspaces: (workspaces) => set({ workspaces }),

      // 获取工作区的默认颜色
      getDefaultColorForWorkspace: (workspaceId) => {
        const colors = ['#4285f4', '#ea4335', '#fbbc04', '#34a853', '#ff6d01', '#46bdc6', '#7b61ff', '#f538a0'];
        const index = parseInt(workspaceId) % colors.length;
        return colors[Math.abs(index)] || colors[0];
      },

      // 初始化工作区
      initWorkspaces: async () => {
        try {
          const tree = await chrome.bookmarks.getTree();
          // TODO 这里需要更新逻辑
          const bar = tree[0].children.find((n) => n.id === '1'); // bookmarks-bar
          if (bar && bar.children) {
            const workspaces = bar.children
              .filter((n) => n.url === undefined)
              .map((folder) => ({
                id: folder.id,
                title: folder.title,
                order: folder.order,
                children: folder.children || [],
              }));

            // 解析 workspace 标题，但尊重用户手动设置的 emoji/text
            const currentMeta = get().wsMeta;
            const updates = {};
            for (const ws of workspaces) {
              const parsed = get().parseWorkspaceTitle(ws.title);
              const existing = currentMeta[ws.id];
              updates[ws.id] = {
                ...existing,
                // 仅在用户未手动设置时才从书签标题解析
                emoji: existing?.emoji || parsed.emoji || '📁',
                text: existing?.text || parsed.text || ws.title,
                color: existing?.color || get().getDefaultColorForWorkspace(ws.id),
              };
            }

            set({
              workspaces,
              wsMeta: { ...currentMeta, ...updates },
            });
          }
        } catch (error) {
          console.error('Failed to init workspaces:', error);
        }
      },

      // 把数据从chrome.bookmarks存到indexdb中
      persistBookmarks: async () => {
        try {
          await clearAllBookmarks();
          const tree = await chrome.bookmarks.getTree();
          const bar = tree[0].children.find((n) => n.id === '1'); // bookmarks-bar

          function tranvese(node) {
            if (node && node.children) {
              node.children.forEach((item) => {
                saveBookmark(item.id, {
                  id: item.id,
                  parentId: item.parentId,
                  title: item.title,
                  createdAt: item.dateAdded,
                  updatedAt: item.dateGroupModified ?? Date.now(),
                  index: item.index,
                  url: item.url ?? null,
                });
                if (item && item.children) {
                  tranvese(item);
                }
              });
            }
          }

          await saveBookmark(bar.id, {
            id: bar.id,
            parentId: bar.parentId,
            title: bar.title,
            createdAt: bar.dateAdded,
            updatedAt: bar.dateGroupModified,
            index: bar.index,
            url: bar.url ?? null,
          });
          await tranvese(bar);
        } catch (error) {
          console.error('Failed to persist chrome.bookmarks:', error);
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
          const isFav = state.favorites.includes(bookmarkId);
          return {
            favorites: isFav ? state.favorites.filter((id) => id !== bookmarkId) : [...state.favorites, bookmarkId],
          };
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
          const current = state.clickCounts[bookmarkId] || 0;
          return {
            clickCounts: { ...state.clickCounts, [bookmarkId]: current + 1 },
          };
        }),

      // 子书签
      subBookmarks: {},
      setSubBookmarks: (subBookmarks) => set({ subBookmarks }),
      // 生成子书签稳定 ID
      generateSubId: () => Date.now().toString(36) + Math.random().toString(36).slice(2),
      addSubBookmark: (parentId, subBookmark) =>
        set((state) => {
          const current = state.subBookmarks[parentId] || [];
          if (current.length >= 5) return state;
          // 确保 subBookmark 有稳定 ID
          const withId = {
            ...subBookmark,
            id: subBookmark.id || state.generateSubId(),
          };
          return {
            subBookmarks: {
              ...state.subBookmarks,
              [parentId]: [...current, withId],
            },
          };
        }),
      removeSubBookmark: (parentId, subId) =>
        set((state) => {
          const current = state.subBookmarks[parentId] || [];
          const updated = current.filter((sub) => sub.id !== subId);
          return {
            subBookmarks: {
              ...state.subBookmarks,
              [parentId]: updated,
            },
          };
        }),
      updateSubBookmark: (parentId, subId, data) =>
        set((state) => {
          const current = state.subBookmarks[parentId] || [];
          const updated = current.map((sub) => (sub.id === subId ? { ...sub, ...data } : sub));
          return {
            subBookmarks: {
              ...state.subBookmarks,
              [parentId]: updated,
            },
          };
        }),

      // GitHub 配置
      githubPat: '',
      setGithubPat: (githubPat) => set({ githubPat }),
      githubGistUrl: '',
      setGithubGistUrl: (githubGistUrl) => set({ githubGistUrl }),
      githubRepoUrl: '',
      setGithubRepoUrl: (githubRepoUrl) => set({ githubRepoUrl }),

      // Favicon 缓存 { domain: { favicon: base64DataUrl, favIconUrl: string, name: string, url: string } }
      // 持久化到 IndexedDB，刷新页面后不丢失
      faviconCache: {},
      setFaviconCache: (faviconCache) => set({ faviconCache }),
      getFaviconCache: (domain) => get().faviconCache[domain] || null,
      setFaviconForDomain: (domain, dataUrl, name, url, favIconUrl) => {
        if (!dataUrl) return; // 不保存空数据
        const record = {
          favicon: dataUrl,
          favIconUrl: favIconUrl || '',
          name: name || '',
          url: url || '',
        };
        const updated = { ...get().faviconCache, [domain]: record };
        set({ faviconCache: updated });
        // 异步持久化到 IndexedDB（带错误日志）
        saveFavicon(domain, { favicon: dataUrl, favIconUrl, name, url })
          .then((saved) => {
            console.debug('[favicon] saved to IndexedDB:', domain, saved?.favicon?.length, 'bytes');
          })
          .catch((err) => {
            console.error('[favicon] FAILED to save to IndexedDB:', domain, err);
          });
      },
      clearFaviconForDomain: (domain) => {
        const updated = { ...get().faviconCache };
        delete updated[domain];
        set({ faviconCache: updated });
        // 异步从 IndexedDB 删除
        deleteFavicon(domain).catch(() => {});
      },
      loadFaviconCache: async () => {
        try {
          const map = await getAllFavicons();
          const count = Object.keys(map).length;
          console.debug('[favicon] loaded from IndexedDB:', count, 'domains');
          if (count > 0) {
            set({ faviconCache: map });
          } else {
            // 首次使用 IndexedDB：从旧的 chrome.storage.local 迁移数据
            if (typeof chrome !== 'undefined' && chrome.storage) {
              try {
                const result = await chrome.storage.local.get('naviga-favicons');
                const oldData = result['naviga-favicons'];
                if (oldData && Object.keys(oldData).length > 0) {
                  // 旧格式: { domain: dataUrl }，转换为新格式
                  const newCache = {};
                  for (const [domain, dataUrl] of Object.entries(oldData)) {
                    newCache[domain] = {
                      favicon: dataUrl,
                      favIconUrl: '',
                      name: '',
                      url: '',
                    };
                    saveFavicon(domain, { favicon: dataUrl }).catch(() => {});
                  }
                  set({ faviconCache: newCache });
                  // 清除旧数据
                  chrome.storage.local.remove('naviga-favicons');
                }
              } catch {
                // 旧数据读取失败不影响
              }
            }
          }
        } catch (err) {
          console.error('Failed to load favicon cache from IndexedDB:', err);
        }
      },

      // Tabs favicon 数据 { domain: favIconUrl } — 从 background service worker 获取
      tabFavicons: {},
      setTabFavicons: (tabFavicons) => set({ tabFavicons }),
      fetchTabFavicons: async () => {
        if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
          try {
            const response = await chrome.runtime.sendMessage({
              type: 'getTabFavicons',
            });
            if (response?.favicons) {
              set({ tabFavicons: response.favicons });
              // 对不在 faviconCache 中的 domain，先检查 IndexedDB，再决定是否请求
              const cache = get().faviconCache;
              for (const [domain, favIconUrl] of Object.entries(response.favicons)) {
                if (!cache[domain]?.favicon && !fetchingDomains.has(domain)) {
                  get().fetchAndCacheFavicon(domain, favIconUrl);
                }
              }
            }
          } catch {
            // Service worker 尚未启动时会出现 "Receiving end does not exist"
            // 这是正常的，不需要报错，后续 tabs 更新时会自动获取
          }
        }
      },
      // 通过 background service worker fetch favicon URL 并转为 base64 dataURL（绕过 CORS）
      fetchFaviconAsDataUrl: async (url) => {
        if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
          try {
            const response = await chrome.runtime.sendMessage({
              type: 'fetchFavicon',
              url,
            });
            if (response?.dataUrl) {
              return response.dataUrl;
            }
          } catch (err) {
            console.warn('[favicon] sendMessage failed:', err?.message || err, url);
          }
        }
        return null;
      },
      // 获取指定 domain 的 favicon base64 并存入缓存
      // 写入前先检查 IndexedDB 是否已存在，避免重复请求
      fetchAndCacheFavicon: async (domain, favIconUrl) => {
        if (!domain) return;
        // 检查是否正在请求中，如果是则跳过
        if (fetchingDomains.has(domain)) {
          console.debug('[favicon] already fetching:', domain);
          return;
        }
        // 先检查内存缓存
        const memCache = get().faviconCache;
        if (memCache[domain]?.favicon) return;
        // 检查 IndexedDB 是否已存在该 domain 的数据
        try {
          const existing = await getFavicon(domain);
          if (existing?.favicon) {
            console.debug('[favicon] already in IndexedDB, skip:', domain);
            // 同步到内存缓存
            const updated = {
              ...memCache,
              [domain]: {
                favicon: existing.favicon,
                favIconUrl: existing.favIconUrl || '',
                name: existing.name || '',
                url: existing.url || '',
              },
            };
            set({ faviconCache: updated });
            return;
          }
        } catch {
          // IndexedDB 查询失败，继续尝试获取
        }
        // 标记为正在请求
        fetchingDomains.add(domain);
        try {
          // 路径 1: 使用传入的 favIconUrl
          let dataUrl = await get().fetchFaviconAsDataUrl(favIconUrl);
          if (dataUrl) {
            get().setFaviconForDomain(domain, dataUrl, '', '', favIconUrl);
            return;
          }
          // 路径 2: fallback 到 domain/favicon.ico
          const fallbackUrl = `${domain}/favicon.ico`;
          if (fallbackUrl !== favIconUrl) {
            console.debug('[favicon] trying fallback:', domain, fallbackUrl);
            dataUrl = await get().fetchFaviconAsDataUrl(fallbackUrl);
            if (dataUrl) {
              get().setFaviconForDomain(domain, dataUrl, '', '', fallbackUrl);
              return;
            }
          }
          console.warn('[favicon] all fetches failed for:', domain);
        } finally {
          // 清除正在请求标记
          fetchingDomains.delete(domain);
        }
      },

      // 从 Chrome Storage 初始化
      initFromChromeStorage: async () => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          try {
            const result = await chrome.storage.local.get('naviga-storage');
            if (result['naviga-storage']) {
              const stored = result['naviga-storage'];
              // 恢复各个状态
              if (stored.state) {
                set({
                  theme: stored.state.theme || 'dark',
                  background: stored.state.background || 'default',
                  iconSize: stored.state.iconSize || 'medium',
                  shadowStyleColor: stored.state.shadowStyleColor || 'violet',
                  shadowStyleBorder: stored.state.shadowStyleBorder || 'dashed',
                  bookmarkCardRadius: stored.state.bookmarkCardRadius || 'md',
                  navbarIconSize: stored.state.navbarIconSize || 'nbi_sm',
                  cardRoundSize: stored.state.cardRoundSize || 'card_small',
                  ungroupedBookmarkPosition: stored.state.ungroupedBookmarkPosition || 'top',
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
                  githubRepoUrl: stored.state.githubRepoUrl || '',
                });
              }
            }
          } catch (error) {
            console.error('Failed to load from chrome storage:', error);
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
        defaultWorkspaceEmoji: state.defaultWorkspaceEmoji,
        shadowStyleColor: state.shadowStyleColor,
        shadowStyleBorder: state.shadowStyleBorder,
        maxSubBookmarks: state.maxSubBookmarks,
        tabDisplay: state.tabDisplay,
        showTabBar: state.showTabBar,
        defaultWorkspace: state.defaultWorkspace,
        startupMode: state.startupMode,
        startupWorkspace: state.startupWorkspace,
        lastWorkspace: state.lastWorkspace,
        language: state.language,
        bookmarkCardRadius: state.bookmarkCardRadius,
        navbarIconSize: state.navbarIconSize,
        cardRoundSize: state.cardRoundSize,
        ungroupedBookmarkPosition: state.ungroupedBookmarkPosition,
        wsMeta: state.wsMeta,
        clickCounts: state.clickCounts,
        subBookmarks: state.subBookmarks,
        favorites: state.favorites,
        folderViewModes: state.folderViewModes,
        githubPat: state.githubPat,
        githubGistUrl: state.githubGistUrl,
        githubRepoUrl: state.githubRepoUrl,
      }),
      skipHydration: true, // 我们手动处理 hydration
    },
  ),
);
