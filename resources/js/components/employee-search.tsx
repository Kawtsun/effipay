import React, { useEffect, useRef, useState } from 'react'
// import axios from 'axios'
import { Input } from '@/components/ui/input'
import { X, Search } from 'lucide-react'
// import debounce from 'lodash/debounce'
import { useStickySearch } from '@/contexts/sticky-search'

interface Props {
  initialSearch?: string | null
  onSearch: (term: string) => void
}

export default function EmployeeSearch({
  initialSearch,
  onSearch,
}: Props) {
  const [search, setSearch] = useState<string>(initialSearch ?? '')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLFormElement>(null)
  const focusedRef = useRef(false)
  const userTyping = useRef(false)

  // Sticky search context integration
  const sticky = useStickySearch()
  // Register on mount
  useEffect(() => {
    const unregister = sticky.register({ onSearch, initialTerm: initialSearch ?? '', placeholder: 'Search employees...' })
    return unregister
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep term in context in sync only when user changes it here, and also mirror context->local when it changes elsewhere (e.g., sticky header)
  const updateStickyTerm = sticky.updateTerm;
  useEffect(() => {
    updateStickyTerm(search)
  }, [search, updateStickyTerm])

  // If the header updates the term, reflect it in the main input value so they always match
  useEffect(() => {
    if (!focusedRef.current && !userTyping.current && sticky.term !== search) {
      setSearch(sticky.term)
    }
  }, [sticky.term, search])

  // Debounced search is centralized in context; call it directly here to match sticky behavior

  // Do not auto-trigger on mount. We trigger only on user input via onChange below.

  // Observe visibility to toggle header sticky search
  useEffect(() => {
    const el = containerRef.current
    if (!el || !('IntersectionObserver' in window)) return
    // Try to find the Radix ScrollArea viewport to observe within the scrolling container
    const scrollRoot = document.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        sticky.setSourceVisible(entry.isIntersecting)
      },
      { root: scrollRoot ?? null, threshold: 0 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [sticky])

  // Fetch hints
  // useEffect(() => {
  //   const q = search.trim()
  //   if (!q) {
  //     setHints([])
  //     return
  //   }
  //   axios
  //     .get('/employees/hints', { params: { q } })
  //     .then(r => setHints(Array.isArray(r.data) ? r.data : []))
  //     .catch(() => setHints([]))
  // }, [search])

  const handleClear = () => {
    setSearch('')
    sticky.triggerSearch('')
    // inputRef.current?.focus()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const term = search.trim()
    sticky.triggerSearch(term)
    inputRef.current?.blur() // 👈 blur the input
  }

  return (
    <form ref={containerRef} onSubmit={handleSubmit} className="mb-4 max-w-[20rem] relative">
      <div className="relative w-full">
        {/* Left Search Icon */}
        <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center text-gray-500 dark:text-gray-400">
          <Search size={16} />
        </div>
        <Input
          ref={inputRef}
          value={search}
          onChange={e => {
            userTyping.current = true
            setSearch(e.target.value)
            // keep context term and trigger debounced search only on user input
            sticky.updateTerm(e.target.value)
            sticky.triggerSearchDebounced(e.target.value.trim())
          }}
          onFocus={() => { focusedRef.current = true }}
          onBlur={() => { focusedRef.current = false; userTyping.current = false }}
          placeholder="Search employees..."
          className="pl-8 pr-10 w-full"
        />

        {/* Right Clear Button */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center">
          <button
            type="button"
            onClick={handleClear}
            tabIndex={-1}
            className={`
              transition-all duration-200 ease-in-out
              ${search ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}
              text-gray-500 dark:text-gray-400
            `}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </form>
  )
}
