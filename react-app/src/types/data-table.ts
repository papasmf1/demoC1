export interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  render?: (value: T[keyof T], row: T, index: number) => React.ReactNode;
  filter?: {
    type: 'text' | 'select' | 'date' | 'number';
    options?: Array<{ label: string; value: string | number }>;
  };
}

export interface SortConfig<T> {
  key: keyof T;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  [key: string]: string | number | boolean;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

export interface SelectionConfig<T> {
  selectedRows: Set<string | number>;
  onSelectionChange: (selectedRows: Set<string | number>) => void;
  getRowId: (row: T) => string | number;
}

export interface BulkAction<T> {
  label: string;
  icon?: React.ReactNode;
  action: (selectedRows: T[]) => void;
  disabled?: (selectedRows: T[]) => boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: PaginationConfig;
  onPaginationChange?: (pagination: PaginationConfig) => void;
  sorting?: SortConfig<T>;
  onSortingChange?: (sorting: SortConfig<T> | null) => void;
  filtering?: FilterConfig;
  onFilteringChange?: (filtering: FilterConfig) => void;
  selection?: SelectionConfig<T>;
  bulkActions?: BulkAction<T>[];
  virtualScrolling?: boolean;
  height?: string | number;
  className?: string;
  emptyStateText?: string;
}