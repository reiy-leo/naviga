/**
 * GitHub Gist 同步功能
 * 用于备份和恢复书签数据
 */

// 从 Gist URL 中提取 Gist ID
// 支持格式: https://gist.github.com/username/gistId 或纯 gistId
function extractGistId(urlOrId) {
  if (!urlOrId) return null
  const trimmed = urlOrId.trim()
  // 尝试匹配 URL 格式
  const urlMatch = trimmed.match(/gist\.github\.com\/[^\/]+\/([a-f0-9]+)/i)
  if (urlMatch) return urlMatch[1]
  // 纯 ID 格式 (hex string)
  if (/^[a-f0-9]{20,}$/i.test(trimmed)) return trimmed
  return null
}

// 上传数据到 GitHub Gist
export async function syncToGithub(pat, gistUrlOrId = null) {
  try {
    const state = window.__NAVIGA_STORE?.getState?.() || {}
    
    // 准备同步数据
    const syncData = {
      settings: {
        theme: state.theme,
        background: state.background,
        iconSize: state.iconSize,
        tabDisplay: state.tabDisplay,
        showWorkspaceName: state.showWorkspaceName,
        defaultWorkspace: state.defaultWorkspace,
        language: state.language,
      },
      clickCounts: state.clickCounts || {},
      subBookmarks: state.subBookmarks || {},
      wsMeta: state.wsMeta || {},
      timestamp: Date.now(),
      version: '1.0.0',
    }
    
    const gistId = extractGistId(gistUrlOrId)
    const url = gistId 
      ? `https://api.github.com/gists/${gistId}`
      : 'https://api.github.com/gists'
    
    const method = gistId ? 'PATCH' : 'POST'
    
    const body = gistId 
      ? {
          files: {
            'naviga-backup.json': {
              content: JSON.stringify(syncData, null, 2)
            }
          }
        }
      : {
          description: 'Naviga Bookmarks Backup',
          public: false,
          files: {
            'naviga-backup.json': {
              content: JSON.stringify(syncData, null, 2)
            }
          }
        }
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${pat}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      return { success: false, error: `githubApiError:${response.status}` }
    }
    
    const result = await response.json()
    
    return {
      success: true,
      gistId: result.id,
      gistUrl: result.html_url,
    }
  } catch (error) {
    console.error('GitHub sync failed:', error)
    return {
      success: false,
      error: `networkError:${error.message}`,
    }
  }
}

// 从 GitHub Gist 恢复数据
export async function restoreFromGithub(pat, gistUrlOrId) {
  try {
    const gistId = extractGistId(gistUrlOrId)
    if (!gistId) {
      return { success: false, error: 'invalidGistUrl' }
    }
    
    const url = `https://api.github.com/gists/${gistId}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${pat}`,
      },
    })
    
    if (!response.ok) {
      return { success: false, error: `githubApiError:${response.status}` }
    }
    
    const result = await response.json()
    const content = result.files['naviga-backup.json']?.content
    
    if (!content) {
      return { success: false, error: 'backupNotFound' }
    }
    
    const data = JSON.parse(content)
    
    // 恢复数据到 store
    const store = window.__NAVIGA_STORE?.getState?.()
    if (store) {
      if (data.settings) {
        store.setTheme(data.settings.theme)
        store.setBackground(data.settings.background)
        store.setIconSize(data.settings.iconSize)
        store.setTabDisplay(data.settings.tabDisplay)
        if (store.setShowTabBar) store.setShowTabBar(data.settings.showTabBar)
        store.setShowWorkspaceName(data.settings.showWorkspaceName)
        store.setDefaultWorkspace(data.settings.defaultWorkspace)
        store.setLanguage(data.settings.language)
      }
      if (data.clickCounts) store.setClickCounts(data.clickCounts)
      if (data.subBookmarks) store.setSubBookmarks(data.subBookmarks)
      if (data.wsMeta) store.setWsMeta(data.wsMeta)
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('GitHub restore failed:', error)
    return {
      success: false,
      error: `networkError:${error.message}`,
    }
  }
}
