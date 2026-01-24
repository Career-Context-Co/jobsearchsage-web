import { useLocalStorage } from '@vueuse/core'

export type LocalStorageStateEntry<T> = {
  value: T
  cachedAt: string
}

export type LocalStorageStateOptions<T> = {
  ttlMs?: number
  shouldCache?: (value: T) => boolean
  validate?: (value: T) => boolean
  onExpire?: (value: T) => void
}

export const useLocalStorageState = <T>(
  key: string,
  options: LocalStorageStateOptions<T> = {}
) => {
  const storage = useLocalStorage<LocalStorageStateEntry<T> | null>(key, null)

  const isExpired = (cachedAt: string) => {
    if (!options.ttlMs) return false
    const cachedAtMs = Date.parse(cachedAt)
    if (!Number.isFinite(cachedAtMs)) return true
    return Date.now() - cachedAtMs > options.ttlMs
  }

  const clear = () => {
    storage.value = null
  }

  const save = (value: T) => {
    if (options.shouldCache && !options.shouldCache(value)) {
      clear()
      return null
    }

    const entry: LocalStorageStateEntry<T> = {
      value,
      cachedAt: new Date().toISOString()
    }

    storage.value = entry
    return entry
  }

  const restore = () => {
    const cached = storage.value

    if (!cached) return null

    if (options.validate && !options.validate(cached.value)) {
      clear()
      return null
    }

    if (isExpired(cached.cachedAt)) {
      if (options.onExpire) {
        options.onExpire(cached.value)
      }
      clear()
      return null
    }

    return cached.value
  }

  const update = (updater: (value: T) => T) => {
    const current = restore()
    if (!current) return null
    return save(updater(current))?.value ?? null
  }

  const getCachedAt = () => storage.value?.cachedAt ?? null

  return {
    storage,
    save,
    restore,
    clear,
    update,
    isExpired,
    getCachedAt
  }
}
