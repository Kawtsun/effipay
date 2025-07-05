import React, { useState, useRef, useEffect, useMemo } from 'react'
import axios from 'axios'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
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
  const [hints, setHints] = useState<string[]>([])
  const [showHint, setShowHint] = useState(false)
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
  useEffect(() => {
    const q = search.trim()
    if (!q) {
      setHints([])
      return
    }
    axios
      .get('/employees/hints', { params: { q } })
      .then(r => setHints(Array.isArray(r.data) ? r.data : []))
      .catch(() => setHints([]))
  }, [search])

  const handleClear = () => {
    setSearch('')
    setHints([])
    setShowHint(false)
    onSearch('')
    // inputRef.current?.focus()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const term = search.trim()
    setShowHint(false)
    onSearch(term)
    inputRef.current?.blur() // 👈 blur the input
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 max-w-md relative">
      <div className="relative flex items-center">
        <Input
          ref={inputRef}
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            setShowHint(true)
          }}
          onFocus={() => hints.length > 0 && setShowHint(true)}
          placeholder="Search employees..."
          className="pr-10 w-full"
        />

        {search && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
            tabIndex={-1}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showHint && hints.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded shadow">
          {hints.map((h, i) => (
            <li
              key={i}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              onMouseDown={() => {
                setSearch(h)
                setShowHint(false)
                onSearch(h)
                inputRef.current?.blur() // 👈 blur on hint click too
              }}
            >
              {h}
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}
