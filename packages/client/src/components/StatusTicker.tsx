import { useRef, useEffect, useState, useCallback } from 'react';

interface StatusTickerProps {
  successSymbols?: string[];
  failedSymbols?: string[];
}

interface TickerSymbol {
  symbol: string;
  failed: boolean;
}

interface TickerSegment {
  id: number;
  symbols: TickerSymbol[];
}

// Scroll speed in pixels per second
const SCROLL_SPEED = 50;
// Width of each segment (approximate, will be measured)
const SEGMENT_WIDTH_ESTIMATE = 200;

export function StatusTicker({ successSymbols = [], failedSymbols = [] }: StatusTickerProps) {
  const [segments, setSegments] = useState<TickerSegment[]>([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const segmentIdRef = useRef(0);
  const lastFrameTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();

  // Get confirmed successful symbols
  const successTickerSymbols: TickerSymbol[] = successSymbols
    .map(s => ({ symbol: s, failed: false }));

  // Get confirmed failed symbols
  const failedTickerSymbols: TickerSymbol[] = failedSymbols
    .map(s => ({ symbol: s, failed: true }));

  // Combined symbols for segments (only confirmed ones)
  const allSymbols = [...successTickerSymbols, ...failedTickerSymbols];

  // Create a new segment with current symbols
  const createSegment = useCallback((): TickerSegment => {
    return {
      id: segmentIdRef.current++,
      symbols: [...allSymbols],
    };
  }, [allSymbols]);

  // Initialize segments
  useEffect(() => {
    if (allSymbols.length === 0) {
      setSegments([]);
      return;
    }

    // Calculate how many segments we need to fill the screen + buffer
    const screenWidth = window.innerWidth;
    const segmentsNeeded = Math.ceil((screenWidth * 2) / SEGMENT_WIDTH_ESTIMATE) + 2;

    const initialSegments: TickerSegment[] = [];
    for (let i = 0; i < segmentsNeeded; i++) {
      initialSegments.push({
        id: segmentIdRef.current++,
        symbols: [...allSymbols],
      });
    }
    setSegments(initialSegments);
    setScrollPosition(0);
  }, [allSymbols.length === 0]); // Only reset when going from 0 to some or some to 0

  // Animation loop
  useEffect(() => {
    if (segments.length === 0 || allSymbols.length === 0) return;

    const animate = (timestamp: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }

      const deltaTime = (timestamp - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = timestamp;

      setScrollPosition(prev => {
        const newPosition = prev + SCROLL_SPEED * deltaTime;

        // Check if we need to recycle segments
        if (contentRef.current) {
          const firstSegment = contentRef.current.firstElementChild as HTMLElement;
          if (firstSegment && newPosition > firstSegment.offsetWidth) {
            // Remove first segment and add new one at end
            setSegments(prevSegments => {
              if (prevSegments.length === 0) return prevSegments;
              const newSegments = [...prevSegments.slice(1)];
              newSegments.push(createSegment());
              return newSegments;
            });
            return newPosition - firstSegment.offsetWidth;
          }
        }

        return newPosition;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      lastFrameTimeRef.current = 0;
    };
  }, [segments.length > 0, allSymbols.length > 0, createSegment]);

  return (
    <div
      ref={containerRef}
      className="bg-gray-900 border-t border-gray-800 overflow-hidden flex-shrink-0"
    >
      <div className="py-2">
        {allSymbols.length === 0 ? (
          <span className="px-4 text-gray-600 font-mono text-sm">Waiting for charts...</span>
        ) : (
          <div
            ref={contentRef}
            className="whitespace-nowrap flex font-mono text-sm"
            style={{ transform: `translateX(-${scrollPosition}px)` }}
          >
            {segments.map((segment) => (
              <span key={segment.id} className="flex">
                {segment.symbols.map((item, idx) => (
                  <span
                    key={`${segment.id}-${item.symbol}-${idx}`}
                    className={`mx-4 ${item.failed ? 'text-red-400' : 'text-green-400'}`}
                  >
                    {item.symbol}{item.failed ? ' (failed)' : ''}
                  </span>
                ))}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
