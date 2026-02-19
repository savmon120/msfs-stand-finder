# Architecture Documentation

## System Architecture

### Overview

The Aviation Stand Finder is built on a modular, layered architecture designed for extensibility, testability, and maintainability. Each layer has a specific responsibility and can be modified independently.

## Layer Breakdown

### 1. Presentation Layer

**Web UI** (`public/index.html`)
- Single-page application
- Vanilla JavaScript (no framework overhead)
- Mobile-responsive design
- Real-time search and results display

**REST API** (`src/routes/`)
- Fastify-based HTTP server
- JSON request/response
- CORS support
- Rate limiting
- Input validation with Zod

### 2. Business Logic Layer

**Stand Resolution Engine** (`src/services/stand-resolution.service.ts`)
- Core algorithm for stand identification
- 4-stage fallback logic
- Confidence scoring
- Result caching

**Flight Resolver** (`src/utils/flight-utils.ts`)
- Normalizes flight numbers and callsigns
- Converts between ICAO/IATA codes
- Extracts airline information

### 3. Data Adapter Layer

**Data Source Manager** (`src/adapters/sources/`)
- Abstract interface for all data sources
- Swappable adapters
- Graceful fallback on failures
- Rate limit handling

**Adapters:**
- OpenSky Network Adapter
- ADS-B Exchange Adapter
- AviationStack Adapter

### 4. Data Access Layer

**Prisma ORM** (`prisma/schema.prisma`)
- Type-safe database queries
- SQLite for development
- PostgreSQL for production
- Migration system

**Cache Service** (`src/services/cache.service.ts`)
- Multi-tier caching (memory + Redis)
- TTL management
- Automatic expiration

### 5. Data Storage Layer

**Relational Database**
- Airports
- Stands
- Airline assignments
- Stand patterns
- Flight cache
- Crowdsourced reports
- Aircraft types
- Stand mappings

## Data Flow

### Stand Resolution Flow

```
1. User Request
   ↓
2. API Endpoint (/api/stand)
   ↓
3. Input Validation (Zod)
   ↓
4. Stand Resolution Engine
   ↓
5. Check Cache
   │
   ├─ Cache Hit → Return Result
   │
   └─ Cache Miss
      ↓
6. Flight Normalization
   ↓
7. Data Source Query (parallel)
   ├─ OpenSky Network
   ├─ ADS-B Exchange
   └─ AviationStack
   ↓
8. Fallback Stage 1: Historical Position
   ├─ Query tracking data
   ├─ Get last ground position
   └─ Match to nearest stand
   ↓ (if no match)
9. Fallback Stage 2: Airline Pattern
   ├─ Query airline_stand_patterns
   └─ Return highest probability
   ↓ (if no match)
10. Fallback Stage 3: Terminal Assignment
    ├─ Query airline_terminal_assignments
    └─ Return suitable stand in terminal
    ↓ (if no match)
11. Fallback Stage 4: Aircraft Size
    ├─ Get aircraft wingspan
    ├─ Filter compatible stands
    └─ Return closest to main apron
    ↓
12. Calculate Confidence Score
    ↓
13. Cache Result (memory + Redis + database)
    ↓
14. Return to User
```

## Design Patterns

### 1. Adapter Pattern
Each data source implements the `DataSourceAdapter` interface, allowing seamless swapping and testing.

### 2. Strategy Pattern
The fallback logic uses a strategy pattern with 4 strategies executed in priority order.

### 3. Repository Pattern
Database access is abstracted through Prisma, acting as a repository layer.

### 4. Singleton Pattern
Services like `CacheService` and `DataSourceManager` use singleton instances.

### 5. Chain of Responsibility
Fallback stages form a chain, each attempting resolution before passing to the next.

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Shared Redis cache across instances
- Database connection pooling

### Caching Strategy
- **L1 Cache**: In-memory (fastest, per-instance)
- **L2 Cache**: Redis (shared, persistent)
- **L3 Cache**: Database (long-term, queryable)

### Rate Limiting
- Per-IP rate limiting at API level
- Per-adapter rate limiting for external APIs
- Exponential backoff on failures

### Database Optimization
- Indexed queries on frequently accessed fields
- Compound indexes for multi-field queries
- Automatic cache expiration cleanup

## Security

### API Security
- CORS configuration
- Rate limiting
- Input validation
- SQL injection prevention (Prisma)
- XSS prevention (sanitized inputs)

### Data Privacy
- No user authentication required
- Optional reporter IDs for crowdsourcing
- No sensitive data storage

## Testing Strategy

### Unit Tests
- Utility functions
- Flight normalization
- Distance calculations
- Stand name normalization

### Integration Tests
- Data adapter functionality
- Database queries
- Cache operations

### End-to-End Tests
- API endpoints
- Full resolution flow
- Error handling

## Deployment Architecture

### Development
```
┌─────────────┐
│ Node.js Dev │
│   Server    │
├─────────────┤
│   SQLite    │
│ In-Memory   │
│   Cache     │
└─────────────┘
```

### Production
```
┌──────────────────────────────────┐
│        Load Balancer             │
└────────┬─────────────┬───────────┘
         │             │
    ┌────▼────┐   ┌───▼─────┐
    │ Node.js │   │ Node.js │
    │Instance1│   │Instance2│
    └────┬────┘   └───┬─────┘
         │            │
    ┌────▼────────────▼─────┐
    │   Redis Cluster       │
    └───────────────────────┘
    ┌───────────────────────┐
    │   PostgreSQL          │
    └───────────────────────┘
```

## Extension Points

### Adding New Data Sources
1. Create adapter class implementing `DataSourceAdapter`
2. Register in `DataSourceManager`
3. Add API key to configuration

### Adding New Fallback Stages
1. Add stage to `FallbackStage` enum
2. Implement resolution method in `StandResolutionEngine`
3. Add to fallback chain

### Adding New Endpoints
1. Create route handler in `src/routes/`
2. Define Zod schemas
3. Register route in main server

### Integration Hooks
- **Pre-resolution hook**: Modify input before processing
- **Post-resolution hook**: Transform output
- **Cache invalidation hook**: Custom cache strategies
- **Data source hook**: Add custom sources dynamically

## Performance Metrics

### Target Metrics
- **API Response Time**: < 500ms (cached), < 2s (uncached)
- **Cache Hit Rate**: > 80%
- **Throughput**: 100 req/s per instance
- **Availability**: 99.9%

### Monitoring
- Request latency tracking
- Cache hit/miss ratios
- Data source success rates
- Error rate monitoring
- Database query performance

## Future Enhancements

### Planned Features
1. **ML-based predictions**: Train model on historical patterns
2. **Real-time updates**: WebSocket for live stand changes
3. **Mobile apps**: Native iOS/Android clients
4. **GraphQL API**: Alternative to REST
5. **Stand availability**: Track occupied vs. available stands
6. **Historical analytics**: Stand usage trends
7. **Multi-airport queries**: Batch processing
8. **Image recognition**: Confirm stands from photos
