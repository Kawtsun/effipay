import React, { useState, useRef, useEffect, useMemo } from 'react'
// import axios from 'axios'
import { Input } from '@/components/ui/input'
import { X, Search } from 'lucide-react'
import debounce from 'lodash/debounce'

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
  const didMount = useRef(false)

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((term: string) => {
        onSearch(term.trim())
      }, 200),
    [onSearch]
  )

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
    } else {
      debouncedSearch(search)
    }
    return () => debouncedSearch.cancel()
  }, [search, debouncedSearch])

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
    onSearch('')
    // inputRef.current?.focus()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const term = search.trim()
    onSearch(term)
    inputRef.current?.blur() // 👈 blur the input
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 max-w-md relative">
      <div className="relative w-full">
        {/* Left Search Icon */}
        <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center text-gray-500 dark:text-gray-400">
          <Search size={16} />
        </div>
        <Input
          ref={inputRef}
          value={search}
          onChange={e => {
            setSearch(e.target.value)
          }}
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
