import { BulkAction } from '../../../types/data-table';

interface BulkActionsProps<T> {
  selectedRows: T[];
  bulkActions: BulkAction<T>[];
  onClearSelection: () => void;
}

export const BulkActions = <T,>({
  selectedRows,
  bulkActions,
  onClearSelection,
}: BulkActionsProps<T>) => {
  if (selectedRows.length === 0) return null;

  return (
    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="flex items-center space-x-3">
        <span className="text-sm font-medium text-blue-900">
          {selectedRows.length} item{selectedRows.length !== 1 ? 's' : ''} selected
        </span>
        <button
          onClick={onClearSelection}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Clear selection
        </button>
      </div>
      
      <div className="flex items-center space-x-2">
        {bulkActions.map((action, index) => (
          <button
            key={index}
            onClick={() => action.action(selectedRows)}
            disabled={action.disabled?.(selectedRows)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`${action.label} for ${selectedRows.length} selected items`}
          >
            {action.icon && <span className="mr-1">{action.icon}</span>}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};