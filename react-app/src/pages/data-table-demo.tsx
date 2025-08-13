import { useState, useMemo } from 'react';
import { DataTable } from '../components/ui/data-table';
import { TrashIcon } from '../components/ui/icons';
import { Employee, generateSampleEmployees } from '../services/sample-data';
import { Column, SortConfig, FilterConfig, PaginationConfig, BulkAction } from '../types/data-table';

export const DataTableDemo = () => {
  const [data] = useState<Employee[]>(() => generateSampleEmployees(1000));
  const [sorting, setSorting] = useState<SortConfig<Employee> | null>(null);
  const [filtering, setFiltering] = useState<FilterConfig>({});
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    pageSize: 25,
    total: 0,
  });
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());
  const [virtualScrollingEnabled, setVirtualScrollingEnabled] = useState(false);

  const columns: Column<Employee>[] = useMemo(() => [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      filterable: true,
      width: 200,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      filterable: true,
      width: 250,
    },
    {
      key: 'department',
      label: 'Department',
      sortable: true,
      filterable: true,
      width: 150,
      filter: {
        type: 'select',
        options: [
          { label: 'Engineering', value: 'Engineering' },
          { label: 'Marketing', value: 'Marketing' },
          { label: 'Sales', value: 'Sales' },
          { label: 'HR', value: 'HR' },
          { label: 'Finance', value: 'Finance' },
          { label: 'Operations', value: 'Operations' },
        ],
      },
    },
    {
      key: 'position',
      label: 'Position',
      sortable: true,
      filterable: true,
      width: 200,
    },
    {
      key: 'salary',
      label: 'Salary',
      sortable: true,
      filterable: true,
      width: 120,
      render: (value) => `$${Number(value).toLocaleString()}`,
    },
    {
      key: 'startDate',
      label: 'Start Date',
      sortable: true,
      filterable: true,
      width: 120,
      render: (value) => new Date(String(value)).toLocaleDateString(),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      width: 100,
      render: (value) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            value === 'active'
              ? 'bg-green-100 text-green-800'
              : value === 'inactive'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {String(value)}
        </span>
      ),
      filter: {
        type: 'select',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Pending', value: 'pending' },
        ],
      },
    },
  ], []);

  const bulkActions: BulkAction<Employee>[] = [
    {
      label: 'Delete Selected',
      icon: <TrashIcon />,
      action: (selectedEmployees) => {
        alert(`Deleting ${selectedEmployees.length} employees:\n${selectedEmployees.map(e => e.name).join('\n')}`);
        setSelectedRows(new Set());
      },
    },
    {
      label: 'Export Selected',
      action: (selectedEmployees) => {
        const csv = [
          'Name,Email,Department,Position,Salary,Start Date,Status',
          ...selectedEmployees.map(emp => 
            `${emp.name},${emp.email},${emp.department},${emp.position},${emp.salary},${emp.startDate},${emp.status}`
          )
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'selected-employees.csv';
        a.click();
        URL.revokeObjectURL(url);
      },
    },
  ];

  const selection = {
    selectedRows,
    onSelectionChange: setSelectedRows,
    getRowId: (row: Employee) => row.id,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">DataTable Demo</h1>
        <p className="text-gray-600">
          Advanced data table with sorting, filtering, pagination, row selection, and virtual scrolling.
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Total Records: {data.length}</span>
          <span className="text-sm text-gray-500">|</span>
          <span className="text-sm text-gray-700">Selected: {selectedRows.size}</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={virtualScrollingEnabled}
              onChange={(e) => setVirtualScrollingEnabled(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Virtual Scrolling</span>
          </label>
          
          <button
            onClick={() => {
              setSorting(null);
              setFiltering({});
              setSelectedRows(new Set());
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            Reset All
          </button>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        data={data}
        columns={columns}
        sorting={sorting}
        onSortingChange={setSorting}
        filtering={filtering}
        onFilteringChange={setFiltering}
        pagination={virtualScrollingEnabled ? undefined : pagination}
        onPaginationChange={virtualScrollingEnabled ? undefined : setPagination}
        selection={selection}
        bulkActions={bulkActions}
        virtualScrolling={virtualScrollingEnabled}
        height={virtualScrollingEnabled ? 600 : undefined}
        className="shadow-sm"
        emptyStateText="No employees found"
      />

      {/* Feature Summary */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Features Demonstrated</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Sorting & Filtering</h3>
            <ul className="text-gray-600 space-y-1">
              <li>• Click column headers to sort</li>
              <li>• Filter inputs below headers</li>
              <li>• Select dropdowns for enum values</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Selection & Actions</h3>
            <ul className="text-gray-600 space-y-1">
              <li>• Individual row selection</li>
              <li>• Select all functionality</li>
              <li>• Bulk action buttons</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Performance</h3>
            <ul className="text-gray-600 space-y-1">
              <li>• Pagination (default mode)</li>
              <li>• Virtual scrolling option</li>
              <li>• TypeScript generics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};