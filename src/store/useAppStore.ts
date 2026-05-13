import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  Theme,
  FaviconRecord,
  Workspace,
  SubBookmark,
  FaviconMap,
  Bookmark,
  StartupMode,
  TabDisplay,
  IconSize,
  BackgroundColor,
  CardRoundSize,
  NavbarIconSize,
  CountryCode,
  UngroupedBookmarkPosition,
  ShadowStyleColor,
  ShadowStyleBorder,
} from '@/types';

import { saveBookmark, clearAllBookmarks } from '@/db/bookmarks';
import { getAllFavicons, saveFavicon, deleteFavicon, getFavicon } from '@/db/favicons';

// 模块级去重：跟踪正在请求的 favicon domain，避免重复请求
const fetchingDomains = new Set<string>();

// Chrome Storage 适配器
const chromeStorage = {
  getItem: (name: string) => {
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
  setItem: (name: string, value: unknown) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ [name]: value });
    } else {
      localStorage.setItem(name, JSON.stringify(value));
    }
  },
  removeItem: (name: string) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.remove([name]);
    } else {
      localStorage.removeItem(name);
    }
  },
};

/** 工作区元数据 */
interface WorkspaceMeta {
  [folderId: string]: {
    emoji?: string;
    text?: string;
    color?: string;
  };
}

/** Store 状态类型 */
interface AppStore {
  // 主题和外观
  theme: Theme;
  setTheme: (theme: Theme) => void;
  shadowStyleColor: ShadowStyleColor;
  setShadowStyleColor: (color: ShadowStyleColor) => void;
  shadowStyleBorder: ShadowStyleBorder;
  setShadowStyleBorder: (border: ShadowStyleBorder) => void;
  getShadowStyle: () => string;
  background: BackgroundColor;
  setBackground: (background: BackgroundColor) => void;
  iconSize: IconSize;
  setIconSize: (size: IconSize) => void;
  bookmarkCardRadius: CardRoundSize;
  setBookmarkCardRadius: (radius: CardRoundSize) => void;
  cardRoundSize: CardRoundSize;
  setCardRoundSize: (size: CardRoundSize) => void;

  // 工作区
  workspaces: Workspace[];
  setWorkspaces: (workspaces: Workspace[]) => void;
  wsMeta: WorkspaceMeta;
  setWsMeta: (wsMeta: WorkspaceMeta) => void;
  updateWsMeta: (folderId: string, meta: WorkspaceMeta[string]) => void;
  defaultWorkspace: string;
  setDefaultWorkspace: (workspace: string) => void;
  defaultWorkspaceEmoji: string;
  setDefaultWorkspaceEmoji: (emoji: string) => void;
  currentWorkspace: string;
  setCurrentWorkspace: (workspace: string) => void;
  lastWorkspace: string;
  parseWorkspaceTitle: (title: string) => { emoji: string | null; text: string };
  getDefaultColorForWorkspace: (workspaceId: string) => string;
  initWorkspaces: () => Promise<void>;

  // 启动和行为
  startupMode: StartupMode;
  setStartupMode: (mode: StartupMode) => void;
  startupWorkspace: string;
  setStartupWorkspace: (workspace: string) => void;
  dragStartBehavior: string;
  setDragStartBehavior: (behavior: string) => void;

  // 显示设置
  tabDisplay: TabDisplay;
  setTabDisplay: (display: TabDisplay) => void;
  showTabBar: boolean;
  setShowTabBar: (show: boolean) => void;
  navbarIconSize: NavbarIconSize;
  setNavbarIconSize: (size: NavbarIconSize) => void;
  ungroupedBookmarkPosition: UngroupedBookmarkPosition;
  setUngroupedBookmarkPosition: (position: UngroupedBookmarkPosition) => void;

  // 语言
  language: CountryCode;
  setLanguage: (lang: CountryCode) => void;

  // 书签
  syncWithBrowser: boolean;
  setSyncWithBrowser: (sync: boolean) => void;
  maxSubBookmarks: number;
  setMaxSubBookmarks: (max: number) => void;
  persistBookmarks: () => Promise<void>;

  // 收藏
  favorites: string[];
  setFavorites: (favorites: string[]) => void;
  toggleFavorite: (bookmarkId: string) => void;
  isFavorite: (bookmarkId: string) => boolean;

  // 视图模式
  folderViewModes: Record<string, string>;
  setFolderViewMode: (pathKey: string, mode: string) => void;
  getFolderViewMode: (pathKey: string) => string;

  // 点击计数
  clickCounts: Record<string, number>;
  setClickCounts: (counts: Record<string, number>) => void;
  incrementClickCount: (bookmarkId: string) => void;

