/**
 * Centralized API client for SIH26032 Backend.
 * Connects React frontend directly to FastAPI REST endpoints.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.detail || data?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Authentication
  login: (username, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  register: (payload) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  getCurrentUser: () => request("/auth/me"),

  // Farmer & Farm Management
  getFarmerProfile: (farmerId) => request(`/farmer/profile/${farmerId}`),
  getFarmerFarms: (farmerId) => request(`/farmer/farms/${farmerId}`),
  createFarm: (payload) => request("/farmer/farms", { method: "POST", body: JSON.stringify(payload) }),
  createCrop: (payload) => request("/farmer/crops", { method: "POST", body: JSON.stringify(payload) }),

  // Bookings & Slot Optimization
  recommendSlots: (farmerId, cropId, preferredCentreId = null) =>
    request("/bookings/recommend-slots", {
      method: "POST",
      body: JSON.stringify({
        farmer_id: farmerId,
        crop_id: cropId,
        preferred_centre_id: preferredCentreId,
      }),
    }),
  confirmBooking: (payload) =>
    request("/bookings/confirm", { method: "POST", body: JSON.stringify(payload) }),
  getFarmerBookings: (farmerId) => request(`/bookings/farmer/${farmerId}`),
  getBookingDetails: (bookingId) => request(`/bookings/${bookingId}`),
  checkInGeofence: (bookingId, latitude, longitude) =>
    request(`/bookings/${bookingId}/check-in`, {
      method: "POST",
      body: JSON.stringify({ latitude, longitude }),
    }),
  updateBookingStatus: (bookingId, newStatus, reason = null) =>
    request(`/bookings/${bookingId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ new_status: newStatus, reason }),
    }),

  // Procurement Centres
  getCentres: (district = null) =>
    request(`/centres${district ? `?district=${encodeURIComponent(district)}` : ""}`),
  getCentreDetails: (centreId) => request(`/centres/${centreId}`),
  getCentreSlots: (centreId, daysAhead = 7) => request(`/centres/${centreId}/slots?days_ahead=${daysAhead}`),

  // Queue Management
  getCentreQueue: (centreId) => request(`/queue/centre/${centreId}`),
  getBookingQueueStatus: (bookingId) => request(`/queue/booking/${bookingId}`),

  // Intelligence & Predictions
  getSatelliteNDVI: (lat, lon) =>
    request(`/predictions/satellite-ndvi?latitude=${lat}&longitude=${lon}`),
  getCropMaturity: (cropId) => request(`/predictions/crop-maturity/${cropId}`),
  getDemandForecast: (centreId) => request(`/predictions/demand-forecast/${centreId}`),
  getWeatherForecast: (lat, lon) =>
    request(`/predictions/weather-forecast?latitude=${lat}&longitude=${lon}`),

  // Quality Inspection
  submitInspection: (payload) =>
    request("/inspections", { method: "POST", body: JSON.stringify(payload) }),
  getInspection: (bookingId) => request(`/inspections/booking/${bookingId}`),

  // Weighbridge Weighment
  recordWeighment: (payload) =>
    request("/weighments", { method: "POST", body: JSON.stringify(payload) }),
  getWeighment: (bookingId) => request(`/weighments/booking/${bookingId}`),

  // Payments / DBT
  getPaymentDetails: (bookingId) => request(`/payments/booking/${bookingId}`),
  settlePayment: (bookingId) =>
    request("/payments/settle", { method: "POST", body: JSON.stringify({ booking_id: bookingId }) }),

  // Notifications & Bhashini Voice
  getUserNotifications: (userId) => request(`/notifications/user/${userId}`),
  getVoiceScript: (token, centre, time, lang = "hi") =>
    request(
      `/notifications/voice-script?booking_token=${encodeURIComponent(token)}&centre_name=${encodeURIComponent(
        centre
      )}&slot_time=${encodeURIComponent(time)}&lang=${lang}`
    ),
  getSupportedLanguages: () => request("/notifications/languages"),
  scanWeatherAlerts: () => request("/notifications/weather-alerts/scan", { method: "POST" }),
};
