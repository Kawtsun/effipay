import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import debounce from 'lodash/debounce'

type RegisterArgs = {
  onSearch: (term: string) => void
  initialTerm?: string
  placeholder?: string
}

type StickySearchContextType = {
  // state mirrored to header
  active: boolean
  sourceVisible: boolean
  term: string
  placeholder: string
  // actions
  register: (args: RegisterArgs) => () => void
  updateTerm: (term: string) => void
  setSourceVisible: (visible: boolean) => void
  triggerSearch: (term?: string) => void
  triggerSearchDebounced: (term?: string) => void
  flushDebounced: () => void
}

const StickySearchContext = createContext<StickySearchContextType | undefined>(undefined)

export function StickySearchProvider({ children }: { children: React.ReactNode }) {
  const onSearchRef = useRef<((term: string) => void) | null>(null)
  const [active, setActive] = useState(false)
  const [sourceVisible, setSourceVisible] = useState(true)
  const [term, setTerm] = useState('')
  const [placeholder, setPlaceholder] = useState('Search...')
  const termRef = useRef('')
  termRef.current = term
  const lastTriggeredRef = useRef<string | null>(null)

  // Provide a debounced trigger that persists across header mount/unmount cycles
  const debouncedRef = useRef<((value: string) => void) | null>(null)
  if (!debouncedRef.current) {
    debouncedRef.current = debounce((value: string) => {
      if (lastTriggeredRef.current === value) return
      lastTriggeredRef.current = value
      onSearchRef.current?.(value)
    }, 200)
  }

  const register = useCallback((args: RegisterArgs) => {
  onSearchRef.current = args.onSearch
    setActive(true)
    // Preserve existing term if already set (e.g., user typed in header before register)
    setTerm(prev => (prev !== '' ? prev : (typeof args.initialTerm !== 'undefined' ? args.initialTerm : prev)))
    setPlaceholder(args.placeholder ?? 'Search...')
    // Keep the current visibility state; caller (source search) updates via setSourceVisible
    return () => {
      // only unregister if current registration matches
  onSearchRef.current = null
      setActive(false)
      setSourceVisible(true)
      setPlaceholder('Search...')
    }
  }, [])

  const updateTerm = useCallback((value: string) => setTerm(value), [])

  const triggerSearch = useCallback((value?: string) => {
    const v = typeof value === 'string' ? value : term
    if (lastTriggeredRef.current === v) return
    lastTriggeredRef.current = v
    onSearchRef.current?.(v)
  }, [term])

  const triggerSearchDebounced = useCallback((value?: string) => {
    const v = typeof value === 'string' ? value : term
    debouncedRef.current?.(v)
  }, [term])

  const flushDebounced = useCallback(() => {
    // lodash debounce provides flush on the debounced function
    // but TS doesn't know; cast to any safely
    ;(debouncedRef.current as unknown as { flush?: () => void })?.flush?.()
  }, [])

  const value = useMemo<StickySearchContextType>(() => ({
    active,
    sourceVisible,
    term,
    placeholder,
    register,
    updateTerm,
    setSourceVisible,
    triggerSearch,
    triggerSearchDebounced,
    flushDebounced,
  }), [active, sourceVisible, term, placeholder, register, updateTerm, triggerSearch, triggerSearchDebounced, flushDebounced])

  return <StickySearchContext.Provider value={value}>{children}</StickySearchContext.Provider>
}

export function useStickySearch() {
  const ctx = useContext(StickySearchContext)
  if (!ctx) throw new Error('useStickySearch must be used within StickySearchProvider')
  return ctx
}
