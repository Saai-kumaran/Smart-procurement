import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import {
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  Scale,
  CreditCard,
  FileCheck,
  RefreshCw
} from "lucide-react";

export default function QueueStatus({ bookingId, setActiveTab }) {
  const { user, t } = useAuth();
  const [queueInfo, setQueueInfo] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, [bookingId]);

  const loadQueue = async () => {
    try {
      let bId = bookingId;
      if (!bId) {
        const bookings = await api.getFarmerBookings(user.farmerId || "frm-01");
        if (bookings && bookings.length > 0) {
          bId = bookings[0].id;
        }
      }
      if (bId) {
        const [bData, qData] = await Promise.all([
          api.getBookingDetails(bId),
          api.getBookingQueueStatus(bId)
        ]);
        setBooking(bData);
        setQueueInfo(qData);
      }
    } catch (err) {
      console.error("Error loading queue info:", err);
    } finally {
      setLoading(false);
    }
  };

  const STAGES = [
    { key: "BOOKED", label: t("stage_booked", "1. Slot Confirmed"), icon: Truck },
    { key: "CHECKED_IN", label: t("stage_gate_entry", "2. Gate Entry (Check-in)"), icon: Truck },
    { key: "INSPECTION", label: t("stage_quality_check", "3. Quality Inspection"), icon: FileCheck },
    { key: "WEIGHING", label: t("stage_weighbridge", "4. Weighbridge Scale"), icon: Scale },
    { key: "PAYMENT_SETTLED", label: t("stage_dbt_settled", "5. DBT Payment Settled"), icon: CreditCard },
  ];

  const getStageIndex = (status) => {
    if (status === "BOOKED") return 0;
    if (status === "ARRIVED" || status === "CHECKED_IN") return 1;
    if (status === "INSPECTION" || status === "QUALITY_CHECK") return 2;
    if (status === "WEIGHING" || status === "PROCUREMENT_COMPLETED") return 3;
    if (status === "PAYMENT_PROCESSING" || status === "PAYMENT_SETTLED") return 4;
    return 0;
  };

  const currentIndex = booking ? getStageIndex(booking.status) : 0;

  return (
    <div>
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">
            <TrendingUp size={22} color="var(--gov-primary)" />
            <span>{t("queue_tracker_title", "Live Mandi Queue & Turnaround Tracker")}</span>
          </div>
          <button
            id="btn-refresh-queue"
            className="btn btn-secondary btn-sm"
            onClick={loadQueue}
          >
            <RefreshCw size={16} />
            <span>{t("refresh", "Refresh")}</span>
          </button>
        </div>

        {booking ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
              <div>
                <span className="form-help" style={{ fontWeight: 700, textTransform: "uppercase" }}>
                  {t("mandi_centre", "Procurement Centre")}
                </span>
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "var(--gov-navy)" }}>
                  {booking.centre_name}
                </h3>
                <div style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {t("token", "Token")}: <strong>{booking.booking_token}</strong> • #{booking.token_number || 101}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <span className={`status-badge badge-${booking.status.toLowerCase().replace(/_/g, "-")}`}>
                  {booking.status.replace(/_/g, " ")}
                </span>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                  {booking.slot_date} ({booking.slot_time})
                </div>
              </div>
            </div>

            {/* Waiting Time Card */}
            <div style={{ backgroundColor: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: "8px", padding: "16px", display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
              <Clock size={36} color="#2563eb" />
              <div>
                <div style={{ fontSize: "13px", color: "#1e40af", fontWeight: 700 }}>
                  {t("est_turnaround", "Estimated Waiting Time")}
                </div>
                <div style={{ fontSize: "26px", fontWeight: 900, color: "#1e3a8a" }}>
                  ~{queueInfo?.estimated_wait_minutes || 20} mins
                </div>
                <div style={{ fontSize: "13px", color: "#1e40af" }}>
                  {t("vehicles_ahead", "Vehicles ahead of you")}: <strong>{queueInfo?.vehicles_ahead || 0}</strong> • {t("position_in_queue", "Position in queue")}: <strong>#{queueInfo?.position || 1}</strong>
                </div>
              </div>
            </div>

            {/* Stage Progress Stepper */}
            <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px", color: "var(--gov-navy)" }}>
              {t("procurement_stages", "Procurement Processing Stages")}
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {STAGES.map((s, idx) => {
                const Icon = s.icon;
                const isPassed = idx < currentIndex;
                const isCurrent = idx === currentIndex;
                return (
                  <div
                    key={s.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      borderRadius: "6px",
                      backgroundColor: isCurrent ? "#f0fdf4" : isPassed ? "#f8fafc" : "#ffffff",
                      border: isCurrent ? "2px solid #16a34a" : "1px solid var(--border-color)"
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: isCurrent ? "#16a34a" : isPassed ? "#0284c7" : "#e2e8f0",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      {isPassed ? <CheckCircle size={18} /> : <Icon size={18} />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "15px", fontWeight: isCurrent ? 800 : 600, color: isCurrent ? "#15803d" : "var(--text-main)" }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {isCurrent ? `● ${t("in_progress", "In Progress")}` : isPassed ? `✓ ${t("completed", "Completed")}` : t("pending", "Pending")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "30px" }}>
            <p>No active queue entry found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
