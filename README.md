# Address Validation API - Dual Implementation

This project provides a backend API for validating and standardizing US property addresses with **two complete implementations** to demonstrate different approaches and technologies.

## 🏗️ Project Structure

```
validate-address-api/
├── nodejs/          # Node.js + TypeScript + Fastify implementation
├── go/             # Go implementation
└── README.md       # This overview file
```

## 🎯 Why Two Implementations?

### Strategic Decision Making
I implemented both **Node.js/TypeScript** and **Go** versions to provide:

1. **Technology Comparison**: Direct comparison of performance, development experience, and maintainability
2. **Team Flexibility**: Different teams can choose the stack that aligns with their expertise
3. **Learning Opportunity**: Demonstrates how the same business logic translates across languages
4. **Risk Mitigation**: Having multiple implementations reduces dependency on a single technology stack

## 🚀 Implementation Details

### Node.js + TypeScript + Fastify (`/nodejs`)
**Framework Choice: Fastify over Express**

**Why Fastify?**
- **Performance**: 2-3x faster than Express
- **Built-in Validation**: JSON Schema validation eliminates middleware overhead
- **TypeScript First**: Superior TypeScript integration out of the box
- **Modern Architecture**: Designed for async/await and modern Node.js patterns

**Key Features:**
- Full TypeScript type safety
- Comprehensive test suite with Jest
- JSON Schema request/response validation
- Hot reload development environment
- ESLint + Prettier code formatting
- Confidence scoring algorithm
- Detailed error handling and logging

### Go Implementation (`/go`)
**Why Go?**
- **Performance**: Compiled binary with excellent runtime performance
- **Concurrency**: Built-in goroutines for high-throughput scenarios
- **Deployment**: Single binary deployment with minimal dependencies
- **Memory Efficiency**: Lower memory footprint for resource-constrained environments

## 🔍 My Thought Process

### 1. Requirements Analysis
- **Core Need**: Validate and standardize US addresses from free-form text
- **Quality Requirements**: Handle edge cases, typos, abbreviations
- **Performance Requirements**: Fast response times for real-time validation
- **Reliability Requirements**: Confidence scoring and graceful degradation

### 2. Architecture Decisions

**API Design Philosophy:**
- Single endpoint: `POST /validate-address`
- Clear response structure with status indicators
- Confidence scoring for validation quality
- Detailed correction tracking

**Validation Logic Strategy:**
```
Input → Normalize → Extract Components → Expand Abbreviations → Score Confidence → Format Response
```

**Edge Case Handling:**
- Partial addresses (missing components)
- Abbreviation expansion (St → Street, CA → California)
- Mixed case and punctuation normalization
- Apartment numbers and extended ZIP codes
- Typo tolerance and fuzzy matching

### 3. Technology Selection Rationale

**Node.js/TypeScript:**
- Rapid development and iteration
- Rich ecosystem for validation and testing
- Strong typing for complex data structures
- JSON-native processing
- Excellent developer experience

**Go:**
- Production-ready performance
- Simple deployment model
- Strong standard library
- Excellent for microservices architecture

## 🎯 Validation Features

Both implementations provide identical functionality:

**Address Parsing:**
- Street number extraction (including apartment numbers like "123A")
- Street name normalization and expansion
- City and state identification
- ZIP code extraction (including ZIP+4)

**Smart Corrections:**
- Abbreviation expansion: St→Street, Ave→Avenue
- Direction expansion: N→North, SW→Southwest
- State normalization: California→CA
- Case standardization: proper title case

**Quality Assessment:**
- Confidence scoring (0.0 to 1.0)
- Status indicators: valid/corrected/unverifiable
- Detailed correction tracking

**Edge Case Handling:**
- Partial addresses with missing components
- Mixed punctuation and formatting
- Common typos and variations
- International format variations

## 📚 Documentation

- **[README.md](README.md)**: Detailed development process and technical decisions
- **[go/README.md](go/README.md)**: Go implementation specifics
- **[nodejs/README.md](nodejs/README.md)**: Node.js implementation specifics
- Each implementation includes comprehensive inline documentation
