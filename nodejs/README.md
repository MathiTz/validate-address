# Address Validation API

A TypeScript/Node.js backend API that validates and standardizes US property addresses using Fastify framework.

## Features

- **Address Validation**: Validates and standardizes property addresses
- **Error Correction**: Expands abbreviations and corrects common formatting issues
- **Confidence Scoring**: Provides confidence levels for validation results
- **Edge Case Handling**: Gracefully handles partial addresses, typos, and missing components
- **TypeScript Support**: Full TypeScript implementation with type safety
- **Fast Performance**: Built with Fastify for optimal performance
- **JSON Schema Validation**: Request/response validation using JSON schemas

## API Endpoints

### POST /validate-address

Validates and standardizes a US address.

**Request:**
```json
{
  "address": "123 Main St, Anytown USA 12345"
}
```

**Response:**
```json
{
  "status": "corrected",
  "confidence": 0.95,
  "original": "123 Main St, Anytown USA 12345",
  "validated": {
    "streetNumber": "123",
    "streetName": "Main Street",
    "city": "Anytown",
    "state": "CA",
    "zipCode": "12345",
    "formatted": "123 Main Street, Anytown, CA 12345"
  },
  "corrections": ["Street abbreviated as 'St' expanded to 'Street'"]
}
```

**Status Values:**
- `valid`: Address is valid as provided
- `corrected`: Address was corrected/standardized
- `unverifiable`: Address cannot be verified or is incomplete

## Installation

```bash
cd nodejs
npm install
```

## Development

```bash
# Start development server with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Run tests
npm test

# Type checking
npm run typecheck

# Lint code
npm run lint
```

## Project Structure

```
src/
├── addressValidator.ts  # Core validation logic
├── server.ts           # Fastify server setup
└── types.ts            # TypeScript type definitions

tests/
└── addressValidator.test.ts  # Test suites
```

## Framework Choice: Fastify vs Express

**Fastify** was chosen over Express for this implementation because:

1. **Performance**: 2-3x faster than Express
2. **Built-in Validation**: JSON Schema validation out of the box
3. **TypeScript Support**: Better TypeScript integration
4. **Modern Architecture**: Built for modern Node.js with async/await
5. **Lightweight**: Smaller footprint while being feature-rich

## Address Validation Logic

The validator handles:

- **Street abbreviations**: St → Street, Ave → Avenue, etc.
- **Direction abbreviations**: N → North, SW → Southwest, etc.
- **State normalization**: California → CA, etc.
- **ZIP code extraction**: Including ZIP+4 format
- **Case normalization**: Proper title case formatting
- **Punctuation handling**: Removes/normalizes commas and periods
- **Partial addresses**: Handles missing components gracefully
- **Confidence scoring**: Based on completeness and corrections needed

## Error Handling

- Input validation with detailed error messages
- Graceful handling of malformed requests
- Comprehensive error logging
- Proper HTTP status codes

## Testing

Comprehensive test suite covering:
- Valid address validation
- Abbreviation expansion
- Partial address handling
- Edge cases and error conditions
- Confidence score calculations