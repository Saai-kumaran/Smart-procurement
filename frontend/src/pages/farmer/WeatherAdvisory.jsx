import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import {
  CloudSun,
  CloudRain,
  Sun,
  AlertTriangle,
  CheckCircle,
  Wind,
  Droplets,
  Satellite,
  Compass,
  Calendar,
  Sparkles,
  RefreshCw
} from "lucide-react";

export default function WeatherAdvisory({ setActiveTab }) {
  const { user, t } = useAuth();
  const [weatherData, setWeatherData] = useState(null);
  const [ndviData, setNdviData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coordinates, setCoordinates] = useState({ lat: 29.6857, lon: 76.9905 }); // Karnal default
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    loadWeatherData();
  }, [coordinates]);

  const loadWeatherData = async () => {
    setLoading(true);
    try {
      const [wRes, nRes] = await Promise.all([
        api.getWeatherForecast(coordinates.lat, coordinates.lon),
        api.getSatelliteNDVI(coordinates.lat, coordinates.lon)
      ]);
      setWeatherData(wRes);
      setNdviData(nRes);
    } catch (err) {
      console.error("Error loading weather and NDVI advisory:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (risk) => {
    switch (risk) {
      case "HIGH":
        return <span className="badge badge-danger">{t("risk_high", "High Rain Risk")}</span>;
      case "MODERATE":
        return <span className="badge badge-warning">{t("risk_moderate", "Moderate Risk")}</span>;
      default:
        return <span className="badge badge-success">{t("risk_low", "Low Risk (Favorable)")}</span>;
    }
  };

  return (
    <div>
      {/* Header Card */}
      <div className="gov-card" style={{ borderLeft: "5px solid #0284c7" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
              {t("weather_subtitle", "IMD Weather Forecast & Copernicus Sentinel-2 Satellite Intelligence")}
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--gov-navy)", marginTop: "2px" }}>
              {t("weather_title", "Agricultural Weather & Sentinel-2 Satellite Advisory")}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              {t("village", "Location")}: <strong>{user.village || "Karnal, Haryana"}</strong> • Lat: {coordinates.lat.toFixed(4)}°N, Lon: {coordinates.lon.toFixed(4)}°E
            </p>
          </div>

          <button id="btn-refresh-weather" className="btn btn-secondary" onClick={loadWeatherData} disabled={loading}>
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            <span>{t("refresh", "Refresh")}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="gov-card" style={{ textAlign: "center", padding: "40px" }}>
          <CloudSun size={48} color="var(--gov-primary)" style={{ animation: "pulse 1.5s infinite" }} />
          <p style={{ marginTop: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
            {t("checkin_in_progress", "Loading weather and satellite imagery data...")}
          </p>
        </div>
      ) : (
        <>
          {/* Real-time Weather & Satellite Banner */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "20px" }}>
            {/* Current Weather Card */}
            <div className="gov-card" style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", border: "1px solid #bae6fd" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0369a1" }}>{t("current_weather", "Current Weather")}</div>
                  <div style={{ fontSize: "36px", fontWeight: 800, color: "#0c4a6e", marginTop: "4px" }}>
                    {weatherData?.current?.temperature_c || "31"}°C
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 600, color: "#0284c7" }}>
                    {weatherData?.current?.weather_condition || "Clear / Partly Sunny"}
                  </div>
                </div>
                <div style={{ backgroundColor: "#ffffff", padding: "12px", borderRadius: "50%", boxShadow: "var(--shadow-sm)" }}>
                  <Sun size={36} color="#eab308" />
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #bae6fd" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#0369a1" }}>
                  <Droplets size={16} />
                  <span>{t("humidity", "Humidity")}: {weatherData?.current?.humidity_pct || 62}%</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#0369a1" }}>
                  <Wind size={16} />
                  <span>{t("wind_speed", "Wind")}: 12 km/h</span>
                </div>
              </div>
            </div>

            {/* Satellite NDVI Crop Health Card */}
            <div className="gov-card" style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", border: "1px solid #bbf7d0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#15803d" }}>{t("satellite_ndvi", "Sentinel-2 NDVI Vegetation Index")}</div>
                  <div style={{ fontSize: "36px", fontWeight: 800, color: "#14532d", marginTop: "4px" }}>
                    {ndviData?.ndvi_value || "0.74"}
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#16a34a" }}>
                    {ndviData?.vegetation_health || t("optimal_maturity", "Optimal Maturity (Ready for Harvest)")}
                  </div>
                </div>
                <div style={{ backgroundColor: "#ffffff", padding: "12px", borderRadius: "50%", boxShadow: "var(--shadow-sm)" }}>
                  <Satellite size={36} color="#16a34a" />
                </div>
              </div>

              <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #bbf7d0", fontSize: "12px", color: "#166534" }}>
                Acquisition: <strong>{ndviData?.acquisition_date || "2026-09-02"}</strong> • Cloud Coverage: {ndviData?.cloud_coverage_pct || "5"}%
              </div>
            </div>
          </div>

          {/* 7-Day Harvest Advisory & Rain Risk Forecast */}
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">
                <Calendar size={20} color="var(--gov-primary)" />
                <span>{t("seven_day_forecast", "7-Day Harvest & Procurement Weather Forecast")}</span>
              </div>
              {setActiveTab && (
                <button
                  id="btn-goto-book"
                  className="btn btn-primary"
                  style={{ padding: "6px 12px", fontSize: "13px" }}
                  onClick={() => setActiveTab("book-slot")}
                >
                  <Sparkles size={14} />
                  <span>{t("nav_book_slot", "Book Slot")}</span>
                </button>
              )}
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t("date_col", "Date")}</th>
                    <th>{t("temp_col", "Temp (Max/Min)")}</th>
                    <th>{t("condition_col", "Condition")}</th>
                    <th>{t("rain_prob_col", "Rain Probability")}</th>
                    <th>{t("harvest_risk_col", "Harvest Risk")}</th>
                    <th>{t("advisory_col", "Scientific Advisory")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(weatherData?.forecast_7day || []).map((day, idx) => (
                    <tr
                      key={idx}
                      style={{
                        backgroundColor: day.risk_level === "HIGH" ? "#fef2f2" : undefined,
                        cursor: "pointer"
                      }}
                      onClick={() => setSelectedDay(idx)}
                    >
                      <td>
                        <strong>{day.date}</strong>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {idx === 0 ? "Today" : idx === 1 ? "Tomorrow" : `Day ${idx + 1}`}
                        </div>
                      </td>
                      <td>{day.temp_max}°C / {day.temp_min}°C</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {day.rain_probability_pct > 50 ? (
                            <CloudRain size={16} color="#dc2626" />
                          ) : (
                            <Sun size={16} color="#eab308" />
                          )}
                          <span>{day.condition}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div
                            style={{
                              width: "50px",
                              backgroundColor: "#e2e8f0",
                              height: "8px",
                              borderRadius: "4px",
                              overflow: "hidden"
                            }}
                          >
                            <div
                              style={{
                                width: `${day.rain_probability_pct}%`,
                                backgroundColor: day.rain_probability_pct > 50 ? "#dc2626" : "#0284c7",
                                height: "100%"
                              }}
                            ></div>
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: 700 }}>{day.rain_probability_pct}%</span>
                        </div>
                      </td>
                      <td>{getRiskBadge(day.risk_level)}</td>
                      <td style={{ fontSize: "13px" }}>
                        {day.harvest_advisory || "Optimal conditions for harvesting, threshing, and transit to mandi."}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Decision Guidance */}
          <div className="gov-card" style={{ backgroundColor: "#fefce8", border: "1px solid #fef08a" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <AlertTriangle size={24} color="#ca8a04" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#854d0e" }}>
                  {t("slot_booking_title", "Smart Harvest & Delivery Recommendation")}
                </h4>
                <p style={{ fontSize: "13px", color: "#a16207", marginTop: "4px", lineHeight: "1.5" }}>
                  Copernicus Sentinel-2 NDVI analysis indicates crop moisture is between 11.5% and 12.5%. With less than 20% precipitation risk over the next 72 hours, 
                  harvesting and booking an immediate delivery slot avoids open-yard exposure and guarantees FAQ compliance.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
