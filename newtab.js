// ═══════════════════════════════════════════════════════════════
// Naviga — Workspace-based Bookmark Navigation
// Data Layer: chrome.bookmarks API + chrome.storage.local
// ═══════════════════════════════════════════════════════════════

// ── Constants ──
const BG_CLASSES = {
    'dark': 'bg-dark',
    'dark-gray': 'bg-dark-gray',
    'deep': 'bg-deep',
    'blue': 'bg-blue',
    'warm': 'bg-warm'
};

const DEFAULT_EMOJIS = ['📁','💼','🏠','📚','🎮','🛒','🎨','🎵','🔬','🌐','💡','🔧'];

// ── i18n ──
const I18N = {
    'zh-CN': {
        settings: '设置',
        appearance: '外观',
        light: '浅色',
        dark: '深色',
        system: '跟随系统',
        background: '背景',
        bgDefault: '默认',
        bgSubtle: '柔和',
        bgDeep: '深邃',
        bgBlueTint: '蓝色调',
        bgWarmTint: '暖色调',
        clicksPerLevel: '每梯度点击量',
        cardDisplay: '工作区卡片显示',
        iconSize: '图标大小',
        small: '小',
        medium: '中',
        large: '大',
        tabDisplay: '标签页显示',
        iconText: '图标 + 文字',
        iconOnly: '仅图标',
        textOnly: '仅文字',
        wsAppearance: '工作区外观',
        importBookmarks: '导入书签',
        importHint: '从 Chrome/Edge 书签 JSON 文件导入 (workspaces_v2)',
        chooseFile: '选择文件',
        saveSettings: '保存设置',
        frequentlyAccessed: '常用访问',
        workspaces: '工作区',
        bookmarks: '个书签',
        clicks: '次点击',
        noBookmarks: '暂无书签',
        noBookmarksHint: '在浏览器中为此文件夹添加书签',
        editBookmark: '编辑书签',
        addBookmark: '添加书签',
        addSubBookmark: '添加子书签',
        editSubBookmark: '编辑子书签',
        deleteFolder: '删除文件夹',
        deleteFolderConfirm: '确定要删除文件夹"{name}"吗？其中的书签将移入父文件夹。',
        refreshFavicon: '刷新图标',
        title: '标题',
        iconSource: '图标来源',
        iconValue: '图标值',
        favicon: '网站图标',
        emoji: 'Emoji',
        lucideIcons: 'Lucide 图标',
        url: '网址',
        cancel: '取消',
        save: '保存',
        edit: '编辑',
        delete: '删除',
        addSub: '添加子书签',
        general: '其他',
        list: '列表',
        grid: '网格',
        smart: '智能',
        language: '语言',
        langZhCN: '简体中文',
        langZhTW: '繁體中文',
        langEn: 'English',
        langJa: '日本語',
        refreshFavicon: '刷新图标',
        deleteFolder: '删除文件夹',
        deleteFolderConfirm: '确定删除文件夹「{name}」？其中的书签将移入父文件夹。',
        newFolderPrompt: '请输入新文件夹名称：',
        newSubFolder: '新建子文件夹',
    },
    'zh-TW': {
        settings: '設定',
        appearance: '外觀',
        light: '淺色',
        dark: '深色',
        system: '跟隨系統',
        background: '背景',
        bgDefault: '預設',
        bgSubtle: '柔和',
        bgDeep: '深邃',
        bgBlueTint: '藍色調',
        bgWarmTint: '暖色調',
        clicksPerLevel: '每梯度點擊量',
        cardDisplay: '工作區卡片顯示',
        iconSize: '圖示大小',
        small: '小',
        medium: '中',
        large: '大',
        tabDisplay: '標籤頁顯示',
        iconText: '圖示 + 文字',
        iconOnly: '僅圖示',
        textOnly: '僅文字',
        wsAppearance: '工作區外觀',
        importBookmarks: '匯入書籤',
        importHint: '從 Chrome/Edge 書籤 JSON 檔案匯入 (workspaces_v2)',
        chooseFile: '選擇檔案',
        saveSettings: '儲存設定',
        frequentlyAccessed: '常用存取',
        workspaces: '工作區',
        bookmarks: '個書籤',
        clicks: '次點擊',
        noBookmarks: '暫無書籤',
        noBookmarksHint: '在瀏覽器中為此資料夾新增書籤',
        editBookmark: '編輯書籤',
        addBookmark: '新增書籤',
        addSubBookmark: '新增子書籤',
        editSubBookmark: '編輯子書籤',
        title: '標題',
        iconSource: '圖示來源',
        iconValue: '圖示值',
        favicon: '網站圖示',
        emoji: 'Emoji',
        lucideIcons: 'Lucide 圖示',
        url: '網址',
        cancel: '取消',
        save: '儲存',
        edit: '編輯',
        delete: '刪除',
        addSub: '新增子書籤',
        general: '其他',
        list: '清單',
        grid: '格線',
        smart: '智慧',
        language: '語言',
        langZhCN: '简体中文',
        langZhTW: '繁體中文',
        langEn: 'English',
        langJa: '日本語',
        refreshFavicon: '重新整理圖示',
        deleteFolder: '刪除資料夾',
        deleteFolderConfirm: '確定刪除資料夾「{name}」？其中的書籤將移入父資料夾。',
        newFolderPrompt: '請輸入新資料夾名稱：',
        newSubFolder: '新建子資料夾',
    },
    'en': {
        appearance: '外觀',
        light: '淺色',
        dark: '深色',
        system: '跟隨系統',
        background: '背景',
        bgDefault: '預設',
        bgSubtle: '柔和',
        bgDeep: '深邃',
        bgBlueTint: '藍色調',
        bgWarmTint: '暖色調',
        clicksPerLevel: '每梯度點擊量',
        cardDisplay: '工作區卡片顯示',
        iconSize: '圖示大小',
        small: '小',
        medium: '中',
        large: '大',
        tabDisplay: '標籤頁顯示',
        iconText: '圖示 + 文字',
        iconOnly: '僅圖示',
        textOnly: '僅文字',
        wsAppearance: '工作區外觀',
        importBookmarks: '匯入書籤',
        importHint: '從 Chrome/Edge 書籤 JSON 檔案匯入 (workspaces_v2)',
        chooseFile: '選擇檔案',
        saveSettings: '儲存設定',
        frequentlyAccessed: '常用存取',
        workspaces: '工作區',
        bookmarks: '個書籤',
        clicks: '次點擊',
        noBookmarks: '暫無書籤',
        noBookmarksHint: '在瀏覽器中為此資料夾新增書籤',
        editBookmark: '編輯書籤',
        addBookmark: '新增書籤',
        addSubBookmark: '新增子書籤',
        editSubBookmark: '編輯子書籤',
        title: '標題',
        iconSource: '圖示來源',
        iconValue: '圖示值',
        favicon: '網站圖示',
        emoji: 'Emoji',
        lucideIcons: 'Lucide 圖示',
        url: '網址',
        cancel: '取消',
        save: '儲存',
        edit: '編輯',
        delete: '刪除',
        addSub: '新增子書籤',
        general: '其他',
        list: '清單',
        grid: '格線',
        smart: '智慧',
        language: '語言',
        langZhCN: '简体中文',
        langZhTW: '繁體中文',
        langEn: 'English',
        langJa: '日本語',
        refreshFavicon: '重新整理圖示',
        deleteFolder: '刪除資料夾',
        deleteFolderConfirm: '確定刪除資料夾「{name}」？其中的書籤將移入父資料夾。',
        newFolderPrompt: '請輸入新資料夾名稱：',
    },
    'en': {
        settings: 'Settings',
        appearance: 'Appearance',
        light: 'Light',
        dark: 'Dark',
        system: 'System',
        background: 'Background',
        bgDefault: 'Default',
        bgSubtle: 'Subtle',
        bgDeep: 'Deep',
        bgBlueTint: 'Blue Tint',
        bgWarmTint: 'Warm Tint',
        clicksPerLevel: 'Clicks per Gradient Level',
        cardDisplay: 'Workspace Card Display',
        iconSize: 'Icon Size',
        small: 'Small',
        medium: 'Medium',
        large: 'Large',
        tabDisplay: 'Tab Display',
        iconText: 'Icon + Text',
        iconOnly: 'Icon Only',
        textOnly: 'Text Only',
        wsAppearance: 'Workspace Appearance',
        importBookmarks: 'Import Bookmarks',
        importHint: 'Import workspaces from a Chrome/Edge bookmarks JSON file (workspaces_v2)',
        chooseFile: 'Choose File',
        saveSettings: 'Save Settings',
        frequentlyAccessed: 'Frequently Accessed',
        workspaces: 'Workspaces',
        bookmarks: 'bookmarks',
        clicks: 'clicks',
        noBookmarks: 'No bookmarks yet',
        noBookmarksHint: 'Add bookmarks to this folder in your browser',
        editBookmark: 'Edit Bookmark',
        addBookmark: 'Add Bookmark',
        addSubBookmark: 'Add Sub-bookmark',
        editSubBookmark: 'Edit Sub-bookmark',
        title: 'Title',
        iconSource: 'Icon Source',
        iconValue: 'Icon Value',
        favicon: 'Favicon',
        emoji: 'Emoji',
        lucideIcons: 'Lucide Icons',
        url: 'URL',
        cancel: 'Cancel',
        save: 'Save',
        edit: 'Edit',
        delete: 'Delete',
        addSub: 'Add Sub-bookmark',
        general: 'General',
        list: 'List',
        grid: 'Grid',
        smart: 'Smart',
        language: 'Language',
        langZhCN: '简体中文',
        langZhTW: '繁體中文',
        langEn: 'English',
        langJa: '日本語',
        refreshFavicon: 'Refresh Favicon',
        deleteFolder: 'Delete Folder',
        deleteFolderConfirm: 'Delete folder "{name}"? Its bookmarks will be moved to the parent folder.',
        newFolderPrompt: 'Please enter new folder name:',
        newSubFolder: 'New Sub-folder',
    },
    'ja': {
        settings: '設定',
        appearance: '外観',
        light: 'ライト',
        dark: 'ダーク',
        system: 'システム',
        background: '背景',
        bgDefault: 'デフォルト',
        bgSubtle: 'サブトル',
        bgDeep: 'ディープ',
        bgBlueTint: 'ブルーティント',
        bgWarmTint: 'ウォームティント',
        clicksPerLevel: 'グラデーションレベルあたりのクリック数',
        cardDisplay: 'ワークスペースカード表示',
        iconSize: 'アイコンサイズ',
        small: '小',
        medium: '中',
        large: '大',
        tabDisplay: 'タブ表示',
        iconText: 'アイコン + テキスト',
        iconOnly: 'アイコンのみ',
        textOnly: 'テキストのみ',
        wsAppearance: 'ワークスペース外観',
        importBookmarks: 'ブックマークをインポート',
        importHint: 'Chrome/Edge ブックマーク JSON ファイルからインポート (workspaces_v2)',
        chooseFile: 'ファイルを選択',
        saveSettings: '設定を保存',
        frequentlyAccessed: 'よくアクセスする',
        workspaces: 'ワークスペース',
        bookmarks: '件のブックマーク',
        clicks: '回クリック',
        noBookmarks: 'ブックマークがありません',
        noBookmarksHint: 'ブラウザでこのフォルダにブックマークを追加してください',
        editBookmark: 'ブックマークを編集',
        addBookmark: 'ブックマークを追加',
        addSubBookmark: 'サブブックマークを追加',
        editSubBookmark: 'サブブックマークを編集',
        title: 'タイトル',
        iconSource: 'アイコンソース',
        iconValue: 'アイコン値',
        favicon: 'ファビコン',
        emoji: 'Emoji',
        lucideIcons: 'Lucide アイコン',
        url: 'URL',
        cancel: 'キャンセル',
        save: '保存',
        edit: '編集',
        delete: '削除',
        addSub: 'サブブックマークを追加',
        general: 'その他',
        list: 'リスト',
        grid: 'グリッド',
        smart: 'スマート',
        language: '言語',
        langZhCN: '简体中文',
        langZhTW: '繁體中文',
        langEn: 'English',
        newFolderPrompt: '新しいフォルダ名を入力してください：',
        newSubFolder: '新しいサブフォルダ',
        langJa: '日本語',
    }
};

