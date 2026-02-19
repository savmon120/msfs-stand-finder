# ✈️ Aviation Stand Finder

Real-world parking stand/gate identification for arriving flights using free aviation data sources.

## Overview

Aviation Stand Finder is a lightweight, modular, open-source tool that identifies the real-world parking stand or gate used by an arriving flight. It uses multiple free data sources and intelligent fallback logic to provide accurate stand assignments with confidence scoring.

## Features

- 🎯 **Multi-source Data Aggregation**: OpenSky Network, ADS-B Exchange, AviationStack
- 🧠 **Intelligent Fallback Logic**: 4-stage resolution from historical positions to aircraft size matching
- 💾 **Efficient Caching**: In-memory + optional Redis for reduced API usage
- 🌐 **REST API**: Simple JSON endpoints for integration
- 🖥️ **Web UI**: Clean, mobile-friendly interface
- 🔌 **Modular Architecture**: Swappable data adapters
- 📊 **Confidence Scoring**: Every result includes reliability metrics
- 🤝 **Crowdsourcing**: Community-contributed stand data
- 🚀 **Edge-Ready**: Deploys to Render, Vercel, Fly.io, Cloudflare Workers

## Architecture

```
┌─────────────────┐
│   Flight Input  │
│ (Number/Callsign)│
└────────┬────────┘
         │
    ┌────▼─────┐
    │ Resolver │
    └────┬─────┘
         │
    ┌────▼──────────────────────────┐
    │   Data Source Layer           │
    │ ┌──────┐ ┌───────┐ ┌────────┐│
    │ │OpenSky│ │ADS-B  │ │Aviation││
    │ │Network│ │Exchange│ │Stack  ││
    │ └──────┘ └───────┘ └────────┘│
    └────┬──────────────────────────┘
         │
    ┌────▼──────────────────────────┐
    │  Stand Resolution Engine      │
    │  ┌──────────────────────────┐ │
    │  │ 1. Historical Position   │ │
    │  │ 2. Airline Pattern       │ │
    │  │ 3. Terminal Assignment   │ │
    │  │ 4. Aircraft Size         │ │
    │  └──────────────────────────┘ │
    └────┬──────────────────────────┘
         │
    ┌────▼─────────┐
    │ Cache Layer  │
    │ Memory/Redis │
    └────┬─────────┘
         │
    ┌────▼─────┐
    │ REST API │
    └────┬─────┘
         │
    ┌────▼────┐
    │ Web UI  │
    └─────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/aviation-stand-finder.git
cd aviation-stand-finder
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment**

```bash
cp .env.example .env
```

Edit `.env` with your configuration (API keys are optional for basic functionality).

4. **Initialize database**

```bash
npm run prisma:migrate
npm run prisma:generate
```

5. **Seed sample data**

```bash
npm run db:seed
npm run import:airports
npm run import:stands
```

6. **Start development server**

```bash
npm run dev
```

Visit `http://localhost:3000` to see the web UI.

## API Documentation

### Get Stand for Flight

```
GET /api/stand?flight=BA1489&airport=EGLL
```

**Parameters:**
- `flight` (optional): Flight number (e.g., BA1489)
- `callsign` (optional): ICAO callsign (e.g., BAW1489)
- `date` (optional): Flight date (ISO 8601)
- `airport` (optional): Airport ICAO/IATA code

**Response:**

```json
{
  "flight": "BA1489",
  "airport": "EGLL",
  "stand": "A10",
  "confidence": 0.92,
  "fallbackStage": 1,
  "fallbackStageName": "Historical ADS-B Position",
  "sources": ["opensky", "database"],
  "terminal": "T2",
  "timestamp": "2026-02-19T10:30:00Z",
  "metadata": {
    "distance": 45
  }
}
```

### Get Airport Stands

```
GET /api/airport/EGLL/stands
```

**Response:**

```json
{
  "airport": {
    "icao": "EGLL",
    "iata": "LHR",
    "name": "London Heathrow Airport"
  },
  "stands": [
    {
      "name": "A10",
      "terminal": "T2",
      "maxWingspanM": 52,
      "aircraftSizeCode": "D",
      "latitude": 51.4720,
      "longitude": -0.4600
    }
  ],
  "total": 1
}
```

### Search Airports

```
GET /api/airports?search=London
```

### Submit Crowdsourced Report

```
POST /api/crowdsource/stand-report
```

**Body:**

