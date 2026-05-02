import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store/useAppStore'
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody,
  Tabs, 
  Tab,
  Button,
  Select,
  SelectItem,
  Input,
  Switch,
  Chip,
  Divider,
  Tooltip,
} from "@nextui-org/react";
import { X, Github, ExternalLink, Upload, Download, RefreshCw, Plus, Trash2 } from 'lucide-react'
import { importBookmarksFromFile } from '../../utils/importBookmarks'
import { syncToGithub, restoreFromGithub } from '../../utils/githubSync'

const WORKSPACE_COLORS = [
  // 蓝色系
  '#3b82f6', '#2563eb', '#1d4ed8', '#60a5fa',
  // 靛/紫色系
  '#6366f1', '#7c3aed', '#818cf8', '#a78bfa',
  // 红色系
  '#ef4444', '#dc2626', '#f87171', '#fb7185',
  // 橙色系
  '#f97316', '#ea580c', '#fb923c',
  // 黄色系
  '#eab308', '#fbbf24',
  // 绿色系
  '#22c55e', '#16a34a', '#4ade80', '#34d399',
  // 青/蓝绿系
  '#06b6d4', '#14b8a6', '#2dd4bf',
  // 粉/玫红系
  '#ec4899', '#f43f5e', '#f472b6',
  // 灰色系
  '#64748b', '#94a3b8',
]

const THEMES = [
  { key: 'light', label: '浅色' },
  { key: 'dark', label: '深色' },
  { key: 'system', label: '跟随系统' },
]

const BACKGROUNDS = [
  { key: 'default', label: '默认' },
  { key: 'subtle', label: '柔和' },
  { key: 'deep', label: '深邃' },
  { key: 'blueTint', label: '蓝色调' },
  { key: 'warmTint', label: '暖色调' },
]

const ICON_SIZES = [
  { key: 'small', label: '小' },
  { key: 'medium', label: '中' },
  { key: 'large', label: '大' },
]

const TAB_DISPLAYS = [
  { key: 'iconOnly', label: '仅图标' },
  { key: 'textOnly', label: '仅文字' },
  { key: 'both', label: '图标+文字' },
]

