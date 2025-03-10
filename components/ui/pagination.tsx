// pagination.tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

interface PaginationProps {
  totalPages: number
  currentPage: number
  totalCount: number
  onPageChange: (page: number) => void // Add onPageChange prop
}

export function Pagination({ totalPages, currentPage, totalCount, onPageChange }: PaginationProps) {
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="flex items-center justify-between space-x-6">
      <div className="text-sm text-muted-foreground">Total documents: {totalCount}</div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          disabled={currentPage <= 1}
          aria-label="Go to previous page"
          onClick={() => onPageChange(currentPage - 1)} // Handle page change
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        {pageNumbers.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(page)} // Handle page change
          >
            {page}
          </Button>
        ))}
        <Button
          variant="outline"
          size="icon"
          disabled={currentPage >= totalPages}
          aria-label="Go to next page"
          onClick={() => onPageChange(currentPage + 1)} // Handle page change
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
