package main

import "time"

type AddressRequest struct {
	Address string `json:"address" binding:"required"`
}

type AddressResponse struct {
	Status          string           `json:"status"`
	OriginalAddress string           `json:"original_address"`
	ValidatedAddress *ValidatedAddress `json:"validated_address,omitempty"`
	Message         string           `json:"message,omitempty"`
	ProcessedAt     time.Time        `json:"processed_at"`
}

type ValidatedAddress struct {
	StreetNumber string `json:"street_number,omitempty"`
	StreetName   string `json:"street_name,omitempty"`
	Unit         string `json:"unit,omitempty"`
	City         string `json:"city,omitempty"`
	State        string `json:"state,omitempty"`
	ZipCode      string `json:"zip_code,omitempty"`
	ZipPlus4     string `json:"zip_plus4,omitempty"`
	County       string `json:"county,omitempty"`
	FullAddress  string `json:"full_address"`
}

const (
	StatusValid        = "valid"
	StatusCorrected    = "corrected"
	StatusUnverifiable = "unverifiable"
)