  // 子书签
  subBookmarks: Record<string, SubBookmark[]>;
  setSubBookmarks: (subBookmarks: Record<string, SubBookmark[]>) => void;
  generateSubId: () => string;
  addSubBookmark: (parentId: string, subBookmark: Partial<SubBookmark>) => void;
  removeSubBookmark: (parentId: string, subId: string) => void;
  updateSubBookmark: (parentId: string, subId: string, data: Partial<SubBookmark>) => void;

  // GitHub 配置
  githubPat: string;
  setGithubPat: (pat: string) => void;
  githubRepoUrl: string;
  setGithubRepoUrl: (url: string) => void;

  // Favicon 缓存
  faviconCache: Record<string, FaviconRecord>;
  setFaviconCache: (cache: Record<string, FaviconRecord>) => void;
  getFaviconCache: (domain: string) => FaviconRecord | null;
  setFaviconForDomain: (domain: string, dataUrl: string, name: string, url: string, favIconUrl: string) => void;
  clearFaviconForDomain: (domain: string) => void;
  loadFaviconCache: () => Promise<void>;
  tabFavicons: Record<string, string>;
  setTabFavicons: (favicons: Record<string, string>) => void;
  fetchTabFavicons: () => Promise<void>;
  fetchFaviconAsDataUrl: (url: string) => Promise<string | null>;
  fetchAndCacheFavicon: (domain: string, favIconUrl: string) => Promise<void>;

  // Chrome Storage 初始化
  initFromChromeStorage: () => Promise<void>;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // 辅助函数：从名称中提取 emoji 和文本
      parseWorkspaceTitle: (title: string) => {
        if (!title) return { emoji: null, text: '' };

        const emojiRegex =
          /^((?:\p{Extended_Pictographic}(?:\uFE0F?|\u200D(?:\p{Extended_Pictographic}|\p{Emoji_Component}))*)+)/u;
        const match = title.match(emojiRegex);

        if (match && match[1]) {
          const emoji = match[1];
          const text = title
            .slice(emoji.length)
            .replace(/^[\s\-—–·|:：]+/, '')
            .trim();
          if (text) {
            return { emoji, text };
          }
          return { emoji, text: title };
        }

        return { emoji: null, text: title };
      },

      // 主题设置
      theme: 'dark',
      setTheme: (theme: Theme) => set({ theme }),

      shadowStyleColor: 'violet',
      setShadowStyleColor: (shadowStyleColor: ShadowStyleColor) => set({ shadowStyleColor }),
      shadowStyleBorder: 'dashed',
      setShadowStyleBorder: (shadowStyleBorder: ShadowStyleBorder) => set({ shadowStyleBorder }),
      getShadowStyle: () => {
        return `${get().shadowStyleBorder === 'double' ? 'border-4' : 'border-2'} border-${get().shadowStyleColor}-500/60 bg-${get().shadowStyleColor}-500/10 border-${get().shadowStyleBorder}`;
      },

      maxSubBookmarks: 5,
      setMaxSubBookmarks: (max: number) => set({ maxSubBookmarks: max }),

      bookmarkCardRadius: 'card_small',
      setBookmarkCardRadius: (radius: CardRoundSize) => set({ bookmarkCardRadius: radius }),

      syncWithBrowser: false,
      setSyncWithBrowser: (syncWithBrowser: boolean) => set({ syncWithBrowser }),

      background: 'default',
      setBackground: (background: BackgroundColor) => set({ background }),

      iconSize: 'medium',
      setIconSize: (iconSize: IconSize) => set({ iconSize }),

      dragStartBehavior: 'hideBookmarks',
      setDragStartBehavior: (dragStartBehavior: string) => set({ dragStartBehavior }),

      tabDisplay: 'both',
      setTabDisplay: (tabDisplay: TabDisplay) => set({ tabDisplay }),

      showTabBar: true,
      setShowTabBar: (showTabBar: boolean) => set({ showTabBar }),

      navbarIconSize: 'nbi_sm',
      setNavbarIconSize: (navbarIconSize: NavbarIconSize) => set({ navbarIconSize }),

      defaultWorkspace: 'all',
      setDefaultWorkspace: (defaultWorkspace: string) => set({ defaultWorkspace }),

      defaultWorkspaceEmoji: '🗂️',
      setDefaultWorkspaceEmoji: (emoji: string) => set({ defaultWorkspaceEmoji: emoji }),

      startupMode: 'openHomepage',
      setStartupMode: (startupMode: StartupMode) => set({ startupMode }),

