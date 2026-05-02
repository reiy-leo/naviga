import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store/useAppStore'
import { useBookmarks } from '../../hooks/useBookmarks'
import BookmarkCard from '../bookmark/BookmarkCard'
import { Button, Tooltip } from "@nextui-org/react";
import { LayoutList, LayoutGrid, Sparkles, Folder, FolderOpen, FolderPlus, FolderMinus, FolderX, Pencil, BookmarkPlus } from 'lucide-react'

// hex 颜色转 rgba
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * 递归展平书签树，为每个书签记录完整文件夹路径
 * 返回: groups (Map<pathString, [bookmarks]>) + directBookmarks
 * 同时返回 folderIdMap (pathString → folderId) 用于跨文件夹移动
 */
function flattenBookmarks(items, parentPath = [], parentFolderIds = []) {
  const groups = new Map()
  const directBookmarks = []
  const folderIdMap = new Map() // pathString → folderId (最深层的子文件夹 ID)

  for (const item of items) {
    if (item.url) {
      if (parentPath.length > 0) {
        const pathKey = parentPath.join(' / ')
        if (!groups.has(pathKey)) groups.set(pathKey, [])
        groups.get(pathKey).push({ ...item, parentId: parentFolderIds[parentFolderIds.length - 1] })
        // 记录路径到文件夹 ID 的映射
        folderIdMap.set(pathKey, parentFolderIds[parentFolderIds.length - 1])
      } else {
        directBookmarks.push({ ...item, parentId: parentFolderIds[parentFolderIds.length - 1] || item.parentId })
      }
    } else if (item.children !== undefined) {
      // 这是一个子文件夹
      const subPath = [...parentPath, item.title]
      const subFolderIds = [...parentFolderIds, item.id]
      // 记录此文件夹的路径和 ID
      folderIdMap.set(subPath.join(' / '), item.id)
      const sub = flattenBookmarks(item.children, subPath, subFolderIds)
      for (const [path, bookmarks] of sub.groups) {
        if (!groups.has(path)) groups.set(path, [])
        groups.get(path).push(...bookmarks)
      }
      directBookmarks.push(...sub.directBookmarks)
      // 合并 folderIdMap
      for (const [k, v] of sub.folderIdMap) {
        folderIdMap.set(k, v)
      }
      // 空文件夹也要显示：如果此文件夹在 groups 中不存在（没有子书签），则添加空数组
      const subPathKey = subPath.join(' / ')
      if (!groups.has(subPathKey)) {
        groups.set(subPathKey, [])
      }
    }
  }

  return { groups, directBookmarks, folderIdMap }
}

/**
 * 文件夹标题右键菜单
 */
