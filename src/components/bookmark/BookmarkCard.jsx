import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store/useAppStore'
import { Card, CardBody, Tooltip } from "@nextui-org/react";
import { Link2, Star, StarOff, Pencil, Trash2, BookmarkPlus, RefreshCw, GripVertical, ChevronDown, ChevronUp, X } from 'lucide-react'

/**
 * 获取子书签 favicon URL
 */
function getSubFavicon(url) {
  try {
    const domain = new URL(url).origin
    return `${domain}/favicon.ico`
  } catch {
    return null
  }
}

/**
 * 右键菜单组件
 */
function ContextMenu({ x, y, bookmark, isFav, onClose }) {
  const { t } = useTranslation()
  const { toggleFavorite } = useAppStore()
  const menuRef = useRef(null)

  // 确保菜单不超出视窗
  const menuWidth = 180
  const menuHeight = 240
  let adjustedX = x
  let adjustedY = y
  if (adjustedX + menuWidth > window.innerWidth) adjustedX = window.innerWidth - menuWidth - 8
  if (adjustedY + menuHeight > window.innerHeight) adjustedY = window.innerHeight - menuHeight - 8

  // 点击外部关闭
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return
      onClose()
    }
    const handleContextMenu = (e) => {
      // 右键其他地方直接关闭，不弹浏览器默认菜单
      e.preventDefault()
      onClose()
    }
    const handleScroll = () => onClose()
    // 延迟绑定避免当前事件立即触发关闭
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

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[180px] bg-content1 border border-default-200 rounded-xl shadow-lg py-1 animate-slide-down"
      style={{ left: adjustedX, top: adjustedY }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 收藏 / 取消收藏 */}
      <button
        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-default-100 transition-colors"
        onClick={() => { toggleFavorite(bookmark.id); onClose() }}
      >
        {isFav ? <StarOff size={16} className="text-warning-500" /> : <Star size={16} className="text-default-400" />}
        {isFav ? (t('unfavorite') || '取消收藏') : (t('favorite') || '收藏')}
      </button>

      {/* 编辑 */}
      <button
        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-default-100 transition-colors"
        onClick={() => {
          window.dispatchEvent(new CustomEvent('edit-bookmark', { detail: bookmark }))
          onClose()
        }}
      >
        <Pencil size={16} className="text-default-400" />
        {t('edit') || '编辑'}
      </button>

      {/* 添加子书签 */}
      <button
        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-default-100 transition-colors"
        onClick={() => {
          window.dispatchEvent(new CustomEvent('add-sub-bookmark', { detail: bookmark }))
          onClose()
        }}
      >
        <BookmarkPlus size={16} className="text-default-400" />
        {t('addSubBookmark') || '添加子书签'}
      </button>

      {/* 刷新图标 */}
      <button
        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-default-100 transition-colors"
        onClick={() => {
          window.dispatchEvent(new CustomEvent('refresh-icon', { detail: bookmark }))
          onClose()
        }}
      >
        <RefreshCw size={16} className="text-default-400" />
        {t('refreshIcon') || '刷新图标'}
      </button>

      <div className="my-1 border-t border-default-200" />

      {/* 删除 */}
      <button
        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-danger-50 text-danger-500 transition-colors"
        onClick={() => {
          if (confirm(t('confirmDelete') || '确定删除此书签？')) {
            chrome.bookmarks.remove(bookmark.id)
          }
          onClose()
        }}
      >
        <Trash2 size={16} />
        {t('delete') || '删除'}
      </button>
    </div>
  )
}

/**
 * 子书签展开列表
 */