function SettingsModal({ onClose, defaultTab = 'general' }) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const { t, i18n } = useTranslation()
  
  const {
    theme, setTheme,
    background, setBackground,
    iconSize, setIconSize,
    tabDisplay, setTabDisplay,
    startupMode, setStartupMode,
    startupWorkspace, setStartupWorkspace,
    language, setLanguage,
    workspaces,
    wsMeta, updateWsMeta, initWorkspaces,
    githubPat, setGithubPat,
    githubGistUrl, setGithubGistUrl,
  } = useAppStore()
  
  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    i18n.changeLanguage(lang)
  }
  
  const handleGithubSync = async () => {
    if (!githubPat) {
      alert('请先配置 Personal Access Token')
      return
    }
    
    const result = await syncToGithub(githubPat, githubGistUrl || null)
    
    if (result.success) {
      // 保存 Gist URL 方便下次同步
      if (result.gistUrl) {
        setGithubGistUrl(result.gistUrl)
      }
      alert(`同步成功！\nGist URL: ${result.gistUrl}\nGist ID: ${result.gistId}`)
    } else {
      alert(`同步失败: ${result.error}`)
    }
  }
  
  const handleGithubRestore = async () => {
    if (!githubPat || !githubGistUrl) {
      alert('请先配置 Personal Access Token 和 Gist URL')
      return
    }
    
    const result = await restoreFromGithub(githubPat, githubGistUrl)
    
    if (result.success) {
      alert('恢复成功！页面将刷新。')
      window.location.reload()
    } else {
      alert(`恢复失败: ${result.error}`)
    }
  }
  
  const handleImportFile = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      
      const result = await importBookmarksFromFile(file)
      
      if (result.success) {
        alert(`成功导入 ${result.count} 个书签`)
      } else {
        alert(`导入失败: ${result.error}`)
      }
    }
    input.click()
  }
  
  const handleExport = () => {
    const state = useAppStore.getState()
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
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'naviga-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }
  
  // 删除工作区
  const handleDeleteWorkspace = async (workspaceId) => {
    if (!confirm(t('confirmDeleteWorkspace') || '确定删除此工作区及其所有内容？')) return
    try {
      await chrome.bookmarks.removeTree(workspaceId)
      // 刷新工作区列表
      await initWorkspaces()
    } catch (error) {
      console.error('Failed to delete workspace:', error)
      alert('删除失败: ' + error.message)
    }
  }
  
  const handleCreateWorkspace = async () => {
    try {
      // 在书签栏下创建新文件夹
      await chrome.bookmarks.create({
        parentId: '1',
        title: '📁 新工作区',
      })
      // 刷新工作区列表
      await initWorkspaces()
    } catch (error) {
      console.error('Failed to create workspace:', error)
    }
  }
  
  return (
    <Modal 
      isOpen 
      onClose={onClose} 
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[80vh]",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex justify-between items-center">
          <span className="text-lg font-semibold">{t('settings') || '设置'}</span>
        </ModalHeader>
        
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={setActiveTab}
          classNames={{
            base: "px-4",
            tabList: "gap-2",
            tab: "px-4 py-2",
            panel: "overflow-y-auto max-h-[calc(80vh-8rem)]",
          }}
        >
          <Tab key="general" title={t('general') || '通用'}>
            <ModalBody className="gap-6 py-4">
              {/* Theme */}
              <div>
                <label className="text-sm font-medium mb-3 block">{t('theme') || '主题'}</label>
                <div className="flex gap-2 flex-wrap">
                  {THEMES.map((opt) => (
                    <Button
                      key={opt.key}
                      variant={theme === opt.key ? "solid" : "bordered"}
                      color={theme === opt.key ? "default" : "default"}
                      onPress={() => setTheme(opt.key)}
                      className="flex-1 min-w-[80px]"
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <Divider />
              
              {/* Background */}
              <div>
                <label className="text-sm font-medium mb-3 block">{t('background') || '背景'}</label>
                <div className="flex gap-2 flex-wrap">
                  {BACKGROUNDS.map((opt) => (
                    <Button
                      key={opt.key}
                      variant={background === opt.key ? "solid" : "bordered"}
                      color={background === opt.key ? "default" : "default"}
                      onPress={() => setBackground(opt.key)}
                      className="flex-1 min-w-[80px]"
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <Divider />
              
              {/* Icon Size */}
              <div>
                <label className="text-sm font-medium mb-3 block">{t('iconSize') || '图标大小'}</label>
                <div className="flex gap-2">
                  {ICON_SIZES.map((opt) => (
                    <Button
                      key={opt.key}
                      variant={iconSize === opt.key ? "solid" : "bordered"}
                      color={iconSize === opt.key ? "default" : "default"}
                      onPress={() => setIconSize(opt.key)}
                      className="flex-1"
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <Divider />
              
              {/* Tab Display */}
              <div>
                <label className="text-sm font-medium mb-3 block">{t('tabDisplay') || '标签显示'}</label>
                <div className="flex gap-2">
                  {TAB_DISPLAYS.map((opt) => (
                    <Button
                      key={opt.key}
                      variant={tabDisplay === opt.key ? "solid" : "bordered"}
                      color={tabDisplay === opt.key ? "default" : "default"}
                      onPress={() => setTabDisplay(opt.key)}
                      className="flex-1"
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <Divider />

              {/* On Startup */}
              <div>
                <label className="text-sm font-medium mb-3 block">{t('onStartup') || '启动时'}</label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    {[
                      { key: 'homepage', label: t('openHomepage') || '打开主页' },
                      { key: 'last', label: t('openLastWorkspace') || '打开上次的工作区' },
                      { key: 'specific', label: t('openSpecificWorkspace') || '打开指定的工作区' },
                    ].map((opt) => (
                      <Button
                        key={opt.key}
                        variant={startupMode === opt.key ? "solid" : "bordered"}
                        color={startupMode === opt.key ? "default" : "default"}
                        onPress={() => setStartupMode(opt.key)}
                        className="flex-1 text-xs"
                        size="sm"
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                  {startupMode === 'specific' && (
                    <Select
                      size="sm"
                      label={t('selectWorkspace') || '选择工作区'}
                      selectedKeys={[startupWorkspace]}
                      onSelectionChange={(keys) => setStartupWorkspace(Array.from(keys)[0])}
                    >
                      <SelectItem key="all">{t('allFavorites') || '收藏'}</SelectItem>
                      {workspaces.map((ws) => (
                        <SelectItem key={ws.id}>
                          {wsMeta[ws.id]?.text || ws.title}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                </div>
              </div>
              
              <Divider />
              
              {/* Language */}
              <div>
                <label className="text-sm font-medium mb-3 block">{t('language') || '语言'}</label>
                <div className="flex gap-2">
                  <Button
                    variant={language === 'zh' ? "solid" : "bordered"}
                    color={language === 'zh' ? "default" : "default"}
                    onPress={() => handleLanguageChange('zh')}
                    className="flex-1"
                  >
                    中文
                  </Button>
                  <Button
                    variant={language === 'en' ? "solid" : "bordered"}
                    color={language === 'en' ? "default" : "default"}
                    onPress={() => handleLanguageChange('en')}
                    className="flex-1"
                  >
                    English
                  </Button>
                  <Button
                    variant={language === 'ja' ? "solid" : "bordered"}
                    color={language === 'ja' ? "default" : "default"}
                    onPress={() => handleLanguageChange('ja')}
                    className="flex-1"
                  >
                    日本語
                  </Button>
                </div>
              </div>
            </ModalBody>
          </Tab>
          
          <Tab key="data" title={t('data') || '数据'}>
            <ModalBody className="gap-6 py-4">
              {/* Import */}
              <div>
                <h3 className="text-sm font-medium mb-2">{t('importBookmarks') || '导入书签'}</h3>
                <p className="text-xs text-default-500 mb-3">{t('importHint') || '从浏览器导出的书签文件导入'}</p>
                <Button
                  variant="bordered"
                  onPress={handleImportFile}
                  startContent={<Upload size={16} />}
                >
                  {t('selectFile') || '选择文件'}
                </Button>
              </div>
              
              <Divider />
              
              {/* GitHub Sync */}
              <div>
                <h3 className="text-sm font-medium mb-2">{t('syncToGithub') || '同步到 GitHub'}</h3>
                <p className="text-xs text-default-500 mb-3">{t('syncHint') || '将数据同步到 GitHub Gist'}</p>
                <div className="flex flex-col gap-3">
                  <Input
                    type="password"
                    label="Personal Access Token"
                    placeholder="ghp_xxxxxxxxxxxx"
                    value={githubPat}
                    onValueChange={setGithubPat}
                  />
                  <Input
                    label="Gist URL"
                    placeholder="https://gist.github.com/username/gistId"
                    value={githubGistUrl}
                    onValueChange={setGithubGistUrl}
                  />
                  <div className="flex gap-2">
                    <Button
                      color="primary"
                      onPress={handleGithubSync}
                      startContent={<RefreshCw size={16} />}
                      className="flex-1"
                    >
                      {t('syncNow') || '立即同步'}
                    </Button>
                    <Button
                      variant="bordered"
                      onPress={handleGithubRestore}
                      startContent={<Download size={16} />}
                      className="flex-1"
                    >
                      {t('restoreFromGithub') || '从GitHub恢复'}
                    </Button>
                  </div>
                </div>
              </div>
              
              <Divider />
              
              {/* Export */}
              <div>
                <h3 className="text-sm font-medium mb-2">{t('exportData') || '导出数据'}</h3>
                <p className="text-xs text-default-500 mb-3">{t('exportHint') || '导出所有数据到本地文件'}</p>
                <Button
                  variant="bordered"
                  onPress={handleExport}
                  startContent={<Download size={16} />}
                >
                  {t('exportNow') || '立即导出'}
                </Button>
              </div>
            </ModalBody>
          </Tab>
          
          <Tab key="workspace" title={t('workspace') || '工作区'}>
            <ModalBody className="gap-4 py-4">
              {workspaces.map((ws) => {
                const meta = wsMeta[ws.id] || {}
                return (
                  <div key={ws.id} className="p-3 rounded-xl bg-default-50 dark:bg-default-100/50 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 flex items-center justify-center text-xl bg-default-100 rounded-lg shrink-0">
                        {meta.emoji || '📁'}
                      </div>
                      <Input
                        size="sm"
                        placeholder={t('workspaceName') || '工作区名称'}
                        value={meta.text || ws.title}
                        onValueChange={(newText) => {
                          const currentEmoji = meta.emoji || '📁'
                          // 同步更新 chrome.bookmarks 标题
                          chrome.bookmarks.update(ws.id, { title: `${currentEmoji} ${newText}` })
                          updateWsMeta(ws.id, { ...meta, text: newText })
                        }}
                        className="flex-1"
                      />
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => handleDeleteWorkspace(ws.id)}
                        title={t('deleteWorkspace') || '删除工作区'}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3 pl-12">
                      <Input
                        size="sm"
                        placeholder="📁"
                        value={meta.emoji || ''}
                        onValueChange={(emoji) => {
                          const newText = meta.text || ws.title
                          updateWsMeta(ws.id, { ...meta, emoji })
                          // 同步更新 chrome.bookmarks 标题，确保刷新后不丢失
                          if (emoji) {
                            chrome.bookmarks.update(ws.id, { title: `${emoji} ${newText}` })
                          }
                        }}
                        className="w-20 shrink-0"
                      />
                      <div className="flex gap-1.5 flex-wrap">
                        {WORKSPACE_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => updateWsMeta(ws.id, { ...meta, color })}
                            className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                              meta.color === color
                                ? 'ring-2 ring-offset-1 ring-default-foreground'
                                : ''
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
              {/* 新建工作区 */}
              <Button
                variant="dashed"
                onPress={handleCreateWorkspace}
                startContent={<Plus size={16} />}
                className="w-full border-dashed border-2 border-default-300 text-default-500 hover:border-default-500 hover:text-default-700"
              >
                {t('newWorkspace') || '新建工作区'}
              </Button>
            </ModalBody>
          </Tab>
          
          <Tab key="about" title={t('about') || '关于'}>
            <ModalBody className="py-8">
              <div className="text-center">
                <div className="text-5xl font-bold mb-3">Naviga</div>
                <div className="text-default-500 mb-8">{t('version') || '版本'} 1.0.0</div>
                
                <div className="flex flex-col gap-3 max-w-xs mx-auto">
                  <Button
                    variant="bordered"
                    startContent={<Github size={18} />}
                    endContent={<ExternalLink size={14} />}
                    as="a"
                    href="https://github.com"
                    target="_blank"
                  >
                    {t('github') || 'GitHub'}
                  </Button>
                  <Button
                    variant="bordered"
                    startContent={<ExternalLink size={18} />}
                    as="a"
                    href="https://github.com/issues"
                    target="_blank"
                  >
                    {t('reportIssue') || '报告问题'}
                  </Button>
                </div>
                
                <div className="mt-8 text-sm text-default-400">
                  {t('author') || '作者'}: Naviga Team
                </div>
              </div>
            </ModalBody>
          </Tab>
        </Tabs>
      </ModalContent>
    </Modal>
  )
}

export default SettingsModal
