/**
 * Naviga Favicon IndexedDB
 * 浏览器端本地数据库，持久化存储每个书签的 favicon
 *
 * 表结构: favicons
 *   - domain (keyPath): 站点 origin，如 "https://github.com"
 *   - name: 站点名称
 *   - favicon: base64 dataURL 格式的图标（图片本身）
 *   - favIconUrl: favicon 原始 URL（图片来源地址）
 *   - url: 书签地址
 *   - updatedAt: 更新时间戳
 */

const DB_NAME = 'naviga-favicons'
const DB_VERSION = 1
const STORE_NAME = 'favicons'

let dbInstance = null

/**
 * 打开/创建数据库
 */
function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance)
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'domain' })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
    }
    request.onsuccess = (e) => {
      dbInstance = e.target.result
      resolve(dbInstance)
    }
    request.onerror = (e) => {
      console.error('Failed to open IndexedDB:', e.target.error)
      reject(e.target.error)
    }
  })
}

/**
 * 获取指定 domain 的完整记录
 */
export async function getFavicon(domain) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(domain)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

/**
 * 保存/更新 favicon 记录
 * @param {string} domain - 站点 origin
 * @param {{ name?: string, favicon: string, favIconUrl?: string, url?: string }} data
 */
export async function saveFavicon(domain, data) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    // 先读取已有记录，合并更新
    const getReq = store.get(domain)
    getReq.onsuccess = () => {
      const existing = getReq.result || {}
      const record = {
        domain,
        name: data.name || existing.name || '',
        favicon: data.favicon,
        favIconUrl: data.favIconUrl || existing.favIconUrl || '',
        url: data.url || existing.url || '',
        updatedAt: Date.now(),
      }
      const putReq = store.put(record)
      putReq.onsuccess = () => resolve(record)
      putReq.onerror = () => reject(putReq.error)
    }
    getReq.onerror = () => reject(getReq.error)
  })
}

/**
 * 删除指定 domain 的记录
 */
export async function deleteFavicon(domain) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(domain)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * 获取所有 favicon 记录，返回 { domain: { favicon, favIconUrl, name, url } } 的 Map
 */
export async function getAllFavicons() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => {
      const map = {}
      for (const record of request.result) {
        if (record.favicon) {
          map[record.domain] = {
            favicon: record.favicon,
            favIconUrl: record.favIconUrl || '',
            name: record.name || '',
            url: record.url || '',
          }
        }
      }
      resolve(map)
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * 清除所有 favicon 记录
 */
export async function clearAllFavicons() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
