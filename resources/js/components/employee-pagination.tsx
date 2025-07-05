import { router } from '@inertiajs/react'
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
  searchTerm?: string
  onPageChange: (page: number) => void
}

export default function EmployeePagination({
  currentPage,
  totalPages,
  searchTerm = '',
  onPageChange,
}: Props) {
  // generate window of pages
  let pages: (number | string)[] = []
  if (totalPages <= 3) {
    pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  } else if (currentPage === 1) {
    pages = [1, 2, '…', totalPages]
  } else if (currentPage === totalPages) {
    pages = [1, '…', totalPages - 1, totalPages]
  } else {
    pages = [1, '…', currentPage, '…', totalPages]
  }

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    onPageChange(page)
  }

  return (
    <Pagination className="select-none">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
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
                onClick={e => {
                  e.preventDefault()
                  goToPage(p)
                }}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ) : (
            <PaginationItem key={`el-${idx}`}>
              <span className="px-2">{p}</span>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            disabled={currentPage === totalPages}
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
