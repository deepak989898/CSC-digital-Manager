"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "./Button";
import { ITEMS_PER_PAGE } from "@/lib/constants";

interface PaginationProps {
  totalItems: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
}

export function Pagination({
  totalItems,
  currentPage,
  onPageChange,
  itemsPerPage = ITEMS_PER_PAGE,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
      <p className="text-sm text-slate-500">
        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
        {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-slate-600">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function usePagination<T>(items: T[], itemsPerPage = ITEMS_PER_PAGE) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const paginatedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems,
    totalItems: items.length,
  };
}
