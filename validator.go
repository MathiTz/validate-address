package main

import (
	"regexp"
	"strings"
	"time"
)

type AddressValidator struct {
	stateAbbreviations map[string]string
	commonMisspellings map[string]string
	streetSuffixes     map[string]string
}

func NewAddressValidator() *AddressValidator {
	return &AddressValidator{
		stateAbbreviations: getStateAbbreviations(),
		commonMisspellings: getCommonMisspellings(),
		streetSuffixes:     getStreetSuffixes(),
	}
}

func (av *AddressValidator) ValidateAndStandardize(address string) (*AddressResponse, error) {
	response := &AddressResponse{
		OriginalAddress: address,
		ProcessedAt:     time.Now(),
	}

	cleanedAddress := av.cleanAddress(address)
	if cleanedAddress == "" {
		response.Status = StatusUnverifiable
		response.Message = "Address is empty or contains only invalid characters"
		return response, nil
	}

	parsedAddress := av.parseAddress(cleanedAddress)
	if parsedAddress == nil {
		response.Status = StatusUnverifiable
		response.Message = "Unable to parse address components"
		return response, nil
	}

	standardizedAddress := av.standardizeAddress(parsedAddress)
	validationResult := av.validateComponents(standardizedAddress)

	response.ValidatedAddress = standardizedAddress
	response.Status = validationResult.status
	response.Message = validationResult.message

	return response, nil
}

func (av *AddressValidator) cleanAddress(address string) string {
	if len(address) > 500 {
		return ""
	}
	
	address = strings.TrimSpace(address)
	if address == "" {
		return ""
	}
	
	address = regexp.MustCompile(`\s+`).ReplaceAllString(address, " ")
	address = regexp.MustCompile(`[^\w\s\-\.#/,]`).ReplaceAllString(address, "")
	
	if len(strings.TrimSpace(address)) < 5 {
		return ""
	}
	
	return address
}

func (av *AddressValidator) parseAddress(address string) *ValidatedAddress {
	patterns := []struct {
		regex *regexp.Regexp
		parse func([]string) *ValidatedAddress
	}{
		{
			regexp.MustCompile(`(?i)^(\d+)\s+([^,]+?)(?:\s+(apt|apartment|unit|ste|suite|#)\s*([^,]+?))?\s*,?\s*([^,]+?)\s*,?\s*([a-z]{2})\s+(\d{5})(?:-(\d{4}))?$`),
			av.parseFullAddress,
		},
		{
			regexp.MustCompile(`(?i)^(\d+)\s+([^,]+?)\s*,?\s*([^,]+?)\s*,?\s*([a-z]{2})\s+(\d{5})(?:-(\d{4}))?$`),
			av.parseSimpleAddress,
		},
	}

	for _, pattern := range patterns {
		if matches := pattern.regex.FindStringSubmatch(address); matches != nil {
			return pattern.parse(matches)
		}
	}

	return av.parsePartialAddress(address)
}

func (av *AddressValidator) parseFullAddress(matches []string) *ValidatedAddress {
	return &ValidatedAddress{
		StreetNumber: matches[1],
		StreetName:   matches[2],
		Unit:         matches[4],
		City:         matches[5],
		State:        strings.ToUpper(matches[6]),
		ZipCode:      matches[7],
		ZipPlus4:     matches[8],
	}
}

func (av *AddressValidator) parseSimpleAddress(matches []string) *ValidatedAddress {
	return &ValidatedAddress{
		StreetNumber: matches[1],
		StreetName:   matches[2],
		City:         matches[3],
		State:        strings.ToUpper(matches[4]),
		ZipCode:      matches[5],
		ZipPlus4:     matches[6],
	}
}

func (av *AddressValidator) parsePartialAddress(address string) *ValidatedAddress {
	parts := strings.Fields(address)
	if len(parts) < 2 {
		return nil
	}

	result := &ValidatedAddress{}
	
	if matched, _ := regexp.MatchString(`^\d+`, parts[0]); matched {
		result.StreetNumber = parts[0]
		parts = parts[1:]
	}

	for i, part := range parts {
		if av.isState(part) {
			result.State = strings.ToUpper(part)
			if i > 0 {
				result.City = strings.Join(parts[:i], " ")
			}
			if i < len(parts)-1 && av.isZipCode(parts[i+1]) {
				result.ZipCode = parts[i+1]
			}
			break
		}
	}

	if result.StreetNumber != "" && result.State == "" {
		for i := len(parts) - 1; i >= 0; i-- {
			if av.isZipCode(parts[i]) {
				result.ZipCode = parts[i]
				if i > 0 && av.isState(parts[i-1]) {
					result.State = strings.ToUpper(parts[i-1])
					if i > 1 {
						result.City = strings.Join(parts[:i-1], " ")
					}
				}
				break
			}
		}
	}

	if result.StreetNumber != "" && result.City == "" && result.State == "" {
		result.StreetName = strings.Join(parts, " ")
	}

	return result
}

func (av *AddressValidator) standardizeAddress(addr *ValidatedAddress) *ValidatedAddress {
	if addr == nil {
		return nil
	}

	if addr.StreetName != "" {
		addr.StreetName = av.standardizeStreetName(addr.StreetName)
	}

	if addr.City != "" {
		addr.City = av.standardizeCity(addr.City)
	}

	if addr.State != "" {
		addr.State = av.standardizeState(addr.State)
	}

	addr.FullAddress = av.buildFullAddress(addr)

	return addr
}

