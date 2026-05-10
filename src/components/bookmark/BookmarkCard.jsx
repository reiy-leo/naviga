import { Card, CardContent, Tooltip, Badge } from '@heroui/react';
import { Link2, CircleEllipsis, Star, GripVertical } from 'lucide-react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getBookmark } from '../../db/bookmarks';
import { colorToHex } from '../../lib/utils';
import { useAppStore } from '../../store/useAppStore';
import { ContextMenu } from './ContextMenu';
import { SubBookmarkList } from './SubBookmarkList';

const cardRoundSizeMap = {
  card_small: 'rounded-lg',
  card_large: 'rounded-4xl',
  card_full: 'rounded-full',
};

function BookmarkCard({ bookmark, viewMode, workspaceColor, style, draggable = false, onDragStart, onDragEnd }) {
  const { t } = useTranslation();
  const {
    incrementClickCount,
    subBookmarks,
    favorites,
    faviconCache,
    tabFavicons,
    setFaviconForDomain,
    clearFaviconForDomain,
    fetchFaviconAsDataUrl,
    iconSize,
    cardRoundSize,
    getShadowStyle,
  } = useAppStore();
  const [imageError, setImageError] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const [subsExpanded, setSubsExpanded] = useState(false);
  const [faviconRefreshKey, setFaviconRefreshKey] = useState(0);
  const badgeRef = useRef(null);

  const [bookmark_id, setBookmarkId] = useState(bookmark.id);
  const [bookmark_title, setBookmarkTitle] = useState(bookmark.title);
  const [bookmark_url, setBookmarkUrl] = useState(bookmark.url);
  const [bookmark_shadowing, setBookmarkShadowing] = useState(bookmark.shadowing);

  const sizeConfig = useMemo(() => {
    if (viewMode === 'list') {
      switch (iconSize) {
        case 'small':
          return { container: 'w-6 h-6', icon: 'w-3.5 h-3.5', fallback: 14 };
        case 'large':
          return { container: 'w-10 h-10', icon: 'w-6 h-6', fallback: 22 };
        default:
          return { container: 'w-8 h-8', icon: 'w-5 h-5', fallback: 18 };
      }
    }
    switch (iconSize) {
      case 'small':
        return {
          container: 'w-12 h-12',
          icon: 'w-12 h-12',
          fallback: 32,
          text: 'text-xs',
          iconPx: 36,
        };
      case 'large':
        return {
          container: 'w-26 h-26',
          icon: 'w-26 h-26',
          fallback: 64,
          text: 'text-xs',
          iconPx: 56,
        };
      default:
        return {
          container: 'w-20 h-20',
          icon: 'w-20 h-20',
          fallback: 48,
          text: 'text-xs',
          iconPx: 48,
        };
    }
  }, [iconSize, viewMode]);

  const cardStyle = useMemo(() => {
    const base = {};
    if (workspaceColor) {
      base.backgroundColor = colorToHex(workspaceColor, 0.09);
    }
    return base;
  }, [workspaceColor]);

  const iconBgStyle = useMemo(() => {
    if (!workspaceColor) return {};
    return { backgroundColor: colorToHex(workspaceColor, 0.12) };
  }, [workspaceColor]);

  useEffect(() => {
    if (bookmark_shadowing) {
      async function load() {
        const shadowed = await getBookmark(bookmark_shadowing);
        setBookmarkId(shadowed.id);
        setBookmarkTitle(shadowed.title);
        setBookmarkUrl(shadowed.url);
      }
      load();
    }
  }, []);

  const isFav = favorites.includes(bookmark_id);
  const hasSubBookmarks = subBookmarks[bookmark_id] && subBookmarks[bookmark_id].length > 0;

  const displayTitle = useMemo(() => {
    if (bookmark_title && bookmark_title.trim()) return bookmark_title;
    try {
      const url = new URL(bookmark_url);
      return url.hostname || t('unnamedBookmark');
    } catch {
      return t('unnamedBookmark');
    }
  }, [bookmark_title, bookmark_url]);

  const domain = useMemo(() => {
    try {
      return new URL(bookmark_url).origin;
    } catch {
      return null;
    }
  }, [bookmark_url]);

  const faviconUrl = useMemo(() => {
    if (imageError || !domain) return null;
    if (faviconCache[domain]?.favicon) return faviconCache[domain].favicon;
    if (tabFavicons[domain]) {
      if (faviconRefreshKey) {
        const sep = tabFavicons[domain].includes('?') ? '&' : '?';
        return `${tabFavicons[domain]}${sep}_t=${faviconRefreshKey}`;
      }
      return tabFavicons[domain];
    }
    const cacheBuster = faviconRefreshKey ? `?t=${faviconRefreshKey}` : '';
    return `${domain}/favicon.ico${cacheBuster}`;
  }, [domain, imageError, faviconCache, tabFavicons, faviconRefreshKey]);

  const handleFaviconLoad = useCallback(
    (e) => {
      if (!domain || faviconCache[domain]?.favicon) return;
      const src = e.target.src;
      if (src && !src.startsWith('data:')) {
        fetchFaviconAsDataUrl(src).then((dataUrl) => {
          if (dataUrl) {
            setFaviconForDomain(domain, dataUrl, displayTitle, bookmark_url, src);
          }
        });
      }
    },
    [domain, faviconCache, fetchFaviconAsDataUrl, setFaviconForDomain, displayTitle, bookmark_url],
  );

  const handleFaviconError = useCallback(() => {
    if (!domain) return;
    if (faviconCache[domain]?.favicon) return;
    setImageError(true);
    const store = useAppStore.getState();
    const favIconUrl = tabFavicons[domain] || `${domain}/favicon.ico`;
    store.fetchAndCacheFavicon(domain, favIconUrl);
  }, [domain, faviconCache, tabFavicons]);

  const handleClick = () => {
    incrementClickCount(bookmark_id);
    window.open(bookmark_url, '_blank');
  };

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPos({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    if (!subsExpanded) return;
    const handleClick = () => setSubsExpanded(false);
    const timer = setTimeout(() => {
      window.addEventListener('click', handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleClick);
    };
  }, [subsExpanded]);

  const closeMenu = useCallback(() => setMenuPos(null), []);

  useEffect(() => {
    const handleRefresh = async (e) => {
      if (e.detail?.id === bookmark_id) {
        setImageError(false);
        if (domain) clearFaviconForDomain(domain);
        await useAppStore.getState().fetchTabFavicons();
        setFaviconRefreshKey(Date.now());
      }
    };
    window.addEventListener('refresh-icon', handleRefresh);
    return () => window.removeEventListener('refresh-icon', handleRefresh);
  }, [bookmark_id, domain, clearFaviconForDomain]);

  const handleDragStart = (e) => {
    if (onDragStart) onDragStart(e, bookmark);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(
      'application/bookmark',
      // NOTE 对于shadow而言，bookmark.id是shadow本身的id，bookmark_id是源id
      JSON.stringify({
        id: bookmark.id,
        parentId: bookmark.parentId,
        title: bookmark_title,
        url: bookmark_url,
        index: bookmark.index,
      }),
    );
  };

  const handleDragEnd = (e) => {
    if (onDragEnd) onDragEnd(e);
  };

  if (viewMode === 'list') {
    return (
      <div className='relative h-full w-full'>
        <Tooltip
          delay={300}
          onContextMenu={handleContextMenu}>
          <div className='h-full w-full'>
            <Card
              isPressable
              onPress={handleClick}
              onClick={handleClick}
              draggable={draggable}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              className='group h-full w-full rounded-md border p-1 transition-colors hover:bg-mist-200/50'
              style={{ ...style, ...cardStyle }}>
              <CardContent className='flex flex-row items-center gap-3 p-1'>
                {draggable && (
                  <GripVertical
                    size={14}
                    className='flex-0 text-mist-300 transition-colors group-hover:text-mist-500'
                  />
                )}
                <div
                  className={`${sizeConfig.container} flex items-center justify-center rounded-md p-1 text-lg text-mist-200`}
                  style={iconBgStyle.backgroundColor ? iconBgStyle : undefined}>
                  {faviconUrl ? (
                    <img
                      src={faviconUrl}
                      alt=''
                      data-bookmark-id={bookmark.id}
                      className={`${sizeConfig.icon} object-contain`}
                      onLoad={(e) => handleFaviconLoad(e)}
                      onError={(e) => handleFaviconError(e)}
                    />
                  ) : (
                    <Link2
                      size={sizeConfig.fallback}
                      className='text-mist-300 dark:text-mist-700'
                    />
                  )}
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='truncate text-sm font-medium'>{displayTitle}</div>
                  <div className='truncate text-xs text-mist-500'>{bookmark_url}</div>
                </div>
                {isFav && (
                  <Star
                    size={14}
                    className='fill-yellow-400 stroke-yellow-400'
                  />
                )}
                {hasSubBookmarks && (
                  <button
                    ref={badgeRef}
                    className='bg-primary h-2 w-2 flex-0 rounded-full transition-transform hover:scale-150'
                    onClick={(e) => {
                      e.stopPropagation();
                      setSubsExpanded(!subsExpanded);
                    }}
                    title={t('subBookmarks')}
                  />
                )}
              </CardContent>
            </Card>
          </div>
          <Tooltip.Content
            showArrow
            placement='bottom'>
            <Tooltip.Arrow />
            <p className='max-w-xs text-sm wrap-break-word whitespace-normal'>{displayTitle}</p>
          </Tooltip.Content>
        </Tooltip>
        {subsExpanded && hasSubBookmarks && (
          <SubBookmarkList
            parentId={bookmark.id}
            faviconCache={faviconCache}
            tabFavicons={tabFavicons}
            onClose={() => setSubsExpanded(false)}
            triggerRef={badgeRef}
          />
        )}
        {menuPos && (
          <ContextMenu
            x={menuPos.x}
            y={menuPos.y}
            isShadow={!!bookmark_shadowing}
            bookmark={bookmark}
            isFav={isFav}
            onClose={closeMenu}
          />
        )}
      </div>
    );
  }

  // 网格模式
  return (
    <div
      style={{ width: '100%', aspectRatio: '1 / 1' }}
      className='relative'>
      <Tooltip delay={300}>
        <div
          onContextMenu={handleContextMenu}
          className='h-full w-full'>
          <Card
            isPressable
            onClick={handleClick}
            draggable={draggable}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={`h-full w-full border p-1 ${cardRoundSizeMap[cardRoundSize]} ${bookmark_shadowing ? getShadowStyle() : ''}`}
            style={!bookmark_shadowing ? cardStyle : {}}>
            <CardContent className='flex flex-col items-center justify-center gap-2 p-1'>
              <div
                className={`${sizeConfig.container} flex flex-0 items-center justify-center rounded-md text-2xl`}
                style={iconBgStyle.backgroundColor ? iconBgStyle : undefined}>
                {faviconUrl ? (
                  <img
                    src={faviconUrl}
                    alt=''
                    data-bookmark-id={bookmark.id}
                    className={`${sizeConfig.icon} object-contain`}
                    onLoad={handleFaviconLoad}
                    onError={handleFaviconError}
                  />
                ) : (
                  <Link2
                    size={sizeConfig.fallback}
                    className='text-mist-300 dark:text-mist-700'
                  />
                )}
              </div>
              <div className={`${sizeConfig.text || 'text-xs'} w-full truncate text-center text-mist-600`}>
                {displayTitle}
              </div>
            </CardContent>
          </Card>
        </div>
        <Tooltip.Content
          showArrow
          placement='bottom'>
          <Tooltip.Arrow />
          <p className='max-w-xs text-sm wrap-break-word whitespace-normal'>{displayTitle}</p>
        </Tooltip.Content>
      </Tooltip>
      {isFav && (
        <Badge
          placement='top-right'
          size='sm'
          className='bg-transparent'>
          <Star
            strokeWidth={1.25}
            size={18}
            className='fill-yellow-500 text-yellow-500'
          />
        </Badge>
      )}
      {hasSubBookmarks && (
        <Badge
          placement='bottom-right'
          className='cursor-pointer bg-transparent transition-colors hover:bg-mist-200/50'
          size='sm'
          onClick={() => {
            setSubsExpanded(true);
          }}>
          <CircleEllipsis
            strokeWidth={2}
            size={18}
            className='text-mist-400'
          />
        </Badge>
      )}
      {subsExpanded && hasSubBookmarks && (
        <SubBookmarkList
          parentId={bookmark_id}
          faviconCache={faviconCache}
          tabFavicons={tabFavicons}
          onClose={() => setSubsExpanded(false)}
          triggerRef={badgeRef}
        />
      )}
      {menuPos && (
        <ContextMenu
          x={menuPos.x}
          y={menuPos.y}
          isShadow={!!bookmark_shadowing}
          bookmark={bookmark}
          isFav={isFav}
          onClose={closeMenu}
        />
      )}
    </div>
  );
}

export default BookmarkCard;
