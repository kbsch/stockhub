import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';
import { ChartPoint } from '../lib/api';
import { useTheme } from '../hooks/useTheme';

interface ChartProps {
  data: ChartPoint[];
  isPositive: boolean;
}

const lightTheme = {
  textColor: '#6b7280',
  gridColor: '#e5e7eb',
  crosshairColor: '#9ca3af',
  labelBackgroundColor: '#f3f4f6',
  borderColor: '#e5e7eb',
};

const darkTheme = {
  textColor: '#9ca3af',
  gridColor: '#1f2937',
  crosshairColor: '#6b7280',
  labelBackgroundColor: '#374151',
  borderColor: '#374151',
};

export function Chart({ data, isPositive: _isPositive }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const { theme } = useTheme();

  const colors = theme === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    if (!containerRef.current) return;

    // Create chart
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: colors.textColor,
      },
      grid: {
        vertLines: { color: colors.gridColor },
        horzLines: { color: colors.gridColor },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: colors.crosshairColor,
          width: 1,
          style: 2,
          labelBackgroundColor: colors.labelBackgroundColor,
        },
        horzLine: {
          color: colors.crosshairColor,
          width: 1,
          style: 2,
          labelBackgroundColor: colors.labelBackgroundColor,
        },
      },
      rightPriceScale: {
        borderColor: colors.borderColor,
      },
      timeScale: {
        borderColor: colors.borderColor,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
      },
      handleScroll: {
        vertTouchDrag: false,
      },
    });

    // Create candlestick series
    const series = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // Handle resize
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    // Initial size
    handleResize();

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [theme, colors.textColor, colors.gridColor, colors.crosshairColor, colors.labelBackgroundColor, colors.borderColor]);

  // Update data when it changes or chart is recreated
  useEffect(() => {
    if (!seriesRef.current || !data.length) return;

    const chartData: CandlestickData<Time>[] = data.map((point) => ({
      time: point.time as Time,
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close,
    }));

    seriesRef.current.setData(chartData);

    // Fit content
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [data, theme]);

  return <div ref={containerRef} className="w-full h-full" />;
}