function t(key) {
    const lang = settings.language || 'zh-CN';
    return (I18N[lang] && I18N[lang][key]) || (I18N['en'] && I18N['en'][key]) || key;
}

// ── State ──
let workspaces = {};       // { folderId: { id, name, folders: { folderName: [bookmarks] } } }
let workspaceFolderIds = {};  // { wsId: { path: chromeBookmarkFolderId } }
let workspaceRootIds = {};  // { wsId: chromeBookmarkFolderId }
let currentWorkspace = 'all';
let currentView = 'list';
let folderViewModes = {};
let editingBookmark = null;
let contextMenuBookmark = null;
let clickCounts = {};      // { bookmarkId: number }
let subBookmarks = {};     // { parentId: [{id, title, url, iconType, iconValue}] }
let wsMeta = {};           // { folderId: { emoji, color, display } }
let settings = {
    appearance: 'system',
    bgGradient: 'dark',
    clicksPerLevel: 100,
    cardDisplay: 'both',
    tabDisplay: 'both',
    iconSize: 'medium',
    language: 'zh-CN'
};

// ── Init ──
async function init() {
    await loadStorage();
    applyTheme();
    applyLanguage();
    await refreshWorkspaces();
    render();
    attachEventListeners();
    applyBackgroundGradient();
    applyTabDisplay();
    applyAppearanceUI();
    watchBookmarkChanges();
}

// ── Storage ──
async function loadStorage() {
    return new Promise(resolve => {
        chrome.storage.local.get(['settings', 'clickCounts', 'subBookmarks', 'wsMeta', 'folderViewModes'], result => {
            if (result.settings) Object.assign(settings, result.settings);
            if (result.clickCounts) clickCounts = result.clickCounts;
            if (result.subBookmarks) subBookmarks = result.subBookmarks;
            if (result.wsMeta) wsMeta = result.wsMeta;
            if (result.folderViewModes) folderViewModes = result.folderViewModes;
            resolve();
        });
    });
}

async function saveStorage() {
    return new Promise(resolve => {
        chrome.storage.local.set({
            settings,
            clickCounts,
            subBookmarks,
            wsMeta,
            folderViewModes
        }, resolve);
    });
}

// ── Bookmarks Data Layer ──
async function refreshWorkspaces() {
    const tree = await chrome.bookmarks.getTree();
    // Find the Bookmarks Bar (id "1" in Chrome/Edge)
    const rootNode = tree[0];
    const bar = rootNode.children.find(c => c.id === '1') || rootNode.children[0];
    if (!bar || !bar.children) { workspaces = {}; return; }

    workspaces = {};
    bar.children
        .filter(node => node.children && node.children.length > 0)
        .forEach((folder, idx) => {
            const rawTitle = folder.title || '';
            const emojis = extractEmojis(rawTitle);
            const cleanName = stripEmojis(rawTitle) || rawTitle;

            if (!wsMeta[folder.id]) {
                wsMeta[folder.id] = {
                    emoji: emojis.length > 0 ? emojis.join('') : DEFAULT_EMOJIS[idx % DEFAULT_EMOJIS.length],
                    color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
                    display: 'both'
                };
            } else if (emojis.length > 0 && wsMeta[folder.id].emoji === DEFAULT_EMOJIS[Object.keys(workspaces).length % DEFAULT_EMOJIS.length]) {
                // If existing emoji is a default one and the name has emojis, auto-upgrade
                wsMeta[folder.id].emoji = emojis.join('');
            }
            const result = groupBySubFolders(folder.children);
            workspaces[folder.id] = {
                id: folder.id,
                name: emojis.length > 0 ? cleanName : rawTitle,
                folders: result.folders
            };
            workspaceFolderIds[folder.id] = result.folderIds;
            workspaceRootIds[folder.id] = folder.id;
        });

    await saveStorage();
}

