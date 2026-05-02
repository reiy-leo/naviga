import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState({})
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef(null)

  const fetchBookmarks = async () => {
    try {
      const tree = await chrome.bookmarks.getTree()
      const bar = tree[0].children.find(n => n.id === '1') // 书签栏

      if (bar && bar.children) {
        const wsBookmarks = {}

        // 遍历所有文件夹（workspace）
        for (const folder of bar.children) {
          if (folder.url === undefined) { // 是文件夹
            try {
              const children = await chrome.bookmarks.getChildren(folder.id)
              // 保留所有子项（包括子文件夹和书签）
              wsBookmarks[folder.id] = children
            } catch (err) {
              console.error(`Failed to get children for folder ${folder.id}:`, err)
              wsBookmarks[folder.id] = []
            }
          }
        }

        setBookmarks(wsBookmarks)
      } else {
        setBookmarks({})
      }

      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error)
      setLoading(false)
    }
  }

  // 防抖版：多个事件快速触发时只执行一次刷新
  const debouncedFetch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchBookmarks()
      debounceRef.current = null
    }, 150)
  }

  useEffect(() => {
    fetchBookmarks()

    // 监听书签变化（防抖）
    if (chrome.bookmarks.onCreated) {
      chrome.bookmarks.onCreated.addListener(debouncedFetch)
      chrome.bookmarks.onRemoved.addListener(debouncedFetch)
      chrome.bookmarks.onChanged.addListener(debouncedFetch)
      chrome.bookmarks.onMoved.addListener(debouncedFetch)
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (chrome.bookmarks.onCreated) {
        chrome.bookmarks.onCreated.removeListener(debouncedFetch)
        chrome.bookmarks.onRemoved.removeListener(debouncedFetch)
        chrome.bookmarks.onChanged.removeListener(debouncedFetch)
        chrome.bookmarks.onMoved.removeListener(debouncedFetch)
      }
    }
  }, [])

  return { bookmarks, loading, refetch: fetchBookmarks }
}
