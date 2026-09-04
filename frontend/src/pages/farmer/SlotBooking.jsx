import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Award,
  ChevronRight
} from "lucide-react";

export default function SlotBooking({ setActiveTab, onSelectBooking }) {
  const { user, t } = useAuth();
  const [crops, setCrops] = useState([]);
  const [selectedCropId, setSelectedCropId] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendationData, setRecommendationData] = useState(null);
  const [reserving, setReserving] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    loadCrops();
  }, [user.farmerId]);

  const loadCrops = async () => {
    try {
      const farms = await api.getFarmerFarms(user.farmerId || "frm-01");
      const allCrops = (farms || []).flatMap((f) => f.crops);
      setCrops(allCrops);
      if (allCrops.length > 0) {
        setSelectedCropId(allCrops[0].id);
        fetchRecommendations(allCrops[0].id);
      }
    } catch (err) {
      console.error("Error loading crops:", err);
    }
  };

  const fetchRecommendations = async (cropId) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await api.recommendSlots(user.farmerId || "frm-01", cropId);
      setRecommendationData(data);
    } catch (err) {
      setErrorMsg("Failed to generate AI slot recommendations: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSlot = async (slot) => {
    setReserving(true);
    setErrorMsg("");
    try {
      const payload = {
        farmer_id: user.farmerId || "frm-01",
        crop_id: selectedCropId,
        centre_id: slot.centre_id,
        slot_id: slot.slot_id,
        slot_date: slot.slot_date,
        time_window: slot.time_window,
        quantity_quintals: 60.0
      };
      const res = await api.confirmBooking(payload);
      setConfirmedBooking(res);
      if (onSelectBooking) onSelectBooking(res.id);
    } catch (err) {
      setErrorMsg("Booking confirmation failed: " + err.message);
    } finally {
      setReserving(false);
    }
  };

  return (
    <div>
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">
            <Calendar size={22} color="var(--gov-primary)" />
            <span>{t("slot_booking_title", "AI-Powered Harvest Slot Allocation & Congestion Balancer")}</span>
          </div>
          <span className="status-badge badge-inspection">AI Multi-Objective</span>
        </div>

        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "16px" }}>
          {t("slot_booking_subtitle", "Avoid mandi traffic jams, minimize open-air crop spoilage, and secure guaranteed same-day weighment.")}
        </p>

        {/* Crop Selection */}
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "16px" }}>
          <div className="form-group" style={{ flex: "1 1 240px", marginBottom: "0" }}>
            <label className="form-label">{t("select_crop_label", "Select Registered Crop:")}</label>
            <select
              id="select-booking-crop"
              className="form-control"
              value={selectedCropId}
              onChange={(e) => {
                setSelectedCropId(e.target.value);
                fetchRecommendations(e.target.value);
              }}
            >
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.crop_name} ({c.variety}) • {c.estimated_quantity_quintals} Quintals
                </option>
              ))}
            </select>
          </div>

          <button
            id="btn-recalculate-slots"
            className="btn btn-secondary"
            style={{ height: "48px" }}
            onClick={() => fetchRecommendations(selectedCropId)}
            disabled={loading}
          >
            <TrendingUp size={18} />
            <span>{loading ? "Optimizing..." : t("refresh", "Re-calculate Slots")}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="gov-alert gov-alert-danger">
            <AlertTriangle size={20} />
            <div>{errorMsg}</div>
          </div>
        )}

        {/* Confirmation Success Banner */}
        {confirmedBooking && (
          <div className="gov-alert gov-alert-success" style={{ flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle size={24} color="#16a34a" />
              <strong style={{ fontSize: "17px" }}>
                {t("slot_confirmed_success", "Procurement Slot Successfully Confirmed!")}
              </strong>
            </div>
            <div>
              {t("token", "Digital Token")}: <strong>{confirmedBooking.booking_token}</strong> | #{confirmedBooking.token_number}
            </div>
            <div>
              {t("reporting_mandi", "Reporting Centre")}: <strong>{confirmedBooking.centre_name}</strong> | {confirmedBooking.slot_date} ({confirmedBooking.slot_time})
            </div>
            <button
              id="btn-goto-digital-pass"
              className="btn btn-primary btn-sm"
              style={{ alignSelf: "flex-start", marginTop: "6px" }}
              onClick={() => setActiveTab("booking-details")}
            >
              {t("view_qr_pass", "View QR Pass")}
            </button>
          </div>
        )}
      </div>

      {/* Recommended Slots List */}
      {recommendationData && recommendationData.recommendations && (
        <div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px", color: "var(--gov-navy)" }}>
            {t("best_ai_slots", "Recommended Optimal Delivery Windows (AI Ranked)")}
          </h3>

          {recommendationData.recommendations.map((slot, index) => {
            const isTopRanked = index === 0;
            return (
              <div
                key={slot.slot_id}
                className={`slot-card ${isTopRanked ? "recommended-top" : ""}`}
                id={`slot-card-${index + 1}`}
              >
                <div className="slot-rank-badge">
                  {index === 0 ? "★ Rank #1 (Optimal Best Fit)" : `#${index + 1} Alternative`}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                  <div>
                    <h4 style={{ fontSize: "18px", fontWeight: 800, color: "var(--gov-navy)" }}>
                      {slot.centre_name}
                    </h4>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                      <MapPin size={15} />
                      <span>{slot.district} • Distance: <strong>{slot.distance_km} km</strong> (~{slot.estimated_travel_minutes} mins)</span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "24px", fontWeight: 900, color: "var(--gov-primary)" }}>
                      {slot.score}<span style={{ fontSize: "14px" }}>/100</span>
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                      Optimization Score
                    </div>
                  </div>
                </div>

                {/* Slot Details Bar */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", padding: "10px", backgroundColor: "#f8fafc", borderRadius: "6px", marginBottom: "12px", border: "1px solid var(--border-color)" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>{t("slot_datetime", "Date & Time")}</div>
                    <div style={{ fontSize: "14px", fontWeight: 700 }}>{slot.slot_date} • {slot.time_window}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>{t("harvest_risk_col", "Weather Risk")}</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: slot.weather_risk_level === "LOW" ? "#16a34a" : "#d97706" }}>
                      {slot.weather_risk_level === "LOW" ? t("risk_low", "Low Risk") : t("risk_moderate", "Moderate Risk")} • {slot.weather_condition}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>{t("capacity_utilization", "Mandi Utilization")}</div>
                    <div style={{ fontSize: "14px", fontWeight: 700 }}>
                      {slot.utilization_pct}% (Remaining: {slot.remaining_capacity}q)
                    </div>
                  </div>
                </div>

                {/* Confirm Button */}
                <button
                  id={`btn-confirm-slot-${index + 1}`}
                  className="btn btn-primary btn-block"
                  disabled={reserving}
                  onClick={() => handleConfirmSlot(slot)}
                >
                  <CheckCircle size={18} />
                  <span>{t("reserve_this_slot", "Reserve This Slot")}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