```json
{
  "airportId": "EGLL",
  "standName": "A10",
  "flightIdentifier": "BA1489",
  "timestamp": "2026-02-19T10:30:00Z",
  "notes": "Confirmed via window seat observation"
}
```

## Fallback Logic

The stand resolution engine uses a 4-stage fallback system:

### Stage 1: Historical ADS-B Position (Confidence: 0.8-0.95)
Query live tracking data for the aircraft's last known ground position and match to nearest stand within 200m.

### Stage 2: Airline Stand Pattern (Confidence: 0.6-0.9)
Use historical usage patterns for the airline at this airport.

### Stage 3: Terminal Assignment (Confidence: 0.7)
Return any suitable stand in the airline's assigned terminal.

### Stage 4: Aircraft Size Compatibility (Confidence: 0.5)
Match aircraft wingspan to available stand capacity.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | SQLite/PostgreSQL URL | `file:./dev.db` |
| `REDIS_URL` | Redis connection string | - |
| `USE_REDIS` | Enable Redis caching | `false` |
| `ADSBEXCHANGE_API_KEY` | ADS-B Exchange key | - |
| `AVIATIONSTACK_API_KEY` | AviationStack key | - |
| `OPENSKY_USERNAME` | OpenSky username | - |
| `OPENSKY_PASSWORD` | OpenSky password | - |
| `CACHE_TTL_SECONDS` | Cache duration | `3600` |
| `RATE_LIMIT_MAX` | Requests per window | `100` |

## Data Sources

### Free Tier
- **OpenSky Network**: Live tracking (no auth required)
- **OurAirports**: Airport & stand data
- **OpenFlights**: Aircraft database

### Paid/Limited Free Tier
- **ADS-B Exchange**: Historical positions
- **AviationStack**: Flight schedules

## Deployment

### Render

```bash
# Render will auto-detect Node.js
# Add environment variables in dashboard
```

### Fly.io

```bash
fly launch
fly secrets set DATABASE_URL=...
fly deploy
```

### Vercel

```bash
vercel
```

### Docker

```bash
docker build -t aviation-stand-finder .
docker run -p 3000:3000 aviation-stand-finder
```

## Development

### Project Structure

```
aviation-stand-finder/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/
│   └── index.html             # Web UI
├── src/
│   ├── adapters/
│   │   └── sources/           # Data source adapters
│   ├── routes/                # API routes
│   ├── services/              # Business logic
│   ├── scripts/               # Import/seed scripts
│   ├── types/                 # TypeScript types
│   └── utils/                 # Utilities
├── .env.example
├── package.json
└── tsconfig.json
```

### Adding a New Data Source

1. Create adapter in `src/adapters/sources/`
2. Implement `DataSourceAdapter` interface
3. Register in `src/adapters/sources/index.ts`

```typescript
export class MyAdapter implements DataSourceAdapter {
  name = 'My Data Source';
  
  async getFlightInfo(flight: FlightInput): Promise<FlightData | null> {
    // Implementation
  }
  
  async getHistoricalPosition(...): Promise<PositionData | null> {
    // Implementation
  }
}
```

### Testing

```bash
npm test                # Run tests
npm run test:watch      # Watch mode
```

## Stand Mapping

Stand names can vary between real-world and simulator scenery. Use mapping files:

**config/stand-mappings/EGLL.json**

```json
{
  "EGLL": {
    "A10": ["A10", "A010", "Gate_A10", "Stand A10"],
    "B32": ["B32", "B032", "532"]
  }
}
```

## Future Integrations

### MSFS Integration
- Auto-detect scenery packages
- Map stands to MSFS parking positions
- Export as BGL

### GSX Pro Integration
- Auto-select correct gate
- Trigger repositioning
- Generate profile XML

### VATSIM Integration
- Real-time stand availability
- Controller coordination
- Online flight preferences

### SimBrief Integration
- Auto-populate arrival stand in OFP
- Route-based suggestions

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Submit a pull request

### Crowdsourcing Stand Data

Submit stand observations via:
- Web UI
- API endpoint
- GitHub PR to `data/stands/`

## License

MIT License - see [LICENSE](LICENSE)

## Support

- Issues: [GitHub Issues](https://github.com/yourusername/aviation-stand-finder/issues)
- Discussions: [GitHub Discussions](https://github.com/yourusername/aviation-stand-finder/discussions)

## Acknowledgments

- OpenSky Network for free ADS-B data
- OurAirports for comprehensive airport database
- Aviation community for crowdsourced stand information

---

**Made with ✈️ by aviation enthusiasts, for aviation enthusiasts**
