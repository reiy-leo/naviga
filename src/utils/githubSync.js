/**
 * GitHub 同步功能（使用 Octokit）
 * 用于备份和恢复书签数据
 */

import { Octokit } from '@octokit/core'

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

// 创建 Octokit 实例
function createOctokit(token) {
  return new Octokit({ auth: token })
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
        showTabBar: state.showTabBar,
        defaultWorkspace: state.defaultWorkspace,
        language: state.language,
      },
      clickCounts: state.clickCounts || {},
      subBookmarks: state.subBookmarks || {},
      wsMeta: state.wsMeta || {},
      timestamp: Date.now(),
      version: '1.0.0',
    }

    const octokit = createOctokit(pat)
    const gistId = extractGistId(gistUrlOrId)

    if (gistId) {
      // 更新现有 Gist
      const response = await octokit.request('PATCH /gists/{gist_id}', {
        gist_id: gistId,
        files: {
          'naviga-backup.json': {
            content: JSON.stringify(syncData, null, 2),
          },
        },
      })

      return {
        success: true,
        gistId: response.data.id,
        gistUrl: response.data.html_url,
      }
    } else {
      // 创建新 Gist
      const response = await octokit.request('POST /gists', {
        description: 'Naviga Bookmarks Backup',
        public: false,
        files: {
          'naviga-backup.json': {
            content: JSON.stringify(syncData, null, 2),
          },
        },
      })

      return {
        success: true,
        gistId: response.data.id,
        gistUrl: response.data.html_url,
      }
    }
  } catch (error) {
    console.error('GitHub sync failed:', error)
    const status = error.status || 'unknown'
    return {
      success: false,
      error: `githubApiError:${status}`,
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

    const octokit = createOctokit(pat)

    const response = await octokit.request('GET /gists/{gist_id}', {
      gist_id: gistId,
    })

    const content = response.data.files['naviga-backup.json']?.content

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
    const status = error.status || 'unknown'
    return {
      success: false,
      error: `githubApiError:${status}`,
    }
  }
}

// 测试 GitHub Token 是否有读写权限（创建并删除测试文件）
export async function testGithubToken(pat, repoUrl = 'https://github.com/reiy-leo/naviga') {
  try {
    // 解析 owner/repo
    const match = repoUrl.match(/github\.com\/([^\/?#]+)\/([^\/?#]+)/)
    if (!match) throw new Error('invalidRepoUrl')
    const owner = match[1]
    const repo = match[2]

    const octokit = createOctokit(pat)

    // 1. 验证仓库访问权限（读权限）
    try {
      await octokit.request('GET /repos/{owner}/{repo}', {
        owner,
        repo,
      })
    } catch (err) {
      throw new Error(`repoAccessFailed:${err.status || 'unknown'}`)
    }

    // 2. 创建测试文件（写权限）
    const testFile = `naviga-write-test-${Date.now()}.txt`
    const testContent = 'Naviga write permission test'
    const base64 = btoa(testContent)

    let fileSha = null
    try {
      const createRes = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
        owner,
        repo,
        path: testFile,
        message: 'Naviga: test write permission',
        content: base64,
      })
      fileSha = createRes.data.content?.sha
    } catch (err) {
      throw new Error(`writeFailed:${err.status || 'unknown'}`)
    }

    // 3. 删除测试文件（清理）
    if (fileSha) {
      try {
        await octokit.request('DELETE /repos/{owner}/{repo}/contents/{path}', {
          owner,
          repo,
          path: testFile,
          message: 'Naviga: clean up test file',
          sha: fileSha,
        })
      } catch (err) {
        console.warn('Failed to clean up test file:', err)
      }
    }

    return { success: true }
  } catch (error) {
    console.error('GitHub token test failed:', error)
    return {
      success: false,
      error: error.message || 'unknownError',
    }
  }
}
