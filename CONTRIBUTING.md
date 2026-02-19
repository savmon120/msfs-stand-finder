# Contributing to Aviation Stand Finder

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Ways to Contribute

### 1. Report Bugs
- Use GitHub Issues
- Include reproduction steps
- Provide system information
- Add relevant logs

### 2. Suggest Features
- Open a GitHub Discussion
- Explain the use case
- Describe the expected behavior

### 3. Improve Documentation
- Fix typos and errors
- Add examples
- Improve clarity
- Translate to other languages

### 4. Contribute Code
- Fix bugs
- Implement features
- Optimize performance
- Add tests

### 5. Crowdsource Stand Data
- Submit stand observations
- Verify existing data
- Add airport information

## Getting Started

### Development Setup

1. **Fork the repository**

2. **Clone your fork**
```bash
git clone https://github.com/YOUR_USERNAME/aviation-stand-finder.git
cd aviation-stand-finder
```

3. **Create a branch**
```bash
git checkout -b feature/your-feature-name
```

4. **Install dependencies**
```bash
npm install
```

5. **Set up environment**
```bash
cp .env.example .env
```

6. **Initialize database**
```bash
npm run prisma:migrate
npm run db:seed
```

7. **Start development server**
```bash
npm run dev
```

### Code Style

We use ESLint and Prettier for code formatting:

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
npm run format      # Format code
```

**Guidelines:**
- Use TypeScript strict mode
- Follow existing code patterns
- Write meaningful variable names
- Add comments for complex logic
- Keep functions small and focused
- Use async/await over promises

### Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Add/update tests
- `chore`: Maintenance

**Examples:**
```
feat(api): add endpoint for stand availability
fix(resolver): handle empty callsign gracefully
docs(readme): update installation instructions
test(utils): add tests for flight normalization
```

### Testing

Write tests for new features:

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

**Test guidelines:**
- Unit tests for utility functions
- Integration tests for services
- Mock external API calls
- Aim for >80% coverage

### Pull Request Process

1. **Update documentation**
   - Update README if needed
   - Add JSDoc comments
   - Update CHANGELOG

2. **Run tests**
```bash
npm test
npm run lint
npm run build
```

3. **Commit changes**
```bash
git add .
git commit -m "feat: description"
git push origin feature/your-feature-name
```

4. **Create Pull Request**
   - Provide clear description
   - Link related issues
   - Add screenshots if relevant
   - Request review

5. **Address feedback**
   - Respond to comments
   - Make requested changes
   - Push updates

## Crowdsourcing Stand Data

### Via Web UI
1. Visit the web interface
2. Click "Report Stand"
3. Fill in details
4. Submit

### Via API
```bash
curl -X POST http://localhost:3000/api/crowdsource/stand-report \
  -H "Content-Type: application/json" \
  -d '{
    "airportId": "EGLL",
    "standName": "A10",
    "flightIdentifier": "BA1489",
    "timestamp": "2026-02-19T10:30:00Z",
    "notes": "Confirmed via window seat"
  }'
```

### Via GitHub PR

1. Edit files in `data/stands/`
2. Follow JSON schema
3. Include source information
4. Submit PR

**Example: data/stands/EGLL.json**
```json
{
  "airport": "EGLL",
  "source": "Personal observation",
  "date": "2026-02-19",
  "stands": [
    {
      "name": "A10",
      "terminal": "T2",
      "latitude": 51.4720,
      "longitude": -0.4600,
      "maxWingspanM": 52,
      "notes": "Wide-body capable"
    }
  ]
}
```

## Adding a New Data Source

1. **Create adapter file**
   - `src/adapters/sources/your-source.adapter.ts`

2. **Implement interface**
```typescript
export class YourSourceAdapter implements DataSourceAdapter {
  name = 'Your Source';
  
  async getFlightInfo(flight: FlightInput): Promise<FlightData | null> {
    // Implementation
  }
  
  async getHistoricalPosition(...): Promise<PositionData | null> {
    // Implementation
  }
}
```

3. **Register adapter**
   - Add to `src/adapters/sources/index.ts`

4. **Add configuration**
   - Add API key to `.env.example`
   - Update config types

5. **Write tests**
   - Create `your-source.adapter.test.ts`

6. **Update documentation**
   - Add to README
   - Update architecture docs

## Code Review Checklist

Before submitting:

- [ ] Code follows style guidelines
- [ ] Tests pass
- [ ] New features have tests
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Error handling implemented
- [ ] Types are correct
- [ ] Breaking changes noted

## Community Guidelines

- Be respectful and inclusive
- Help newcomers
- Provide constructive feedback
- Focus on the code, not the person
- Follow the Code of Conduct

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Credited in release notes
- Acknowledged in documentation

## Questions?

- GitHub Discussions for general questions
- GitHub Issues for bug reports
- Email for security issues

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Aviation Stand Finder! ✈️
