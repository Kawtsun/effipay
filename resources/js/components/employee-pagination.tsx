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

    // Generate page numbers (simple version, can be improved for large sets)
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
    }

    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        onClick={() => goToPage(currentPage - 1)}
                        aria-disabled={currentPage === 1}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                </PaginationItem>
                {pages.map((page) => (
                    <PaginationItem key={page}>
                        <PaginationLink
                            isActive={page === currentPage}
                            onClick={() => goToPage(page)}
                        >
                            {page}
                        </PaginationLink>
                    </PaginationItem>
                ))}
                <PaginationItem>
                    <PaginationNext
                        onClick={() => goToPage(currentPage + 1)}
                        aria-disabled={currentPage === totalPages}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}
