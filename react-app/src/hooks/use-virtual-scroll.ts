import { useState, useEffect, useCallback, useMemo } from 'react';

interface UseVirtualScrollProps {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export const useVirtualScroll = ({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 5,
}: UseVirtualScrollProps) => {
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      itemCount - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight)
    );

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(itemCount - 1, end + overscan),
    };
  }, [scrollTop, itemHeight, containerHeight, itemCount, overscan]);

  const totalHeight = itemCount * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return {
    visibleRange,
    totalHeight,
    offsetY,
    handleScroll,
  };
};