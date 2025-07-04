// components/employee-search.tsx
import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { router } from '@inertiajs/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface Props {
    initialSearch?: string | null
    onSearch?: (term: string) => void
}

export default function EmployeeSearch({
    initialSearch = '',
    onSearch,
}: Props) {
    const [search, setSearch] = useState(initialSearch ?? '')
    const [hints, setHints] = useState<string[]>([])
    const [showHint, setShowHint] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Bare‐bones fetch on EVERY keystroke
    useEffect(() => {
        if (!search.trim()) {
            console.log('Clearing hints because search is empty')
            setHints([])
            setShowHint(false)
            return
        }

        console.log('FETCH HINTS for:', search)
        axios
            .get('/employees/hints', {
                headers: { Accept: 'application/json' },
                withCredentials: true,
                params: { q: search },
            })
            .then(resp => {
                const arr = Array.isArray(resp.data) ? resp.data : []
                setHints(arr)
                setShowHint(arr.length > 0)
            })
            .catch(err => {
                console.error('HINTS ERROR:', err)
                setHints([])
                setShowHint(false)
            })
    }, [search])

    const runSearch = (term: string) => {
        router.visit('/employees', {
            method: 'get',
            data: term ? { search: term } : {},
            preserveState: true,
            preserveScroll: true,
        })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const term = search.trim()
            ; (onSearch ?? runSearch)(term)
        setShowHint(false)
    }

    const handleClear = () => {
        setSearch('')
        setHints([])
        setShowHint(false)
        inputRef.current?.focus()
            ; (onSearch ?? runSearch)('')
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="mb-4 max-w-md"
            autoComplete="off"
        >
            <div className="flex items-center gap-2 relative">
                {/* Input + hints container */}
                <div className="relative flex-1">
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Search employees..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onFocus={() => setShowHint(hints.length > 0)}
                        onBlur={() => setTimeout(() => setShowHint(false), 200)}
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

                    {showHint && hints.length > 0 && (
                        <ul className="absolute z-30 mt-1 w-full bg-white border border-gray-300 rounded shadow">
                            {hints.map((name, i) => (
                                <li
                                    key={i}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                    onMouseDown={() => {
                                        setSearch(name)
                                        setShowHint(false)
                                        inputRef.current?.focus()
                                    }}
                                >
                                    {name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Inline Search button */}
                <Button type="submit">Search</Button>
            </div>
        </form>
    )
}
