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

**Data Flow:**
1. User types/pastes text in `TextInput` (debounced 400ms)
2. `parseAssets()` extracts stocks, options, bonds, economic indicators
3. `AssetCard` components fetch quote/chart data via React Query
4. Cards report success/failure back to App via `onStatus` callback
5. `StatusTicker` displays confirmed success (green) and failed (red) symbols

**Supported Asset Types:**
- Stocks: `$AAPL`, `AAPL`, company names ("Apple")
- Options: `AAPL 200C 3/21`, `AAPL Jan 19 $150 call`
- Bonds: 9-character CUSIPs with checksum validation
- Economic: DXY, VIX, TNX, CPI, etc.

### Server (`packages/server`)
Express + TypeScript API proxy that:
- Aggregates Yahoo Finance and FRED APIs
- Handles CORS and normalizes response data
- Implements in-memory caching (5-minute TTL)

**API Routes:**
- `GET /api/quote/:symbol` - Current price and metadata
- `GET /api/chart/:symbol?range=3M` - Historical OHLCV data
- `GET /api/search/:query` - Symbol/name lookup
- `GET /api/health` - Health check

### Key Design Decisions
- Cards only render after data loads successfully (no loading placeholders)
- Exit animations use segment-based ticker that snapshots symbols at creation time
- Portal-based modal for expanded charts to avoid z-index issues