function groupBySubFolders(children, prefix) {
    const folders = {};
    const folderIds = {};  // { path: chromeBookmarkFolderId }
    const orphans = [];
    const orphansFolderId = null;

    children.forEach(node => {
        if (node.url) {
            orphans.push(nodeToBookmark(node));
        } else if (node.children) {
            const path = prefix ? prefix + '/' + node.title : node.title;
            folderIds[path] = node.id;
            // Collect urls directly in this sub-folder
            const directBms = node.children.filter(n => n.url).map(n => nodeToBookmark(n));
            if (directBms.length > 0) folders[path] = directBms;
            // Recurse into nested sub-folders
            const subFolders = node.children.filter(n => !n.url && n.children);
            subFolders.forEach(sub => {
                const subResult = groupBySubFolders([sub], path);
                Object.assign(folders, subResult.folders);
                Object.assign(folderIds, subResult.folderIds);
            });
        }
    });

    if (orphans.length > 0) {
        const key = prefix || t('general');
        folders[key] = orphans;
    }
    return { folders, folderIds };
}

function nodeToBookmark(node) {
    return {
        id: node.id,
        title: node.title || node.url,
        url: node.url,
        iconType: 'favicon',
        iconValue: node.url,
        clicks: clickCounts[node.id] || 0,
        children: subBookmarks[node.id] || []
    };
}

const DEFAULT_COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#06b6d4','#ec4899','#8b5cf6','#14b8a6'];

function watchBookmarkChanges() {
    chrome.bookmarks.onCreated.addListener(() => refreshAndRender());
    chrome.bookmarks.onRemoved.addListener(() => refreshAndRender());
    chrome.bookmarks.onChanged.addListener(() => refreshAndRender());
    chrome.bookmarks.onMoved.addListener(() => refreshAndRender());
}

async function refreshAndRender() {
    await refreshWorkspaces();
    render();
    applyTabDisplay();
}

// ── Theme ──
function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme() {
    const effective = settings.appearance === 'system' ? getSystemTheme() : settings.appearance;
    document.documentElement.setAttribute('data-theme', effective);
    document.documentElement.setAttribute('data-icon-size', settings.iconSize || 'medium');
}

function applyAppearanceUI() {
    document.querySelectorAll('.appearance-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.appearance === settings.appearance);
    });
}

function applyLanguage() {
    document.documentElement.setAttribute('lang', settings.language || 'zh-CN');

    // Update toolbar view mode buttons
    document.querySelectorAll('.view-mode-btn').forEach(btn => {
        const view = btn.dataset.view;
        const label = btn.querySelector('span');
        if (label) label.textContent = t(view);
    });

    // Update settings panel labels
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) {
        settingsPanel.querySelector('.settings-header h2').textContent = t('settings');
        const groups = settingsPanel.querySelectorAll('.setting-group > label');
        if (groups[0]) groups[0].textContent = t('appearance');
        if (groups[1]) groups[1].textContent = t('background');
        if (groups[2]) groups[2].textContent = t('clicksPerLevel');
        if (groups[3]) groups[3].textContent = t('cardDisplay');
        if (groups[4]) groups[4].textContent = t('iconSize');
        if (groups[5]) groups[5].textContent = t('tabDisplay');
        if (groups[6]) groups[6].textContent = t('wsAppearance');
        if (groups[7]) groups[7].textContent = t('importBookmarks');
        if (groups[8]) groups[8].textContent = t('language');

        // Background options
        const bgSelect = document.getElementById('bgGradientPreset');
        if (bgSelect) {
            bgSelect.options[0].textContent = t('bgDefault');
            bgSelect.options[1].textContent = t('bgSubtle');
            bgSelect.options[2].textContent = t('bgDeep');
            bgSelect.options[3].textContent = t('bgBlueTint');
            bgSelect.options[4].textContent = t('bgWarmTint');
        }

        // Radio labels
        settingsPanel.querySelectorAll('.radio-option').forEach(opt => {
            const input = opt.querySelector('input');
            const value = input.value;
            const map = {
                'both': t('iconText'), 'icon': t('iconOnly'), 'text': t('textOnly'),
                'small': t('small'), 'medium': t('medium'), 'large': t('large')
            };
            if (map[value]) {
                opt.childNodes[opt.childNodes.length - 1].textContent = ' ' + map[value];
            }
        });

        // Appearance button labels
        settingsPanel.querySelectorAll('.appearance-btn span').forEach(span => {
            const ap = span.parentElement.dataset.appearance;
            if (ap === 'light') span.textContent = t('light');
            else if (ap === 'dark') span.textContent = t('dark');
            else if (ap === 'system') span.textContent = t('system');
        });

        // Import
        const importHint = settingsPanel.querySelector('.setting-hint');
        if (importHint) importHint.textContent = t('importHint');
        const importBtn = document.getElementById('importBtn');
        if (importBtn) importBtn.innerHTML = '<i data-lucide="upload" style="width:14px;height:14px;"></i> ' + t('chooseFile');

        // Save button
        document.getElementById('saveSettings').textContent = t('saveSettings');

        // Language select
        const langSelect = document.getElementById('languageSelect');
        if (langSelect) {
            langSelect.options[0].textContent = t('langZhCN');
            langSelect.options[1].textContent = t('langZhTW');
            langSelect.options[2].textContent = t('langEn');
            langSelect.options[3].textContent = t('langJa');
        }
    }

    // Edit modal labels
    const modalGroups = document.querySelectorAll('#editModal .form-group > label');
    if (modalGroups[0]) modalGroups[0].textContent = t('title');
    if (modalGroups[1]) modalGroups[1].textContent = t('iconSource');
    if (modalGroups[2]) modalGroups[2].textContent = t('iconValue');
    if (modalGroups[3]) modalGroups[3].textContent = t('url');
    const iconTypeSelect = document.getElementById('editIconType');
    if (iconTypeSelect) {
        iconTypeSelect.options[0].textContent = t('favicon');
        iconTypeSelect.options[1].textContent = t('emoji');
        iconTypeSelect.options[2].textContent = t('lucideIcons');
    }
    document.getElementById('cancelEdit').textContent = t('cancel');
    document.getElementById('saveEdit').textContent = t('save');
}

// ── Utility ──
function extractEmojis(str) {
    // Match emoji characters: Unicode emoji ranges + emoji modifiers + ZWJ sequences
    const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}](?:\uFE0F)?(?:\u200D[\p{Emoji_Presentation}\p{Extended_Pictographic}](?:\uFE0F)?)*/gu;
    const matches = str.match(emojiRegex);
    return matches || [];
}

function stripEmojis(str) {
    const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}](?:\uFE0F)?(?:\u200D[\p{Emoji_Presentation}\p{Extended_Pictographic}](?:\uFE0F)?)*/gu;
    return str.replace(emojiRegex, '').trim().replace(/\s+/g, ' ');
}

function extractMainDomain(url) {
    try {
        const h = new URL(url).hostname.split('.');
        const slds = ['co.uk','com.cn','net.cn','org.cn'];
        const last2 = h.slice(-2).join('.');
        return slds.includes(last2) ? h.slice(-3).join('.') : h.slice(-2).join('.');
    } catch(e) { return ''; }
}

function validateChildDomain(pUrl, cUrl) {
    return extractMainDomain(pUrl) === extractMainDomain(cUrl);
}

function getWorkspaceMeta(wsId) {
    return wsMeta[wsId] || { emoji: '📁', color: '#6366f1', display: 'both' };
}

function getWorkspaceColor(wsId) {
    return getWorkspaceMeta(wsId).color;
}

