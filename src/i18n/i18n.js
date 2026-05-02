import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  zh: {
    translation: {
      // 通用设置
      settings: '设置',
      general: '通用',
      data: '数据',
      workspace: '工作区',
      about: '关于',
      
      // 外观
      appearance: '外观',
      theme: '主题',
      light: '浅色',
      dark: '深色',
      system: '跟随系统',
      
      // 背景
      background: '背景',
      default: '默认',
      subtle: '淡雅',
      deep: '深邃',
      blueTint: '蓝色调',
      warmTint: '暖色调',
      
      // 工作区显示
      workspaceDisplay: '工作区显示',
      showTabBar: '显示标签栏',
      
      // 图标
      iconSize: '图标大小',
      small: '小',
      medium: '中',
      large: '大',
      
      // 书签页显示
      tabDisplay: '标签显示',
      iconOnly: '仅图标',
      textOnly: '仅文本',
      both: '图标和文本',
      
      // 默认工作区
      defaultWorkspace: '默认工作区',

      // 启动时
      onStartup: '启动时',
      openHomepage: '打开主页',
      openLastWorkspace: '打开上次的工作区',
      openSpecificWorkspace: '打开指定的工作区',
      selectWorkspace: '选择工作区',
      allFavorites: '收藏',
      
      // 语言
      language: '语言',
      chinese: '简体中文',
      english: 'English',
      
      // 数据
      importBookmarks: '导入书签',
      importHint: '从 Chrome/Edge 书签 JSON 文件导入',
      selectFile: '选择文件',
      syncToGithub: '同步到 GitHub',
      syncHint: '将书签数据同步到 GitHub Gist',
      configureGithub: '配置 GitHub',
      syncNow: '立即同步',
      exportData: '导出数据',
      exportHint: '导出所有书签和设置为 JSON 文件',
      exportNow: '立即导出',
      importData: '导入数据',
      importDataHint: '从 JSON 文件导入书签和设置',
      
      // 工作区设置
      workspaceSettings: '工作区设置',
      workspaceName: '工作区名称',
      workspaceEmoji: '工作区图标',
      workspaceColor: '主色调',
      newWorkspace: '新建工作区',
      save: '保存',
      cancel: '取消',
      
      // 关于
      version: '版本',
      github: 'GitHub',
      reportIssue: '报告问题',
      author: '作者',
      
      // 书签
      all: '全部',
      addBookmark: '添加书签',
      editBookmark: '编辑书签',
      deleteBookmark: '删除书签',
      addSubBookmark: '添加子书签',
      editSubBookmark: '编辑子书签',
      deleteSubBookmark: '删除子书签',
      subBookmarks: '子书签',
      maxSubBookmarks: '最多添加 5 个子书签',
      confirmDeleteSubBookmark: '确定删除此子书签？',
      saveFailed: '保存失败',
      url: '网址',
      name: '名称',
      confirmDelete: '确定要删除此书签吗？',
      favorite: '收藏',
      unfavorite: '取消收藏',
      edit: '编辑',
      delete: '删除',
      refreshIcon: '刷新图标',
      save: '保存',
      cancel: '取消',
      
      // 视图
      listView: '列表视图',
      gridView: '网格视图',
      smartView: '智能视图',

      // 文件夹操作
      rename: '重命名',
      newFolder: '新建文件夹',
      newSubFolder: '新建子文件夹',
      dissolveFolder: '解散文件夹',
    }
  },
  en: {
    translation: {
      // General Settings
      settings: 'Settings',
      general: 'General',
      data: 'Data',
      workspace: 'Workspace',
      about: 'About',
      
      // Appearance
      appearance: 'Appearance',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
      
      // Background
      background: 'Background',
      default: 'Default',
      subtle: 'Subtle',
      deep: 'Deep',
      blueTint: 'Blue Tint',
      warmTint: 'Warm Tint',
      
      // Workspace Display
      workspaceDisplay: 'Workspace Display',
      showTabBar: 'Show Tab Bar',
      
      // Icon
      iconSize: 'Icon Size',
      small: 'Small',
      medium: 'Medium',
      large: 'Large',
      
      // Tab Display
      tabDisplay: 'Tab Display',
      iconOnly: 'Icon Only',
      textOnly: 'Text Only',
      both: 'Icon & Text',
      
      // Default Workspace
      defaultWorkspace: 'Default Workspace',

      // On Startup
      onStartup: 'On Startup',
      openHomepage: 'Open Homepage',
      openLastWorkspace: 'Open Last Workspace',
      openSpecificWorkspace: 'Open Specific Workspace',
      selectWorkspace: 'Select Workspace',
      allFavorites: 'Favorites',
      
      // Language
      language: 'Language',
      chinese: '简体中文',
      english: 'English',
      
      // Data
      importBookmarks: 'Import Bookmarks',
      importHint: 'Import from Chrome/Edge Bookmarks JSON file',
      selectFile: 'Select File',
      syncToGithub: 'Sync to GitHub',
      syncHint: 'Sync bookmark data to GitHub Gist',
      configureGithub: 'Configure GitHub',
      syncNow: 'Sync Now',
      exportData: 'Export Data',
      exportHint: 'Export all bookmarks and settings as JSON file',
      exportNow: 'Export Now',
      importData: 'Import Data',
      importDataHint: 'Import bookmarks and settings from JSON file',
      
      // Workspace Settings
      workspaceSettings: 'Workspace Settings',
      workspaceName: 'Workspace Name',
      workspaceEmoji: 'Workspace Icon',
      workspaceColor: 'Primary Color',
      newWorkspace: 'New Workspace',
      save: 'Save',
      cancel: 'Cancel',
      
      // About
      version: 'Version',
      github: 'GitHub',
      reportIssue: 'Report Issue',
      author: 'Author',
      
      // Bookmarks
      all: 'All',
      addBookmark: 'Add Bookmark',
      editBookmark: 'Edit Bookmark',
      deleteBookmark: 'Delete Bookmark',
      addSubBookmark: 'Add Sub-Bookmark',
      editSubBookmark: 'Edit Sub-Bookmark',
      deleteSubBookmark: 'Delete Sub-Bookmark',
      subBookmarks: 'Sub-Bookmarks',
      maxSubBookmarks: 'Maximum 5 sub-bookmarks',
      confirmDeleteSubBookmark: 'Delete this sub-bookmark?',
      saveFailed: 'Save Failed',
      confirmDelete: 'Are you sure you want to delete this bookmark?',
      favorite: 'Favorite',
      unfavorite: 'Unfavorite',
      edit: 'Edit',
      delete: 'Delete',
      refreshIcon: 'Refresh Icon',
      url: 'URL',
      name: 'Name',
      
      // Views
      listView: 'List View',
      gridView: 'Grid View',
      smartView: 'Smart View',

      // Folder operations
      rename: 'Rename',
      newFolder: 'New Folder',
      newSubFolder: 'New Subfolder',
      dissolveFolder: 'Dissolve Folder',
    }
  },
  ja: {
    translation: {
      // 一般設定
      settings: '設定',
      general: '一般',
      data: 'データ',
      workspace: 'ワークスペース',
      about: 'について',
      
      // 外観
      appearance: '外観',
      theme: 'テーマ',
      light: 'ライト',
      dark: 'ダーク',
      system: 'システムに合わせる',
      
      // 背景
      background: '背景',
      default: 'デフォルト',
      subtle: 'サトル',
      deep: 'ディープ',
      blueTint: 'ブルーティント',
      warmTint: 'ウォームティント',
      
      // ワークスペース表示
      workspaceDisplay: 'ワークスペース表示',
      showTabBar: 'タブバーを表示',
      
      // アイコン
      iconSize: 'アイコンサイズ',
      small: '小',
      medium: '中',
      large: '大',
      
      // タブ表示
      tabDisplay: 'タブ表示',
      iconOnly: 'アイコンのみ',
      textOnly: 'テキストのみ',
      both: 'アイコンとテキスト',
      
      // デフォルトワークスペース
      defaultWorkspace: 'デフォルトワークスペース',
      
      // 起動時
      onStartup: '起動時',
      openHomepage: 'ホームページを開く',
      openLastWorkspace: '前回のワークスペースを開く',
      openSpecificWorkspace: '指定したワークスペースを開く',
      selectWorkspace: 'ワークスペースを選択',
      allFavorites: 'お気に入り',
      
      // 言語
      language: '言語',
      chinese: '簡体中文',
      english: 'English',
      japanese: '日本語',
      
      // データ
      importBookmarks: 'ブックマークをインポート',
      importHint: 'Chrome/Edge ブックマークJSONファイルからインポート',
      selectFile: 'ファイルを選択',
      syncToGithub: 'GitHubに同期',
      syncHint: 'ブックマークデータをGitHub Gistに同期',
      configureGithub: 'GitHubを設定',
      syncNow: '今すぐ同期',
      exportData: 'データをエクスポート',
      exportHint: 'すべてのブックマークと設定をJSONファイルとしてエクスポート',
      exportNow: '今すぐエクスポート',
      importData: 'データをインポート',
      importDataHint: 'JSONファイルからブックマークと設定をインポート',
      
      // ワークスペース設定
      workspaceSettings: 'ワークスペース設定',
      workspaceName: 'ワークスペース名',
      workspaceEmoji: 'ワークスペースアイコン',
      workspaceColor: 'プライマリカラー',
      newWorkspace: '新規ワークスペース',
      save: '保存',
      cancel: 'キャンセル',
      
      // について
      version: 'バージョン',
      github: 'GitHub',
      reportIssue: '問題を報告',
      author: '作者',
      
      // ブックマーク
      all: 'すべて',
      addBookmark: 'ブックマークを追加',
      editBookmark: 'ブックマークを編集',
      deleteBookmark: 'ブックマークを削除',
      addSubBookmark: 'サブブックマークを追加',
      editSubBookmark: 'サブブックマークを編集',
      deleteSubBookmark: 'サブブックマークを削除',
      subBookmarks: 'サブブックマーク',
      maxSubBookmarks: '最大5個のサブブックマーク',
      confirmDeleteSubBookmark: 'このサブブックマークを削除しますか？',
      saveFailed: '保存に失敗しました',
      confirmDelete: 'このブックマークを削除してもよろしいですか？',
      favorite: 'お気に入り',
      unfavorite: 'お気に入りから削除',
      edit: '編集',
      delete: '削除',
      refreshIcon: 'アイコンを更新',
      url: 'URL',
      name: '名前',
      
      // 表示
      listView: 'リスト表示',
      gridView: 'グリッド表示',
      smartView: 'スマート表示',
      
      // フォルダ操作
      rename: '名前を変更',
      newFolder: '新規フォルダ',
      newSubFolder: '新規サブフォルダ',
      dissolveFolder: 'フォルダを解体',
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'zh',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
