import { AddressValidationResult, ValidatedAddress, ValidationStatus } from './types';

const stateAbbreviations: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
  'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
  'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
  'district of columbia': 'DC'
};

const streetAbbreviations: Record<string, string> = {
  'st': 'Street', 'ave': 'Avenue', 'blvd': 'Boulevard', 'dr': 'Drive', 'rd': 'Road',
  'ct': 'Court', 'cir': 'Circle', 'ln': 'Lane', 'way': 'Way', 'pl': 'Place',
  'pkwy': 'Parkway', 'ter': 'Terrace', 'sq': 'Square', 'hwy': 'Highway'
};

const directions: Record<string, string> = {
  'n': 'North', 's': 'South', 'e': 'East', 'w': 'West',
  'ne': 'Northeast', 'nw': 'Northwest', 'se': 'Southeast', 'sw': 'Southwest'
};

function normalizeAddress(address: string): string {
  return address.toLowerCase().trim().replace(/[,\.]/g, ' ').replace(/\s+/g, ' ');
}

function extractZipCode(parts: string[]): string | null {
  const zipPattern = /\b(\d{5}(?:-\d{4})?)\b/;
  for (let i = parts.length - 1; i >= 0; i--) {
    const match = parts[i].match(zipPattern);
    if (match) {
      parts.splice(i, 1);
      return match[1];
    }
  }
  return null;
}

function extractState(parts: string[]): string | null {
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i].toLowerCase();
    if (stateAbbreviations[part] || Object.values(stateAbbreviations).includes(part.toUpperCase())) {
      parts.splice(i, 1);
      return stateAbbreviations[part] || part.toUpperCase();
    }
  }
  return null;
}

function extractStreetNumber(parts: string[]): string | null {
  const numberPattern = /^\d+[A-Za-z]?$/;
  if (parts.length > 0 && numberPattern.test(parts[0])) {
    const number = parts.shift() || null;
    // Preserve uppercase letters in apartment numbers
    return number ? number.replace(/([a-z])$/, (match) => match.toUpperCase()) : null;
  }
  return null;
}

function expandStreetType(streetName: string): { expanded: string; corrected: boolean } {
  const words = streetName.split(' ');
  const lastWord = words[words.length - 1].toLowerCase();

  if (streetAbbreviations[lastWord]) {
    words[words.length - 1] = streetAbbreviations[lastWord];
    return { expanded: words.join(' '), corrected: true };
  }

  return { expanded: streetName, corrected: false };
}

function expandDirections(streetName: string): { expanded: string; corrected: boolean } {
  const words = streetName.split(' ');
  let corrected = false;

  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase();
    if (directions[word]) {
      words[i] = directions[word];
      corrected = true;
    }
  }

  return { expanded: words.join(' '), corrected };
}

function calculateConfidence(parsed: Partial<ValidatedAddress>, corrections: string[]): number {
  let confidence = 0.9;

  if (!parsed.streetNumber) confidence -= 0.2;
  if (!parsed.streetName) confidence -= 0.3;
  if (!parsed.city) confidence -= 0.2;
  if (!parsed.state) confidence -= 0.2;
  if (!parsed.zipCode) confidence -= 0.1;

  confidence -= corrections.length * 0.05;

  return Math.max(0.1, Math.min(1.0, confidence));
}

export function validateAddress(address: string): AddressValidationResult {
  const original = address;
  const normalized = normalizeAddress(address);
  const parts = normalized.split(' ').filter(part => part.length > 0);
  const corrections: string[] = [];

  if (parts.length === 0) {
    return {
      status: 'unverifiable',
      confidence: 0.0,
      original,
      validated: null,
      corrections: ['Empty or invalid address provided']
    };
  }

  const zipCode = extractZipCode(parts);
  const state = extractState(parts);
  const streetNumber = extractStreetNumber(parts);

  let city: string | null = null;
  let streetName: string | null = null;

  if (parts.length > 0) {
    if (parts.length >= 2) {
      // Check if the last part looks like a street type abbreviation
      const lastPart = parts[parts.length - 1].toLowerCase();
      const streetTypeAbbrevs = Object.keys(streetAbbreviations);

      if (streetTypeAbbrevs.includes(lastPart)) {
        // This is likely a street name with type, not a city
        streetName = parts.join(' ');
        city = null;
      } else {
        // Traditional parsing: last part is city, rest is street name
        city = parts.pop() || null;
        streetName = parts.join(' ');
      }
    } else {
      // For single remaining part, prefer street name if we have a street number
      // otherwise treat as city (like "Main Street, Anytown" -> streetName="Main Street")
      const singlePart = parts.join(' ');
      if (streetNumber) {
        streetName = singlePart;
      } else {
        // Check if it looks like a street name (contains common street indicators)
        const streetIndicators = /\b(street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|court|ct|circle|cir|boulevard|blvd|place|pl)\b/i;
        if (streetIndicators.test(singlePart)) {
          streetName = singlePart;
        } else {
          city = singlePart;
        }
      }
    }
  }

  if (streetName) {
    const directionResult = expandDirections(streetName);
    if (directionResult.corrected) {
      corrections.push('Direction abbreviations expanded');
      streetName = directionResult.expanded;
    }

    const streetResult = expandStreetType(streetName);
    if (streetResult.corrected) {
      corrections.push('Street type abbreviation expanded');
      streetName = streetResult.expanded;
    }
  }

  if (city) {
    city = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
  }

  if (streetName) {
    streetName = streetName.replace(/\b\w/g, l => l.toUpperCase());
  }

  const parsed: Partial<ValidatedAddress> = {
    streetNumber,
    streetName,
    city,
    state,
    zipCode
  };

  const confidence = calculateConfidence(parsed, corrections);
  let status: ValidationStatus = 'valid';

  if (corrections.length > 0) {
    status = 'corrected';
  }

  // Only mark as unverifiable if confidence is very low or we have almost no useful information
  if (confidence < 0.3 || (!streetName && !city)) {
    status = 'unverifiable';
  }

  const formatted = [
    streetNumber && streetName ? `${streetNumber} ${streetName}` : (streetName || ''),
    city,
    state && zipCode ? `${state} ${zipCode}` : (state || zipCode || '')
  ].filter(part => part).join(', ');

  const validated: ValidatedAddress = {
    streetNumber,
    streetName,
    city,
    state,
    zipCode,
    formatted
  };

  return {
    status,
    confidence: Math.round(confidence * 100) / 100,
    original,
    validated,
    corrections: corrections.length > 0 ? corrections : undefined
  };
}