      startupWorkspace: 'all',
      setStartupWorkspace: (startupWorkspace: string) => set({ startupWorkspace }),

      lastWorkspace: 'all',

      language: 'zh',
      setLanguage: (language: CountryCode) => set({ language }),

      currentWorkspace: 'all',
      setCurrentWorkspace: (currentWorkspace: string) => set({ currentWorkspace, lastWorkspace: currentWorkspace }),

      cardRoundSize: 'card_small',
      setCardRoundSize: (cardRoundSize: CardRoundSize) => set({ cardRoundSize }),

      ungroupedBookmarkPosition: 'ungroup_top',
      setUngroupedBookmarkPosition: (ungroupedBookmarkPosition: UngroupedBookmarkPosition) =>
        set({ ungroupedBookmarkPosition }),

      workspaces: [],
      setWorkspaces: (workspaces: Workspace[]) => set({ workspaces }),

      getDefaultColorForWorkspace: (workspaceId: string) => {
        const colors = ['#4285f4', '#ea4335', '#fbbc04', '#34a853', '#ff6d01', '#46bdc6', '#7b61ff', '#f538a0'];
        const index = parseInt(workspaceId) % colors.length;
        return colors[Math.abs(index)] || colors[0];
      },

      initWorkspaces: async () => {
        try {
          const tree = await chrome.bookmarks.getTree();
          const bar = tree[0].children?.find((n) => n.id === '1');
          if (bar && bar.children) {
            const workspaces = bar.children
              .filter((n) => n.url === undefined)
              .map((folder) => ({
                id: folder.id,
                title: folder.title,
                order: folder.index,
                children: [] as Bookmark[],
              })) as Workspace[];

            const currentMeta = get().wsMeta;
            const updates: WorkspaceMeta = {};
            for (const ws of workspaces) {
              const parsed = get().parseWorkspaceTitle(ws.title);
              const existing = currentMeta[ws.id];
              updates[ws.id] = {
                ...existing,
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

      persistBookmarks: async () => {
        try {
          await clearAllBookmarks();
          const tree = await chrome.bookmarks.getTree();
          const bar = tree[0].children?.find((n) => n.id === '1');

          function traverse(node: chrome.bookmarks.BookmarkTreeNode) {
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
                if (item.children) {
                  traverse(item);
                }
              });
            }
          }

          await saveBookmark(bar!.id, {
            id: bar!.id,
            parentId: bar!.parentId,
            title: bar!.title,
            createdAt: bar!.dateAdded,
            updatedAt: bar!.dateGroupModified,
            index: bar!.index,
            url: bar!.url ?? null,
          });
          traverse(bar!);
        } catch (error) {
          console.error('Failed to persist chrome.bookmarks:', error);
        }
      },

      wsMeta: {},
      setWsMeta: (wsMeta: WorkspaceMeta) => set({ wsMeta }),
      updateWsMeta: (folderId: string, meta: WorkspaceMeta[string]) =>
        set((state) => ({
          wsMeta: { ...state.wsMeta, [folderId]: meta },
        })),

      favorites: [],
      setFavorites: (favorites: string[]) => set({ favorites }),
      toggleFavorite: (bookmarkId: string) =>
        set((state) => {
          const isFav = state.favorites.includes(bookmarkId);
          return {
            favorites: isFav ? state.favorites.filter((id) => id !== bookmarkId) : [...state.favorites, bookmarkId],
          };
        }),
      isFavorite: (bookmarkId: string) => get().favorites.includes(bookmarkId),

      folderViewModes: {},
      setFolderViewMode: (pathKey: string, mode: string) =>
        set((state) => ({
          folderViewModes: { ...state.folderViewModes, [pathKey]: mode },
        })),
      getFolderViewMode: (pathKey: string) => get().folderViewModes[pathKey] || 'grid',

      clickCounts: {},
      setClickCounts: (clickCounts: Record<string, number>) => set({ clickCounts }),
      incrementClickCount: (bookmarkId: string) =>
        set((state) => {
          const current = state.clickCounts[bookmarkId] || 0;
          return {
            clickCounts: { ...state.clickCounts, [bookmarkId]: current + 1 },
          };
        }),

      subBookmarks: {},
      setSubBookmarks: (subBookmarks: Record<string, SubBookmark[]>) => set({ subBookmarks }),
      generateSubId: () => Date.now().toString(36) + Math.random().toString(36).slice(2),
      addSubBookmark: (parentId: string, subBookmark: Partial<SubBookmark>) =>
        set((state) => {
          const current = state.subBookmarks[parentId] || [];
          if (current.length >= 5) return state;
          const withId = {
            ...subBookmark,
            id: subBookmark.id || state.generateSubId(),
          } as SubBookmark;
          return {
            subBookmarks: {
              ...state.subBookmarks,
              [parentId]: [...current, withId],
            },
          };
        }),
      removeSubBookmark: (parentId: string, subId: string) =>
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
      updateSubBookmark: (parentId: string, subId: string, data: Partial<SubBookmark>) =>
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

      githubPat: '',
      setGithubPat: (githubPat: string) => set({ githubPat }),
      githubRepoUrl: '',
      setGithubRepoUrl: (githubRepoUrl: string) => set({ githubRepoUrl }),

      faviconCache: {},
      setFaviconCache: (faviconCache: Record<string, FaviconRecord>) => set({ faviconCache }),
      getFaviconCache: (domain: string) => get().faviconCache[domain] || null,
      setFaviconForDomain: (domain: string, dataUrl: string, name: string, url: string, favIconUrl: string) => {
        if (!dataUrl) return;
        const record: FaviconRecord = {
          favicon: dataUrl,
          favIconUrl: favIconUrl || '',
          name: name || '',
          url: url || '',
        };
        const updated = { ...get().faviconCache, [domain]: record };
        set({ faviconCache: updated });
        saveFavicon(domain, { favicon: dataUrl, favIconUrl, name, url })
          .then((saved) => {
            console.debug('[favicon] saved to IndexedDB:', domain, saved?.favicon?.length, 'bytes');
          })
          .catch((err) => {
            console.error('[favicon] FAILED to save to IndexedDB:', domain, err);
          });
      },
      clearFaviconForDomain: (domain: string) => {
        const updated = { ...get().faviconCache };
        delete updated[domain];
        set({ faviconCache: updated });
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
            if (typeof chrome !== 'undefined' && chrome.storage) {
              try {
                const result = await chrome.storage.local.get('naviga-favicons');
                const oldData = result['naviga-favicons'];
                if (oldData && Object.keys(oldData).length > 0) {
                  const newCache: Record<string, FaviconRecord> = {};
                  for (const [domain, dataUrl] of Object.entries(oldData)) {
                    newCache[domain] = {
                      favicon: dataUrl as string,
                      favIconUrl: '',
                      name: '',
                      url: '',
                    };
                    saveFavicon(domain, { favicon: dataUrl as string }).catch(() => {});
                  }
                  set({ faviconCache: newCache });
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

      tabFavicons: {},
      setTabFavicons: (tabFavicons: Record<string, string>) => set({ tabFavicons }),
      fetchTabFavicons: async () => {
        if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
          try {
            const response: { favicons: FaviconMap } = await chrome.runtime.sendMessage({
              type: 'getTabFavicons',
            });
            if (response?.favicons) {
              set({ tabFavicons: response.favicons });
              const cache = get().faviconCache;
              for (const [domain, favIconUrl] of Object.entries(response.favicons)) {
                if (!cache[domain]?.favicon && !fetchingDomains.has(domain)) {
                  get().fetchAndCacheFavicon(domain, favIconUrl);
                }
              }
            }
          } catch (error: any) {
            console.error('error fetchTabFavicons', error.message || error);
            // Service worker 尚未启动时会出现 "Receiving end does not exist"
          }
        } else {
          console.error('error fetchTabFavicons 2');
        }
      },
      fetchFaviconAsDataUrl: async (url: string) => {
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
            console.warn('[favicon] sendMessage failed:', err, url);
          }
        }
        return null;
      },
      fetchAndCacheFavicon: async (domain: string, favIconUrl: string) => {
        if (!domain) return;
        if (fetchingDomains.has(domain)) {
          console.debug('[favicon] already fetching:', domain);
          return;
        }
        const memCache = get().faviconCache;
        if (memCache[domain]?.favicon) return;
        try {
          const existing = await getFavicon(domain);
          if (existing?.favicon) {
            console.debug('[favicon] already in IndexedDB, skip:', domain);
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
        fetchingDomains.add(domain);
        try {
          let dataUrl = await get().fetchFaviconAsDataUrl(favIconUrl);
          if (dataUrl) {
            get().setFaviconForDomain(domain, dataUrl, '', '', favIconUrl);
            return;
          }
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
          fetchingDomains.delete(domain);
        }
      },

      initFromChromeStorage: async () => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          try {
            const result = await chrome.storage.local.get('naviga-storage');
            if (result['naviga-storage']) {
              const stored = result['naviga-storage'] as any;
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
        githubRepoUrl: state.githubRepoUrl,
      }),
      skipHydration: true,
    },
  ),
);
