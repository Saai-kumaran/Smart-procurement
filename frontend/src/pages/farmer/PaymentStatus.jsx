import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import {
  CreditCard,
  CheckCircle,
  Clock,
  Building,
  FileText,
  TrendingUp,
  ShieldCheck
} from "lucide-react";

export default function PaymentStatus({ bookingId }) {
  const { user, t } = useAuth();
  const [payment, setPayment] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentData();
  }, [bookingId]);

  const loadPaymentData = async () => {
    setLoading(true);
    try {
      let bId = bookingId;
      if (!bId) {
        const list = await api.getFarmerBookings(user.farmerId || "frm-01");
        if (list && list.length > 0) {
          bId = list[0].id;
        }
      }

      if (bId) {
        const [bData, pData] = await Promise.all([
          api.getBookingDetails(bId),
          api.getPaymentDetails(bId)
        ]);
        setBooking(bData);
        setPayment(pData);
      }
    } catch (err) {
      console.error("Error loading payment data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">
            <CreditCard size={22} color="var(--gov-primary)" />
            <span>{t("dbt_status_title", "Direct Benefit Transfer (DBT) Status")}</span>
          </div>
          <span className="status-badge badge-procurement-completed">PFMS / APBS Verified</span>
        </div>

        {payment ? (
          <div>
            {/* Status Banner */}
            <div
              className={`gov-alert ${payment.status === "PAYMENT_SETTLED" ? "gov-alert-success" : "gov-alert-info"}`}
              style={{ marginBottom: "20px" }}
            >
              {payment.status === "PAYMENT_SETTLED" ? (
                <CheckCircle size={22} color="#16a34a" />
              ) : (
                <Clock size={22} color="#0284c7" />
              )}
              <div>
                <strong>
                  {payment.status === "PAYMENT_SETTLED"
                    ? t("payment_settled_msg", "Payment directly credited to bank account via DBT!")
                    : t("payment_processing_msg", "Payment processing post-inspection and weighbridge verification.")}
                </strong>
                <div style={{ fontSize: "13px", marginTop: "2px" }}>
                  {t("utr_ref", "UTR / Transaction Reference")}: <strong>{payment.dbt_transaction_ref || "Pending Settlement"}</strong>
                </div>
              </div>
            </div>

            {/* Payout Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "20px" }}>
              <div className="stat-card" style={{ borderLeft: "4px solid var(--gov-primary)" }}>
                <div>
                  <div className="stat-label">{t("net_payable_amount", "Net Settled Amount")}</div>
                  <div className="stat-value" style={{ color: "var(--gov-primary)", marginTop: "4px" }}>
                    ₹{payment.net_payable_amount ? payment.net_payable_amount.toLocaleString("en-IN") : "0"}
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div>
                  <div className="stat-label">{t("net_procured_qty", "Net Procured Quantity")}</div>
                  <div className="stat-value" style={{ marginTop: "4px" }}>
                    {payment.net_quantity_quintals} <span style={{ fontSize: "16px" }}>Quintals</span>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div>
                  <div className="stat-label">{t("msp_rate_label", "Minimum Support Price (MSP Rate)")}</div>
                  <div className="stat-value" style={{ marginTop: "4px" }}>
                    ₹{payment.msp_rate} <span style={{ fontSize: "16px" }}>/q</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed DBT Breakdown */}
            <div className="gov-card" style={{ backgroundColor: "#f8fafc", padding: "16px" }}>
              <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px", color: "var(--gov-navy)" }}>
                {t("payment_beneficiary_details", "Payment & Beneficiary Details")}
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                  <span style={{ color: "var(--text-muted)" }}>{t("gross_msp_value", "Gross MSP Value")}:</span>
                  <strong>₹{payment.gross_amount ? payment.gross_amount.toLocaleString("en-IN") : "0"}</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                  <span style={{ color: "var(--text-muted)" }}>{t("deductions_mandi_fee", "Deductions / Mandi Cess")}:</span>
                  <strong style={{ color: "#16a34a" }}>₹0.00 (Zero Deductions)</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                  <span style={{ color: "var(--text-muted)" }}>{t("beneficiary_bank_account", "Beneficiary Bank Account")}:</span>
                  <strong>{t("state_bank_india_linked", "State Bank of India (Aadhaar Bridge Linked)")}</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                  <span style={{ color: "var(--text-muted)" }}>{t("payment_mode_label", "Payment Mode")}:</span>
                  <strong>{payment.payment_mode || "DBT_AADHAAR_BRIDGE"}</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "4px" }}>
                  <span style={{ color: "var(--text-muted)" }}>{t("settlement_time", "Settled At")}:</span>
                  <strong>{payment.settled_at || "In Progress (Within 48-72h)"}</strong>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "30px" }}>
            <p>No active payment record found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
