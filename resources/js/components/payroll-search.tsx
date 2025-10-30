import { useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'

export interface PayrollSearchProps {
  value: string
  onChange: (term: string) => void
  placeholder?: string
  className?: string
}

export default function PayrollSearch({ value, onChange, placeholder = 'Search', className }: PayrollSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); inputRef.current?.blur() }}
      className={`relative mb-0 max-w-[16rem] ${className ?? ''}`}
    >
      {/* Left icon */}
      <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center text-gray-500 dark:text-gray-400">
        <Search size={16} />
      </div>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-10"
      />
      {/* Clear button */}
      <button
        type="button"
        onClick={() => { onChange(''); inputRef.current?.focus() }}
        className={`absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 transition-all duration-200 ease-in-out ${value ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}
        tabIndex={-1}
      >
        <X size={16} />
      </button>
    </form>
  )
}
