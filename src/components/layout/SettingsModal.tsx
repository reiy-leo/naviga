import {
  Tabs,
  Modal,
  Label,
  Link,
  Button,
  Select,
  ListBox,
  Input,
  Separator,
  Description,
  Tooltip,
  ColorPicker,
  ColorArea,
  ColorSlider,
  ColorSwatch,
  ColorSwatchPicker,
  Radio,
  RadioGroup,
  toast,
} from '@heroui/react';
import { US, CN, JP } from 'country-flag-icons/react/3x2';
import {
  Upload,
  Download,
  RefreshCw,
  Plus,
  SquareX,
  Link as LinkIcon,
  Sun,
  Moon,
  Laptop,
  Image,
  Cannabis,
  ChevronUp,
  ChevronDown,
  ArrowUpToLine,
  ArrowDownToLine,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { colorToHex, countEmojis, semanticLength } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import {
  Theme,
  IconSize,
  CountryCode,
  NavbarIconSize,
  CardRoundSize,
  UngroupedBookmarkPosition,
  BackgroundColor,
  StartupMode,
  TabDisplay,
  ShadowStyleColor,
  ShadowStyleBorder,
} from '@/types';
import { syncToGitHub, restoreFromGitHub, testGitHubToken } from '@/utils/githubSync';
import { importBookmarksFromFile } from '@/utils/importBookmarks';

const navbarIconSizes: NavbarIconSize[] = ['nbi_sm', 'nbi_base', 'nbi_lg'];

const ungroupedBookmarkPositions: UngroupedBookmarkPosition[] = ['ungroup_top', 'ungroup_bottom'];
const ungroupedBookmarkPositionMap: Record<UngroupedBookmarkPosition, any> = {
  ungroup_top: <ArrowUpToLine className='h-12 w-12' />,
  ungroup_bottom: <ArrowDownToLine className='h-12 w-12' />,
};

const cardRoundSizes: CardRoundSize[] = ['card_small', 'card_large', 'card_full'];
const cardRoundSizeMap: Record<CardRoundSize, any> = {
  card_small: <div className='h-full w-full rounded-lg border border-zinc-100 bg-lime-200 dark:bg-zinc-800'></div>,
  card_large: <div className='h-full w-full rounded-xl border border-zinc-100 bg-lime-200 dark:bg-zinc-800'></div>,
  card_full: <div className='h-full w-full rounded-full border border-zinc-100 bg-lime-200 dark:bg-zinc-800'></div>,
};

const THEMES: Theme[] = ['light', 'dark', 'system'];
const THEMES_ICONS: Record<Theme, any> = {
  light: (
    <Sun
      size={22}
      className='flex-1 text-yellow-400'
    />
  ),
  dark: (
    <Moon
      size={22}
      className='flex-1 text-blue-400'
    />
  ),
  system: (
    <Laptop
      size={22}
      className='flex-1 text-gray-400'
    />
  ),
};

const BACKGROUNDS: BackgroundColor[] = ['default', 'subtle', 'deep', 'blueTint', 'warmTint'];

const backgroundStyles: Record<BackgroundColor, string[]> = {
  default: ['bg-swatch-default', 'bg-swatch-default2'],
  subtle: ['bg-swatch-subtle', 'bg-swatch-subtle2'],
  deep: ['bg-swatch-deep', 'bg-swatch-deep2'],
  blueTint: ['bg-swatch-bluetint', 'bg-swatch-bluetint2'],
  warmTint: ['bg-swatch-warmtint', 'bg-swatch-warmtint2'],
};

const ICON_SIZES: IconSize[] = ['small', 'medium', 'large'];

const ICON_SIZE_ICONS: Record<IconSize, any> = {
  small: (
    <Image
      size={12}
      className='flex-1 rounded text-gray-400'
    />
  ),
  medium: (
    <Image
      size={17}
      className='flex-1 rounded text-gray-400'
    />
  ),
  large: (
    <Image
      size={22}
      className='flex-1 rounded text-gray-400'
    />
  ),
};

const TAB_DISPLAYS: TabDisplay[] = ['iconOnly', 'textOnly', 'both'];

const ON_STARTUPS: StartupMode[] = ['openHomepage', 'openLastWorkspace', 'openSpecificWorkspace'];

const LANGS: CountryCode[] = ['zh', 'en', 'ja'];
const LANG_ICONS: Record<CountryCode, any> = {
  zh: <CN className='text-sm font-bold' />,
  en: <US className='text-sm font-bold' />,
  ja: <JP className='text-sm font-bold' />,
};

const shadowStyleBorders: ShadowStyleBorder[] = ['solid', 'dotted', 'dashed', 'double'];
const shadowStyleColors: ShadowStyleColor[] = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  'slate',
];

interface SettingsModalProps {
  onClose: () => void;
  defaultTab?: string;
}