function getClickBackgroundColor(clicks, wsId) {
    const base = getWorkspaceColor(wsId);
    const level = Math.min(Math.floor(clicks / settings.clicksPerLevel), 9);
    const r = parseInt(base.slice(1,3),16), g = parseInt(base.slice(3,5),16), b = parseInt(base.slice(5,7),16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + (0.04 + level * 0.022) + ')';
}

function renderBookmarkIcon(bm) {
    switch (bm.iconType) {
        case 'favicon':
            try { var d = new URL(bm.iconValue || bm.url).hostname; } catch(e) { var d = 'example.com'; }
            return '<img src="https://www.google.com/s2/favicons?domain=' + d + '&sz=64" onerror="this.style.display=\'none\';this.nextSibling&&this.nextSibling.remove&&this.nextSibling.remove();this.parentNode.innerHTML+=\'<span style=\\\'font-size:14px;font-weight:600;color:var(--text-tertiary);\\\\'>\' + (this.alt||\\'?\\') + '</span>\';">';
        case 'emoji':
            return '<span>' + (bm.iconValue || '') + '</span>';
        case 'icons8':
        case 'iconfont':
            return '<img src="' + (bm.iconValue || '') + '">';
        default:
            return '<i data-lucide="' + (bm.iconValue || 'star') + '"></i>';
    }
}

function generateContextMenu(bm, isChild) {
    let h = '';
    if (!isChild && (!bm.children || bm.children.length < 5)) {
        h += '<div class="context-menu-item" data-action="add-child"><i data-lucide="folder-plus" style="width:14px;height:14px;"></i> ' + t('addSub') + '</div>';
    }
    h += '<div class="context-menu-item" data-action="edit"><i data-lucide="pencil" style="width:14px;height:14px;"></i> ' + t('edit') + '</div>';
    if (!isChild && bm.iconType === 'favicon') {
        h += '<div class="context-menu-item" data-action="refresh-favicon"><i data-lucide="refresh-cw" style="width:14px;height:14px;"></i> ' + t('refreshFavicon') + '</div>';
    }
    h += '<div class="context-menu-item danger" data-action="delete"><i data-lucide="trash-2" style="width:14px;height:14px;"></i> ' + t('delete') + '</div>';
    return h;
}

// ── Find Bookmark ──
function findBookmarkInWorkspace(id) {
    for (const [wsId, ws] of Object.entries(workspaces)) {
        for (const bms of Object.values(ws.folders)) {
            const bm = bms.find(b => b.id === id);
            if (bm) return { bookmark: bm, wsId };
        }
    }
    return null;
}

function findSubBookmark(childId) {
    for (const [parentId, children] of Object.entries(subBookmarks)) {
        const ch = children.find(c => c.id === childId);
        if (ch) return { child: ch, parentId };
    }
    return null;
}

function findBookmarkOrChild(id) {
    const sub = findSubBookmark(id);
    if (sub) {
        // Find parent bookmark for domain validation
        const parentInfo = findBookmarkInWorkspace(sub.parentId);
        return { bookmark: sub.child, isChild: true, parent: parentInfo ? parentInfo.bookmark : null };
    }
    const info = findBookmarkInWorkspace(id);
    if (info) return { bookmark: info.bookmark, isChild: false, parent: null };
    return null;
}

function getAllBookmarks() {
    const all = [];
    for (const [wsId, ws] of Object.entries(workspaces)) {
        for (const [fn, bms] of Object.entries(ws.folders)) {
            bms.forEach(bm => all.push({...bm, workspace: wsId, folder: fn}));
        }
    }
    return all;
}

// ── Settings Helpers ──
function applyBackgroundGradient() {
    document.body.className = '';
    const effective = settings.appearance === 'system' ? getSystemTheme() : settings.appearance;
    if (effective === 'light') {
        const lightMap = { 'dark': 'bg-dark', 'dark-gray': 'bg-dark-gray', 'deep': 'bg-deep', 'blue': 'bg-blue', 'warm': 'bg-warm' };
        document.body.classList.add(lightMap[settings.bgGradient] || 'bg-dark');
    } else {
        const cls = BG_CLASSES[settings.bgGradient];
        if (cls) document.body.classList.add(cls);
    }
}

function applyTabDisplay() {
    const display = settings.tabDisplay;
    document.querySelectorAll('.nav-tab').forEach(btn => {
        const icon = btn.querySelector('.nav-tab-icon');
        const text = btn.querySelector('.nav-tab-text');
        if (!icon || !text) return;
        if (display === 'icon') { icon.style.display = ''; text.style.display = 'none'; }
        else if (display === 'text') { icon.style.display = 'none'; text.style.display = ''; }
        else { icon.style.display = ''; text.style.display = ''; }
    });
}

function updateColorPreview() {
    const preview = document.getElementById('colorPreview');
    if (!preview) return;
    const c = document.getElementById('gradientColor');
    if (!c) return;
    const color = c.value;
    let h = '';
    for (let i = 0; i < 10; i++) {
        const op = 0.04 + i * 0.022;
        const r = parseInt(color.slice(1,3),16), g = parseInt(color.slice(3,5),16), b = parseInt(color.slice(5,7),16);
        h += '<div class="color-gradient-bar" style="background:rgba(' + r + ',' + g + ',' + b + ',' + op + ')"></div>';
    }
    preview.innerHTML = h;
}

// ── Render ──
function render() {
    const main = document.getElementById('main-content');
    const toolbar = document.getElementById('toolbar');

    if (currentWorkspace === 'all') {
        toolbar.style.display = 'none';
        renderAllView(main);
    } else {
        toolbar.style.display = 'flex';
        renderWorkspaceView(main);
    }

    updateStats();
    attachBookmarkClickHandlers();
    if (window.lucide) lucide.createIcons();
}

function renderAllView(container) {
    const all = getAllBookmarks();
    const top = [...all].sort((a,b) => b.clicks - a.clicks).slice(0, 12);

    let h = '';

    // Frequently Accessed
    h += '<div class="section">';
    h += '<div class="section-header"><div class="section-title">' + t('frequentlyAccessed') + '</div></div>';
    h += '<div class="frequent-grid">';
    top.forEach(bm => {
        const bg = getClickBackgroundColor(bm.clicks, bm.workspace);
        h += '<a class="frequent-item" href="' + bm.url + '" target="_blank" data-id="' + bm.id + '" style="background:' + bg + '">';
        h += '<div class="frequent-item-icon">' + renderBookmarkIcon(bm) + '</div>';
        h += '<div class="frequent-item-title">' + bm.title + '</div>';
        h += '</a>';
    });
    h += '</div></div>';

    // Workspaces
    h += '<div class="section">';
    h += '<div class="section-header"><div class="section-title">' + t('workspaces') + '</div></div>';
    h += '<div class="workspace-grid">';
    for (const [wsId, ws] of Object.entries(workspaces)) {
        const meta = getWorkspaceMeta(wsId);
        let count = 0;
        for (const bms of Object.values(ws.folders)) count += bms.length;
        let card = '';
        if (settings.cardDisplay === 'icon' || settings.cardDisplay === 'both') card += '<div class="workspace-card-icon">' + meta.emoji + '</div>';
        if (settings.cardDisplay === 'text' || settings.cardDisplay === 'both') {
            card += '<div class="workspace-card-name">' + ws.name + '</div>';
            card += '<div class="workspace-card-count">' + count + ' ' + t('bookmarks') + '</div>';
        }
        h += '<div class="workspace-card" data-workspace="' + wsId + '">' + card + '</div>';
    }
    h += '</div></div>';

    container.innerHTML = h;

    document.querySelectorAll('.workspace-card').forEach(card => {
        card.addEventListener('click', e => switchToWorkspace(e.currentTarget.dataset.workspace));
    });
}

function renderWorkspaceView(container) {
    const ws = workspaces[currentWorkspace];
    if (!ws || Object.keys(ws.folders).length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><h2>' + t('noBookmarks') + '</h2><p>' + t('noBookmarksHint') + '</p></div>';
        return;
    }

    let h = '';
    for (const [fn, bms] of Object.entries(ws.folders)) {
        const fid = currentWorkspace + '-' + fn;
        const mode = folderViewModes[fid] || currentView;
        const folderId = (workspaceFolderIds[currentWorkspace] || {})[fn] || '';
        // Render path with "/" separator
        const parts = fn.split('/');
        let titleHtml = '<i data-lucide="folder" style="width:14px;height:14px;"></i> ';
        parts.forEach((part, i) => {
            if (i > 0) titleHtml += '<span class="folder-sep">/</span>';
            titleHtml += '<span class="folder-part" data-folder-id="' + (i === parts.length - 1 ? folderId : '') + '">' + part + '</span>';
        });
        titleHtml += ' <span class="folder-count">(' + bms.length + ')</span>';
        h += '<div class="folder">';
        h += '<div class="folder-header">';
        h += '<div class="folder-title" data-folder-path="' + fn + '" data-folder-id="' + folderId + '">' + titleHtml + '</div>';
        h += '<div class="folder-actions">';
        h += '<button class="folder-add-btn" data-folder-id="' + folderId + '" title="' + t('addBookmark') + '"><i data-lucide="plus" style="width:14px;height:14px;"></i></button>';
        h += '<button class="folder-add-subfolder-btn" data-folder-id="' + folderId + '" title="' + t('newSubFolder') + '"><i data-lucide="folder-plus" style="width:14px;height:14px;"></i></button>';
        h += '<button class="folder-toggle" data-folder="' + fid + '" data-mode="' + mode + '"><i data-lucide="arrow-right-left" style="width:12px;height:12px;"></i> ' + (mode === 'list' ? t('grid') : mode === 'grid' ? t('smart') : t('list')) + '</button>';
        h += '<button class="folder-delete-btn" data-folder-id="' + folderId + '" data-workspace="' + currentWorkspace + '" data-folder-path="' + fn + '" title="' + t('deleteFolder') + '"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>';
        h += '</div>';
        h += '</div>';
        h += renderBookmarks(bms, mode, fid);
        h += '</div>';
    }

    container.innerHTML = h;
}

function renderBookmarks(bms, mode, fid) {
    const wk = fid.split('-')[0];

    if (mode === 'list') {
        let h = '<div class="bookmarks-list">';
        bms.forEach(bm => {
            const bg = getClickBackgroundColor(bm.clicks, wk);
            const hc = bm.children && bm.children.length > 0;
            h += '<div class="bookmark-list-item' + (hc ? ' has-children' : '') + '" data-id="' + bm.id + '" data-url="' + bm.url + '" style="background:' + bg + '">';
            h += '<a class="bookmark-list-main" href="' + bm.url + '" target="_blank">';
            h += '<div class="bookmark-list-icon">' + renderBookmarkIcon(bm) + '</div>';
            h += '<div class="bookmark-list-info"><div class="bookmark-list-title">' + bm.title + '</div>';
            h += '<div class="bookmark-list-url">' + bm.url + '</div></div>';
            h += '</a>';
            if (hc) {
                h += '<div class="bookmark-sub-items">';
                bm.children.forEach(ch => {
                    h += '<a class="bookmark-sub-item" href="' + ch.url + '" target="_blank" data-id="' + ch.id + '" title="' + ch.title + '">';
                    h += '<span class="bookmark-sub-item-icon">' + renderBookmarkIcon(ch) + '</span>';
                    h += '<span class="bookmark-sub-item-name">' + ch.title + '</span>';
                    h += '</a>';
                });
                h += '</div>';
            }
            h += '</div>';
        });
        h += '</div>';
        return h;
    }

    if (mode === 'grid') {
        let h = '<div class="bookmarks-grid">';
        bms.forEach(bm => {
            const bg = getClickBackgroundColor(bm.clicks, wk);
            const hc = bm.children && bm.children.length > 0;
            h += '<a class="bookmark-grid-item' + (hc ? ' has-children' : '') + '" href="' + bm.url + '" target="_blank" data-id="' + bm.id + '" style="background:' + bg + '">';
            h += '<div class="badge-dot"></div>';
            h += '<div class="bookmark-grid-icon">' + renderBookmarkIcon(bm) + '</div>';
            h += '<div class="bookmark-grid-title">' + bm.title + '</div>';
            h += '</a>';
        });
        h += '</div>';
        return h;
    }

    // Smart
    const sorted = [...bms].sort((a,b) => b.clicks - a.clicks);
    const freq = sorted.slice(0, 3);
    const rest = sorted;

    let h = '<div class="bookmarks-smart">';
    h += '<div class="smart-section"><h3>' + t('frequentlyAccessed') + '</h3><div class="bookmarks-grid">';
    freq.forEach(bm => {
        const bg = getClickBackgroundColor(bm.clicks, wk);
        const hc = bm.children && bm.children.length > 0;
        h += '<a class="bookmark-grid-item' + (hc ? ' has-children' : '') + '" href="' + bm.url + '" target="_blank" data-id="' + bm.id + '" style="background:' + bg + '">';
        h += '<div class="badge-dot"></div>';
        h += '<div class="bookmark-grid-icon">' + renderBookmarkIcon(bm) + '</div>';
        h += '<div class="bookmark-grid-title">' + bm.title + '</div>';
        h += '</a>';
    });
    h += '</div></div>';

    h += '<div class="smart-section"><h3>' + t('workspaces') + '</h3><div class="bookmarks-list">';
    rest.forEach(bm => {
        const bg = getClickBackgroundColor(bm.clicks, wk);
        const hc = bm.children && bm.children.length > 0;
        h += '<div class="bookmark-list-item' + (hc ? ' has-children' : '') + '" data-id="' + bm.id + '" data-url="' + bm.url + '" style="background:' + bg + '">';
        h += '<a class="bookmark-list-main" href="' + bm.url + '" target="_blank">';
        h += '<div class="bookmark-list-icon">' + renderBookmarkIcon(bm) + '</div>';
        h += '<div class="bookmark-list-info"><div class="bookmark-list-title">' + bm.title + '</div>';
        h += '<div class="bookmark-list-url">' + bm.url + '</div></div>';
        h += '</a>';
        if (hc) {
            h += '<div class="bookmark-sub-items">';
            bm.children.forEach(ch => {
                h += '<a class="bookmark-sub-item" href="' + ch.url + '" target="_blank" data-id="' + ch.id + '" title="' + ch.title + '">';
                h += '<span class="bookmark-sub-item-icon">' + renderBookmarkIcon(ch) + '</span>';
                h += '<span class="bookmark-sub-item-name">' + ch.title + '</span>';
                h += '</a>';
            });
            h += '</div>';
        }
        h += '</div>';
    });
    h += '</div></div></div>';
    return h;
}

function switchToWorkspace(key) {
    currentWorkspace = key;
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.workspace === key);
    });
    render();
}

