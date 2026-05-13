/** GitHub 同步功能（使用 Octokit） 用于备份和恢复书签数据 */

import { Octokit } from '@octokit/core';

interface SyncData {
  settings: {
    theme: string;
    background: string;
    iconSize: string;
    tabDisplay: string;
    showTabBar: boolean;
    defaultWorkspace: string;
    language: string;
  };
  clickCounts: Record<string, number>;
  subBookmarks: Record<string, unknown>;
  wsMeta: Record<string, unknown>;
  timestamp: number;
  version: string;
}

interface GitHubResponse {
  success: boolean;
  gistId?: string;
  gistUrl?: string;
  error?: string;
}

// 从 Gist URL 中提取 Gist ID
function extractGistId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  const urlMatch = trimmed.match(/gist\.github\.com\/[^\/]+\/([a-f0-9]+)/i);
  if (urlMatch) return urlMatch[1];
  if (/^[a-f0-9]{20,}$/i.test(trimmed)) return trimmed;
  return null;
}

// 创建 Octokit 实例
function createOctokit(token: string): Octokit {
  return new Octokit({ auth: token });
}

// 上传数据到 GitHub Gist
export async function syncToGitHub(pat: string, gistUrlOrId: string | null = null): Promise<GitHubResponse> {
  try {
    const state = (window as any).__NAVIGA_STORE?.getState?.() || {};

    const syncData: SyncData = {
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
    };

    const octokit = createOctokit(pat);
    const gistId = extractGistId(gistUrlOrId || '');

    if (gistId) {
      const response = await octokit.request('PATCH /gists/{gist_id}', {
        gist_id: gistId,
        files: {
          'naviga-backup.json': {
            content: JSON.stringify(syncData, null, 2),
          },
        },
      });

      return {
        success: true,
        gistId: (response.data as any).id,
        gistUrl: (response.data as any).html_url,
      };
    } else {
      const response = await octokit.request('POST /gists', {
        description: 'Naviga Bookmarks Backup',
        public: false,
        files: {
          'naviga-backup.json': {
            content: JSON.stringify(syncData, null, 2),
          },
        },
      });

      return {
        success: true,
        gistId: (response.data as any).id,
        gistUrl: (response.data as any).html_url,
      };
    }
  } catch (error: any) {
    console.error('GitHub sync failed:', error);
    const status = error.status || 'unknown';
    return {
      success: false,
      error: `githubApiError:${status}`,
    };
  }
}

// 从 GitHub Gist 恢复数据
export async function restoreFromGitHub(pat: string, gistUrlOrId: string): Promise<GitHubResponse & { data?: any }> {
  try {
    const gistId = extractGistId(gistUrlOrId);
    if (!gistId) {
      return { success: false, error: 'invalidGistUrl' };
    }

    const octokit = createOctokit(pat);
    const response = await octokit.request('GET /gists/{gist_id}', {
      gist_id: gistId,
    });

    const content = (response.data as any).files['naviga-backup.json']?.content;

    if (!content) {
      return { success: false, error: 'backupNotFound' };
    }

    const data = JSON.parse(content);
    const store = (window as any).__NAVIGA_STORE?.getState?.();

    if (store) {
      if (data.settings) {
        store.setTheme(data.settings.theme);
        store.setBackground(data.settings.background);
        store.setIconSize(data.settings.iconSize);
        store.setTabDisplay(data.settings.tabDisplay);
        if (store.setShowTabBar) store.setShowTabBar(data.settings.showTabBar);
        store.setDefaultWorkspace(data.settings.defaultWorkspace);
        store.setLanguage(data.settings.language);
      }
      if (data.clickCounts) store.setClickCounts(data.clickCounts);
      if (data.subBookmarks) store.setSubBookmarks(data.subBookmarks);
      if (data.wsMeta) store.setWsMeta(data.wsMeta);
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('GitHub restore failed:', error);
    const status = error.status || 'unknown';
    return {
      success: false,
      error: `githubApiError:${status}`,
    };
  }
}

// 测试 GitHub Token 是否有读写权限
export async function testGitHubToken(pat: string, repoUrl = 'https://github.com/reiy-leo/naviga'): Promise<{ success: boolean; error?: string }> {
  try {
    const match = repoUrl.match(/github\.com\/([^\/?#]+)\/([^\/?#]+)/);
    if (!match) throw new Error('invalidRepoUrl');
    const owner = match[1];
    const repo = match[2];

    const octokit = createOctokit(pat);

    try {
      await octokit.request('GET /repos/{owner}/{repo}', {
        owner,
        repo,
      });
    } catch (err: any) {
      throw new Error(`repoAccessFailed:${err.status || 'unknown'}`);
    }

    const testFile = `naviga-write-test-${Date.now()}.txt`;
    const testContent = 'Naviga write permission test';
    const base64 = btoa(testContent);

    let fileSha: string | null = null;
    try {
      const createRes = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
        owner,
        repo,
        path: testFile,
        message: 'Naviga: test write permission',
        content: base64,
      });
      fileSha = (createRes.data as any).content?.sha;
    } catch (err: any) {
      throw new Error(`writeFailed:${err.status || 'unknown'}`);
    }

    if (fileSha) {
      try {
        await octokit.request('DELETE /repos/{owner}/{repo}/contents/{path}', {
          owner,
          repo,
          path: testFile,
          message: 'Naviga: clean up test file',
          sha: fileSha,
        });
      } catch (err) {
        console.warn('Failed to clean up test file:', err);
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('GitHub token test failed:', error);
    return {
      success: false,
      error: error.message || 'unknownError',
    };
  }
}
