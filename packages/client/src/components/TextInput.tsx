import { useState, useEffect, useRef, useMemo } from 'react';

interface TextInputProps {
  value: string;
  onChange: (text: string) => void;
  onSubmit: (text: string) => void;
}

// Pattern to match tickers for highlighting
const TICKER_PATTERNS = [
  /\$[A-Za-z]{1,5}\b/g,  // Cashtags
  /\b[A-Z]{2,5}\b/g,      // Uppercase tickers
];

export function TextInput({ value: text, onChange: setText, onSubmit }: TextInputProps) {
  const [highlightKey, setHighlightKey] = useState(0);
  const [height, setHeight] = useState('40vh');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  // Dynamically adjust height based on content
  useEffect(() => {
    if (!measureRef.current) return;

    const minHeight = window.innerHeight * 0.4; // 40vh
    const maxHeight = window.innerHeight * 0.6; // 60vh

    // Measure using hidden auto-height div
    const contentHeight = measureRef.current.scrollHeight;

    const newHeight = Math.max(minHeight, Math.min(contentHeight, maxHeight));
    setHeight(`${newHeight}px`);
  }, [text]);

  useEffect(() => {
    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce parsing by 400ms after user stops typing
    debounceRef.current = setTimeout(() => {
      onSubmit(text);
      // Trigger highlight animation when there's text
      if (text.trim()) {
        setHighlightKey(k => k + 1);
      }
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [text, onSubmit]);

  // Sync scroll between textarea and highlight overlay
  const handleScroll = () => {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Generate highlighted HTML
  const highlightedHtml = useMemo(() => {
    if (!text) return '';

    let result = text;
    const matches: { start: number; end: number; text: string }[] = [];

    // Find all ticker matches
    for (const pattern of TICKER_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
        });
      }
    }

    // Sort by position and remove overlaps
    matches.sort((a, b) => a.start - b.start);
    const filtered: typeof matches = [];
    for (const m of matches) {
      if (filtered.length === 0 || m.start >= filtered[filtered.length - 1].end) {
        filtered.push(m);
      }
    }

    // Build highlighted string from end to start to preserve indices
    for (let i = filtered.length - 1; i >= 0; i--) {
      const m = filtered[i];
      const before = result.slice(0, m.start);
      const ticker = result.slice(m.start, m.end);
      const after = result.slice(m.end);
      result = `${before}<span class="ticker-highlight" key="${highlightKey}-${i}">${ticker}</span>${after}`;
    }

    // Escape HTML except our spans, and preserve whitespace
    result = result
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/&lt;span class="ticker-highlight"(.*?)&gt;/g, '<span class="ticker-highlight"$1>')
      .replace(/&lt;\/span&gt;/g, '</span>')
      .replace(/\n/g, '<br>');

    return result + '<br>';
  }, [text, highlightKey]);

  return (
    <div className="flex flex-col">
      {/* Hidden measuring div - same styling but auto height */}
      <div
        ref={measureRef}
        className="absolute -left-[9999px] w-72 lg:w-80 xl:w-96 p-fluid-2 text-fluid-sm whitespace-pre-wrap break-words"
        style={{ wordBreak: 'break-word' }}
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
      <div
        className="relative min-h-40 bg-gray-800 rounded-lg border border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 transition-[height] duration-150"
        style={{ height }}
      >
        {/* Highlight backdrop */}
        <div
          ref={highlightRef}
          className="absolute inset-0 p-fluid-2 text-fluid-sm overflow-auto whitespace-pre-wrap break-words pointer-events-none text-transparent"
          style={{ wordBreak: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
        {/* Actual textarea - transparent to show highlights */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onScroll={handleScroll}
          placeholder="Paste your message here...

Example:
I'm bullish on $AAPL and MSFT. Looking at AAPL 200C 3/21. DXY is wild."
          className="absolute inset-0 w-full h-full bg-transparent text-gray-100 placeholder-gray-500 p-fluid-2 resize-none focus:outline-none text-fluid-sm caret-white"
        />
      </div>
      <p className="text-fluid-xs text-gray-500 mt-2">
        $AAPL, company names, options, CUSIPs, DXY, VIX
      </p>
    </div>
  );
}
