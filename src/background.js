// Naviga Background Service Worker
// 使用 chrome.tabs API 获取已打开标签页的 favicon 数据

// 监听来自 newtab 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getTabFavicons') {
    chrome.tabs.query({}, (tabs) => {
      const faviconMap = {};
      for (const tab of tabs) {
        if (tab.url && tab.favIconUrl) {
          try {
            const domain = new URL(tab.url).origin;
            // 优先保留 https 的 favicon（质量通常更好）
            if (!faviconMap[domain] || tab.favIconUrl.startsWith('https://')) {
              faviconMap[domain] = tab.favIconUrl;
            }
          } catch {
            // 无效 URL 跳过
          }
        }
      }
      sendResponse({ favicons: faviconMap });
    });
    // 返回 true 表示异步发送响应
    return true;
  }

  // 通过 service worker fetch favicon 并转为 dataURL，绕过 CORS
  if (message.type === 'fetchFavicon' && message.url) {
    (async () => {
      try {
        const response = await fetch(message.url);
        if (!response.ok) {
          console.warn('[fetchFavicon] HTTP error:', response.status, message.url);
          sendResponse({ dataUrl: null });
          return;
        }
        const blob = await response.blob();
        // 放宽检查：很多 favicon 返回 application/octet-stream 等非标准类型
        // 只要大小合理（< 100KB）就尝试转换
        const isImage = blob.type.startsWith('image/');
        const isOctetStream = blob.type === 'application/octet-stream';
        const isSmallEnough = blob.size > 0 && blob.size < 100 * 1024;
        if (!isImage && !(isOctetStream && isSmallEnough)) {
          console.warn('[fetchFavicon] Invalid blob:', blob.type, blob.size, message.url);
          sendResponse({ dataUrl: null });
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result;
          // 验证转换结果确实像图片
          if (dataUrl && (dataUrl.startsWith('data:image/') || dataUrl.startsWith('data:application/octet-stream'))) {
            sendResponse({ dataUrl });
          } else {
            console.warn('[fetchFavicon] Invalid dataUrl prefix for:', message.url);
            sendResponse({ dataUrl: null });
          }
        };
        reader.onerror = () => {
          console.warn('[fetchFavicon] FileReader error for:', message.url);
          sendResponse({ dataUrl: null });
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.warn('[fetchFavicon] fetch error:', err?.message || err, message.url);
        sendResponse({ dataUrl: null });
      }
    })();
    return true;
  }
});

// 通知所有 newtab 页面刷新 favicon 数据
function notifyFaviconsUpdate() {
  chrome.runtime.sendMessage({ type: 'tabFaviconsUpdated' }).catch(() => {
    // 没有监听者时忽略错误（newtab 页面未打开）
  });
}

// 标签页更新时通知 newtab 刷新 favicon 数据
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.favIconUrl || changeInfo.status === 'complete') {
    notifyFaviconsUpdate();
  }
});

chrome.tabs.onRemoved.addListener(() => {
  notifyFaviconsUpdate();
});

// Service worker 启动后延迟通知 newtab 刷新
// 解决 newtab 先于 service worker 加载导致 "Receiving end does not exist" 的问题
setTimeout(notifyFaviconsUpdate, 1000);
