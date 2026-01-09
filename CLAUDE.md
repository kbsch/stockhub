# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (runs both client and server concurrently)
npm run dev

# Run only client (Vite dev server on port 5173)
npm run dev:client

# Run only server (Express on port 3001)
npm run dev:server

# Build both packages
npm run build

# Lint all packages
npm run lint
```

## Architecture

This is a monorepo using npm workspaces with two packages:

### Client (`packages/client`)
React 18 + TypeScript + Vite + TailwindCSS frontend that:
- Parses text input for financial assets using regex patterns (`lib/parser.ts`)
- Displays interactive charts using TradingView Lightweight Charts
- Uses TanStack Query (React Query) for data fetching with caching

**Key Files:**
- `src/App.tsx` - Main app with asset state, animations, highlighting
- `src/components/TextInput.tsx` - Dynamic height textarea (40vh-60vh), 400ms debounce
- `src/components/AssetCard.tsx` - Card with quote/chart, expandable modal, 6 time ranges
- `src/components/AssetGrid.tsx` - Masonry grid with staggered animations (50ms delay per card)
- `src/components/Chart.tsx` - Lightweight Charts candlestick visualization
- `src/lib/parser.ts` - Asset parsing with 677-entry company name mapping
- `src/lib/api.ts` - API client (fetchQuote, fetchChart, searchSymbols)

**Data Flow:**
1. User types/pastes text in `TextInput` (debounced 400ms)
2. `parseAssets()` extracts stocks, options, bonds, economic indicators
3. `AssetCard` components fetch quote/chart data via React Query
4. Cards report success/failure back to App via `onStatus` callback
5. `StatusTicker` displays bubbles: success (green), failed (red), pending (gray)
6. Clicking a bubble scrolls to and highlights the corresponding card

**Supported Asset Types:**
- Stocks: `$AAPL`, `AAPL`, company names ("Apple", "Microsoft")
- Crypto: Company name mappings for major cryptocurrencies
- Options: `AAPL 200C 3/21`, `AAPL Jan 19 $150 call`
- Bonds: 9-character CUSIPs with checksum validation
- Economic: DXY, VIX, TNX, TYX, FVX, IRX, CPI, GDP, FEDFUNDS, M2, UNEMPLOYMENT, CASE-SHILLER

### Server (`packages/server`)
Express + TypeScript API proxy that:
- Aggregates Yahoo Finance and FRED APIs
- Handles CORS and normalizes response data
- Implements in-memory caching (5-minute TTL)

**Key Files:**
- `src/index.ts` - Express app setup with CORS, port 3001
- `src/routes/quote.ts` - Quote endpoint handler
- `src/routes/chart.ts` - Chart endpoint with 6 time ranges (1D, 1W, 1M, 3M, 1Y, 5Y)
- `src/routes/search.ts` - Symbol search endpoint
- `src/services/yahoo.ts` - Yahoo Finance v8 chart API integration
- `src/services/fred.ts` - Economic indicator mapping with Yahoo fallbacks

**API Routes:**
- `GET /api/quote/:symbol` - Current price and metadata
- `GET /api/chart/:symbol?range=3M` - Historical OHLCV data
- `GET /api/search/:query` - Symbol/name lookup
- `GET /api/health` - Health check

### Vercel API Routes (`packages/client/api`)
Serverless functions mirroring the Express backend for Vercel deployment:
- `api/quote/[symbol].ts` - Quote handler
- `api/chart/[symbol].ts` - Chart handler
- `api/search/[query].ts` - Search handler
- `api/health.ts` - Health check
- `api/lib/yahoo.ts`, `api/lib/fred.ts` - Shared service logic

### Key Design Decisions
- Cards only render after data loads successfully (no loading placeholders)
- Exit animations use segment-based ticker that snapshots symbols at creation time
- Portal-based modal for expanded charts to avoid z-index issues
- Staggered card animations with 50ms delay per index
- Removed assets get `isExiting` flag and animate out over 300ms before DOM removal
- Responsive UI with fluid typography and spacing via Tailwind custom utilities
