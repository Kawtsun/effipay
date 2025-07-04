import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { router } from "@inertiajs/react";

interface EmployeePaginationProps {
    currentPage: number;
    totalPages: number;
}

export default function EmployeePagination({ currentPage, totalPages }: EmployeePaginationProps) {
    const goToPage = (page: number) => {
        if (page !== currentPage && page > 0 && page <= totalPages) {
            router.visit(`/employees?page=${page}`);
        }
    };

    // Calculate which page numbers to show (max 3)
    let pages: (number | string)[] = [];
    if (totalPages <= 3) {
        pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else if (currentPage === 1) {
        pages = [1, 2, '...'];
    } else if (currentPage === totalPages) {
        pages = ['...', totalPages - 1, totalPages];
    } else {
        pages = ['...', currentPage, '...'];
    }

    return (
        <Pagination className="select-none user-select-none">
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        className={`select-none user-select-none ${currentPage === 1 ? "pointer-events-none opacity-50" : ""}`}
                        onClick={e => {
                            e.preventDefault();
                            goToPage(currentPage - 1);
                        }}
                        aria-disabled={currentPage === 1}
                    />
                </PaginationItem>
                {pages.map((page, idx) =>
                    typeof page === "number" ? (
                        <PaginationItem key={page}>
                            <PaginationLink
                                className="select-none user-select-none"
                                isActive={page === currentPage}
                                onClick={e => {
                                    e.preventDefault();
                                    goToPage(page);
                                }}
                            >
                                {page}
                            </PaginationLink>
                        </PaginationItem>
                    ) : (
                        <PaginationItem key={`ellipsis-${idx}`}>
                            <span className="px-2 select-none user-select-none">...</span>
                        </PaginationItem>
                    )
                )}
                <PaginationItem>
                    <PaginationNext
                        className={`select-none user-select-none ${currentPage === totalPages ? "pointer-events-none opacity-50" : ""}`}
                        onClick={e => {
                            e.preventDefault();
                            goToPage(currentPage + 1);
                        }}
                        aria-disabled={currentPage === totalPages}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}