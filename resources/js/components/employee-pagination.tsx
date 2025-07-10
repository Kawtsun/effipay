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
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    onPageChange(page)
  }

  const getPages = (): (number | string)[] => {
    const pages: (number | string)[] = []

    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    if (currentPage <= 3) {
      pages.push(1, 2, 3, '…', totalPages)
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '…', totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, '…', currentPage, '…', totalPages)
    }

    return pages
  }

  const pages = getPages()

  return (
    <Pagination className="select-none">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            aria-label="Previous page"
            disabled={currentPage === 1}
            className={currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}
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
            aria-label="Next page"
            disabled={currentPage === totalPages}
            className={currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}
            onClick={e => {
              e.preventDefault()
              goToPage(currentPage + 1)
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
