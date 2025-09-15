package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

func main() {
	validator := NewAddressValidator()
	
	mux := http.NewServeMux()
	
	mux.HandleFunc("POST /validate-address", handleValidateAddress(validator))
	mux.HandleFunc("GET /health", handleHealthCheck)
	
	fmt.Println("Starting address validation API server on :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}

func handleValidateAddress(validator *AddressValidator) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req AddressRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeErrorResponse(w, "Invalid JSON format", http.StatusBadRequest)
			return
		}

		if req.Address == "" {
			writeErrorResponse(w, "Address field is required", http.StatusBadRequest)
			return
		}

		response, err := validator.ValidateAndStandardize(req.Address)
		if err != nil {
			writeErrorResponse(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(response); err != nil {
			log.Printf("Error encoding response: %v", err)
		}
	}
}

func handleHealthCheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	response := map[string]string{
		"status":  "healthy",
		"service": "address-validation-api",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func writeErrorResponse(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	
	errorResponse := map[string]string{
		"error": message,
	}
	
	json.NewEncoder(w).Encode(errorResponse)
}