function updateStats() {
    const ws = workspaces[currentWorkspace];
    if (!ws) return;
    let total = 0, clicks = 0;
    if (currentWorkspace === 'all') {
        for (const w of Object.values(workspaces)) {
            for (const bms of Object.values(w.folders)) { total += bms.length; bms.forEach(b => clicks += b.clicks); }
        }
    } else {
        for (const bms of Object.values(ws.folders)) { total += bms.length; bms.forEach(b => clicks += b.clicks); }
    }
    document.getElementById('stats-text').textContent = total + ' ' + t('bookmarks') + ' \u00b7 ' + clicks + ' ' + t('clicks');
}

// ── Dynamic Nav Tabs ──
function renderNavTabs() {
    const container = document.getElementById('navTabs');
    let h = '<button class="nav-tab active" data-workspace="all">';
    h += '<span class="nav-tab-icon">📚</span>';
    h += '<span class="nav-tab-text">All</span>';
    h += '</button>';

    for (const [wsId, ws] of Object.entries(workspaces)) {
        const meta = getWorkspaceMeta(wsId);
        h += '<button class="nav-tab" data-workspace="' + wsId + '">';
        h += '<span class="nav-tab-icon">' + meta.emoji + '</span>';
        h += '<span class="nav-tab-text">' + ws.name + '</span>';
        h += '</button>';
    }

    container.innerHTML = h;

    // Re-attach nav tab listeners
    container.querySelectorAll('.nav-tab').forEach(btn => {
        btn.addEventListener('click', e => {
            switchToWorkspace(e.currentTarget.dataset.workspace);
        });
    });
}

// ── Dynamic Settings Workspace List ──
function renderSettingsWorkspaces() {
    const container = document.getElementById('workspaceColorsList');
    if (!container) return;
    let h = '';
    for (const [wsId, ws] of Object.entries(workspaces)) {
        const meta = getWorkspaceMeta(wsId);
        h += '<div class="workspace-color-item">';
        h += '<input type="text" class="emoji-input" data-ws-id="' + wsId + '" data-field="emoji" value="' + meta.emoji + '">';
        h += '<label>' + ws.name + '</label>';
        h += '<input type="color" data-ws-id="' + wsId + '" data-field="color" value="' + meta.color + '">';
        h += '</div>';
    }
    container.innerHTML = h;
}

