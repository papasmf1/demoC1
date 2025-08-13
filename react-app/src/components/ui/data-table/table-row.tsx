import { Column, SelectionConfig } from '../../../types/data-table';

interface TableRowProps<T> {
  row: T;
  index: number;
  columns: Column<T>[];
  selection?: SelectionConfig<T>;
  style?: React.CSSProperties;
}

export const TableRow = <T,>({
  row,
  index,
  columns,
  selection,
  style,
}: TableRowProps<T>) => {
  const rowId = selection?.getRowId(row);
  const isSelected = selection && rowId !== undefined ? selection.selectedRows.has(rowId) : false;

  const handleRowSelection = () => {
    if (!selection || rowId === undefined) return;

    const newSelectedRows = new Set(selection.selectedRows);
    if (isSelected) {
      newSelectedRows.delete(rowId);
    } else {
      newSelectedRows.add(rowId);
    }
    selection.onSelectionChange(newSelectedRows);
  };

  return (
    <tr
      style={style}
      className={`${
        isSelected ? 'bg-blue-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
      } hover:bg-gray-100 transition-colors duration-150`}
      role="row"
      aria-selected={isSelected}
    >
      {selection && (
        <td className="w-12 px-6 py-4 whitespace-nowrap">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleRowSelection}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            aria-label={`Select row ${index + 1}`}
          />
        </td>
      )}
      {columns.map((column) => {
        const value = row[column.key];
        const cellContent = column.render
          ? column.render(value, row, index)
          : String(value ?? '');

        return (
          <td
            key={String(column.key)}
            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
            style={{ width: column.width }}
          >
            {cellContent}
          </td>
        );
      })}
    </tr>
  );
};