func (av *AddressValidator) standardizeStreetName(streetName string) string {
	streetName = strings.TrimSpace(streetName)
	streetName = av.toTitleCase(streetName)
	
	for abbrev, full := range av.streetSuffixes {
		pattern := regexp.MustCompile(`(?i)\b` + regexp.QuoteMeta(abbrev) + `\b`)
		streetName = pattern.ReplaceAllString(streetName, full)
	}

	for misspelled, correct := range av.commonMisspellings {
		pattern := regexp.MustCompile(`(?i)\b` + regexp.QuoteMeta(misspelled) + `\b`)
		streetName = pattern.ReplaceAllString(streetName, correct)
	}

	return streetName
}

func (av *AddressValidator) standardizeCity(city string) string {
	city = strings.TrimSpace(city)
	return av.toTitleCase(city)
}

func (av *AddressValidator) standardizeState(state string) string {
	state = strings.TrimSpace(strings.ToUpper(state))
	if _, exists := av.stateAbbreviations[state]; exists {
		return state
	}
	
	for abbrev, fullName := range av.stateAbbreviations {
		if strings.EqualFold(state, fullName) {
			return abbrev
		}
	}
	
	return state
}

func (av *AddressValidator) buildFullAddress(addr *ValidatedAddress) string {
	var parts []string

	if addr.StreetNumber != "" && addr.StreetName != "" {
		streetPart := addr.StreetNumber + " " + addr.StreetName
		if addr.Unit != "" {
			streetPart += " " + addr.Unit
		}
		parts = append(parts, streetPart)
	}

	if addr.City != "" {
		parts = append(parts, addr.City)
	}

	if addr.State != "" {
		statePart := addr.State
		if addr.ZipCode != "" {
			statePart += " " + addr.ZipCode
			if addr.ZipPlus4 != "" {
				statePart += "-" + addr.ZipPlus4
			}
		}
		parts = append(parts, statePart)
	}

	return strings.Join(parts, ", ")
}

type validationResult struct {
	status  string
	message string
}

func (av *AddressValidator) validateComponents(addr *ValidatedAddress) validationResult {
	if addr == nil {
		return validationResult{StatusUnverifiable, "Unable to parse address"}
	}

	missingComponents := []string{}
	correctedComponents := []string{}

	if addr.StreetNumber == "" {
		missingComponents = append(missingComponents, "street number")
	}

	if addr.StreetName == "" {
		missingComponents = append(missingComponents, "street name")
	}

	if addr.City == "" {
		missingComponents = append(missingComponents, "city")
	}

	if addr.State == "" {
		missingComponents = append(missingComponents, "state")
	} else if !av.isValidState(addr.State) {
		missingComponents = append(missingComponents, "valid state")
	}

	if addr.ZipCode == "" {
		missingComponents = append(missingComponents, "ZIP code")
	} else if !av.isValidZipCode(addr.ZipCode) {
		missingComponents = append(missingComponents, "valid ZIP code")
	}

	if len(missingComponents) > 2 {
		return validationResult{
			StatusUnverifiable,
			"Missing critical components: " + strings.Join(missingComponents, ", "),
		}
	}

	if len(missingComponents) > 0 {
		return validationResult{
			StatusCorrected,
			"Address standardized but missing: " + strings.Join(missingComponents, ", "),
		}
	}

	if len(correctedComponents) > 0 {
		return validationResult{
			StatusCorrected,
			"Address standardized with corrections: " + strings.Join(correctedComponents, ", "),
		}
	}

	return validationResult{StatusValid, "Address is valid and standardized"}
}

func (av *AddressValidator) isState(s string) bool {
	s = strings.ToUpper(strings.TrimSpace(s))
	_, exists := av.stateAbbreviations[s]
	if exists {
		return true
	}
	
	for _, fullName := range av.stateAbbreviations {
		if strings.EqualFold(s, fullName) {
			return true
		}
	}
	
	return false
}

func (av *AddressValidator) isValidState(state string) bool {
	_, exists := av.stateAbbreviations[strings.ToUpper(state)]
	return exists
}

func (av *AddressValidator) isZipCode(s string) bool {
	matched, _ := regexp.MatchString(`^\d{5}(-\d{4})?$`, s)
	return matched
}

func (av *AddressValidator) isValidZipCode(zipCode string) bool {
	return av.isZipCode(zipCode)
}

func (av *AddressValidator) toTitleCase(s string) string {
	words := strings.Fields(strings.ToLower(s))
	for i, word := range words {
		if len(word) > 0 {
			words[i] = strings.ToUpper(string(word[0])) + word[1:]
		}
	}
	return strings.Join(words, " ")
}

func getStateAbbreviations() map[string]string {
	return map[string]string{
		"AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
		"CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
		"HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
		"KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
		"MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
		"MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
		"NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
		"OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
		"SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
		"VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
		"DC": "District of Columbia",
	}
}

func getCommonMisspellings() map[string]string {
	return map[string]string{
		"Steet":   "Street",
		"Streat":  "Street",
		"Streeet": "Street",
		"Avenu":   "Avenue",
		"Aveune":  "Avenue",
		"Blvd":    "Boulevard",
		"Rd":      "Road",
		"Dr":      "Drive",
		"Ct":      "Court",
		"Ln":      "Lane",
		"Pl":      "Place",
		"Pkwy":    "Parkway",
	}
}

func getStreetSuffixes() map[string]string {
	return map[string]string{
		"St":   "Street",
		"Ave":  "Avenue",
		"Blvd": "Boulevard",
		"Rd":   "Road",
		"Dr":   "Drive",
		"Ct":   "Court",
		"Ln":   "Lane",
		"Pl":   "Place",
		"Pkwy": "Parkway",
		"Cir":  "Circle",
		"Way":  "Way",
		"Trl":  "Trail",
		"Ter":  "Terrace",
	}
}