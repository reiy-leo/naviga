import { useEffect, useState, useRef } from 'react';

interface BookmarkHookResult {
  bookmarks: Record<string, chrome.bookmarks.BookmarkTreeNode[]>;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useBookmarks(): BookmarkHookResult {
  const [bookmarks, setBookmarks] = useState<Record<string, chrome.bookmarks.BookmarkTreeNode[]>>({});
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchBookmarks = async () => {
    try {
      const tree = await chrome.bookmarks.getTree();
      const bar = tree[0].children?.find((n) => n.id === '1');

      if (bar && bar.children) {
        const wsBookmarks: Record<string, chrome.bookmarks.BookmarkTreeNode[]> = {};

        for (const folder of bar.children) {
          if (folder.url === undefined) {
            try {
              const children = await chrome.bookmarks.getChildren(folder.id);
              wsBookmarks[folder.id] = children;
            } catch (err) {
              console.error(`Failed to get children for folder ${folder.id}:`, err);
              wsBookmarks[folder.id] = [];
            }
          }
        }

        setBookmarks(wsBookmarks);
      } else {
        setBookmarks({});
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
      setLoading(false);
    }
  };

  const debouncedFetch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchBookmarks();
      debounceRef.current = null;
    }, 150);
  };

  useEffect(() => {
    fetchBookmarks();

    if (chrome.bookmarks.onCreated) {
      chrome.bookmarks.onCreated.addListener(debouncedFetch);
      chrome.bookmarks.onRemoved.addListener(debouncedFetch);
      chrome.bookmarks.onChanged.addListener(debouncedFetch);
      chrome.bookmarks.onMoved.addListener(debouncedFetch);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (chrome.bookmarks.onCreated) {
        chrome.bookmarks.onCreated.removeListener(debouncedFetch);
        chrome.bookmarks.onRemoved.removeListener(debouncedFetch);
        chrome.bookmarks.onChanged.removeListener(debouncedFetch);
        chrome.bookmarks.onMoved.removeListener(debouncedFetch);
      }
    };
  }, []);

  return { bookmarks, loading, refetch: fetchBookmarks };
}
