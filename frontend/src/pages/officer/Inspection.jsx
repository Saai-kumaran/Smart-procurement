import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import {
  FileCheck,
  CheckCircle,
  AlertTriangle,
  Scale,
  ShieldCheck,
  Wheat
} from "lucide-react";

export default function Inspection({ bookingId, setActiveOfficerTab }) {
  const { user, t } = useAuth();
  const [activeBookings, setActiveBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState(bookingId || "");
  const [moisture, setMoisture] = useState("11.5");
  const [foreignMatter, setForeignMatter] = useState("0.4");
  const [damagedGrains, setDamagedGrains] = useState("0.5");
  const [grade, setGrade] = useState("GRADE_A");
  const [remarks, setRemarks] = useState("FAQ standard compliant lot.");
  const [submitting, setSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState(null);

  const centreId = user.centreId || "cnt-01";

  useEffect(() => {
    loadCandidates();
  }, [centreId, bookingId]);

  const loadCandidates = async () => {
    try {
      const qRes = await api.getCentreQueue(centreId);
      const candidates = (qRes.queue || []).filter(
        (b) => b.status === "CHECKED_IN" || b.status === "INSPECTION" || b.booking_id === bookingId
      );
      setActiveBookings(candidates);
      if (bookingId) {
        setSelectedBookingId(bookingId);
      } else if (candidates.length > 0) {
        setSelectedBookingId(candidates[0].booking_id);
      }
    } catch (err) {
      console.error("Error loading candidate bookings for inspection:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingId) {
      alert("Please select a farmer lot for quality inspection");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitInspection({
        booking_id: selectedBookingId,
        officer_id: user.id || "usr-off-01",
        moisture_percentage: parseFloat(moisture),
        foreign_matter_percentage: parseFloat(foreignMatter),
        damaged_grains_percentage: parseFloat(damagedGrains),
        quality_grade: grade,
        remarks: remarks
      });
      setResultMsg(res);
      setTimeout(() => {
        if (res.status === "APPROVED") {
          setActiveOfficerTab("weighing");
        }
      }, 1800);
    } catch (err) {
      alert("Error submitting inspection: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCandidate = activeBookings.find((b) => b.booking_id === selectedBookingId);

  return (
    <div>
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">
            <FileCheck size={22} color="var(--gov-primary)" />
            <span>{t("inspection_title", "Quality Assessment & Moisture Grading")}</span>
          </div>
          <span className="status-badge badge-inspection">BIS / AGMARK Standards</span>
        </div>

        {resultMsg && (
          <div className={`gov-alert ${resultMsg.status === "APPROVED" ? "gov-alert-success" : "gov-alert-danger"}`}>
            <CheckCircle size={20} />
            <div>
              <strong>Result: {resultMsg.quality_grade}</strong> — {resultMsg.message}
              {resultMsg.status === "APPROVED" && (
                <div style={{ marginTop: "4px", fontSize: "13px" }}>
                  Proceeding to Weighbridge scale...
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t("select_crop_label", "Select Farmer Lot from Queue")}</label>
            <select
              id="select-inspection-booking"
              className="form-control"
              value={selectedBookingId}
              onChange={(e) => setSelectedBookingId(e.target.value)}
              required
            >
              {activeBookings.length > 0 ? (
                activeBookings.map((b) => (
                  <option key={b.booking_id} value={b.booking_id}>
                    Token #{b.token_number} • {b.booking_token} — {b.farmer_name} ({b.crop_name}, {b.quantity_quintals}q)
                  </option>
                ))
              ) : (
                <option value="">No pending checked-in lots in queue</option>
              )}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">
                {t("moisture_pct", "Moisture Content (%)")}
              </label>
              <input
                id="input-moisture"
                type="number"
                step="0.1"
                min="5"
                max="30"
                className="form-control"
                value={moisture}
                onChange={(e) => {
                  const val = e.target.value;
                  setMoisture(val);
                  if (parseFloat(val) > 14.5) {
                    setGrade("GRADE_C");
                  } else if (parseFloat(val) > 12.5) {
                    setGrade("GRADE_B");
                  } else {
                    setGrade("GRADE_A");
                  }
                }}
                required
              />
              <span className="form-help">
                Standard FAQ Limit: Up to 12.0% (Rejection threshold &gt; 14.0%)
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">{t("foreign_matter_pct", "Foreign Matter (%)")}</label>
              <input
                id="input-foreign-matter"
                type="number"
                step="0.1"
                className="form-control"
                value={foreignMatter}
                onChange={(e) => setForeignMatter(e.target.value)}
                required
              />
              <span className="form-help">Allowable Limit: &lt; 0.75%</span>
            </div>

            <div className="form-group">
              <label className="form-label">{t("damaged_grains_pct", "Damaged Grains (%)")}</label>
              <input
                id="input-damaged-grains"
                type="number"
                step="0.1"
                className="form-control"
                value={damagedGrains}
                onChange={(e) => setDamagedGrains(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t("quality_grade", "Assigned Quality Grade")}</label>
              <select
                id="select-quality-grade"
                className="form-control"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              >
                <option value="GRADE_A">{t("grade_a", "Grade A (FAQ Compliant - 100% MSP)")}</option>
                <option value="GRADE_B">{t("grade_b", "Grade B (FAQ Compliant - 100% MSP)")}</option>
                <option value="GRADE_C">{t("grade_c", "Grade C (Moisture Deductions Apply)")}</option>
                <option value="REJECTED">{t("grade_rejected", "REJECTED (Excess Moisture)")}</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t("inspector_remarks", "Inspector Remarks")}</label>
            <input
              id="input-remarks"
              type="text"
              className="form-control"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <button
            type="submit"
            id="btn-submit-inspection"
            className="btn btn-primary btn-block"
            disabled={submitting || !selectedBookingId}
          >
            {submitting ? "Processing..." : t("btn_issue_cert", "Issue Quality Inspection Certificate")}
          </button>
        </form>
      </div>
    </div>
  );
}
