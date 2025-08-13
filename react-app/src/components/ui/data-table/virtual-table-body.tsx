import { useMemo } from 'react';
import { useVirtualScroll } from '../../../hooks/use-virtual-scroll';
import { Column, SelectionConfig } from '../../../types/data-table';
import { TableRow } from './table-row';

interface VirtualTableBodyProps<T> {
  data: T[];
  columns: Column<T>[];
  selection?: SelectionConfig<T>;
  height: number;
  rowHeight?: number;
}

export const VirtualTableBody = <T,>({
  data,
  columns,
  selection,
  height,
  rowHeight = 48,
}: VirtualTableBodyProps<T>) => {
  const { visibleRange, totalHeight, offsetY, handleScroll } = useVirtualScroll({
    itemCount: data.length,
    itemHeight: rowHeight,
    containerHeight: height,
    overscan: 5,
  });

  const visibleItems = useMemo(() => {
    return data.slice(visibleRange.start, visibleRange.end + 1);
  }, [data, visibleRange]);

  if (data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center text-gray-500 text-sm"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  return (
    <div
      className="overflow-auto"
      style={{ height }}
      onScroll={handleScroll}
      role="rowgroup"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          <table className="min-w-full">
            <tbody className="bg-white divide-y divide-gray-200">
              {visibleItems.map((row, virtualIndex) => {
                const actualIndex = visibleRange.start + virtualIndex;
                return (
                  <TableRow
                    key={actualIndex}
                    row={row}
                    index={actualIndex}
                    columns={columns}
                    selection={selection}
                    style={{ height: rowHeight }}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};