// ── Event Listeners ──
function attachEventListeners() {
    // Nav tabs (initial - will be refreshed dynamically)
    renderNavTabs();

    // Folder toggles & add bookmark button & delete folder (delegated)
    document.addEventListener('click', e => {
        if (e.target.closest('.folder-add-btn')) {
            const btn = e.target.closest('.folder-add-btn');
            const folderId = btn.dataset.folderId;
            if (folderId) openAddBookmarkModal(folderId);
            return;
        }
        if (e.target.closest('.folder-delete-btn')) {
            const btn = e.target.closest('.folder-delete-btn');
            const folderId = btn.dataset.folderId;
            const workspaceId = btn.dataset.workspace;
            const folderPath = btn.dataset.folderPath;
            confirmDeleteFolder(folderId, workspaceId, folderPath);
            return;
        }
        if (e.target.closest('.folder-toggle')) {
            const btn = e.target.closest('.folder-toggle');
            const fid = btn.dataset.folder;
            const cur = btn.dataset.mode;
            const modes = ['list','grid','smart'];
            folderViewModes[fid] = modes[(modes.indexOf(cur) + 1) % 3];
            saveStorage();
            render();
        }
    });

    // New Folder button (workspace view)
    document.getElementById('newFolderBtn').addEventListener('click', async () => {
        if (currentWorkspace === 'all') return;
        const name = prompt(t('newFolderPrompt') || '请输入文件夹名称：');
        if (!name) return;
        const rootId = workspaceRootIds[currentWorkspace];
        if (!rootId) { alert('无法找到当前工作区的根文件夹'); return; }
        try {
            await new Promise((resolve, reject) => {
                chrome.bookmarks.create({ parentId: rootId, title: name.trim() }, resolve);
            });
            await refreshAndRender();
        } catch(e) {
            alert('创建文件夹失败：' + e.message);
        }
    });

    // New Sub-folder button (delegated)
    document.addEventListener('click', e => {
        if (e.target.closest('.folder-add-subfolder-btn')) {
            const btn = e.target.closest('.folder-add-subfolder-btn');
            const folderId = btn.dataset.folderId;
            if (!folderId) return;
            const name = prompt(t('newFolderPrompt') || 'Enter sub-folder name:');
            if (!name) return;
            chrome.bookmarks.create({ parentId: folderId, title: name.trim() }, () => {
                refreshAndRender();
            });
            return;
        }
    });

    // Folder title double-click to edit (delegated)
    document.addEventListener('dblclick', async e => {
        const titleEl = e.target.closest('.folder-title');
        if (!titleEl || titleEl.querySelector('.folder-edit-input')) return;
        const folderId = titleEl.dataset.folderId;
        if (!folderId) return;
        const path = titleEl.dataset.folderPath;
        const parts = path.split('/');
        const lastName = parts[parts.length - 1];

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'folder-edit-input';
        input.value = lastName;
        titleEl.innerHTML = '';
        titleEl.appendChild(input);
        input.focus();
        input.select();

        const finish = async () => {
            const newName = input.value.trim() || lastName;
            if (newName !== lastName) {
                try {
                    await chrome.bookmarks.update(folderId, { title: newName });
                } catch(err) {
                    console.warn('Failed to rename folder:', err);
                }
            }
            await refreshAndRender();
        };

        input.addEventListener('blur', finish);
        input.addEventListener('keydown', ev => {
            if (ev.key === 'Enter') input.blur();
            if (ev.key === 'Escape') { input.value = lastName; input.blur(); }
        });
    });

    // Settings
    document.getElementById('settingsBtn').addEventListener('click', () => {
        renderSettingsWorkspaces();
        // Set icon size radio
        document.querySelectorAll('input[name="iconSize"]').forEach(r => {
            r.checked = r.value === settings.iconSize;
        });
        // Set language select
        document.getElementById('languageSelect').value = settings.language || 'zh-CN';
        document.getElementById('settingsPanel').classList.add('open');
        document.getElementById('overlay').classList.add('open');
    });

    document.getElementById('closeSettings').addEventListener('click', closeSettingsPanel);
    document.getElementById('overlay').addEventListener('click', closeSettingsPanel);

    document.getElementById('bgGradientPreset').addEventListener('change', e => {
        settings.bgGradient = e.target.value;
        applyBackgroundGradient();
    });

    // Appearance buttons
    document.querySelectorAll('.appearance-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            settings.appearance = btn.dataset.appearance;
            applyTheme();
            applyAppearanceUI();
            applyBackgroundGradient();
            render();
            saveStorage();
        });
    });

    // System theme change listener
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (settings.appearance === 'system') {
            applyTheme();
            applyBackgroundGradient();
            render();
        }
    });

    document.getElementById('saveSettings').addEventListener('click', async () => {
        settings.bgGradient = document.getElementById('bgGradientPreset').value;
        settings.clicksPerLevel = parseInt(document.getElementById('clicksPerLevel').value) || 100;
        settings.cardDisplay = document.querySelector('input[name="cardDisplay"]:checked').value;
        settings.tabDisplay = document.querySelector('input[name="tabDisplay"]:checked').value;
        settings.iconSize = document.querySelector('input[name="iconSize"]:checked').value;
        settings.language = document.getElementById('languageSelect').value;

        // Save workspace metadata from settings panel
        document.querySelectorAll('#workspaceColorsList [data-ws-id]').forEach(input => {
            const wsId = input.dataset.wsId;
            const field = input.dataset.field;
            if (!wsMeta[wsId]) wsMeta[wsId] = { emoji: '📁', color: '#6366f1', display: 'both' };
            wsMeta[wsId][field] = input.value;
        });

        await saveStorage();
        applyTheme();
        applyLanguage();
        applyBackgroundGradient();
        renderNavTabs();
        applyTabDisplay();
        render();
        closeSettingsPanel();
    });

    // Import bookmarks
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFileInput').click();
    });

    document.getElementById('importFileInput').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const statusEl = document.getElementById('importStatus');
        statusEl.style.display = 'block';
        statusEl.className = 'import-status';
        statusEl.textContent = 'Reading file...';

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            const result = await importFromBookmarksJSON(data);
            statusEl.className = 'import-status import-success';
            statusEl.textContent = result;
            await refreshAndRender();
            renderNavTabs();
            applyTabDisplay();
            renderSettingsWorkspaces();
        } catch (err) {
            statusEl.className = 'import-status import-error';
            statusEl.textContent = 'Import failed: ' + err.message;
            console.error('Import error:', err);
        }
        // Reset file input so same file can be re-imported
        e.target.value = '';
    });

    // Context menu
    document.addEventListener('contextmenu', e => {
        e.preventDefault();
        const el = e.target.closest('[data-id]');
        if (el) {
            const id = el.dataset.id;
            const info = findBookmarkOrChild(id);
            if (info && info.bookmark) {
                contextMenuBookmark = info;
                const menu = document.getElementById('contextMenu');
                menu.innerHTML = generateContextMenu(info.bookmark, info.isChild);
                menu.style.left = Math.min(e.clientX, window.innerWidth - 220) + 'px';
                menu.style.top = Math.min(e.clientY, window.innerHeight - 200) + 'px';
                menu.classList.add('open');
                if (window.lucide) lucide.createIcons();
            }
        }
    });

    document.addEventListener('click', e => {
        if (!e.target.closest('#contextMenu')) closeContextMenu();
    });

    document.getElementById('contextMenu').addEventListener('click', e => {
        const item = e.target.closest('.context-menu-item');
        if (!item) return;
        const action = item.dataset.action;
        if (action === 'add-child' && contextMenuBookmark && !contextMenuBookmark.isChild) {
            openAddSubBookmarkModal(contextMenuBookmark.bookmark.id);
        } else if (action === 'edit' && contextMenuBookmark) {
            openEditModal(contextMenuBookmark.bookmark.id, contextMenuBookmark.isChild);
        } else if (action === 'refresh-favicon' && contextMenuBookmark) {
            refreshFavicon(contextMenuBookmark.bookmark.id, contextMenuBookmark.isChild);
        } else if (action === 'delete' && contextMenuBookmark) {
            if (contextMenuBookmark.isChild) {
                deleteSubBookmark(contextMenuBookmark.bookmark.id, contextMenuBookmark.parent);
            } else {
                deleteBookmark(contextMenuBookmark.bookmark.id);
            }
        }
        closeContextMenu();
    });

    // Edit modal
    document.getElementById('cancelEdit').addEventListener('click', closeEditModal);
    document.getElementById('saveEdit').addEventListener('click', saveEdit);
    document.getElementById('editIconType').addEventListener('change', updateIconLabel);
    document.getElementById('editModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeEditModal(); });
}

