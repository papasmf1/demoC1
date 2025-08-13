import { Column, SortConfig, FilterConfig } from '../../../types/data-table';
import { ChevronUpIcon, ChevronDownIcon, FilterIcon } from '../icons';

interface TableHeaderProps<T> {
  columns: Column<T>[];
  sorting?: SortConfig<T>;
  onSortingChange?: (sorting: SortConfig<T> | null) => void;
  filtering?: FilterConfig;
  onFilteringChange?: (filtering: FilterConfig) => void;
  selection?: {
    selectedRows: Set<string | number>;
    onSelectionChange: (selectedRows: Set<string | number>) => void;
  };
  allRowIds?: Array<string | number>;
}

export const TableHeader = <T,>({
  columns,
  sorting,
  onSortingChange,
  filtering,
  onFilteringChange,
  selection,
  allRowIds = [],
}: TableHeaderProps<T>) => {
  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !onSortingChange) return;

    if (sorting?.key === column.key) {
      if (sorting.direction === 'asc') {
        onSortingChange({ key: column.key, direction: 'desc' });
      } else {
        onSortingChange(null);
      }
    } else {
      onSortingChange({ key: column.key, direction: 'asc' });
    }
  };

  const handleSelectAll = () => {
    if (!selection) return;

    const allSelected = allRowIds.every(id => selection.selectedRows.has(id));
    if (allSelected) {
      selection.onSelectionChange(new Set());
    } else {
      selection.onSelectionChange(new Set(allRowIds));
    }
  };

  const isAllSelected = allRowIds.length > 0 && allRowIds.every(id => selection?.selectedRows.has(id));
  const isIndeterminate = allRowIds.some(id => selection?.selectedRows.has(id)) && !isAllSelected;

  return (
    <thead className="bg-gray-50 sticky top-0 z-10">
      <tr>
        {selection && (
          <th className="w-12 px-6 py-3 text-left">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isIndeterminate;
              }}
              onChange={handleSelectAll}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              aria-label="Select all rows"
            />
          </th>
        )}
        {columns.map((column) => (
          <th
            key={String(column.key)}
            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
              column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
            }`}
            style={{ width: column.width }}
            onClick={() => handleSort(column)}
            role={column.sortable ? 'button' : undefined}
            tabIndex={column.sortable ? 0 : undefined}
            onKeyDown={(e) => {
              if (column.sortable && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                handleSort(column);
              }
            }}
            aria-sort={
              sorting?.key === column.key
                ? sorting.direction === 'asc'
                  ? 'ascending'
                  : 'descending'
                : 'none'
            }
          >
            <div className="flex items-center justify-between">
              <span>{column.label}</span>
              <div className="flex items-center space-x-1">
                {column.sortable && (
                  <div className="flex flex-col">
                    {sorting?.key === column.key ? (
                      sorting.direction === 'asc' ? (
                        <ChevronUpIcon className="w-3 h-3" />
                      ) : (
                        <ChevronDownIcon className="w-3 h-3" />
                      )
                    ) : (
                      <div className="w-3 h-3 opacity-30">
                        <ChevronUpIcon className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                )}
                {column.filterable && (
                  <FilterIcon className="w-3 h-3 text-gray-400" />
                )}
              </div>
            </div>
          </th>
        ))}
      </tr>
      {/* Filter Row */}
      {columns.some(col => col.filterable) && (
        <tr className="bg-white border-b">
          {selection && <th className="w-12 px-6 py-2"></th>}
          {columns.map((column) => (
            <th key={String(column.key)} className="px-6 py-2">
              {column.filterable && (
                <div>
                  {column.filter?.type === 'select' ? (
                    <select
                      value={filtering?.[String(column.key)] || ''}
                      onChange={(e) => {
                        onFilteringChange?.({
                          ...filtering,
                          [String(column.key)]: e.target.value,
                        });
                      }}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                      aria-label={`Filter by ${column.label}`}
                    >
                      <option value="">All</option>
                      {column.filter.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={column.filter?.type || 'text'}
                      placeholder={`Filter ${column.label.toLowerCase()}...`}
                      value={filtering?.[String(column.key)] || ''}
                      onChange={(e) => {
                        onFilteringChange?.({
                          ...filtering,
                          [String(column.key)]: e.target.value,
                        });
                      }}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                      aria-label={`Filter by ${column.label}`}
                    />
                  )}
                </div>
              )}
            </th>
          ))}
        </tr>
      )}
    </thead>
  );
};