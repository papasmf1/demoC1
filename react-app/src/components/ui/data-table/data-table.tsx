import { useMemo } from 'react';
import { DataTableProps } from '../../../types/data-table';
import { TableHeader } from './table-header';
import { TableRow } from './table-row';
import { VirtualTableBody } from './virtual-table-body';
import { Pagination } from './pagination';
import { BulkActions } from './bulk-actions';
import { LoadingSpinner } from '../loading-spinner';

export const DataTable = <T,>({
  data,
  columns,
  loading = false,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  filtering,
  onFilteringChange,
  selection,
  bulkActions = [],
  virtualScrolling = false,
  height = 400,
  className = '',
  emptyStateText = 'No data available',
}: DataTableProps<T>) => {
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply filtering
    if (filtering) {
      result = result.filter((row) => {
        return Object.entries(filtering).every(([key, filterValue]) => {
          if (!filterValue) return true;
          
          const cellValue = String(row[key as keyof T] ?? '').toLowerCase();
          const filter = String(filterValue).toLowerCase();
          
          return cellValue.includes(filter);
        });
      });
    }

    // Apply sorting
    if (sorting) {
      result.sort((a, b) => {
        const aValue = a[sorting.key];
        const bValue = b[sorting.key];
        
        if (aValue === bValue) return 0;
        
        const comparison = aValue < bValue ? -1 : 1;
        return sorting.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, filtering, sorting]);

  const paginatedData = useMemo(() => {
    if (!pagination) return filteredAndSortedData;
    
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    
    return filteredAndSortedData.slice(startIndex, endIndex);
  }, [filteredAndSortedData, pagination]);

  const displayData = virtualScrolling ? filteredAndSortedData : paginatedData;

  const selectedRowsData = useMemo(() => {
    if (!selection) return [];
    
    return displayData.filter((row) => {
      const rowId = selection.getRowId(row);
      return selection.selectedRows.has(rowId);
    });
  }, [displayData, selection]);

  const allRowIds = useMemo(() => {
    if (!selection) return [];
    return displayData.map(row => selection.getRowId(row));
  }, [displayData, selection]);

  const handleClearSelection = () => {
    selection?.onSelectionChange(new Set());
  };

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Bulk Actions */}
      {selection && bulkActions.length > 0 && (
        <div className="p-4">
          <BulkActions
            selectedRows={selectedRowsData}
            bulkActions={bulkActions}
            onClearSelection={handleClearSelection}
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden">
        {virtualScrolling ? (
          <div>
            {/* Header for virtual scrolling */}
            <table className="min-w-full">
              <TableHeader
                columns={columns}
                sorting={sorting}
                onSortingChange={onSortingChange}
                filtering={filtering}
                onFilteringChange={onFilteringChange}
                selection={selection}
                allRowIds={allRowIds}
              />
            </table>
            
            {/* Virtual scrollable body */}
            <VirtualTableBody
              data={displayData}
              columns={columns}
              selection={selection}
              height={typeof height === 'number' ? height : 400}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <TableHeader
                columns={columns}
                sorting={sorting}
                onSortingChange={onSortingChange}
                filtering={filtering}
                onFilteringChange={onFilteringChange}
                selection={selection}
                allRowIds={allRowIds}
              />
              <tbody className="bg-white divide-y divide-gray-200" role="rowgroup">
                {displayData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + (selection ? 1 : 0)}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      {emptyStateText}
                    </td>
                  </tr>
                ) : (
                  displayData.map((row, index) => (
                    <TableRow
                      key={index}
                      row={row}
                      index={index}
                      columns={columns}
                      selection={selection}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && onPaginationChange && !virtualScrolling && (
        <Pagination
          pagination={{
            ...pagination,
            total: filteredAndSortedData.length,
          }}
          onPaginationChange={onPaginationChange}
        />
      )}

      {/* Virtual scrolling info */}
      {virtualScrolling && (
        <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-700">
          Showing {displayData.length} of {filteredAndSortedData.length} rows
        </div>
      )}
    </div>
  );
};