function closeSettingsPanel() {
    document.getElementById('settingsPanel').classList.remove('open');
    document.getElementById('overlay').classList.remove('open');
}

function closeContextMenu() {
    document.getElementById('contextMenu').classList.remove('open');
}

// ── Bookmark Click Handlers ──
function attachBookmarkClickHandlers() {
    document.querySelectorAll('[data-id]').forEach(el => {
        el.addEventListener('click', e => {
            // If it's the outer div (bookmark-list-item with data-url), navigate
            if (el.classList.contains('bookmark-list-item') && el.dataset.url) {
                // Don't interfere if click was on a sub-icon-link or the main <a>
                if (e.target.closest('.bookmark-sub-icon-link') || e.target.closest('.bookmark-list-main')) return;
                window.open(el.dataset.url, '_blank');
            }
            const id = el.dataset.id;
            incrementClicks(id);
            el.classList.add('clicked');
            setTimeout(() => el.classList.remove('clicked'), 150);
        });
    });

    // Sub-bookmark hover dropdown (grid mode only — list mode renders inline)
    document.querySelectorAll('.bookmark-grid-item.has-children').forEach(item => {
        const id = item.dataset.id;
        const info = findBookmarkOrChild(id);
        if (info && info.bookmark && info.bookmark.children && info.bookmark.children.length > 0) {
            item.addEventListener('mouseenter', () => showSubBookmarkDropdown(info.bookmark, item));
            item.addEventListener('mouseleave', () => {
                clearTimeout(window._ddTimer);
                window._ddTimer = setTimeout(() => {
                    const dd = document.getElementById('subBookmarkDropdown');
                    if (!dd.matches(':hover')) dd.classList.remove('open');
                }, 300);
            });
        }
    });
}

function showSubBookmarkDropdown(bm, el) {
    if (!bm || !bm.children || !bm.children.length) return;
    const dd = document.getElementById('subBookmarkDropdown');
    let h = '';
    bm.children.forEach(ch => {
        h += '<a class="sub-bookmark-item" href="' + ch.url + '" target="_blank" data-id="' + ch.id + '">';
        h += '<span class="sub-icon">' + renderBookmarkIcon(ch) + '</span>';
        h += '<span class="sub-title">' + ch.title + '</span></a>';
    });
    dd.innerHTML = h;
    const r = el.getBoundingClientRect();
    dd.style.left = Math.min(r.left, window.innerWidth - 220) + 'px';
    dd.style.top = (r.bottom + 4) + 'px';
    dd.classList.add('open');
    if (window.lucide) lucide.createIcons();
    dd.onmouseenter = () => clearTimeout(window._ddTimer);
    dd.onmouseleave = () => { window._ddTimer = setTimeout(() => dd.classList.remove('open'), 300); };
}

// ── Edit Modal ──
function openEditModal(id, isChild) {
    let bm;
    if (isChild) {
        const sub = findSubBookmark(id);
        if (!sub) return;
        bm = sub.child;
        const parentInfo = findBookmarkInWorkspace(sub.parentId);
        editingBookmark = { bookmark: bm, isChild: true, parent: parentInfo ? parentInfo.bookmark : null };
    } else {
        const info = findBookmarkInWorkspace(id);
        if (!info) return;
        bm = info.bookmark;
        editingBookmark = { bookmark: bm, isChild: false, parent: null };
    }
    document.getElementById('editModalHeader').textContent = isChild ? t('editSubBookmark') : t('editBookmark');
    document.getElementById('editTitle').value = bm.title;
    document.getElementById('editIconType').value = bm.iconType || 'favicon';
    document.getElementById('editIconValue').value = bm.iconValue || '';
    document.getElementById('editUrl').value = bm.url;
    updateIconLabel();
    document.getElementById('editModal').classList.add('open');
}

function updateIconLabel() {
    const type = document.getElementById('editIconType').value;
    const label = document.getElementById('editIconLabel');
    const input = document.getElementById('editIconValue');
    switch (type) {
        case 'favicon': label.textContent = t('favicon') + ' (auto)'; input.style.display = 'none'; break;
        case 'emoji': label.textContent = t('emoji'); input.style.display = 'block'; input.placeholder = 'e.g. 🔥'; break;
        case 'lucide': label.textContent = t('lucideIcons'); input.style.display = 'block'; input.placeholder = 'e.g. star, heart, github'; break;
        case 'icons8': label.textContent = 'Icons8 URL'; input.style.display = 'block'; input.placeholder = 'https://img.icons8.com/...'; break;
        case 'iconfont': label.textContent = 'Iconfont URL'; input.style.display = 'block'; input.placeholder = 'https://at.alicdn.com/...'; break;
    }
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('open');
    editingBookmark = null;
}

async function saveEdit() {
    if (!editingBookmark) return;
    const { bookmark, isChild, parent, folderId } = editingBookmark;

    if (!bookmark && folderId) {
        // Adding new bookmark to folder via chrome.bookmarks API
        const title = document.getElementById('editTitle').value.trim();
        const url = document.getElementById('editUrl').value.trim();
        if (!url) { alert('URL is required'); return; }
        try {
            await chrome.bookmarks.create({
                parentId: folderId,
                title: title || url,
                url: url
            });
        } catch(e) {
            alert('Failed to add bookmark: ' + e.message);
            return;
        }
    } else if (!bookmark) {
        // Adding new sub-bookmark
        const childId = 'sub_' + Date.now();
        const child = {
            id: childId,
            title: document.getElementById('editTitle').value,
            url: document.getElementById('editUrl').value,
            iconType: document.getElementById('editIconType').value,
            iconValue: document.getElementById('editIconValue').value,
            clicks: 0
        };
        if (parent && parent.url && !validateChildDomain(parent.url, child.url)) {
            alert('Sub-bookmark domain must match parent!');
            return;
        }
        const parentId = editingBookmark.parent ? editingBookmark.parent.id : Object.keys(subBookmarks)[0];
        if (!subBookmarks[parentId]) subBookmarks[parentId] = [];
        if (subBookmarks[parentId].length >= 5) { alert('Maximum 5 sub-bookmarks!'); return; }
        subBookmarks[parentId].push(child);
    } else if (isChild) {
        // Edit sub-bookmark
        bookmark.title = document.getElementById('editTitle').value;
        bookmark.iconType = document.getElementById('editIconType').value;
        bookmark.iconValue = document.getElementById('editIconValue').value;
        bookmark.url = document.getElementById('editUrl').value;
        // Persist: find and update in subBookmarks
        const sub = findSubBookmark(bookmark.id);
        if (sub) {
            const idx = subBookmarks[sub.parentId].findIndex(c => c.id === bookmark.id);
            if (idx !== -1) subBookmarks[sub.parentId][idx] = bookmark;
        }
    } else {
        // Edit real bookmark — update via chrome.bookmarks API
        bookmark.title = document.getElementById('editTitle').value;
        bookmark.iconType = document.getElementById('editIconType').value;
        bookmark.iconValue = document.getElementById('editIconValue').value;

        try {
            await chrome.bookmarks.update(bookmark.id, {
                title: document.getElementById('editTitle').value,
                url: document.getElementById('editUrl').value
            });
        } catch(e) {
            console.warn('Failed to update bookmark:', e);
        }
    }

    await saveStorage();
    await refreshAndRender();
    closeEditModal();
}

