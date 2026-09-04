import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import {
  Users,
  Search,
  Filter,
  CheckCircle,
  FileCheck,
  Scale,
  RefreshCw,
  QrCode
} from "lucide-react";

export default function QueueManagement({ setActiveOfficerTab, setSelectedBookingId }) {
  const { user, t } = useAuth();
  const [queue, setQueue] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const centreId = user.centreId || "cnt-01";

  useEffect(() => {
    loadQueue();
  }, [centreId]);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await api.getCentreQueue(centreId);
      setQueue(res.queue || []);
    } catch (err) {
      console.error("Error loading queue:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceStatus = async (bookingId, newStatus) => {
    try {
      await api.updateBookingStatus(bookingId, newStatus);
      await loadQueue();
    } catch (err) {
      alert("Error updating status: " + err.message);
    }
  };

  const filteredQueue = queue.filter((item) => {
    const matchesSearch =
      item.booking_token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.farmer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.token_number).includes(searchQuery);

    const matchesStatus =
      statusFilter === "ALL" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">
            <Users size={22} color="var(--gov-primary)" />
            <span>{t("mandi_queue_ops", "Mandi Gate & Token Queue Management")}</span>
          </div>
          <button
            id="btn-refresh-queue-officer"
            className="btn btn-secondary btn-sm"
            onClick={loadQueue}
          >
            <RefreshCw size={16} />
            <span>{t("refresh", "Refresh")}</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
          <div style={{ flex: "1 1 280px", position: "relative" }}>
            <input
              id="input-queue-search"
              type="text"
              className="form-control"
              placeholder={t("search_token_ph", "Search token number or farmer name...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ flex: "0 1 200px" }}>
            <select
              id="select-status-filter"
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">{t("all_statuses", "All Statuses")}</option>
              <option value="CHECKED_IN">{t("checked_in_status", "Gate Entry (Checked In)")}</option>
              <option value="INSPECTION">{t("inspection_status", "Quality Inspection")}</option>
              <option value="WEIGHING">{t("weighing_status", "Weighbridge Scale")}</option>
            </select>
          </div>
        </div>

        {/* Queue Table */}
        <div className="table-responsive">
          <table className="gov-table">
            <thead>
              <tr>
                <th>{t("col_token", "Token #")}</th>
                <th>{t("col_booking_code", "Booking Code")}</th>
                <th>{t("col_farmer", "Farmer Name")}</th>
                <th>{t("col_crop_qty", "Crop & Quantity")}</th>
                <th>{t("col_status", "Status")}</th>
                <th>{t("col_wait", "Wait Time")}</th>
                <th>{t("col_actions", "Workflow Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.map((item) => (
                <tr key={item.queue_entry_id}>
                  <td>
                    <strong style={{ fontSize: "17px", color: "var(--gov-primary)" }}>
                      #{item.token_number}
                    </strong>
                  </td>
                  <td>
                    <code>{item.booking_token}</code>
                  </td>
                  <td>
                    <strong>{item.farmer_name}</strong>
                  </td>
                  <td>
                    {item.crop_name} • <strong>{item.quantity_quintals}q</strong>
                  </td>
                  <td>
                    <span className={`status-badge badge-${item.status.toLowerCase().replace(/_/g, "-")}`}>
                      {item.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td>~{item.estimated_wait_minutes} mins</td>
                  <td>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {item.status === "CHECKED_IN" && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            if (setSelectedBookingId) setSelectedBookingId(item.booking_id);
                            setActiveOfficerTab("inspection");
                          }}
                        >
                          <FileCheck size={14} />
                          <span>{t("nav_officer_inspection", "Inspect")}</span>
                        </button>
                      )}

                      {item.status === "INSPECTION" && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            if (setSelectedBookingId) setSelectedBookingId(item.booking_id);
                            setActiveOfficerTab("weighing");
                          }}
                        >
                          <Scale size={14} />
                          <span>{t("nav_officer_weighbridge", "Weigh")}</span>
                        </button>
                      )}

                      {item.status === "WEIGHING" && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            if (setSelectedBookingId) setSelectedBookingId(item.booking_id);
                            setActiveOfficerTab("weighing");
                          }}
                        >
                          <CheckCircle size={14} />
                          <span>{t("nav_officer_weighbridge", "Record Weight")}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
