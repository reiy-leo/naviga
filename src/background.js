// Naviga Background Service Worker
// 使用 chrome.tabs API 获取已打开标签页的 favicon 数据

// 监听来自 newtab 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getTabFavicons') {
    chrome.tabs.query({}, (tabs) => {
      const faviconMap = {}
      for (const tab of tabs) {
        if (tab.url && tab.favIconUrl) {
          try {
            const domain = new URL(tab.url).origin
            // 优先保留 https 的 favicon（质量通常更好）
            if (!faviconMap[domain] || tab.favIconUrl.startsWith('https://')) {
              faviconMap[domain] = tab.favIconUrl
            }
          } catch {
            // 无效 URL 跳过
          }
        }
      }
      sendResponse({ favicons: faviconMap })
    })
    // 返回 true 表示异步发送响应
    return true
  }
})

// 标签页更新时通知 newtab 刷新 favicon 数据
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.favIconUrl || changeInfo.status === 'complete') {
    // 通知所有 newtab 页面
    chrome.runtime.sendMessage({ type: 'tabFaviconsUpdated' }).catch(() => {
      // 没有监听者时忽略错误
    })
  }
})

chrome.tabs.onRemoved.addListener(() => {
  chrome.runtime.sendMessage({ type: 'tabFaviconsUpdated' }).catch(() => {})
})
