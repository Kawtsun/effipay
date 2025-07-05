import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface Props {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function EmployeePagination({
  currentPage,
  totalPages,
  onPageChange,
}: Props) {
  const generatePages = (): (number | string)[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | string)[] = [1]

    if (currentPage > 3) pages.push('…')

    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (currentPage < totalPages - 2) pages.push('…')

    pages.push(totalPages)

    return pages
  }

  const pages = generatePages()

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    onPageChange(page)
  }

  return (
    <Pagination className="select-none">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            aria-label="Previous page"
            className={currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}
            disabled={currentPage === 1}
            onClick={e => {
              e.preventDefault()
              goToPage(currentPage - 1)
            }}
          />
        </PaginationItem>

        {pages.map((p, idx) =>
          typeof p === 'number' ? (
            <PaginationItem key={p}>
              <PaginationLink
                isActive={p === currentPage}
                aria-current={p === currentPage ? 'page' : undefined}
                onClick={e => {
                  e.preventDefault()
                  goToPage(p)
                }}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ) : (
            <PaginationItem key={`ellipsis-${idx}`}>
              <span className="px-2 text-muted-foreground select-none">…</span>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            disabled={currentPage === totalPages}
            aria-disabled={currentPage === totalPages}
            className={currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}
            onClick={e => {
              e.preventDefault()
              if (currentPage === totalPages) return
              goToPage(currentPage + 1)
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