function FolderContextMenu({ x, y, folderId, folderTitle, workspaceId, onClose, onRefresh }) {
  const { t } = useTranslation()
  const menuRef = useRef(null)

  const menuWidth = 180
  const menuHeight = 220
  let adjustedX = x
  let adjustedY = y
  if (adjustedX + menuWidth > window.innerWidth) adjustedX = window.innerWidth - menuWidth - 8
  if (adjustedY + menuHeight > window.innerHeight) adjustedY = window.innerHeight - menuHeight - 8

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return
      onClose()
    }
    const handleContextMenu = (e) => { e.preventDefault(); onClose() }
    const handleScroll = () => onClose()
    const timer = setTimeout(() => {
      window.addEventListener('click', handleClick)
      window.addEventListener('contextmenu', handleContextMenu)
      window.addEventListener('scroll', handleScroll, true)
    }, 0)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('click', handleClick)
      window.removeEventListener('contextmenu', handleContextMenu)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [onClose])

  // 重命名（触发双击编辑）
  const handleRename = () => {
    onClose()
    // 通过 CustomEvent 通知 FolderGroup 进入编辑模式
    window.dispatchEvent(new CustomEvent('folder-rename', { detail: { folderId } }))
  }

  // 新建子文件夹
  const handleNewSubFolder = async () => {
    onClose()
    try {
      await chrome.bookmarks.create({
        parentId: folderId,
        title: t('newFolder') || '新建文件夹',
      })
      onRefresh?.()
    } catch (err) {
      console.error('Failed to create sub folder:', err)
    }
  }

  // 解散文件夹：将子项移到父文件夹（workspaceId），然后删除空文件夹
  const handleDissolve = async () => {
    onClose()
    try {
      const folder = await chrome.bookmarks.get(folderId)
      const parentId = folder[0]?.parentId || workspaceId
      const children = await chrome.bookmarks.getChildren(folderId)
      // 将所有子项移到父文件夹
      for (const child of children) {
        await chrome.bookmarks.move(child.id, { parentId })
      }
      // 删除空文件夹
      await chrome.bookmarks.remove(folderId)
      onRefresh?.()
    } catch (err) {
      console.error('Failed to dissolve folder:', err)
    }
  }

  // 删除文件夹：递归删除文件夹及其所有子项
  const handleDelete = async () => {
    onClose()
    if (!confirm(t('confirmDeleteFolder') || '确定删除此文件夹及其所有内容？')) return
    try {
      await chrome.bookmarks.removeTree(folderId)
      onRefresh?.()
    } catch (err) {
      console.error('Failed to delete folder:', err)
    }
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[180px] bg-content1 border border-default-200 rounded-xl shadow-lg py-1 animate-slide-down"
      style={{ left: adjustedX, top: adjustedY }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-default-100 transition-colors"
        onClick={handleRename}
      >
        <Pencil size={16} className="text-default-400" />
        {t('rename') || '重命名'}
      </button>
      <button
        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-default-100 transition-colors"
        onClick={handleNewSubFolder}
      >
        <FolderPlus size={16} className="text-default-400" />
        {t('newSubFolder') || '新建子文件夹'}
      </button>
      <div className="my-1 border-t border-default-200" />
      <button
        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-default-100 transition-colors"
        onClick={handleDissolve}
      >
        <FolderMinus size={16} className="text-warning-500" />
        {t('dissolveFolder') || '解散文件夹'}
      </button>
      <button
        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-danger-50 text-danger-500 transition-colors"
        onClick={handleDelete}
      >
        <FolderX size={16} />
        {t('deleteFolder') || '删除文件夹'}
      </button>
    </div>
  )
}

/**
 * 单个文件夹组的视图模式切换 + 书签渲染（支持拖拽排序和跨组拖拽）
 */
