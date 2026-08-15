import React, { useState, useMemo } from 'react';
import { cn } from '@/utils/cn';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Inbox,
  Filter,
} from 'lucide-react';

/**
 * Helper to safely extract nested property values from an object using dot notation.
 * e.g., getNestedValue({ user: { name: 'John' } }, 'user.name') => 'John'
 */
function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

/**
 * Standard reusable DataTable matching GymPulse layout specifications.
 */
export function DataTable({
  columns = [],
  data = [],
  loading = false,
  searchable = false,
  searchPlaceholder = 'Search records...',
  searchKeys = [],
  selectable = false,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  onRowClick,
  emptyMessage = 'No records found',
  emptyIcon: EmptyIcon = Inbox,
  pageSizeOptions = [10, 20, 50, 100],
  defaultPageSize = 10,
  serverPagination = false,
  totalCount,
  currentPage: externalPage,
  onPageChange: externalPageChange,
  onPageSizeChange: externalPageSizeChange,
  filters = null,
  activeFilterCount = 0,
  className,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [internalPageSize, setInternalPageSize] = useState(defaultPageSize);
  const [internalPage, setInternalPage] = useState(1);

  const isServerPagination = serverPagination && totalCount !== undefined;
  const pageSize = isServerPagination ? defaultPageSize : internalPageSize;
  const page = isServerPagination ? externalPage || 1 : internalPage;

  // 1. Search filtering (Client-side)
  const searchedData = useMemo(() => {
    if (isServerPagination || !searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((row) => {
      if (searchKeys.length > 0) {
        return searchKeys.some((key) => {
          const val = getNestedValue(row, key);
          return val != null && String(val).toLowerCase().includes(term);
        });
      }
      return Object.values(row).some((val) => {
        if (val == null) return false;
        if (typeof val === 'object') {
          return Object.values(val).some(
            (nestedVal) => nestedVal != null && String(nestedVal).toLowerCase().includes(term)
          );
        }
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm, searchKeys, isServerPagination]);

  // 2. Sorting (Client-side)
  const sortedData = useMemo(() => {
    if (isServerPagination || !sortConfig.key) return searchedData;

    return [...searchedData].sort((a, b) => {
      const aVal = getNestedValue(a, sortConfig.key);
      const bVal = getNestedValue(b, sortConfig.key);

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [searchedData, sortConfig, isServerPagination]);

  // 3. Pagination (Client-side)
  const totalItems = isServerPagination ? totalCount : sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const paginatedData = useMemo(() => {
    if (isServerPagination) return data;
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize, isServerPagination, data]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handlePageChange = (newPage) => {
    const clamped = Math.max(1, Math.min(newPage, totalPages));
    if (isServerPagination) {
      externalPageChange?.(clamped);
    } else {
      setInternalPage(clamped);
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value);
    if (isServerPagination) {
      externalPageSizeChange?.(newSize);
    } else {
      setInternalPageSize(newSize);
      setInternalPage(1);
    }
  };

  const isAllSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row) => selectedIds.includes(row.id));

  return (
    <div className={cn('bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden space-y-0', className)}>
      {/* Search & Filter Header Toolbar */}
      {(searchable || filters) && (
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          {searchable && (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (!isServerPagination) setInternalPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
            </div>
          )}

          {filters && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {activeFilterCount} active
                </span>
              )}
              {filters}
            </div>
          )}
        </div>
      )}

      {/* Mobile Card List View (< md screens) */}
      <div className="block md:hidden divide-y divide-slate-100 bg-white">
        {loading ? (
          Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, idx) => (
            <div key={idx} className="p-4 space-y-3 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-3 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-2/3" />
            </div>
          ))
        ) : paginatedData.length === 0 ? (
          <div className="px-4 py-12 text-center text-slate-400">
            <EmptyIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-500">{emptyMessage}</p>
          </div>
        ) : (
          paginatedData.map((row, rowIndex) => {
            const isSelected = selectedIds.includes(row.id);
            const statusOrBadgeCol = columns.find(
              (c) => c.key === 'status' || c.label?.toLowerCase() === 'status'
            );
            const actionCol = columns.find(
              (c) => c.key === 'actions' || c.label?.toLowerCase() === 'actions' || c.label === 'Action'
            );

            return (
              <div
                key={row.id || rowIndex}
                className={cn(
                  'p-4 transition-colors hover:bg-slate-50/80 space-y-2.5',
                  isSelected && 'bg-emerald-50/30',
                  onRowClick && 'cursor-pointer active:bg-slate-100'
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {/* Header row of card: Checkbox + First Column label/value + Status badge */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {selectable && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          onSelectRow && onSelectRow(row);
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20"
                      />
                    )}
                    {columns[0] && (
                      <div className="font-semibold text-slate-900 text-sm truncate">
                        {columns[0].render
                          ? columns[0].render(row, getNestedValue(row, columns[0].key))
                          : getNestedValue(row, columns[0].key) ?? '—'}
                      </div>
                    )}
                  </div>

                  {statusOrBadgeCol && statusOrBadgeCol !== columns[0] && (
                    <div className="shrink-0">
                      {statusOrBadgeCol.render
                        ? statusOrBadgeCol.render(row, getNestedValue(row, statusOrBadgeCol.key))
                        : getNestedValue(row, statusOrBadgeCol.key)}
                    </div>
                  )}
                </div>

                {/* Key-Value fields grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs pt-1">
                  {columns.slice(1).map((col) => {
                    if (col === statusOrBadgeCol || col === actionCol) return null;
                    const cellValue = getNestedValue(row, col.key);
                    return (
                      <div key={col.key} className={cn('space-y-0.5', col.className)}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          {col.label}
                        </p>
                        <div className="text-slate-800 font-medium break-words">
                          {col.render ? col.render(row, cellValue) : cellValue ?? '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom action bar */}
                {actionCol && (
                  <div
                    className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {actionCol.render
                      ? actionCol.render(row, getNestedValue(row, actionCol.key))
                      : getNestedValue(row, actionCol.key)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Main Table View (>= md screens) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-600">
              {selectable && (
                <th className="w-10 px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={() => onSelectAll && onSelectAll(paginatedData)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3.5 select-none',
                    col.sortable && 'cursor-pointer hover:bg-slate-100/80 transition-colors',
                    col.width,
                    col.className
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span className="text-slate-400">
                        {sortConfig.key === col.key ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 bg-white">
            {loading ? (
              Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  {selectable && (
                    <td className="px-4 py-3.5">
                      <div className="w-4 h-4 bg-slate-200 rounded" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <div className="h-4 bg-slate-200 rounded w-2/3" />
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
                    {columns.map((col) => {
                      const cellValue = getNestedValue(row, col.key);
                      return (
                        <td
                          key={col.key}
                          className={cn(
                            'px-4 py-3.5 text-slate-800',
                            col.width,
                            col.className
                          )}
                        >
                          {col.render
                            ? col.render(row, cellValue)
                            : cellValue ?? '—'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 px-3 sm:px-4 py-3 border-t border-slate-200/80 bg-slate-50/50">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-center sm:text-left">
            <span>
              Showing{' '}
              <span className="font-semibold text-slate-700">
                {Math.min((page - 1) * pageSize + 1, totalItems)}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(page * pageSize, totalItems)}
              </span>{' '}
              of <span className="font-semibold text-slate-700">{totalItems}</span> results
            </span>

            <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
              className="p-1.5 rounded hover:bg-slate-200/60 disabled:opacity-40 disabled:hover:bg-transparent text-slate-600 transition-colors"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="p-1.5 rounded hover:bg-slate-200/60 disabled:opacity-40 disabled:hover:bg-transparent text-slate-600 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="p-1.5 rounded hover:bg-slate-200/60 disabled:opacity-40 disabled:hover:bg-transparent text-slate-600 transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={page === totalPages}
              className="p-1.5 rounded hover:bg-slate-200/60 disabled:opacity-40 disabled:hover:bg-transparent text-slate-600 transition-colors"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
