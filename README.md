# Address Validation API

A Go-based REST API that validates and standardizes US property addresses from free-form text input.

## Overview

This API accepts unstructured address strings and returns standardized, validated address components including street number, street name, city, state, and ZIP code. It handles common edge cases like typos, abbreviations, and partial addresses gracefully.

## Architecture & Design Decisions

### Core Components

1. **HTTP Server** (`main.go`)
   - Single POST endpoint `/validate-address` for address processing
   - Health check endpoint `/health` for monitoring
   - JSON request/response format with proper error handling

2. **Data Models** (`models.go`)
   - `AddressRequest`: Input structure requiring only an address string
   - `AddressResponse`: Comprehensive response with validation status and metadata
   - `ValidatedAddress`: Structured address components
   - Status constants: `valid`, `corrected`, `unverifiable`

3. **Validation Engine** (`validator.go`)
   - Multi-stage processing pipeline: clean → parse → standardize → validate
   - Regex-based pattern matching for different address formats
   - Dictionary-based corrections for common misspellings and abbreviations
   - State abbreviation normalization using complete US state mapping

### Thought Process

**1. Address Parsing Strategy**
- Used multiple regex patterns to handle various address formats
- Started with most complete formats (with units/apartments) and fell back to simpler patterns
- Implemented partial parsing for incomplete addresses to extract available components

**2. Standardization Approach**
- Built comprehensive lookup tables for:
  - All 50 US states + DC abbreviations
  - Common street suffix abbreviations (St→Street, Ave→Avenue)
  - Frequent misspellings (Steet→Street, Avenu→Avenue)
- Applied title case formatting consistently

**3. Validation Logic**
- Three-tier status system based on completeness and corrections:
  - `valid`: All critical components present and properly formatted
  - `corrected`: Minor issues fixed or non-critical components missing
  - `unverifiable`: Too many missing components or unparseable input

**4. Edge Case Handling**
- Input sanitization: length limits, character filtering, whitespace normalization
- Graceful degradation for partial addresses
- Comprehensive error messages for debugging
- Proper HTTP status codes and JSON error responses

## API Specification

### POST /validate-address

**Request:**
```json
{
  "address": "123 Main Street, New York, NY 10001"
}
```

**Response:**
```json
{
  "status": "valid",
  "original_address": "123 Main Street, New York, NY 10001",
  "validated_address": {
    "street_number": "123",
    "street_name": "Main Street",
    "city": "New York",
    "state": "NY",
    "zip_code": "10001",
    "full_address": "123 Main Street, New York, NY 10001"
  },
  "message": "Address is valid and standardized",
  "processed_at": "2025-09-15T10:11:53.325174-03:00"
}
```

**Status Codes:**
- `200 OK`: Address processed successfully
- `400 Bad Request`: Invalid JSON or missing address field
- `405 Method Not Allowed`: Non-POST requests
- `500 Internal Server Error`: Server processing error

### GET /health

Returns service health status for monitoring.

## Example Use Cases

### Valid Address
```bash
curl -X POST http://localhost:8080/validate-address \
  -H "Content-Type: application/json" \
  -d '{"address": "123 Main Street, New York, NY 10001"}'
# Status: "valid"
```

### Address with Corrections
```bash
curl -X POST http://localhost:8080/validate-address \
  -H "Content-Type: application/json" \
  -d '{"address": "456 oak st, san francisco, ca 94102"}'
# Status: "corrected" - standardizes "st" to "Street", capitalizes city
```

### Partial Address
```bash
curl -X POST http://localhost:8080/validate-address \
  -H "Content-Type: application/json" \
  -d '{"address": "789 Main Street"}'
# Status: "unverifiable" - missing city, state, ZIP
```

## Running Locally

### Prerequisites
- Go 1.21 or higher
- curl or similar HTTP client for testing

### Steps

1. **Clone and navigate to project:**
```bash
cd validate-address-api
```

2. **Initialize Go module (if needed):**
```bash
go mod tidy
```

3. **Start the server:**
```bash
go run .
```

The server will start on `http://localhost:8080`

4. **Test the API:**
```bash
# Test with a valid address
curl -X POST http://localhost:8080/validate-address \
  -H "Content-Type: application/json" \
  -d '{"address": "123 Main Street, New York, NY 10001"}'

# Test health endpoint
curl http://localhost:8080/health
```

### Building for Production

```bash
# Build binary
go build -o address-api

# Run binary
./address-api
```

## Development Tools Used

This implementation was developed with assistance from **Claude Code** (Anthropic's AI coding assistant), which helped with:

- **Architecture Planning**: Structuring the multi-component system with proper separation of concerns
- **Regex Pattern Development**: Creating robust patterns for various address formats
- **Error Handling Strategy**: Implementing comprehensive edge case management
- **Testing Approach**: Designing test cases covering normal and edge scenarios

### AI Prompts Used
- "Design a Go backend API for address validation with proper error handling"
- "Create regex patterns for parsing various US address formats"
- "Implement standardization logic for street names and state abbreviations"
- "Add edge case handling for malformed and partial addresses"

The AI assistance focused on best practices for Go HTTP servers, regex optimization, and comprehensive error handling rather than external service integration.