function FolderGroup({ path, bookmarks, clickCounts, workspaceId, folderId, allFolderIds, onRefresh, workspaceColor }) {
  const { t } = useTranslation()
  const { folderViewModes, setFolderViewMode, getFolderViewMode, iconSize } = useAppStore()
  const viewMode = getFolderViewMode(path)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const containerRef = useRef(null)

  // 双击编辑状态
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const editInputRef = useRef(null)

  // 右键菜单
  const [menuPos, setMenuPos] = useState(null)

  // 从 path 中提取当前文件夹名（取最后一段）
  const folderName = path.includes(' / ') ? path.split(' / ').pop() : path

  const handleViewModeChange = (mode) => {
    setFolderViewMode(path, mode)
  }

  // 新建子文件夹 — 弹出 inline 输入
  const [newSubInput, setNewSubInput] = useState(false)
  const [newSubValue, setNewSubValue] = useState('')
  const newSubInputRef = useRef(null)

  const handleNewSubFolderClick = () => {
    setNewSubValue('')
    setNewSubInput(true)
  }

  useEffect(() => {
    if (newSubInput && newSubInputRef.current) {
      newSubInputRef.current.focus()
    }
  }, [newSubInput])

  const handleNewSubConfirm = async () => {
    const trimmed = newSubValue.trim()
    if (trimmed) {
      try {
        await chrome.bookmarks.create({ parentId: folderId, title: trimmed })
        onRefresh?.()
      } catch (err) {
        console.error('Failed to create sub folder:', err)
      }
    }
    setNewSubInput(false)
    setNewSubValue('')
  }

  const handleNewSubKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleNewSubConfirm()
    } else if (e.key === 'Escape') {
      setNewSubInput(false)
      setNewSubValue('')
    }
  }

  // 解散文件夹：将子项移到父文件夹（workspaceId），然后删除空文件夹
  const handleDissolve = async () => {
    try {
      const folder = await chrome.bookmarks.get(folderId)
      const parentId = folder[0]?.parentId || workspaceId
      const children = await chrome.bookmarks.getChildren(folderId)
      // 将所有子项移到父文件夹
      for (const child of children) {
        await chrome.bookmarks.move(child.id, { parentId })
      }
      // 删除空文件夹
      await chrome.bookmarks.remove(folderId)
      onRefresh?.()
    } catch (err) {
      console.error('Failed to dissolve folder:', err)
    }
  }

  // 双击进入编辑
  const handleDoubleClick = () => {
    setEditValue(folderName)
    setEditing(true)
  }

  // 编辑确认
  const handleEditConfirm = async () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== folderName && folderId) {
      try {
        await chrome.bookmarks.update(folderId, { title: trimmed })
      } catch (err) {
        console.error('Failed to rename folder:', err)
      }
    }
    setEditing(false)
  }

  // 编辑取消
  const handleEditCancel = () => {
    setEditing(false)
  }

  // 编辑输入键盘事件
  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleEditConfirm()
    } else if (e.key === 'Escape') {
      handleEditCancel()
    }
  }

  // 自动聚焦编辑输入框
  useEffect(() => {
    if (editing && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editing])

  // 监听 folder-rename 事件
  useEffect(() => {
    const handleRename = (e) => {
      if (e.detail?.folderId === folderId) {
        setEditValue(folderName)
        setEditing(true)
      }
    }
    window.addEventListener('folder-rename', handleRename)
    return () => window.removeEventListener('folder-rename', handleRename)
  }, [folderId, folderName])

  // 右键菜单
  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setMenuPos({ x: e.clientX, y: e.clientY })
  }, [])

  const closeMenu = useCallback(() => setMenuPos(null), [])

  // 根据 iconSize 计算网格列宽
  const gridColWidth = iconSize === 'small' ? '90px' : iconSize === 'large' ? '148px' : '116px'

  // 智能视图：按点击量排序
  const sortedBookmarks = useMemo(() => {
    if (viewMode !== 'smart') return bookmarks
    return [...bookmarks].sort((a, b) => {
      const countA = clickCounts[a.id] || 0
      const countB = clickCounts[b.id] || 0
      return countB - countA
    })
  }, [bookmarks, viewMode, clickCounts])

  // ── 拖拽排序处理 ──
  const handleDragStart = (e, bookmark) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/bookmark', JSON.stringify({
      id: bookmark.id,
      parentId: bookmark.parentId,
      title: bookmark.title,
      url: bookmark.url,
      sourceFolderId: folderId,
      sourcePath: path,
    }))
  }

  const handleDragEnd = () => {
    setDragOverIndex(null)
    setIsDragOver(false)
  }

  // 文件夹组本身作为放置目标（跨文件夹拖拽）
  const handleGroupDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleGroupDragLeave = (e) => {
    // 只在真正离开容器时设置
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget)) {
      setIsDragOver(false)
      setDragOverIndex(null)
    }
  }

  const handleGroupDrop = async (e) => {
    e.preventDefault()
    setIsDragOver(false)
    setDragOverIndex(null)

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/bookmark'))
      if (!data || !data.id) return

      // 同一文件夹内的排序
      if (data.sourceFolderId === folderId) {
        // 计算放置位置的目标 index
        const targetIndex = dragOverIndex !== null ? dragOverIndex : bookmarks.length - 1
        const currentIndex = bookmarks.findIndex(b => b.id === data.id)
        if (currentIndex === targetIndex) return

        // chrome.bookmarks.move 需要目标 parentId 和 index
        await chrome.bookmarks.move(data.id, {
          parentId: folderId,
          index: targetIndex > currentIndex ? targetIndex + 1 : targetIndex,
        })
      } else {
        // 跨文件夹移动
        await chrome.bookmarks.move(data.id, {
          parentId: folderId,
          index: bookmarks.length, // 放到末尾
        })
      }
    } catch (err) {
      console.error('Failed to move bookmark:', err)
    }
  }

  // 书签项之间的排序指示
  const handleItemDragOver = (e, index) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverIndex(index)
  }

  return (
    <div
      ref={containerRef}
      className={`mb-6 rounded-xl transition-colors ${isDragOver ? 'bg-primary-500/5 ring-1 ring-primary-500/20' : ''}`}
      onDragOver={handleGroupDragOver}
      onDragLeave={handleGroupDragLeave}
      onDrop={handleGroupDrop}
    >
      {/* 路径标题 + 视图切换 */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <Folder size={16} className="text-default-400 flex-shrink-0" />
        {editing ? (
          <input
            ref={editInputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditConfirm}
            onKeyDown={handleEditKeyDown}
            className="w-40 text-sm font-medium bg-default-100 text-foreground px-2 py-0.5 rounded-md outline-none focus:ring-1 focus:ring-primary-500"
          />
        ) : (
          <span
            className="text-sm font-medium text-default-500 truncate cursor-default flex-1 min-w-0"
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
          >
            {path}
          </span>
        )}
        <span className="text-xs text-default-400 flex-shrink-0">
          {bookmarks.length}
        </span>
        {/* 右侧：文件夹操作 + 视图切换 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Tooltip content={t('newSubFolder') || '新建子文件夹'}>
            <button
              onClick={handleNewSubFolderClick}
              className="p-1 rounded-md text-default-400 hover:text-primary-500 hover:bg-default-100 transition-colors"
            >
              <FolderPlus size={13} />
            </button>
          </Tooltip>
          <Tooltip content={t('dissolveFolder') || '解散文件夹'}>
            <button
              onClick={handleDissolve}
              className="p-1 rounded-md text-default-400 hover:text-warning-500 hover:bg-warning-50 transition-colors"
            >
              <FolderMinus size={13} />
            </button>
          </Tooltip>
          <Tooltip content={t('deleteFolder') || '删除文件夹'}>
            <button
              onClick={async () => {
                if (!confirm(t('confirmDeleteFolder') || '确定删除此文件夹及其所有内容？')) return
                try {
                  await chrome.bookmarks.removeTree(folderId)
                  onRefresh?.()
                } catch (err) {
                  console.error('Failed to delete folder:', err)
                }
              }}
              className="p-1 rounded-md text-default-400 hover:text-danger-500 hover:bg-danger-50 transition-colors"
            >
              <FolderX size={13} />
            </button>
          </Tooltip>
          <div className="w-px h-3 bg-default-200 mx-0.5" />
          <div className="flex gap-0.5 bg-default-100/50 p-0.5 rounded-lg">
            <Tooltip content="列表">
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-1 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-500 text-white'
                    : 'text-default-400 hover:text-default-600'
                }`}
              >
                <LayoutList size={14} />
              </button>
            </Tooltip>
            <Tooltip content="网格">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`p-1 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary-500 text-white'
                    : 'text-default-400 hover:text-default-600'
                }`}
              >
                <LayoutGrid size={14} />
              </button>
            </Tooltip>
            <Tooltip content="智能排序">
              <button
                onClick={() => handleViewModeChange('smart')}
                className={`p-1 rounded-md transition-colors ${
                  viewMode === 'smart'
                    ? 'bg-primary-500 text-white'
                    : 'text-default-400 hover:text-default-600'
                }`}
              >
                <Sparkles size={14} />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* 新建子文件夹输入框 */}
      {newSubInput && (
        <div className="flex items-center gap-2 mb-3 px-1 pl-7">
          <FolderPlus size={14} className="text-primary-500 flex-shrink-0" />
          <input
            ref={newSubInputRef}
            type="text"
            value={newSubValue}
            onChange={(e) => setNewSubValue(e.target.value)}
            onBlur={handleNewSubConfirm}
            onKeyDown={handleNewSubKeyDown}
            placeholder={t('newSubFolder') || '新建子文件夹'}
            className="w-48 text-sm bg-default-100 text-foreground px-2 py-1 rounded-md outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-default-300"
          />
        </div>
      )}

      {/* 书签列表 */}
      {viewMode === 'list' ? (
        <div className="flex flex-col gap-2 relative">
          {sortedBookmarks.map((bookmark, index) => (
            <div
              key={bookmark.id}
              className="relative"
              onDragOver={(e) => handleItemDragOver(e, index)}
            >
              {/* 拖拽指示线 */}
              {dragOverIndex === index && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full z-10 -translate-y-1" />
              )}
              <BookmarkCard
                bookmark={bookmark}
                viewMode="list"
                workspaceColor={workspaceColor}
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            </div>
          ))}
          {/* 末尾指示线 */}
          {dragOverIndex === sortedBookmarks.length && (
            <div className="h-0.5 bg-primary-500 rounded-full" />
          )}
        </div>
      ) : (
            <div className="grid gap-3 relative" style={{ gridTemplateColumns: `repeat(auto-fill, ${gridColWidth})` }}>
              {sortedBookmarks.map((bookmark, index) => (
                <div
                  key={bookmark.id}
                  className="relative"
                  onDragOver={(e) => handleItemDragOver(e, index)}
                >
              {dragOverIndex === index && (
                <div className="absolute -left-2 top-0 bottom-0 w-0.5 bg-primary-500 rounded-full z-10" />
              )}
              <BookmarkCard
                bookmark={bookmark}
                viewMode={viewMode}
                workspaceColor={workspaceColor}
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            </div>
          ))}
        </div>
      )}
      {/* 文件夹右键菜单 */}
      {menuPos && (
        <FolderContextMenu
          x={menuPos.x}
          y={menuPos.y}
          folderId={folderId}
          folderTitle={folderName}
          workspaceId={workspaceId}
          onClose={closeMenu}
          onRefresh={onRefresh}
        />
      )}
    </div>
  )
}

