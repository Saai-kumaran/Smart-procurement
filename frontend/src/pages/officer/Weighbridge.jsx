import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import {
  Scale,
  CheckCircle,
  AlertTriangle,
  Printer,
  FileText,
  Truck,
  RotateCcw,
  CreditCard,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

export default function Weighbridge({ bookingId, setActiveOfficerTab, setSelectedBookingId }) {
  const { user, t } = useAuth();
  const centreId = user.centreId || "cnt-01";

  const [activeQueue, setActiveQueue] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(bookingId || "");
  const [bookingDetail, setBookingDetail] = useState(null);
  const [grossWeight, setGrossWeight] = useState("145.5"); // Tractor + Crop
  const [tareWeight, setTareWeight] = useState("25.5");   // Empty Tractor
  const [bagCount, setBagCount] = useState("240");
  const [submitting, setSubmitting] = useState(false);
  const [weighmentResult, setWeighmentResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const netWeight = Math.max(0, (parseFloat(grossWeight) || 0) - (parseFloat(tareWeight) || 0)).toFixed(2);
  const estimatedPayout = (parseFloat(netWeight) * 2275.0).toFixed(2); // Wheat MSP ₹2,275 / quintal

  useEffect(() => {
    loadEligibleBookings();
  }, [centreId, bookingId]);

  useEffect(() => {
    if (selectedBooking) {
      loadBookingDetail(selectedBooking);
    }
  }, [selectedBooking]);

  const loadEligibleBookings = async () => {
    try {
      const qRes = await api.getCentreQueue(centreId);
      const queue = qRes.queue || [];
      const eligible = queue.filter(
        (b) =>
          b.status === "INSPECTION_COMPLETED" ||
          b.status === "INSPECTION" ||
          b.status === "CHECKED_IN" ||
          b.booking_id === bookingId
      );
      setActiveQueue(eligible);

      if (bookingId) {
        setSelectedBooking(bookingId);
      } else if (eligible.length > 0 && !selectedBooking) {
        setSelectedBooking(eligible[0].booking_id);
      }
    } catch (err) {
      console.error("Error loading eligible weighbridge bookings:", err);
    }
  };

  const loadBookingDetail = async (bId) => {
    try {
      const detail = await api.getBookingDetails(bId);
      setBookingDetail(detail);
      if (detail?.allocated_quantity_quintals) {
        const estQ = parseFloat(detail.allocated_quantity_quintals);
        setTareWeight("25.0");
        setGrossWeight((estQ + 25.0).toFixed(1));
        setBagCount(Math.round(estQ * 2).toString());
      }
    } catch (err) {
      console.error("Error loading booking detail for weighment:", err);
    }
  };

  const handleSubmitWeighment = async (e) => {
    e.preventDefault();
    if (!selectedBooking) {
      setErrorMsg("Please select a farmer booking token.");
      return;
    }
    if (parseFloat(netWeight) <= 0) {
      setErrorMsg("Gross weight must exceed empty vehicle tare weight.");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);
    try {
      const payload = {
        booking_id: selectedBooking,
        operator_id: user.id || "usr-off-01",
        gross_weight_quintals: parseFloat(grossWeight),
        tare_weight_quintals: parseFloat(tareWeight),
        bag_count: parseInt(bagCount, 10) || 1
      };

      const res = await api.recordWeighment(payload);
      setWeighmentResult({
        ...res,
        netWeight,
        estimatedPayout,
        farmerName: bookingDetail?.farmer?.name || "Farmer",
        cropName: bookingDetail?.crop?.crop_name || "Wheat",
        variety: bookingDetail?.crop?.variety || "PBW-550",
        token: bookingDetail?.booking_token || selectedBooking
      });
      loadEligibleBookings();
    } catch (err) {
      setErrorMsg(err.message || "Failed to record weighment");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div>
      {/* Header Banner */}
      <div className="gov-card" style={{ borderLeft: "5px solid var(--gov-primary)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
              {t("nav_officer_weighbridge", "Electronic Weighbridge Station")}
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--gov-navy)", marginTop: "2px" }}>
              {t("weighbridge_title", "Electronic Weighbridge Terminal")} • {user.centreName || "Karnal Main Anaj Mandi"}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              {t("weighbridge_subtitle", "Record vehicle gross and tare weights, calculate net grain weight, and trigger automated DBT settlement.")}
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              id="btn-nav-queue"
              className="btn btn-secondary"
              onClick={() => setActiveOfficerTab && setActiveOfficerTab("queue")}
            >
              <Truck size={16} />
              <span>{t("nav_officer_queue", "Queue Gate")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Receipt Modal / Card */}
      {weighmentResult && (
        <div className="gov-card" style={{ border: "2px solid #16a34a", backgroundColor: "#f0fdf4" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <CheckCircle size={32} color="#16a34a" />
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#166534" }}>
                Weighment Recorded Successfully • Procurement Completed
              </h3>
              <p style={{ fontSize: "13px", color: "#15803d" }}>
                Weighment Slip No: <strong>{weighmentResult.slip_no}</strong> • DBT Escrow payment clearance initialized.
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
            <div style={{ backgroundColor: "#ffffff", padding: "12px", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
              <div style={{ fontSize: "12px", color: "#4b5563" }}>{t("farmer_name_label", "Farmer Name")}</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>{weighmentResult.farmerName}</div>
            </div>
            <div style={{ backgroundColor: "#ffffff", padding: "12px", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
              <div style={{ fontSize: "12px", color: "#4b5563" }}>{t("net_weight", "Net Weight")}</div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#166534" }}>{weighmentResult.net_weight_quintals || weighmentResult.netWeight} Quintals</div>
            </div>
            <div style={{ backgroundColor: "#ffffff", padding: "12px", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
              <div style={{ fontSize: "12px", color: "#4b5563" }}>{t("calculated_payout", "Total Amount (MSP ₹2,275/q)")}</div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#0d5231" }}>₹{weighmentResult.total_amount_inr?.toLocaleString("en-IN") || weighmentResult.estimatedPayout}</div>
            </div>
            <div style={{ backgroundColor: "#ffffff", padding: "12px", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
              <div style={{ fontSize: "12px", color: "#4b5563" }}>{t("payment_status", "DBT Status")}</div>
              <span className="badge badge-success">INITIALIZED (PFMS / NPCI)</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button id="btn-print-slip" className="btn btn-primary" onClick={handlePrintSlip}>
              <Printer size={16} />
              <span>{t("print_weigh_slip", "Print Weighbridge Slip")}</span>
            </button>
            <button
              id="btn-next-weighment"
              className="btn btn-secondary"
              onClick={() => {
                setWeighmentResult(null);
                setGrossWeight("140.0");
                setTareWeight("25.0");
              }}
            >
              <RotateCcw size={16} />
              <span>Weigh Next Vehicle</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Weighment Form */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <Scale size={20} color="var(--gov-primary)" />
              <span>{t("weighbridge_title", "Electronic Weighbridge Terminal")}</span>
            </div>
          </div>

          {errorMsg && (
            <div className="alert alert-warning" style={{ marginBottom: "16px" }}>
              <AlertTriangle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmitWeighment}>
            {/* Step 1: Select Token */}
            <div className="form-group">
              <label className="form-label" htmlFor="weigh-token-select">
                {t("select_crop_label", "Select Farmer Token from Queue")}:
              </label>
              <select
                id="weigh-token-select"
                className="form-control"
                value={selectedBooking}
                onChange={(e) => {
                  setSelectedBooking(e.target.value);
                  if (setSelectedBookingId) setSelectedBookingId(e.target.value);
                }}
                required
              >
                <option value="">-- Select from Active Queue --</option>
                {activeQueue.map((b) => (
                  <option key={b.booking_id} value={b.booking_id}>
                    #{b.token} — {b.farmer_name} ({b.crop_name}, {b.quantity_quintals}q) [{b.status}]
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Weight Readings */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="input-gross-weight">
                  {t("gross_weight", "Gross Weight (Vehicle + Produce) [Quintals]")}:
                </label>
                <input
                  type="number"
                  step="0.05"
                  id="input-gross-weight"
                  className="form-control"
                  value={grossWeight}
                  onChange={(e) => setGrossWeight(e.target.value)}
                  placeholder="e.g. 145.50"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-tare-weight">
                  {t("tare_weight", "Tare Weight (Empty Vehicle) [Quintals]")}:
                </label>
                <input
                  type="number"
                  step="0.05"
                  id="input-tare-weight"
                  className="form-control"
                  value={tareWeight}
                  onChange={(e) => setTareWeight(e.target.value)}
                  placeholder="e.g. 25.50"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-bag-count">
                {t("bag_count", "Total Gunny Bags Count")}:
              </label>
              <input
                type="number"
                id="input-bag-count"
                className="form-control"
                value={bagCount}
                onChange={(e) => setBagCount(e.target.value)}
                placeholder="e.g. 240"
                required
              />
            </div>

            {/* Calculated Preview Pill */}
            <div
              style={{
                backgroundColor: "var(--bg-subtle)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "16px",
                marginBottom: "20px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>{t("net_weight", "Net Produce Weight")}:</span>
                <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--gov-primary)" }}>
                  {netWeight} Quintals
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>{t("calculated_payout", "Total Payable MSP Amount (₹2,275/q)")}:</span>
                <span style={{ fontSize: "18px", fontWeight: 800, color: "var(--gov-navy)" }}>
                  ₹{Number(estimatedPayout).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <button
              id="btn-submit-weighment"
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={submitting || !selectedBooking}
            >
              <FileText size={18} />
              <span>{submitting ? "Processing..." : t("btn_issue_slip", "Issue Weighbridge Slip & Complete Procurement")}</span>
            </button>
          </form>
        </div>

        {/* Selected Booking Summary & Guidelines */}
        <div>
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">
                <ShieldCheck size={20} color="var(--gov-primary)" />
                <span>Verification Details</span>
              </div>
            </div>

            {bookingDetail ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-muted)" }}>{t("token", "Token Code")}:</span>
                  <strong>#{bookingDetail.booking_token}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-muted)" }}>{t("farmer_name_label", "Farmer Name")}:</span>
                  <strong>{bookingDetail.farmer?.name}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-muted)" }}>{t("crop_and_qty", "Crop & Variety")}:</span>
                  <strong>{bookingDetail.crop?.crop_name} ({bookingDetail.crop?.variety})</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-muted)" }}>{t("allocated_quantity", "Expected Quantity")}:</span>
                  <strong>{bookingDetail.allocated_quantity_quintals} Quintals</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-muted)" }}>{t("status_label", "Current Status")}:</span>
                  <span className="badge badge-warning">{bookingDetail.status}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>{t("bank_account", "Aadhaar NPCI Status")}:</span>
                  <span className="badge badge-success">Active & Linked</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text-muted)" }}>
                Select a token from the dropdown above to load verification details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
