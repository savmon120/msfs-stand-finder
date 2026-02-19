# Aviation Stand Finder - Copilot Instructions

## Project Overview
Aviation stand/gate identification system using free data sources. Built with Node.js, TypeScript, Fastify, and Prisma.

## Architecture
- **Modular layers**: Flight resolver → Data adapters → Stand engine → API → UI
- **Data sources**: ADS-B Exchange, OpenSky Network, AviationStack
- **Fallback logic**: Historical position → Airline patterns → Terminal → Aircraft size
- **Caching**: In-memory + optional Redis

## Development Guidelines
- Use TypeScript strict mode
- Follow modular adapter pattern for data sources
- Each adapter must be swappable and testable
- Return confidence scores with all stand resolutions
- Cache aggressively to reduce API usage
- Handle rate limits gracefully
- Use Zod for validation
- Log with structured Pino logger

## Code Style
- Use ES modules
- Async/await over promises
- Functional where possible
- Clear error messages
- Document fallback stages

## Testing
- Unit tests for fallback logic
- Integration tests for adapters
- Mock external API calls

## Future Integrations
- MSFS scenery mapping
- GSX Pro automation
- VATSIM operations
- SimBrief integration