function WorkspaceView({ workspaceId }) {
  const { t } = useTranslation()
  const { bookmarks, loading } = useBookmarks()
  const { workspaces, wsMeta, clickCounts, folderViewModes, setFolderViewMode, getFolderViewMode, iconSize } = useAppStore()

  const workspace = workspaces.find(w => w.id === workspaceId)
  const workspaceItems = bookmarks[workspaceId] || []

  // 递归获取完整子树并展平
  const [flatData, setFlatData] = useState({ groups: new Map(), directBookmarks: [], folderIdMap: new Map() })
  const [flattening, setFlattening] = useState(false)

  // 直接书签的视图模式（持久化）
  const directViewMode = getFolderViewMode(`__direct_${workspaceId}`)
  const setDirectViewMode = (mode) => setFolderViewMode(`__direct_${workspaceId}`, mode)

  // 拖拽状态
  const [isDirectDragOver, setIsDirectDragOver] = useState(false)
  const [directDragOverIndex, setDirectDragOverIndex] = useState(null)
  const directContainerRef = useRef(null)

  const buildFlatData = useCallback(async () => {
    if (!workspaceId || workspaceItems.length === 0) {
      setFlatData({ groups: new Map(), directBookmarks: [], folderIdMap: new Map() })
      return
    }

    // 仅首次加载显示 loading，后续刷新不闪烁
    if (flatData.groups.size === 0 && flatData.directBookmarks.length === 0) {
      setFlattening(true)
    }
    try {
      const subTree = await chrome.bookmarks.getSubTree(workspaceId)
      const rootChildren = subTree[0]?.children || []
      const result = flattenBookmarks(rootChildren, [], [workspaceId])
      setFlatData(result)
    } catch (err) {
      console.error('Failed to flatten bookmarks tree:', err)
      const folders = workspaceItems.filter(item => !item.url)
      const directBookmarks = workspaceItems.filter(item => item.url).map(b => ({ ...b, parentId: workspaceId }))
      const groups = new Map()
      const folderIdMap = new Map()
      for (const folder of folders) {
        groups.set(folder.title, (folder.children || []).map(b => ({ ...b, parentId: folder.id })))
        folderIdMap.set(folder.title, folder.id)
      }
      setFlatData({ groups, directBookmarks, folderIdMap })
    } finally {
      setFlattening(false)
    }
  }, [workspaceId, workspaceItems])

  useEffect(() => {
    buildFlatData()
  }, [buildFlatData])

  const { groups, directBookmarks, folderIdMap } = flatData

  // 直接书签的智能排序
  const sortedDirectBookmarks = useMemo(() => {
    if (directViewMode !== 'smart') return directBookmarks
    return [...directBookmarks].sort((a, b) => {
      const countA = clickCounts[a.id] || 0
      const countB = clickCounts[b.id] || 0
      return countB - countA
    })
  }, [directBookmarks, directViewMode, clickCounts])

  // ── 直接书签区域拖拽处理 ──
  const handleDirectDragStart = (e, bookmark) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/bookmark', JSON.stringify({
      id: bookmark.id,
      parentId: bookmark.parentId || workspaceId,
      title: bookmark.title,
      url: bookmark.url,
      sourceFolderId: workspaceId,
      sourcePath: '__direct',
    }))
  }

  const handleDirectDragEnd = () => {
    setDirectDragOverIndex(null)
    setIsDirectDragOver(false)
  }

  const handleDirectDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDirectDragOver(true)
  }

  const handleDirectDragLeave = (e) => {
    if (directContainerRef.current && !directContainerRef.current.contains(e.relatedTarget)) {
      setIsDirectDragOver(false)
      setDirectDragOverIndex(null)
    }
  }

  const handleDirectDrop = async (e) => {
    e.preventDefault()
    setIsDirectDragOver(false)
    setDirectDragOverIndex(null)

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/bookmark'))
      if (!data || !data.id) return

      // 移到工作区根目录
      await chrome.bookmarks.move(data.id, {
        parentId: workspaceId,
        index: directBookmarks.length,
      })
    } catch (err) {
      console.error('Failed to move bookmark:', err)
    }
  }

  const handleDirectItemDragOver = (e, index) => {
    e.preventDefault()
    e.stopPropagation()
    setDirectDragOverIndex(index)
  }

  // ── 工作区标题区域作为放置目标（拖拽到工作区根） ──
  const [wsTitleDragOver, setWsTitleDragOver] = useState(false)

  // 在工作区下新建文件夹（inline 输入）— hooks 必须在早返回之前
  const [newFolderInput, setNewFolderInput] = useState(false)
  const [newFolderValue, setNewFolderValue] = useState('')
  const newFolderInputRef = useRef(null)

  const handleNewFolderClick = () => {
    setNewFolderValue('')
    setNewFolderInput(true)
  }

  useEffect(() => {
    if (newFolderInput && newFolderInputRef.current) {
      newFolderInputRef.current.focus()
    }
  }, [newFolderInput])

  const handleNewFolderConfirm = async () => {
    const trimmed = newFolderValue.trim()
    if (trimmed) {
      try {
        await chrome.bookmarks.create({ parentId: workspaceId, title: trimmed })
        buildFlatData()
      } catch (err) {
        console.error('Failed to create folder:', err)
      }
    }
    setNewFolderInput(false)
    setNewFolderValue('')
  }

  const handleNewFolderKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleNewFolderConfirm()
    } else if (e.key === 'Escape') {
      setNewFolderInput(false)
      setNewFolderValue('')
    }
  }

  const handleWsTitleDrop = async (e) => {
    e.preventDefault()
    setWsTitleDragOver(false)
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/bookmark'))
      if (!data || !data.id) return
      await chrome.bookmarks.move(data.id, {
        parentId: workspaceId,
        index: 0,
      })
    } catch (err) {
      console.error('Failed to move bookmark:', err)
    }
  }

  if (loading || flattening) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-default-500">加载中...</div>
      </div>
    )
  }

  // 直接书签区域也用动态列宽
  const directGridColWidth = iconSize === 'small' ? '90px' : iconSize === 'large' ? '148px' : '116px'

  const wsColor = wsMeta[workspaceId]?.color || '#6366f1'
  const hasContent = groups.size > 0 || directBookmarks.length > 0

  return (
    <div className="animate-fade-in">
      {/* 工作区标题 - 可作为拖拽目标 */}
      {workspace && (
        <div
          className={`flex items-center gap-3 mb-8 rounded-xl p-3 -m-3 transition-colors ${
            wsTitleDragOver ? 'ring-1 ring-primary-500/30' : ''
          }`}
          style={{ backgroundColor: hexToRgba(wsColor, 0.08) }}
          onDragOver={(e) => { e.preventDefault(); setWsTitleDragOver(true) }}
          onDragLeave={() => setWsTitleDragOver(false)}
          onDrop={handleWsTitleDrop}
        >
          <span className="text-4xl">{wsMeta[workspaceId]?.emoji || '📁'}</span>
          <h2 className="text-3xl font-semibold" style={{ color: wsColor }}>
            {wsMeta[workspaceId]?.text || workspace.title}
          </h2>
          <Tooltip content={t('newFolder') || '新建文件夹'}>
            <button
              onClick={handleNewFolderClick}
              className="p-2 rounded-lg text-default-400 hover:text-default-600 hover:bg-default-100 transition-colors"
            >
              <FolderPlus size={20} />
            </button>
          </Tooltip>
          {wsTitleDragOver && (
            <span className="text-sm text-primary-500 ml-2 animate-pulse">放到此处</span>
          )}
        </div>
      )}

      {/* 新建文件夹输入框（工作区级别） */}
      {newFolderInput && (
        <div className="flex items-center gap-2 mb-4 px-1">
          <FolderPlus size={16} className="text-primary-500 flex-shrink-0" />
          <input
            ref={newFolderInputRef}
            type="text"
            value={newFolderValue}
            onChange={(e) => setNewFolderValue(e.target.value)}
            onBlur={handleNewFolderConfirm}
            onKeyDown={handleNewFolderKeyDown}
            placeholder={t('newFolder') || '新建文件夹'}
            className="w-56 text-sm bg-default-100 text-foreground px-3 py-1.5 rounded-lg outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-default-300"
          />
        </div>
      )}

      {/* 按路径分组的书签 - 每组独立视图模式 + 拖拽支持 */}
      {Array.from(groups.entries()).map(([path, pathBookmarks]) => (
        <FolderGroup
          key={path}
          path={path}
          bookmarks={pathBookmarks}
          clickCounts={clickCounts}
          workspaceId={workspaceId}
          folderId={folderIdMap.get(path)}
          allFolderIds={folderIdMap}
          onRefresh={buildFlatData}
          workspaceColor={wsColor}
        />
      ))}

      {/* 直接书签（不属于任何子文件夹） */}
      {directBookmarks.length > 0 && (
        <div
          ref={directContainerRef}
          className={`mb-6 rounded-xl transition-colors ${isDirectDragOver ? 'bg-primary-500/5 ring-1 ring-primary-500/20' : ''}`}
          onDragOver={handleDirectDragOver}
          onDragLeave={handleDirectDragLeave}
          onDrop={handleDirectDrop}
        >
          <div className="flex items-center gap-2 mb-3 px-1">
            <FolderOpen size={16} className="text-default-400 flex-shrink-0" />
            <span className="text-sm font-medium text-default-500 flex-1">
              未分组
            </span>
            <span className="text-xs text-default-400 flex-shrink-0 mr-2">
              {directBookmarks.length}
            </span>
            <div className="flex gap-0.5 bg-default-100/50 p-0.5 rounded-lg flex-shrink-0">
              <Tooltip content="列表">
                <button
                  onClick={() => setDirectViewMode('list')}
                  className={`p-1 rounded-md transition-colors ${
                    directViewMode === 'list'
                      ? 'bg-primary-500 text-white'
                      : 'text-default-400 hover:text-default-600'
                  }`}
                >
                  <LayoutList size={14} />
                </button>
              </Tooltip>
              <Tooltip content="网格">
                <button
                  onClick={() => setDirectViewMode('grid')}
                  className={`p-1 rounded-md transition-colors ${
                    directViewMode === 'grid'
                      ? 'bg-primary-500 text-white'
                      : 'text-default-400 hover:text-default-600'
                  }`}
                >
                  <LayoutGrid size={14} />
                </button>
              </Tooltip>
              <Tooltip content="智能排序">
                <button
                  onClick={() => setDirectViewMode('smart')}
                  className={`p-1 rounded-md transition-colors ${
                    directViewMode === 'smart'
                      ? 'bg-primary-500 text-white'
                      : 'text-default-400 hover:text-default-600'
                  }`}
                >
                  <Sparkles size={14} />
                </button>
              </Tooltip>
            </div>
          </div>
          {directViewMode === 'list' ? (
            <div className="flex flex-col gap-2 relative">
              {sortedDirectBookmarks.map((bookmark, index) => (
                <div
                  key={bookmark.id}
                  className="relative"
                  onDragOver={(e) => handleDirectItemDragOver(e, index)}
                >
                  {directDragOverIndex === index && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full z-10 -translate-y-1" />
                  )}
                  <BookmarkCard
                    bookmark={bookmark}
                    viewMode="list"
                    workspaceColor={wsColor}
                    draggable
                    onDragStart={handleDirectDragStart}
                    onDragEnd={handleDirectDragEnd}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(auto-fill, ${directGridColWidth})` }}>
              {sortedDirectBookmarks.map((bookmark, index) => (
                <div
                  key={bookmark.id}
                  className="relative"
                  onDragOver={(e) => handleDirectItemDragOver(e, index)}
                >
                  <BookmarkCard
                    bookmark={bookmark}
                    viewMode={directViewMode}
                    workspaceColor={wsColor}
                    draggable
                    onDragStart={handleDirectDragStart}
                    onDragEnd={handleDirectDragEnd}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!hasContent && (
        <div className="text-center py-20 text-default-500">
          <p className="text-lg mb-2">暂无书签</p>
          <p className="text-sm">右键点击页面可添加书签</p>
        </div>
      )}
    </div>
  )
}

export default WorkspaceView
