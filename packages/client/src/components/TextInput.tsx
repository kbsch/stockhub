import { useState, useEffect, useRef } from 'react';

interface TextInputProps {
  value: string;
  onChange: (text: string) => void;
  onSubmit: (text: string) => void;
}

export function TextInput({ value: text, onChange: setText, onSubmit }: TextInputProps) {
  const [height, setHeight] = useState('40vh');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  // Dynamically adjust height based on content
  useEffect(() => {
    if (!measureRef.current) return;

    const minHeight = window.innerHeight * 0.4; // 40vh
    const maxHeight = window.innerHeight * 0.6; // 60vh

    const contentHeight = measureRef.current.scrollHeight;
    const newHeight = Math.max(minHeight, Math.min(contentHeight, maxHeight));
    setHeight(`${newHeight}px`);
  }, [text]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSubmit(text);
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [text, onSubmit]);

  return (
    <div className="flex flex-col">
      {/* Hidden measuring div */}
      <div
        ref={measureRef}
        className="absolute -left-[9999px] w-72 lg:w-80 xl:w-96 p-fluid-2 text-fluid-sm whitespace-pre-wrap break-words"
        style={{ wordBreak: 'break-word' }}
      >
        {text || 'x'}
      </div>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your message here...

Example:
I'm bullish on $AAPL and MSFT. Looking at AAPL 200C 3/21. DXY is wild."
        className="min-h-40 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-100 placeholder-gray-500 p-fluid-2 resize-none text-fluid-sm transition-[height] duration-150"
        style={{ height }}
      />
      <p className="text-fluid-xs text-gray-500 mt-2">
        $AAPL, company names, options, CUSIPs, DXY, VIX
      </p>
    </div>
  );
}