function SettingsModal({ onClose, defaultTab = 'general' }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [workspaceActiveTab, setWorkspaceActiveTab] = useState('workspaces_general');
  const { t, i18n } = useTranslation();

  const {
    theme,
    setTheme,
    background,
    setBackground,
    iconSize,
    setIconSize,
    tabDisplay,
    setTabDisplay,
    startupMode,
    setStartupMode,
    startupWorkspace,
    setStartupWorkspace,
    language,
    setLanguage,
    workspaces,
    wsMeta,
    updateWsMeta,
    initWorkspaces,
    githubPat,
    setGithubPat,
    githubRepoUrl,
    setGithubRepoUrl,
    defaultWorkspaceEmoji,
    cardRoundSize,
    setCardRoundSize,
    ungroupedBookmarkPosition,
    setUngroupedBookmarkPosition,
    navbarIconSize,
    setNavbarIconSize,
    shadowStyleColor,
    setShadowStyleColor,
    shadowStyleBorder,
    setShadowStyleBorder,
  } = useAppStore();

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as CountryCode);
    i18n.changeLanguage(lang);
  };

  const getNavbarIconSize = (opt: NavbarIconSize) => {
    return opt.replace('nbi_', 'text-');
  };

  const handleTestToken = async () => {
    if (!githubPat) {
      alert(t('testTokenFailed') || '请先填写 Token');
      return;
    }
    try {
      const repo = githubRepoUrl && githubRepoUrl.trim() ? githubRepoUrl.trim() : 'https://github.com/reiy-leo/naviga';
      const result = await testGitHubToken(githubPat, repo);
      if (result.success) {
        alert(t('testTokenSuccess'));
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      const msg = error.message || '';
      let displayMsg = t('testTokenFailed') || 'Token 无效或无法写入仓库';
      if (msg.startsWith('invalidRepoUrl')) displayMsg += ': 无效的仓库 URL';
      else if (msg.startsWith('repoAccessFailed')) displayMsg += ': 无法访问仓库（读权限失败）';
      else if (msg.startsWith('writeFailed')) displayMsg += ': 无法写入仓库（写权限失败）';
      else if (msg.startsWith('unknownError')) displayMsg += ': 未知错误';
      alert(displayMsg + '\n' + msg);
    }
  };

  const handleGitHubSync = async () => {
    if (!githubPat) {
      alert(t('configPatAndGistUrl'));
      return;
    }
    const result = await syncToGitHub(githubPat, githubRepoUrl || null);
    if (result.success) {
      if (result.gistUrl) setGithubRepoUrl(result.gistUrl);
      alert(t('syncSuccess') + result.gistUrl + '\nGist ID: ' + result.gistId);
    } else {
      let errorMsg = result.error || '';
      if (errorMsg.startsWith('githubApiError')) {
        const status = errorMsg.split(':')[1] || 'unknown';
        errorMsg = (t('githubApiError') || 'GitHub API 错误: ') + status;
      } else if (errorMsg.startsWith('networkError')) {
        const msg = errorMsg.split(':').slice(1).join(':') || '';
        errorMsg = (t('networkError') || '网络错误: ') + msg;
      }
      alert(t('syncFailed') + errorMsg);
    }
  };

  const handleGitHubRestore = async () => {
    if (!githubPat || !githubRepoUrl) {
      alert(t('configPatAndGistUrl'));
      return;
    }
    const result = await restoreFromGitHub(githubPat, githubRepoUrl);
    if (result.success) {
      alert(t('restoreSuccess'));
      window.location.reload();
    } else {
      let errorMsg = result.error || '';
      if (errorMsg.startsWith('invalidGistUrl')) errorMsg = t('invalidGistUrl') || '无效的 Gist URL';
      else if (errorMsg.startsWith('backupNotFound')) errorMsg = t('backupNotFound') || '备份文件不存在';
      else if (errorMsg.startsWith('githubApiError')) {
        const status = errorMsg.split(':')[1] || 'unknown';
        errorMsg = t('githubApiError') + status;
      }
      alert(t('restoreFailed') + errorMsg);
    }
  };

  const handleImportFile = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const result = await importBookmarksFromFile(file);
      if (result.success) alert(`成功导入 ${result.count} 个书签`);
      else alert(`导入失败: ${result.error}`);
    };
    input.click();
  };

  const handleExport = () => {
    const state = useAppStore.getState();
    const exportData = {
      settings: {
        theme: state.theme,
        background: state.background,
        iconSize: state.iconSize,
        tabDisplay: state.tabDisplay,
        defaultWorkspace: state.defaultWorkspace,
        language: state.language,
        wsMeta: state.wsMeta,
      },
      clickCounts: state.clickCounts,
      subBookmarks: state.subBookmarks,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'naviga-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (!confirm(t('confirmDeleteWorkspace'))) return;
    try {
      await chrome.bookmarks.removeTree(workspaceId);
      await initWorkspaces();
    } catch (error: any) {
      toast.danger(t('deleteWorkspaceFailed'), {
        description: error.message,
      });
    }
  };

  const handleCreateWorkspace = async () => {
    try {
      // FIXME 新工作区?
      await chrome.bookmarks.create({ parentId: '1', title: `${defaultWorkspaceEmoji} 新工作区` });
      await initWorkspaces();
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  };

  const handleWorkspaceOrderUp = async (workspaceId: string, parentId: string) => {
    const children = await chrome.bookmarks.getChildren(parentId);
    const index = children.findIndex((x: chrome.bookmarks.BookmarkTreeNode) => x.id === workspaceId);
    if (index > 0) {
      try {
        await chrome.bookmarks.move(workspaceId, {
          index: index - 1,
        });
        await initWorkspaces();
      } catch (error: any) {
        toast.danger('移动workspace失败 up', {
          description: error.message,
        });
      }
    } else {
      toast.danger('移动workspace失败 up2', {});
    }
  };

  const handleWorkspaceOrderDown = async (workspaceId: string, parentId: string) => {
    const children = await chrome.bookmarks.getChildren(parentId);
    const index = children.findIndex((x: chrome.bookmarks.BookmarkTreeNode) => x.id === workspaceId);
    if (index < children.length - 1) {
      try {
        await chrome.bookmarks.move(workspaceId, {
          index: index + 2,
        });
        await initWorkspaces();
      } catch (error: any) {
        toast.danger('移动workspace失败 down', {
          description: error.message,
        });
      }
    } else {
      toast.danger('移动workspace失败 down2', {});
    }
  };

  const presets = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <Modal>
      <Modal.Backdrop
        variant='transparent'
        isOpen={!!onClose}
        onOpenChange={(isOpen) => {
          if (!isOpen) onClose?.();
        }}>
        <Modal.Container
          placement='center'
          scroll='inside'>
          <Modal.Dialog className='top-4 h-4/5 min-h-4/5 w-2xl min-w-2xl'>
            <Modal.CloseTrigger onPress={onClose} />
            <Modal.Header className=''>
              <Modal.Heading className='mb-3 font-medium'>{t('settings')}</Modal.Heading>
            </Modal.Header>
            <Modal.Body
              className='px-6 pb-6'
              onScroll={(e) => e.stopPropagation()}>
              <Tabs
                selectedKey={activeTab}
                variant='secondary'
                onSelectionChange={(key) => {
                  setActiveTab(key as string);
                }}>
                <Tabs.ListContainer>
                  <Tabs.List
                    aria-label='Settings tabs'
                    className='*:w-[unset]'>
                    <Tabs.Tab id='general'>
                      {t('general')}
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id='data'>
                      {t('data')}
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id='workspace'>
                      {t('workspace')}
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id='shadows'>
                      {t('shadows')}
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id='about'>
                      {t('about')}
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs.ListContainer>
                <Tabs.Panel id='general'>
                  <div className='mt-4 space-y-6'>
                    {/* Theme */}
                    <div>
                      <Label className='mb-4 block text-sm font-medium text-gray-400'>{t('theme')}</Label>
                      <RadioGroup
                        defaultValue={theme}
                        value={theme}
                        name='theme'
                        orientation='horizontal'
                        onChange={(value) => {
                          setTheme(value as Theme);
                        }}>
                        {THEMES.map((opt) => (
                          <Tooltip delay={0}>
                            <Radio
                              value={opt}
                              className='data-[selected=true]:bg-accent-soft-hover h-12 w-12 rounded-lg'>
                              <Radio.Content className='flex h-full w-full flex-col items-center gap-2 px-2 py-2'>
                                {THEMES_ICONS[opt]}
                              </Radio.Content>
                            </Radio>
                            <Tooltip.Content
                              showArrow
                              placement='bottom'>
                              <Tooltip.Arrow />
                              <p>{t(opt)}</p>
                            </Tooltip.Content>
                          </Tooltip>
                        ))}
                      </RadioGroup>
                    </div>
                    <Separator className='my-4' />

                    {/* Background */}
                    <div>
                      <Label className='mb-4 block text-sm font-medium text-gray-400'>{t('background')}</Label>
                      <RadioGroup
                        defaultValue={background}
                        value={background}
                        name='background'
                        orientation='horizontal'
                        onChange={(value) => {
                          setBackground(value as BackgroundColor);
                        }}>
                        {BACKGROUNDS.map((opt) => (
                          <Radio
                            value={opt}
                            className={`${backgroundStyles[opt][0]} data-[selected=true]:${backgroundStyles[opt][1]} h-12 w-12 rounded-lg border border-zinc-200 dark:border-zinc-700`}>
                            <Radio.Content></Radio.Content>
                          </Radio>
                        ))}
                      </RadioGroup>
                    </div>
                    <Separator className='my-4' />

                    {/* Tab Display */}
                    <div>
                      <Label className='mb-4 block text-sm font-medium text-gray-400'>{t('tabDisplay')}</Label>
                      <RadioGroup
                        defaultValue={tabDisplay}
                        value={tabDisplay}
                        name='tabDisplay'
                        orientation='horizontal'
                        onChange={(value) => {
                          setTabDisplay(value as TabDisplay);
                        }}>
                        {TAB_DISPLAYS.map((opt) => (
                          <Radio value={opt}>
                            <Radio.Control>
                              <Radio.Indicator />
                            </Radio.Control>
                            <Radio.Content>
                              <p>{t(opt)}</p>
                            </Radio.Content>
                          </Radio>
                        ))}
                      </RadioGroup>
                    </div>
                    <Separator className='mb-4' />

                    {/* On Startup */}
                    <div>
                      <Label className='mb-3 block text-sm font-medium text-gray-400'>{t('onStartup')}</Label>
                      <RadioGroup
                        defaultValue={startupMode}
                        value={startupMode}
                        name='startupMode'
                        orientation='horizontal'
                        onChange={(value) => {
                          setStartupMode(value as StartupMode);
                        }}>
                        {ON_STARTUPS.map((opt) => (
                          <Radio value={opt}>
                            <Radio.Control>
                              <Radio.Indicator />
                            </Radio.Control>
                            <Radio.Content>
                              <Label>{t(opt)}</Label>
                            </Radio.Content>
                          </Radio>
                        ))}
                      </RadioGroup>
                      {startupMode === 'openSpecificWorkspace' && (
                        <Select
                          selectionMode='single'
                          isRequired
                          placeholder={t('selectWorkspace')}
                          value={startupWorkspace}
                          defaultValue={startupWorkspace}
                          className='mt-3 w-full'
                          onChange={(value) => setStartupWorkspace(value as string)}>
                          <Select.Trigger>
                            <Select.Value />
                            <Select.Indicator />
                          </Select.Trigger>
                          <Select.Popover>
                            <ListBox>
                              <ListBox.Item id='all'>
                                {t('allFavorites')}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                              {workspaces.map((ws: any) => (
                                <ListBox.Item
                                  key={ws.id}
                                  id={ws.id}
                                  textValue={wsMeta[ws.id]?.text || ws.title}>
                                  {ws.emoji || wsMeta[ws.id]?.emoji} {wsMeta[ws.id]?.text || ws.title}
                                  <ListBox.ItemIndicator />
                                </ListBox.Item>
                              ))}
                            </ListBox>
                          </Select.Popover>
                        </Select>
                      )}
                    </div>
                    <Separator className='mb-4' />

                    {/* Language */}
                    <div>
                      <Label className='mb-3 block text-sm font-medium text-gray-400'>{t('language')}</Label>
                      <RadioGroup
                        defaultValue={language}
                        value={language}
                        name='language'
                        orientation='horizontal'
                        onChange={(value) => {
                          handleLanguageChange(value);
                        }}>
                        {LANGS.map((opt) => (
                          <Tooltip delay={0}>
                            <Radio
                              value={opt}
                              className='data-[selected=true]:bg-accent-soft-hover h-12 w-12 rounded-lg'>
                              <Radio.Content className='flex h-full w-full flex-col items-center gap-2 px-2 py-2'>
                                {LANG_ICONS[opt]}
                              </Radio.Content>
                            </Radio>
                            <Tooltip.Content
                              showArrow
                              placement='top'>
                              <Tooltip.Arrow />
                              <p>{t(opt)}</p>
                            </Tooltip.Content>
                          </Tooltip>
                        ))}
                      </RadioGroup>
                    </div>
                    <Separator className='mb-4' />
                  </div>
                </Tabs.Panel>
                <Tabs.Panel id='data'>
                  <div className='mt-4 space-y-6'>
                    <Tabs variant='secondary'>
                      <Tabs.ListContainer>
                        <Tabs.List className='*:w-[unset]'>
                          <Tabs.Tab id='sync_chrome'>
                            {t('sync_chrome')}
                            <Tabs.Indicator />
                          </Tabs.Tab>
                          <Tabs.Tab id='sync_github'>
                            {t('sync_github')}
                            <Tabs.Indicator />
                          </Tabs.Tab>
                          <Tabs.Tab id='sync_manual'>
                            {t('sync_manual')}
                            <Tabs.Indicator />
                          </Tabs.Tab>
                        </Tabs.List>
                      </Tabs.ListContainer>
                      <Tabs.Panel id='sync_chrome'>
                        <div className='mt-4 space-y-6'>
                          {/* Chrome Sync */}
                          <div>
                            <h3 className='mb-2 text-sm font-medium'>{t('syncFromChrome')}</h3>
                            <Description>{t('syncChromeHint')}</Description>
                            <Button
                              variant='outline'
                              className='mt-2'>
                              {t('syncNow')}
                            </Button>
                          </div>
                        </div>
                      </Tabs.Panel>
                      <Tabs.Panel id='sync_github'>
                        <div className='mt-4 space-y-6'>
                          {/* GitHub Sync */}
                          <div>
                            <h3 className='mb-2 text-sm font-medium'>{t('syncToGitHub')}</h3>
                            <Description>{t('syncHint')}</Description>
                            <div className='flex flex-col gap-3'>
                              <div>
                                <Label>{t('githubToken') || 'Personal Access Token'}</Label>
                                <Input
                                  type='password'
                                  placeholder='ghp_xxxxxxxxxxxx'
                                  value={githubPat}
                                  onChange={(e) => setGithubPat(e.target.value)}
                                />
                              </div>
                              <Description>{t('githubTokenHint')}</Description>
                              <div>
                                <Label>{t('githubRepoUrl')}</Label>
                                <Input
                                  placeholder='https://github.com/reiy-leo/naviga-bookmarks'
                                  value={githubRepoUrl}
                                  onChange={(e) => setGithubRepoUrl(e.target.value)}
                                />
                              </div>
                              <Description>{t('githubRepoUrlHint')}</Description>
                              <div className='flex gap-2'>
                                <Button
                                  variant='outline'
                                  onPress={handleTestToken}
                                  className='flex-1'>
                                  <RefreshCw size={16} />
                                  {t('testToken')}
                                </Button>
                                <Button
                                  variant='outline'
                                  onPress={handleGitHubSync}
                                  className='flex-1'>
                                  <RefreshCw size={16} />
                                  {t('syncNow')}
                                </Button>
                                <Button
                                  variant='outline'
                                  onPress={handleGitHubRestore}
                                  className='flex-1'>
                                  <Download size={16} />
                                  {t('restoreFromGitHub')}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Tabs.Panel>
                      <Tabs.Panel id='sync_manual'>
                        <div className='mt-4 space-y-6'>
                          {/* Import */}
                          <div>
                            <h3 className='mb-2 text-sm font-medium'>{t('importBookmarks')}</h3>
                            <Description>{t('importHint')}</Description>
                            <Button
                              variant='outline'
                              onPress={handleImportFile}>
                              <Upload size={16} />
                              {t('selectFile')}
                            </Button>
                          </div>
                          <Separator />

                          {/* Export */}
                          <div>
                            <h3 className='mb-2 text-sm font-medium'>{t('exportData')}</h3>
                            <p className='mb-3 text-xs text-gray-500'>{t('exportHint')}</p>
                            <Button
                              variant='outline'
                              onPress={handleExport}>
                              <Download size={16} />
                              {t('exportNow')}
                            </Button>
                          </div>
                        </div>
                      </Tabs.Panel>
                    </Tabs>
                  </div>
                </Tabs.Panel>
                {/* MARK workspaces */}
                <Tabs.Panel id='workspace'>
                  <div className='space-y-4 py-3'>
                    <Tabs
                      selectedKey={workspaceActiveTab}
                      variant='secondary'
                      onSelectionChange={(key) => {
                        setWorkspaceActiveTab(key as string);
                      }}>
                      <Tabs.ListContainer>
                        <Tabs.List
                          aria-label='Workspace tabs'
                          className='*:w-[unset]'>
                          <Tabs.Tab id='workspaces_general'>
                            {t('workspaces_general')}
                            <Tabs.Indicator />
                          </Tabs.Tab>
                          <Tabs.Tab id='workspaces_colors'>
                            {t('workspaces_colors')}
                            <Tabs.Indicator />
                          </Tabs.Tab>
                        </Tabs.List>
                      </Tabs.ListContainer>
                      <Tabs.Panel id='workspaces_general'>
                        <div className='mt-4 space-y-6'>
                          {/* Icon Size */}
                          <div>
                            <Label className='mb-4 block text-sm font-medium text-gray-400'>{t('iconSize')}</Label>
                            <RadioGroup
                              defaultValue={iconSize}
                              value={iconSize}
                              name='iconSize'
                              orientation='horizontal'
                              onChange={(value) => {
                                setIconSize(value as IconSize);
                              }}>
                              {ICON_SIZES.map((opt) => (
                                <Radio
                                  value={opt}
                                  className='data-[selected=true]:bg-accent-soft-hover h-16 w-16 rounded-lg'>
                                  <Radio.Content className='flex h-full w-full flex-col items-center gap-2 px-2 py-2'>
                                    {ICON_SIZE_ICONS[opt]}
                                  </Radio.Content>
                                </Radio>
                              ))}
                            </RadioGroup>
                          </div>
                          <Separator className='mb-4' />

                          {/* Icon Rounded corner */}
                          <div>
                            <Label className='mb-3 block text-sm font-medium text-gray-400'>{t('card_corner')}</Label>
                            <RadioGroup
                              defaultValue={cardRoundSize}
                              value={cardRoundSize}
                              name='cardRoundSize'
                              orientation='horizontal'
                              onChange={(value) => {
                                setCardRoundSize(value as CardRoundSize);
                              }}>
                              {cardRoundSizes.map((opt) => (
                                <Radio
                                  value={opt}
                                  className='data-[selected=true]:bg-accent-soft-hover h-12 w-12 rounded-lg'>
                                  <Radio.Content className='flex h-full w-full flex-col items-center gap-2 px-2 py-2'>
                                    <Tooltip
                                      delay={0}
                                      trigger='hover'>
                                      {cardRoundSizeMap[opt]}
                                      <Tooltip.Content
                                        showArrow
                                        placement='top'>
                                        <Tooltip.Arrow />
                                        <p>{t(opt)}</p>
                                      </Tooltip.Content>
                                    </Tooltip>
                                  </Radio.Content>
                                </Radio>
                              ))}
                            </RadioGroup>
                          </div>
                          <Separator className='mb-4' />

                          {/* navbar 标签大小 */}
                          <div>
                            <Label className='mb-3 block text-sm font-medium text-gray-400'>
                              {t('navbar_icon_size')}
                            </Label>
                            <RadioGroup
                              defaultValue={navbarIconSize}
                              value={navbarIconSize}
                              name='navbarIconSize'
                              orientation='horizontal'
                              onChange={(value) => {
                                setNavbarIconSize(value as NavbarIconSize);
                              }}>
                              {navbarIconSizes.map((opt) => (
                                <Radio
                                  value={opt}
                                  className='data-[selected=true]:bg-accent-soft-hover h-12 w-24 rounded-lg'>
                                  <Radio.Content
                                    className={`flex h-full w-full flex-row items-center gap-2 px-2 py-2 ${getNavbarIconSize(opt)} font-medium`}>
                                    <Tooltip
                                      delay={0}
                                      trigger='hover'>
                                      <p className='shrink'>{defaultWorkspaceEmoji}</p>
                                      <p className='flex-1'>{t('workspace')}</p>
                                      <Tooltip.Content
                                        showArrow
                                        placement='top'>
                                        <Tooltip.Arrow />
                                        <p>{t(opt)}</p>
                                      </Tooltip.Content>
                                    </Tooltip>
                                  </Radio.Content>
                                </Radio>
                              ))}
                            </RadioGroup>
                          </div>
                          <Separator className='mb-4' />

                          {/* 未分组 位置 */}
                          <div>
                            <Label className='mb-3 block text-sm font-medium text-gray-400'>{t('ungroup_pos')}</Label>
                            <RadioGroup
                              defaultValue={ungroupedBookmarkPosition}
                              value={ungroupedBookmarkPosition}
                              name='ungroupedBookmarkPosition'
                              orientation='horizontal'
                              onChange={(value) => {
                                setUngroupedBookmarkPosition(value as UngroupedBookmarkPosition);
                              }}>
                              {ungroupedBookmarkPositions.map((opt) => (
                                <Radio
                                  value={opt}
                                  className='data-[selected=true]:bg-accent-soft-hover h-12 w-12 rounded-lg'>
                                  <Radio.Content className='flex h-full w-full flex-col items-center gap-2 px-2 py-2'>
                                    <Tooltip
                                      delay={0}
                                      trigger='hover'>
                                      {ungroupedBookmarkPositionMap[opt]}
                                      <Tooltip.Content
                                        showArrow
                                        placement='top'>
                                        <Tooltip.Arrow />
                                        <p>{t(opt)}</p>
                                      </Tooltip.Content>
                                    </Tooltip>
                                  </Radio.Content>
                                </Radio>
                              ))}
                            </RadioGroup>
                          </div>
                        </div>
                      </Tabs.Panel>
                      <Tabs.Panel id='workspaces_colors'>
                        <div className='mt-4 space-y-6'>
                          {workspaces.map((ws: any) => {
                            const meta = wsMeta[ws.id] || {};
                            return (
                              <div
                                key={ws.id}
                                className='flex flex-row gap-3 rounded-xl border-zinc-100 bg-gray-50/50 py-3 dark:border-zinc-700 dark:bg-zinc-800/50'>
                                <div className='text-md flex h-9 w-12 shrink-0 items-center justify-end rounded-lg'>
                                  {meta.emoji || defaultWorkspaceEmoji}
                                </div>
                                <div className='flex h-10 flex-1 flex-col gap-3'>
                                  <Input
                                    placeholder={t('workspaceName')}
                                    value={meta.text || ws.title}
                                    onChange={(e) => {
                                      const newText = e.target.value;
                                      const currentEmoji = meta.emoji || defaultWorkspaceEmoji;
                                      chrome.bookmarks.update(ws.id, {
                                        title: `${currentEmoji} ${newText}`,
                                      });
                                      updateWsMeta(ws.id, { ...meta, text: newText });
                                    }}
                                    className='h-8 flex-1 rounded-sm border-0 text-sm font-medium'
                                  />
                                  <div className='flex flex-1 items-center gap-3'>
                                    <Input
                                      name='workspace-icon-emojis'
                                      placeholder={defaultWorkspaceEmoji}
                                      value={meta.emoji || ''}
                                      onChange={async (e) => {
                                        const emojis = (e.target as HTMLInputElement).value.trim();
                                        const newText = meta.text || ws.title;
                                        const emojiCount = countEmojis(emojis);
                                        if (emojiCount <= 3 && semanticLength(emojis) === emojiCount) {
                                          updateWsMeta(ws.id, { ...meta, emoji: (e.target as HTMLInputElement).value });
                                          await chrome.bookmarks.update(ws.id, {
                                            title: `${emojis} ${newText}`,
                                          });
                                        } else {
                                          toast(t('workspaceEmojiCountLimit'), {
                                            description: t('workspaceEmojiCountHint'),
                                            variant: 'danger',
                                            indicator: <Cannabis className='text-red-400' />,
                                          });
                                        }
                                      }}
                                      className='flex-1 rounded-sm text-sm'
                                    />
                                    <ColorPicker
                                      defaultValue={colorToHex(meta.color!)}
                                      onChange={(color) => {
                                        updateWsMeta(ws.id, { ...meta, color: color.toString('rgba') });
                                      }}
                                      className='flex-1'>
                                      <ColorPicker.Trigger>
                                        <ColorSwatch
                                          size='sm'
                                          shape='square'
                                          color={colorToHex(meta.color!)}
                                          className='h-8 w-full rounded-sm'
                                        />
                                      </ColorPicker.Trigger>
                                      <ColorPicker.Popover>
                                        <ColorArea
                                          aria-label='Color area'
                                          className='max-w-full'
                                          colorSpace='hsb'
                                          xChannel='saturation'
                                          yChannel='brightness'>
                                          <ColorArea.Thumb />
                                        </ColorArea>
                                        <ColorSlider
                                          aria-label='Hue slider'
                                          channel='hue'
                                          className='gap-1 px-1'
                                          colorSpace='hsb'>
                                          <Label>{t('color_hue')}</Label>
                                          <ColorSlider.Output className='text-muted' />
                                          <ColorSlider.Track>
                                            <ColorSlider.Thumb />
                                          </ColorSlider.Track>
                                        </ColorSlider>
                                        <ColorSlider
                                          aria-label='Alpha slider'
                                          channel='alpha'
                                          className='gap-1 px-1'
                                          colorSpace='hsb'>
                                          <Label>{t('color_alpha')}</Label>
                                          <ColorSlider.Output className='text-muted' />
                                          <ColorSlider.Track>
                                            <ColorSlider.Thumb />
                                          </ColorSlider.Track>
                                        </ColorSlider>
                                        <ColorSwatchPicker
                                          className='justify-center px-1'
                                          size='xs'>
                                          {presets.map((preset) => (
                                            <ColorSwatchPicker.Item
                                              key={preset}
                                              color={preset}>
                                              <ColorSwatchPicker.Swatch />
                                            </ColorSwatchPicker.Item>
                                          ))}
                                        </ColorSwatchPicker>
                                      </ColorPicker.Popover>
                                    </ColorPicker>
                                  </div>
                                </div>
                                <div className='flex flex-col gap-1 py-2'>
                                  <Tooltip delay={300}>
                                    <Button
                                      isIconOnly
                                      size='sm'
                                      variant='ghost'
                                      onPress={() => handleDeleteWorkspace(ws.id)}>
                                      <SquareX
                                        size={16}
                                        className='text-red-200 hover:text-red-500'
                                      />
                                    </Button>
                                    <Tooltip.Content
                                      showArrow
                                      placement='right'>
                                      <Tooltip.Arrow />
                                      <p>{t('deleteWorkspace')}</p>
                                    </Tooltip.Content>
                                  </Tooltip>
                                  <Tooltip delay={300}>
                                    <Button
                                      isIconOnly
                                      size='sm'
                                      variant='ghost'
                                      onPress={() => handleWorkspaceOrderUp(ws.id, '1')}>
                                      <ChevronUp
                                        size={16}
                                        className='text-zinc-200 hover:text-zinc-700'
                                      />
                                    </Button>
                                    <Tooltip.Content
                                      showArrow
                                      placement='right'>
                                      <Tooltip.Arrow />
                                      <p>{t('moveWorkspaceUp')}</p>
                                    </Tooltip.Content>
                                  </Tooltip>
                                  <Tooltip delay={300}>
                                    <Button
                                      isIconOnly
                                      size='sm'
                                      variant='ghost'
                                      onPress={() => handleWorkspaceOrderDown(ws.id, '1')}>
                                      <ChevronDown
                                        size={16}
                                        className='text-zinc-200 hover:text-zinc-700'
                                      />
                                    </Button>
                                    <Tooltip.Content
                                      showArrow
                                      placement='right'>
                                      <Tooltip.Arrow />
                                      <p>{t('moveWorkspaceDown')}</p>
                                    </Tooltip.Content>
                                  </Tooltip>
                                </div>
                              </div>
                            );
                          })}
                          <Button
                            variant='outline'
                            onPress={handleCreateWorkspace}
                            className='w-full border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-500 hover:text-gray-700'>
                            <Plus size={16} />
                            {t('newWorkspace')}
                          </Button>
                        </div>
                      </Tabs.Panel>
                    </Tabs>
                  </div>
                </Tabs.Panel>
                <Tabs.Panel id='shadows'>
                  <div className='mt-4 space-y-6'>
                    {/* shadow bookmark/folder 样式 */}
                    <div>
                      <Label className='mb-3 block text-sm font-medium text-gray-400'>{t('shadowStyle')}</Label>
                      <RadioGroup
                        defaultValue={shadowStyleColor}
                        value={shadowStyleColor}
                        name='shadowStyleColor'
                        orientation='horizontal'
                        onChange={(value) => {
                          setShadowStyleColor(value as ShadowStyleColor);
                        }}>
                        {shadowStyleColors.map((opt) => {
                          const color = `bg-${opt}-500/10 border-${opt}-500/60`;
                          const border = `${shadowStyleBorder === 'double' ? 'border-4' : 'border-2'} border-${shadowStyleBorder}`;
                          return (
                            <Radio
                              value={opt}
                              className={`data-[selected=true]:bg-accent-soft-hover h-12 w-12 place-content-center items-center rounded-lg ${color} ${border}`}>
                              <Radio.Content className='h-10 w-10 rounded-lg'></Radio.Content>
                            </Radio>
                          );
                        })}
                      </RadioGroup>
                      <Separator className='my-4' />
                      <RadioGroup
                        defaultValue={shadowStyleBorder}
                        value={shadowStyleBorder}
                        name='shadowStyleBorder'
                        orientation='horizontal'
                        onChange={(value) => {
                          setShadowStyleBorder(value as ShadowStyleBorder);
                        }}>
                        {shadowStyleBorders.map((opt) => {
                          const border = `${opt === 'double' ? 'border-4' : 'border-2'} border-${opt}`;
                          const color = `bg-${shadowStyleColor}-500/10 border-${shadowStyleColor}-500/60`;
                          return (
                            <Radio
                              value={opt}
                              className={`data-[selected=true]:bg-accent-soft-hover h-12 w-12 place-content-center items-center rounded-lg ${border} ${color}`}>
                              <Radio.Content className='h-10 w-10 rounded-lg'></Radio.Content>
                            </Radio>
                          );
                        })}
                      </RadioGroup>
                    </div>
                  </div>
                </Tabs.Panel>
                <Tabs.Panel id='about'>
                  <div className='py-8 text-center'>
                    <div className='flex flex-col items-center justify-center gap-2'>
                      <img
                        src='/logo.png?v=20260503'
                        alt='Naviga'
                        className='mx-auto mb-4 h-16 w-16 rounded-xl object-contain'
                      />
                    </div>
                    <div className='flex max-w-xs flex-col items-center'>
                      <div className='mb-3 font-medium tracking-wide'>Naviga</div>
                      <div className='mb-8'>{t('version')} 1.0.0</div>
                    </div>
                    <div className='mx-auto flex max-w-xs flex-row gap-3 *:inline-block'>
                      <Link
                        className='flex-1 gap-1'
                        href='https://github.com/reiy-leo/naviga'>
                        {t('github')}
                        <Link.Icon className='size-3'>
                          <LinkIcon />
                        </Link.Icon>
                      </Link>
                      <Link
                        className='flex-1 gap-1'
                        href='https://github.com/reiy-leo/naviga/issues'>
                        {t('reportIssue')}
                        <Link.Icon className='size-3'>
                          <LinkIcon />
                        </Link.Icon>
                      </Link>
                    </div>
                  </div>
                </Tabs.Panel>
              </Tabs>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export default SettingsModal;
