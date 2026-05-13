// Naviga 项目类型定义

export interface FaviconMap {
  [domain: string]: string;
}

/** Chrome 书签节点 */
export interface ChromeBookmarkNode {
  id: string;
  parentId?: string;
  index?: number;
  url?: string;
  title: string;
  dateAdded?: number;
  dateGroupModified?: number;
  children?: ChromeBookmarkNode[];
}

/** 书签数据（IndexedDB 存储） */
export interface BookmarkItem {
  id: string;
  parentId?: string | null;
  syncing: boolean;
  title: string;
  url?: string | null;
  index: number;
  createdAt: number;
  updatedAt: number;
  children?: BookmarkItem[];
}

/** 子书签 */
export interface SubBookmark {
  id: string;
  title: string;
  url: string;
  favicon?: string;
}

export interface ShadowBookmark {
  id: string;
  parentId: string;
  shadowing: string;
  index: number;
  url?: string;
  title?: string;
  children?: BookmarkItem[] | chrome.bookmarks.BookmarkTreeNode[];
  createdAt?: number;
  UpdatedAt?: number;
}

export interface ShadowBookmarkUpdate {
  parentId?: string;
  syncing?: boolean;
  shadowing?: string;
  index?: number;
  url?: string;
  title?: string;
}

/** 工作区元数据 */
export interface WorkspaceMeta {
  id: string;
  emoji?: string;
  text?: string;
  color?: string;
}

/** Favicon 缓存记录 */
export interface FaviconRecord {
  favicon: string;
  favIconUrl: string;
  name: string;
  url: string;
}

export interface FaviconItem {
  domain: string;
  name: string;
  favicon: string;
  favIconUrl: string;
  url: string;
  updatedAt: number;
}

/** 工作区 */
export interface WorkspaceItem {
  id: string;
  title: string;
  order?: number;
  children?: BookmarkItem[];
}

/** 主题类型 */
export type Theme = 'light' | 'dark' | 'system';

/** 背景预设 */
export type BackgroundColor = 'default' | 'subtle' | 'deep' | 'blueTint' | 'warmTint';

/** 图标大小 */
export type IconSize = 'small' | 'medium' | 'large';

/** 启动模式 */
export type StartupMode = 'openHomepage' | 'openLastWorkspace' | 'openSpecificWorkspace';

/** 拖拽行为 */
export type DragStartBehavior = 'hideBookmarks' | 'shakeBookmarks' | 'pluseBookmarks';

/** 标签显示模式 */
export type TabDisplay = 'both' | 'iconOnly' | 'textOnly';

/** 视图模式 */
export type ViewMode = 'list' | 'grid' | 'smart';

/** 书签卡片圆角 */
export type CardRoundSize = 'card_small' | 'card_large' | 'card_full';

/** 未分组书签位置 */
export type UngroupedPosition = 'ungroup_top' | 'ungroup_bottom';

/** 导航栏图标大小 */
export type NavbarIconSize = 'nbi_sm' | 'nbi_base' | 'nbi_lg';

/** 阴影样式边框 */
export type ShadowStyleBorder = 'solid' | 'dotted' | 'dashed' | 'double';

/** 设置模态框标签页 */
export type SettingsTab = 'general' | 'appearance' | 'bookmarks' | 'sync' | 'about';

export type CountryCode = 'en' | 'zh' | 'ja';

export type UngroupedBookmarkPosition = 'ungroup_top' | 'ungroup_bottom';

export type ShadowStyleColor =
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'fuchsia'
  | 'pink'
  | 'rose'
  | 'slate';