function SubBookmarkList({ parentId, viewMode }) {
  const { subBookmarks, removeSubBookmark } = useAppStore()
  const subs = subBookmarks[parentId] || []

  if (subs.length === 0) return null

  const handleSubClick = (e, url) => {
    e.stopPropagation()
    window.open(url, '_blank')
  }

  const handleSubDelete = (e, subId) => {
    e.stopPropagation()
    removeSubBookmark(parentId, subId)
  }

  const handleSubEdit = (e, sub) => {
    e.stopPropagation()
    window.dispatchEvent(new CustomEvent('edit-sub-bookmark', {
      detail: { parentId, subBookmark: sub }
    }))
  }

  // 列表模式：紧凑水平布局
  if (viewMode === 'list') {
    return (
      <div className="sub-bookmarks-list ml-11 mt-1 flex flex-col gap-0.5">
        {subs.map((sub) => {
          const subFav = getSubFavicon(sub.url)
          return (
            <div
              key={sub.id}
              className="sub-bookmark-item group flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-default-100/80 transition-colors cursor-pointer"
              onClick={(e) => handleSubClick(e, sub.url)}
            >
              <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                {subFav ? (
                  <img src={subFav} alt="" className="w-3.5 h-3.5 object-contain" onError={(e) => { e.target.style.display = 'none' }} />
                ) : (
                  <Link2 size={12} className="text-default-400" />
                )}
              </div>
              <span className="text-xs text-default-600 flex-1 min-w-0 break-all">{sub.title}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  className="p-0.5 rounded hover:bg-default-200 transition-colors"
                  onClick={(e) => handleSubEdit(e, sub)}
                  title="编辑"
                >
                  <Pencil size={11} className="text-default-400" />
                </button>
                <button
                  className="p-0.5 rounded hover:bg-danger-100 transition-colors"
                  onClick={(e) => handleSubDelete(e, sub.id)}
                  title="删除"
                >
                  <X size={11} className="text-danger-400" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // 网格模式：浮层卡片
  return (
    <div className="sub-bookmarks-popover absolute left-1/2 -translate-x-1/2 top-full mt-1 z-40 bg-content1 border border-default-200 rounded-xl shadow-lg p-2 w-max min-w-[220px] max-w-[320px]">
      <div className="flex items-center justify-between px-2 py-1 mb-1">
        <span className="text-xs font-medium text-default-500">子书签</span>
        <span className="text-[10px] text-default-400">{subs.length}/5</span>
      </div>
      {subs.map((sub) => {
        const subFav = getSubFavicon(sub.url)
        return (
          <div
            key={sub.id}
            className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-default-100 transition-colors cursor-pointer"
            onClick={(e) => handleSubClick(e, sub.url)}
          >
            <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
              {subFav ? (
                <img src={subFav} alt="" className="w-3.5 h-3.5 object-contain" onError={(e) => { e.target.style.display = 'none' }} />
              ) : (
                <Link2 size={12} className="text-default-400" />
              )}
            </div>
            <span className="text-xs text-default-600 flex-1 min-w-0 break-all">{sub.title}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                className="p-0.5 rounded hover:bg-default-200 transition-colors"
                onClick={(e) => handleSubEdit(e, sub)}
                title="编辑"
              >
                <Pencil size={11} className="text-default-400" />
              </button>
              <button
                className="p-0.5 rounded hover:bg-danger-100 transition-colors"
                onClick={(e) => handleSubDelete(e, sub.id)}
                title="删除"
              >
                <X size={11} className="text-danger-400" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BookmarkCard({ bookmark, viewMode, workspaceColor, style, draggable = false, onDragStart, onDragEnd }) {
  const { incrementClickCount, subBookmarks, favorites, faviconCache, setFaviconForDomain, clearFaviconForDomain, iconSize } = useAppStore()
  const [imageError, setImageError] = useState(false)
  const [menuPos, setMenuPos] = useState(null)
  const [subsExpanded, setSubsExpanded] = useState(false)

  // 根据 iconSize 计算各尺寸
  const sizeConfig = useMemo(() => {
    if (viewMode === 'list') {
      switch (iconSize) {
        case 'small': return { container: 'w-6 h-6', icon: 'w-3.5 h-3.5', fallback: 14 }
        case 'large': return { container: 'w-10 h-10', icon: 'w-6 h-6', fallback: 22 }
        default: return { container: 'w-8 h-8', icon: 'w-5 h-5', fallback: 18 }
      }
    }
    // grid / smart — 用固定像素保证统一尺寸
    switch (iconSize) {
      case 'small': return { container: 'w-9 h-9', icon: 'w-5 h-5', fallback: 16, text: 'text-[10px]', iconPx: 36 }
      case 'large': return { container: 'w-14 h-14', icon: 'w-9 h-9', fallback: 28, text: 'text-sm', iconPx: 56 }
      default: return { container: 'w-12 h-12', icon: 'w-7 h-7', fallback: 24, text: 'text-xs', iconPx: 48 }
    }
  }, [iconSize, viewMode])

  // 工作区色调背景
  const cardStyle = useMemo(() => {
    const base = {}
    if (workspaceColor) {
      const r = parseInt(workspaceColor.slice(1, 3), 16)
      const g = parseInt(workspaceColor.slice(3, 5), 16)
      const b = parseInt(workspaceColor.slice(5, 7), 16)
      base.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.06)`
    }
    return base
  }, [workspaceColor])

  // favicon 容器背景（稍深一点）
  const iconBgStyle = useMemo(() => {
    if (!workspaceColor) return {}
    const r = parseInt(workspaceColor.slice(1, 3), 16)
    const g = parseInt(workspaceColor.slice(3, 5), 16)
    const b = parseInt(workspaceColor.slice(5, 7), 16)
    return { backgroundColor: `rgba(${r}, ${g}, ${b}, 0.12)` }
  }, [workspaceColor])

  const isFav = favorites.includes(bookmark.id)
  const hasSubBookmarks = subBookmarks[bookmark.id] && subBookmarks[bookmark.id].length > 0
  const subCount = subBookmarks[bookmark.id]?.length || 0

  // 计算显示标题：优先使用title，否则使用URL主机名，最后使用默认文本
  const displayTitle = useMemo(() => {
    if (bookmark.title && bookmark.title.trim()) return bookmark.title
    try {
      const url = new URL(bookmark.url)
      return url.hostname || '未命名书签'
    } catch {
      return '未命名书签'
    }
  }, [bookmark.title, bookmark.url])

  // 获取 favicon：优先从缓存，否则用 URL
  const domain = useMemo(() => {
    try { return new URL(bookmark.url).origin } catch { return null }
  }, [bookmark.url])

  const faviconUrl = useMemo(() => {
    if (imageError || !domain) return null
    // 优先使用缓存
    if (faviconCache[domain]) return faviconCache[domain]
    // 无缓存，用远程 URL
    return `${domain}/favicon.ico`
  }, [domain, imageError, faviconCache])

  // favicon 加载成功时缓存为 dataUrl
  const handleFaviconLoad = useCallback((e) => {
    if (!domain || faviconCache[domain]) return
    const img = e.target
    try {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || 32
      canvas.height = img.naturalHeight || 32
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/png')
      setFaviconForDomain(domain, dataUrl)
    } catch {
      // CORS 限制时无法 canvas 导出，跳过缓存
    }
  }, [domain, faviconCache, setFaviconForDomain])

  const handleClick = () => {
    incrementClickCount(bookmark.id)
    window.open(bookmark.url, '_blank')
  }

  // 右键菜单 - 绑定在外层 div 上，避免 NextUI Card isPressable 拦截
  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setMenuPos({ x: e.clientX, y: e.clientY })
  }, [])

  const closeMenu = useCallback(() => {
    setMenuPos(null)
  }, [])

  // 刷新图标事件
  useEffect(() => {
    const handleRefresh = (e) => {
      if (e.detail?.id === bookmark.id) {
        setImageError(false)
        // 清除缓存后重新获取
        if (domain) clearFaviconForDomain(domain)
      }
    }
    window.addEventListener('refresh-icon', handleRefresh)
    return () => window.removeEventListener('refresh-icon', handleRefresh)
  }, [bookmark.id, domain, clearFaviconForDomain])

  // 拖拽事件处理
  const handleDragStart = (e) => {
    if (onDragStart) onDragStart(e, bookmark)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/bookmark', JSON.stringify({
      id: bookmark.id,
      parentId: bookmark.parentId,
      title: bookmark.title,
      url: bookmark.url,
      index: bookmark.index,
    }))
  }

  const handleDragEnd = (e) => {
    if (onDragEnd) onDragEnd(e)
  }

  if (viewMode === 'list') {
    return (
      <div onContextMenu={handleContextMenu}>
        <Card
          isPressable
          onPress={handleClick}
          draggable={draggable}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className={`w-full hover:bg-default-200/50 transition-colors group ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
          style={{ ...style, ...cardStyle }}
        >
          <CardBody className="flex flex-row items-center gap-3 py-3 px-4">
            {draggable && (
              <GripVertical size={14} className="text-default-300 group-hover:text-default-500 flex-shrink-0 transition-colors" />
            )}
            <div className={`${sizeConfig.container} flex items-center justify-center rounded-md text-lg flex-shrink-0`}
              style={iconBgStyle.backgroundColor ? iconBgStyle : undefined}
            >
              {faviconUrl ? (
                <img
                  src={faviconUrl}
                  alt=""
                  data-bookmark-id={bookmark.id}
                  className={`${sizeConfig.icon} object-contain`}
                  onLoad={handleFaviconLoad}
                  onError={() => setImageError(true)}
                />
              ) : (
                <Link2 size={sizeConfig.fallback} className="text-default-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{displayTitle}</div>
              <div className="text-xs text-default-500 truncate">{bookmark.url}</div>
            </div>
            {isFav && (
              <Star size={14} className="text-warning-500 flex-shrink-0 fill-warning-500" />
            )}
            {hasSubBookmarks && (
              <button
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-500 text-xs font-medium hover:bg-primary-500/20 transition-colors flex-shrink-0"
                onClick={(e) => { e.stopPropagation(); setSubsExpanded(!subsExpanded) }}
                title={subsExpanded ? '收起子书签' : '展开子书签'}
              >
                <span>{subCount}</span>
                {subsExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
          </CardBody>
        </Card>
        {/* 子书签展开列表 */}
        {subsExpanded && hasSubBookmarks && (
          <SubBookmarkList parentId={bookmark.id} viewMode="list" />
        )}
        {menuPos && (
          <ContextMenu
            x={menuPos.x}
            y={menuPos.y}
            bookmark={bookmark}
            isFav={isFav}
            onClose={closeMenu}
          />
        )}
      </div>
    )
  }

  // 网格模式
  return (
    <Tooltip content={displayTitle} placement="bottom">
      <div onContextMenu={handleContextMenu} style={{ width: '100%', aspectRatio: '1 / 1' }} className="relative">
        <Card
          isPressable
          onPress={handleClick}
          draggable={draggable}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className={`w-full h-full hover:bg-default-200/50 transition-all hover:-translate-y-0.5 group ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
          style={cardStyle}
        >
          <CardBody className="flex flex-col items-center justify-center gap-2 p-3">
            {isFav && (
              <Star size={12} className="absolute top-2 right-2 text-warning-500 fill-warning-500 z-10" />
            )}
            <div className={`${sizeConfig.container} flex items-center justify-center rounded-md text-2xl flex-shrink-0`}
              style={iconBgStyle.backgroundColor ? iconBgStyle : undefined}
            >
              {faviconUrl ? (
                <img
                  src={faviconUrl}
                  alt=""
                  data-bookmark-id={bookmark.id}
                  className={`${sizeConfig.icon} object-contain`}
                  onLoad={handleFaviconLoad}
                  onError={() => setImageError(true)}
                />
              ) : (
                <Link2 size={sizeConfig.fallback} className="text-default-500" />
              )}
            </div>
            <div className={`${sizeConfig.text || 'text-xs'} text-center text-default-600 truncate w-full`}>
              {displayTitle}
            </div>
          </CardBody>
        </Card>
        {/* 子书签徽标 - 绝对定位，不影响Card尺寸 */}
        {hasSubBookmarks && (
          <button
            className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-primary-500/10 text-primary-500 text-[10px] font-medium hover:bg-primary-500/20 transition-colors z-20"
            onClick={(e) => { e.stopPropagation(); setSubsExpanded(!subsExpanded) }}
            title={subsExpanded ? '收起子书签' : '展开子书签'}
          >
            {subCount}
            {subsExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
        )}
        {/* 子书签浮层 */}
        {subsExpanded && hasSubBookmarks && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50">
            <SubBookmarkList parentId={bookmark.id} viewMode="grid" />
          </div>
        )}
        {menuPos && (
          <ContextMenu
            x={menuPos.x}
            y={menuPos.y}
            bookmark={bookmark}
            isFav={isFav}
            onClose={closeMenu}
          />
        )}
      </div>
    </Tooltip>
  )
}

export default BookmarkCard
