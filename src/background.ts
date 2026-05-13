// Naviga Background Service Worker
// 使用 chrome.tabs API 获取已打开标签页的 favicon 数据
import { FaviconMap } from '@/types';

// 监听来自 newtab 的消息
chrome.runtime.onMessage.addListener(
  (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => {
    if (message.type === 'getTabFavicons') {
      chrome.tabs.query({}, (tabs: chrome.tabs.Tab[]) => {
        const faviconMap: FaviconMap = {};
        for (const tab of tabs) {
          if (tab.url && tab.favIconUrl) {
            try {
              const domain = new URL(tab.url).origin;
              if (!faviconMap[domain]) {
                faviconMap[domain] = tab.favIconUrl;
              }
            } catch {
              console.warn('tab favicon no url or favIconUrl');
              // 无效 URL 跳过
            }
          }
        }
        sendResponse({ favicons: faviconMap });
      });
      return true;
    }

    if (message.type === 'fetchFavicon' && message.url) {
      (async () => {
        try {
          const response = await fetch(message.url);
          if (!response.ok) {
            console.trace('[fetchFavicon] HTTP error:', response.status, message.url);
            sendResponse({ dataUrl: null });
            return;
          }
          const blob = await response.blob();
          const isImage = blob.type.startsWith('image/');
          const isOctetStream = blob.type === 'application/octet-stream';
          const isSmallEnough = blob.size > 0 && blob.size < 900 * 1024;
          if (!isImage && !(isOctetStream && isSmallEnough)) {
            console.trace('[fetchFavicon] Invalid blob:', blob.type, blob.size, message.url);
            sendResponse({ dataUrl: null });
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            if (dataUrl && (dataUrl.startsWith('data:image/') || dataUrl.startsWith('data:application/octet-stream'))) {
              sendResponse({ dataUrl });
            } else {
              console.trace('[fetchFavicon] Invalid dataUrl prefix for:', message.url);
              sendResponse({ dataUrl: null });
            }
          };
          reader.onerror = () => {
            console.trace('[fetchFavicon] FileReader error for:', message.url);
            sendResponse({ dataUrl: null });
          };
          reader.readAsDataURL(blob);
        } catch (err) {
          console.trace('[fetchFavicon] fetch error:', err, message.url);
          sendResponse({ dataUrl: null });
        }
      })();
      return true;
    }
  },
);

// 通知所有 newtab 页面刷新 favicon 数据
function notifyFaviconsUpdate(): void {
  chrome.runtime.sendMessage({ type: 'tabFaviconsUpdated' }).catch(() => {
    // 没有监听者时忽略错误
  });
}

// 标签页更新时通知 newtab 刷新 favicon 数据
chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: chrome.tabs.OnUpdatedInfo, _tab: chrome.tabs.Tab) => {
  if (changeInfo.favIconUrl || changeInfo.status === 'complete') {
    notifyFaviconsUpdate();
  }
});

chrome.tabs.onRemoved.addListener(() => {
  notifyFaviconsUpdate();
});

// Service worker 启动后延迟通知 newtab 刷新
setTimeout(notifyFaviconsUpdate, 1000);
