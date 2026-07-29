import { useState, useMemo } from 'react';
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Inbox,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Input } from './Input';
import { Select } from './Select';
import { Skeleton } from './Skeleton';

/**
 * DataTable matching the exact table design in members.png and admin dashboard.png mockups.
 */

function DataTable({
  columns = [],
  data = [],
  loading = false,
  // Search
  searchable = true,
  searchPlaceholder = 'Search...',
  searchValue: controlledSearch,
  onSearchChange,
  searchKeys = [],
  // Sorting
  defaultSortKey,
  defaultSortDir = 'asc',
  // Pagination
  pagination: paginationConfig,
  onPageChange,
  onPageSizeChange,
  clientPagination = true,
  pageSizeOptions = [10, 20, 50],
  defaultPageSize = 10,
  // Interaction
  onRowClick,
  selectable = false,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  // Styling
  className,
  emptyMessage = 'No records found',
  emptyIcon: EmptyIcon = Inbox,
  // Extra toolbar content
  toolbar,
}) {
  const [localSearch, setLocalSearch] = useState('');
  const [sortKey, setSortKey] = useState(defaultSortKey || null);
  const [sortDir, setSortDir] = useState(defaultSortDir);
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(defaultPageSize);

  const searchTerm = controlledSearch !== undefined ? controlledSearch : localSearch;
  const handleSearch = (e) => {
    const value = e.target.value;
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setLocalSearch(value);
      setLocalPage(1);
    }
  };

  // ── Client-Side Filtering ──
  const filteredData = useMemo(() => {
    if (!searchTerm || onSearchChange) return data;

    const term = searchTerm.toLowerCase();
    const keys = searchKeys.length > 0 ? searchKeys : columns.map((c) => c.key);

    return data.filter((row) =>
      keys.some((key) => {
        const value = getNestedValue(row, key);
        return value != null && String(value).toLowerCase().includes(term);
      })
    );
  }, [data, searchTerm, searchKeys, columns, onSearchChange]);

  // ── Client-Side Sorting ──
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = getNestedValue(a, sortKey);
      const bVal = getNestedValue(b, sortKey);

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime();
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDir === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDir]);

  // ── Pagination ──
  const isServerPagination = !!paginationConfig;
  const page = isServerPagination ? paginationConfig.page : localPage;
  const pageSize = isServerPagination ? paginationConfig.pageSize : localPageSize;
  const totalItems = isServerPagination ? paginationConfig.total : sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const paginatedData = useMemo(() => {
    if (isServerPagination || !clientPagination) return sortedData;
    const start = (localPage - 1) * localPageSize;
    return sortedData.slice(start, start + localPageSize);
  }, [sortedData, localPage, localPageSize, isServerPagination, clientPagination]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setLocalPage(newPage);
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value);
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    } else {
      setLocalPageSize(newSize);
      setLocalPage(1);
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  const allSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row) => selectedIds.includes(row.id));

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar: Search + Custom Actions */}
      {(searchable || toolbar) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {searchable && (
            <div className="w-full sm:w-72">
              <Input
                icon={Search}
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          )}
          {toolbar && <div className="flex items-center gap-2 w-full sm:w-auto">{toolbar}</div>}
        </div>
      )}

      {/* Table Container matching mockup */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-sm">
          {/* Header */}
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              {selectable && (
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAll && onSelectAll(e.target.checked, paginatedData)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider',
                    col.sortable && 'cursor-pointer select-none hover:text-slate-900 transition-colors',
                    col.width,
                    col.headerClassName
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && (
                      <span className="inline-flex flex-col">
                        {sortKey === col.key ? (
                          sortDir === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-emerald-700" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  {selectable && (
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-4 w-4 rounded" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <Skeleton className="h-4 w-full bg-slate-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <EmptyIcon className="w-10 h-10 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => {
                const isSelected = selectedIds.includes(row.id);
                return (
                  <tr
                    key={row.id || rowIndex}
                    className={cn(
                      'transition-colors hover:bg-slate-50/80',
                      isSelected && 'bg-emerald-50/30',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {selectable && (
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onSelectRow && onSelectRow(row)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-4 py-3.5 text-slate-800',
                          col.width,
                          col.className
                        )}
                      >
                        {col.render
                          ? col.render(getNestedValue(row, col.key), row)
                          : getNestedValue(row, col.key) ?? '—'}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer matching mockup */}
      {!loading && totalItems > 0 && (clientPagination || isServerPagination) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              Showing {startItem}–{endItem} of {totalItems}
            </span>
            <Select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="!py-1 !text-xs w-20"
              containerClassName="w-auto"
              placeholder=""
              options={pageSizeOptions.map((s) => ({ value: s, label: `${s}` }))}
            />
          </div>

          <div className="flex items-center gap-1">
            <PaginationButton
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </PaginationButton>
            <PaginationButton
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </PaginationButton>

            {getPageNumbers(page, totalPages).map((p, i) =>
              p === '...' ? (
                <span key={`dots-${i}`} className="px-1.5 text-slate-400">
                  …
                </span>
              ) : (
                <PaginationButton
                  key={p}
                  onClick={() => handlePageChange(p)}
                  active={p === page}
                >
                  {p}
                </PaginationButton>
              )
            )}

            <PaginationButton
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </PaginationButton>
            <PaginationButton
              onClick={() => handlePageChange(totalPages)}
              disabled={page === totalPages}
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </PaginationButton>
          </div>
        </div>
      )}
    </div>
  );
}

function PaginationButton({ children, onClick, disabled, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-medium transition-all border',
        active
          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50',
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
      )}
    >
      {children}
    </button>
  );
}

function getNestedValue(obj, path) {
  if (!path) return undefined;
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

function getPageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [];

  if (current <= 3) {
    pages.push(1, 2, 3, 4, '...', total);
  } else if (current >= total - 2) {
    pages.push(1, '...', total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }

  return pages;
}

export { DataTable };