function openAddSubBookmarkModal(parentId) {
    const info = findBookmarkInWorkspace(parentId);
    if (!info) return;
    editingBookmark = { bookmark: null, isChild: true, parent: info.bookmark, folderId: null };
    document.getElementById('editModalHeader').textContent = t('addSubBookmark');
    document.getElementById('editTitle').value = '';
    document.getElementById('editIconType').value = 'favicon';
    document.getElementById('editIconValue').value = '';
    document.getElementById('editUrl').value = '';
    updateIconLabel();
    document.getElementById('editModal').classList.add('open');
}

function openAddBookmarkModal(folderId) {
    editingBookmark = { bookmark: null, isChild: false, parent: null, folderId: folderId };
    document.getElementById('editModalHeader').textContent = t('addBookmark');
    document.getElementById('editTitle').value = '';
    document.getElementById('editIconType').value = 'favicon';
    document.getElementById('editIconValue').value = '';
    document.getElementById('editUrl').value = '';
    updateIconLabel();
    document.getElementById('editModal').classList.add('open');
}

async function confirmDeleteFolder(folderId, workspaceId, folderPath) {
    // 找到文件夹名称
    let folderName = folderPath.split('/').pop();
    const confirmed = confirm(t('deleteFolderConfirm').replace('{name}', folderName));
    if (confirmed) {
        await deleteFolder(folderId, workspaceId);
    }
}

async function deleteFolder(folderId, workspaceId) {
    try {
        // 获取文件夹信息以找到父文件夹 ID
        const folder = await new Promise(resolve => {
            chrome.bookmarks.get(folderId, result => resolve(result[0]));
        });
        const parentId = folder.parentId;

        // 获取文件夹的所有直接子项
        const children = await new Promise(resolve => {
            chrome.bookmarks.getChildren(folderId, resolve);
        });

        // 将每个子项移动到父文件夹
        for (const child of children) {
            await new Promise((resolve, reject) => {
                chrome.bookmarks.move(child.id, { parentId: parentId }, resolve);
            });
        }

        // 删除空文件夹
        await new Promise(resolve => {
            chrome.bookmarks.removeTree(folderId, resolve);
        });

        // 清理 folderViewModes 中的数据
        const fid = workspaceId + '-' + folderPath;
        delete folderViewModes[fid];

        // 清理 workspaceFolderIds 中的数据（在 refreshWorkspaces 中会重新生成）

        await saveStorage();
        await refreshAndRender();
    } catch(e) {
        console.warn('Failed to delete folder:', e);
        alert('Failed to delete folder: ' + e.message);
    }
}

async function refreshFavicon(id, isChild) {
    const els = document.querySelectorAll('[data-id="' + id + '"]');
    if (!els.length) return;

    els.forEach(function(el) {
        var iconContainer = el.querySelector('.bookmark-list-icon, .bookmark-grid-icon, .frequent-item-icon, .sub-icon');
        if (!iconContainer) return;
        var img = iconContainer.querySelector('img');
        if (!img) return;
        // 正确追加缓存破坏参数，保留原有查询参数
        var sep = img.src.indexOf('?') !== -1 ? '&' : '?';
        img.src = img.src + sep + '_t=' + Date.now();
    });

    // 确保书签数据中 iconType 为 favicon，使重新渲染时保持一致
    if (isChild) {
        var sub = findSubBookmark(id);
        if (sub) {
            sub.child.iconType = 'favicon';
            sub.child.iconValue = '';
            await saveStorage();
        }
    } else {
        var info = findBookmarkInWorkspace(id);
        if (info) {
            info.bookmark.iconType = 'favicon';
            info.bookmark.iconValue = '';
            try { await chrome.bookmarks.update(id, {}); } catch(e) {}
            await saveStorage();
        }
    }
}

async function deleteBookmark(id) {
    try {
        await chrome.bookmarks.remove(id);
        delete clickCounts[id];
        delete subBookmarks[id];
        await saveStorage();
        await refreshAndRender();
    } catch(e) {
        console.warn('Failed to delete bookmark:', e);
    }
}

async function deleteSubBookmark(childId, parent) {
    // Remove from our subBookmarks storage
    for (const [parentId, children] of Object.entries(subBookmarks)) {
        const idx = children.findIndex(c => c.id === childId);
        if (idx !== -1) {
            children.splice(idx, 1);
            break;
        }
    }
    await saveStorage();
    await refreshAndRender();
}

async function incrementClicks(id) {
    clickCounts[id] = (clickCounts[id] || 0) + 1;
    await saveStorage();
    updateStats();
}

// ── Import from Bookmarks JSON ──
async function importFromBookmarksJSON(data) {
    // Navigate to workspaces_v2: data.roots.workspaces_v2.children
    let wsList = null;
    if (data.roots && data.roots.workspaces_v2 && data.roots.workspaces_v2.children) {
        wsList = data.roots.workspaces_v2.children;
    } else if (data.workspaces_v2 && data.workspaces_v2.children) {
        wsList = data.workspaces_v2.children;
    } else if (Array.isArray(data.workspaces_v2)) {
        wsList = data.workspaces_v2;
    }

    if (!wsList || !wsList.length) {
        throw new Error('No workspaces_v2 found in file');
    }

    // Filter to only folder-type workspaces that have children
    const workspacesToImport = wsList.filter(ws => ws.type === 'folder' && ws.children && ws.children.length > 0);

    if (!workspacesToImport.length) {
        throw new Error('No workspaces with bookmarks found');
    }

    let wsCreated = 0;
    let bmCreated = 0;
    let subFoldersCreated = 0;

    // Get bookmarks bar
    const tree = await chrome.bookmarks.getTree();
    const rootNode = tree[0];
    const bar = rootNode.children.find(c => c.id === '1') || rootNode.children[0];

    for (const ws of workspacesToImport) {
        const rawName = ws.name || 'Imported Workspace';
        const emojis = extractEmojis(rawName);
        const cleanName = stripEmojis(rawName) || rawName;

        // Check if a folder with the clean name already exists in the bar
        const existing = bar.children.find(c => (stripEmojis(c.title) || c.title) === cleanName && c.children);
        let wsFolder;

        if (existing) {
            wsFolder = existing;
        } else {
            // Create folder with clean name (no emoji)
            wsFolder = await chrome.bookmarks.create({
                parentId: bar.id,
                title: cleanName
            });
            wsCreated++;
        }

        // Recursively import children
        const count = await importChildren(ws.children, wsFolder.id);
        bmCreated += count.bookmarks;
        subFoldersCreated += count.folders;

        // Set metadata — use extracted emoji if found
        if (!wsMeta[wsFolder.id]) {
            const idx = Object.keys(workspaces).length;
            wsMeta[wsFolder.id] = {
                emoji: emojis.length > 0 ? emojis.join('') : DEFAULT_EMOJIS[idx % DEFAULT_EMOJIS.length],
                color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
                display: 'both'
            };
        }
    }

    await saveStorage();
    return `${workspacesToImport.length} workspaces, ${bmCreated} bookmarks, ${subFoldersCreated} sub-folders imported`;
}

async function importChildren(children, parentId) {
    let bookmarks = 0;
    let folders = 0;

    for (const child of children) {
        if (child.type === 'url' && child.url) {
            try {
                await chrome.bookmarks.create({
                    parentId: parentId,
                    title: child.name || child.url,
                    url: child.url
                });
                bookmarks++;
            } catch (e) {
                console.warn('Skip invalid bookmark:', child.url, e);
            }
        } else if (child.type === 'folder' && child.children && child.children.length > 0) {
            try {
                const subFolder = await chrome.bookmarks.create({
                    parentId: parentId,
                    title: child.name || 'Unnamed Folder'
                });
                folders++;
                const subCount = await importChildren(child.children, subFolder.id);
                bookmarks += subCount.bookmarks;
                folders += subCount.folders;
            } catch (e) {
                console.warn('Skip invalid folder:', child.name, e);
            }
        }
    }

    return { bookmarks, folders };
}

// ── Go ──
init();
