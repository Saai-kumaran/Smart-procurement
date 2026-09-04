"""
Centralized API Endpoints and External Service Configurations.
Allows changing remote endpoints and timeouts without altering business logic.
"""

# Copernicus Sentinel Hub / Data Space
COPERNICUS_AUTH_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
COPERNICUS_STAT_URL = "https://sh.dataspace.copernicus.eu/api/v1/statistics"
COPERNICUS_PROCESS_URL = "https://sh.dataspace.copernicus.eu/api/v1/process"

# OpenWeatherMap / IMD
OPENWEATHER_CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather"
OPENWEATHER_FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"
OPENWEATHER_ONECALL_URL = "https://api.openweathermap.org/data/3.0/onecall"

# Mappls / MapmyIndia
MAPPLS_AUTH_URL = "https://outpost.mappls.com/api/security/oauth/token"
MAPPLS_GEOCODE_URL = "https://atlas.mappls.com/api/places/geocode"
MAPPLS_ROUTING_URL = "https://apis.mappls.com/advancedmaps/v1"

# Bhashini Digital India Language Initiative
BHASHINI_PIPELINE_URL = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
BHASHINI_SUPPORTED_LANGUAGES = {
    "hi": "Hindi",
    "en": "English",
    "pa": "Punjabi",
    "te": "Telugu",
    "mr": "Marathi",
    "ta": "Tamil",
    "kn": "Kannada",
    "bn": "Bengali"
}

# e-NAM Agmarknet Mandi API
ENAM_MANDI_PRICES_URL = "https://enam.gov.in/web/api/mandi-prices"

# Minimum Support Price (MSP) Reference Data (INR per Quintal - 2025-26 Standard)
DEFAULT_MSP_RATES = {
    "Wheat": 2275.0,
    "Paddy": 2300.0,
    "Basmati Rice": 3200.0,
    "Soybean": 4600.0,
    "Maize": 2090.0,
    "Cotton": 6620.0,
    "Mustard": 5650.0,
    "Gram": 5440.0
}

# Standard API timeouts
HTTP_TIMEOUT_SECONDS = 8.0
HTTP_MAX_RETRIES = 2
