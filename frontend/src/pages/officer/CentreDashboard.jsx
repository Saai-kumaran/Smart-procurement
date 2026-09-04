import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import {
  Building2,
  Users,
  Scale,
  FileCheck,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowRight
} from "lucide-react";

export default function CentreDashboard({ setActiveOfficerTab, setSelectedBookingId }) {
  const { user, t } = useAuth();
  const [centreData, setCentreData] = useState(null);
  const [queueData, setQueueData] = useState([]);
  const [loading, setLoading] = useState(true);

  const centreId = user.centreId || "cnt-01";

  useEffect(() => {
    loadDashboardData();
  }, [centreId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [cRes, qRes] = await Promise.all([
        api.getCentreDetails(centreId),
        api.getCentreQueue(centreId)
      ]);
      setCentreData(cRes);
      setQueueData(qRes.queue || []);
    } catch (err) {
      console.error("Error loading centre dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Officer Centre Header */}
      <div className="gov-card" style={{ borderLeft: "5px solid var(--gov-navy)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
              {t("centre_mgmt", "Procurement Centre Management")} • {t("centre_code_lbl", "Centre Code")}: {centreData?.centre_code || "PC-HR-KARNAL-01"}
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--gov-navy)", marginTop: "2px" }}>
              {centreData?.centre_name || "Karnal Main Anaj Mandi"}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              {t("nodal_officer", "Nodal Officer")}: <strong>{user.name}</strong> • {t("operating_hours_lbl", "Operating Hours")}: {centreData?.operating_hours || "08:00 - 18:00"}
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              id="btn-officer-queue"
              className="btn btn-primary"
              onClick={() => setActiveOfficerTab("queue")}
            >
              <Users size={18} />
              <span>{t("btn_active_queue_mgmt", "Active Queue Management")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Operational Metrics Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}>
            <Building2 size={24} />
          </div>
          <div>
            <div className="stat-value">{centreData?.daily_capacity_quintals || 2000}q</div>
            <div className="stat-label">{t("daily_proc_limit", "Daily Processing Limit")}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: "#ecfdf5", color: "#16a34a" }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-value">{centreData?.utilization_pct || 0}%</div>
            <div className="stat-label">{t("today_utilization", "Today's Capacity Utilization")}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: "#fef3c7", color: "#d97706" }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-value">{queueData.length}</div>
            <div className="stat-label">{t("farmers_in_yard", "Farmers Currently in Yard")}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-value">~35 mins</div>
            <div className="stat-label">{t("avg_clearance_time", "Average Turnaround Time")}</div>
          </div>
        </div>
      </div>

      {/* Immediate Action Queue Table */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">
            <Users size={20} color="var(--gov-primary)" />
            <span>{t("mandi_queue_ops", "Mandi Gate & Token Queue Management")}</span>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveOfficerTab("queue")}
          >
            View All
          </button>
        </div>

        {queueData.length > 0 ? (
          <div className="table-responsive">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>{t("col_token", "Token #")}</th>
                  <th>{t("col_farmer", "Farmer Name")}</th>
                  <th>{t("crop_name", "Crop")}</th>
                  <th>{t("crop_and_qty", "Quantity")}</th>
                  <th>{t("col_status", "Status")}</th>
                  <th>{t("col_wait", "Wait Time")}</th>
                  <th>{t("col_actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {queueData.map((item) => (
                  <tr key={item.queue_entry_id}>
                    <td>
                      <strong style={{ fontSize: "16px", color: "var(--gov-primary)" }}>
                        #{item.token_number}
                      </strong>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{item.booking_token}</div>
                    </td>
                    <td><strong>{item.farmer_name}</strong></td>
                    <td>{item.crop_name}</td>
                    <td>{item.quantity_quintals}q</td>
                    <td>
                      <span className={`status-badge badge-${item.status.toLowerCase().replace(/_/g, "-")}`}>
                        {item.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>~{item.estimated_wait_minutes} min</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          id={`btn-action-insp-${item.token_number}`}
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            if (setSelectedBookingId) setSelectedBookingId(item.booking_id);
                            setActiveOfficerTab("inspection");
                          }}
                        >
                          <FileCheck size={15} />
                          <span>{t("nav_officer_inspection", "Inspect")}</span>
                        </button>

                        <button
                          id={`btn-action-weigh-${item.token_number}`}
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            if (setSelectedBookingId) setSelectedBookingId(item.booking_id);
                            setActiveOfficerTab("weighing");
                          }}
                        >
                          <Scale size={15} />
                          <span>{t("nav_officer_weighbridge", "Weigh")}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
            No pending vehicles currently in yard.
          </div>
        )}
      </div>
    </div>
  );
}
