import { useEffect, useMemo, useState } from "react";
import { Plus, User, Trash2, Edit } from "lucide-react";
import ErrorBanner from "../components/ErrorBanner";
import StatusPill from "../components/StatusPill";
import { TableSkeleton } from "../components/Skeletons";
import EmptyState from "../components/EmptyState";
import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../components/ToastContext";
import { companyApi } from "../lib/apiClient";
import { formatDateTimeUS, formatDisplayValue } from "../lib/dateFormatter";

const initialForm = {
  cnic: "",
  full_name: "",
  password: "",
  country_code: "+92",
  phone_number: "",
  email: "",
  license_number: "",
  license_expiry: "",
  date_of_birth: "",
  age: "",
  gender: "Male",
  address: "",
  country: "Pakistan",
  city: "Karachi",
  is_active: true
};

const countryCodeOptions = [
  { label: "Pakistan (+92)", value: "+92" },
  { label: "United States (+1)", value: "+1" },
  { label: "United Kingdom (+44)", value: "+44" },
  { label: "Canada (+1)", value: "+1" }
];

const cityMap = {
  Pakistan: ["Karachi", "Lahore", "Islamabad", "Multan", "Peshawar", "Quetta"],
  USA: ["New York", "Los Angeles", "Chicago", "Houston", "Dallas"],
  UK: ["London", "Manchester", "Birmingham", "Leeds", "Glasgow"],
  Canada: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"]
};

const splitPhoneNumber = (combinedPhone) => {
  if (!combinedPhone) return { country_code: "+92", phone_number: "" };
  const digits = String(combinedPhone).replace(/\D/g, "");
  if (digits.length <= 10) return { country_code: "+92", phone_number: digits };
  const local = digits.slice(-10);
  const codeDigits = digits.slice(0, -10);
  return { country_code: `+${codeDigits}`, phone_number: local };
};

function normalizeDriverPayload(source) {
  const payload = {
    ...source,
    age: source.age === "" ? null : Number(source.age),
    is_active: Boolean(source.is_active)
  };
  Object.keys(payload).forEach((key) => {
    if (typeof payload[key] === "string" && payload[key].trim() === "") payload[key] = null;
  });
  delete payload.country;
  return payload;
}

function CompanyDriversPage() {
  const { showToast } = useToast();
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingDriverId, setEditingDriverId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState(null);

  const loadDrivers = async (searchTerm = "") => {
    setLoading(true);
    setPageError("");
    try {
      const data = await companyApi.getDrivers(searchTerm);
      setDrivers(Array.isArray(data) ? data : []);
    } catch (err) {
      if ((err.message || "").toLowerCase().includes("no drivers found")) {
        setDrivers([]);
      } else {
        setPageError(err.message || "Unable to load drivers.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const onSearchSubmit = async (e) => {
    e.preventDefault();
    await loadDrivers(search.trim());
  };

  const onFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (name === "cnic") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 13);
      setForm((p) => ({ ...p, cnic: digitsOnly }));
      return;
    }
    if (name === "phone_number") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setForm((p) => ({ ...p, phone_number: digitsOnly }));
      return;
    }
    if (name === "country") {
      const firstCity = cityMap[value]?.[0] || "";
      setForm((p) => ({ ...p, country: value, city: firstCity }));
      return;
    }
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const editPayload = useMemo(() => normalizeDriverPayload(form), [form]);

  const onCreateDriver = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    if (!form.cnic.trim() || !form.full_name.trim() || !form.password || !form.license_number.trim()) {
      setFormError("CNIC, full name, password, and license number are required.");
      return;
    }
    if (form.cnic.length !== 13) { setFormError("CNIC must be exactly 13 digits."); return; }
    if (form.phone_number.length !== 10) { setFormError("Phone number must be exactly 10 digits."); return; }

    setSaving(true);
    try {
      await companyApi.addDriver({ ...editPayload });
      setFormSuccess("Driver created successfully.");
      setForm(initialForm);
      setShowModal(false);
      showToast("Driver created.", "success");
      await loadDrivers(search.trim());
    } catch (err) {
      setFormError(err.message || "Unable to create driver.");
    } finally {
      setSaving(false);
    }
  };

  const onStartEdit = (driver) => {
    const parsedPhone = splitPhoneNumber(driver.phone_number);
    setEditingDriverId(driver.driver_id);
    setShowModal(true);
    setForm({
      cnic: driver.cnic || "",
      full_name: driver.full_name || "",
      password: "",
      country_code: parsedPhone.country_code,
      phone_number: parsedPhone.phone_number,
      email: driver.email || "",
      license_number: driver.license_number || "",
      license_expiry: (driver.license_expiry || "").slice(0, 10),
      date_of_birth: (driver.date_of_birth || "").slice(0, 10),
      age: driver.age ?? "",
      gender: driver.gender || "Male",
      address: driver.address || "",
      country: "Pakistan",
      city: driver.city || "",
      is_active: driver.is_active ?? true
    });
    setFormError("");
    setFormSuccess("");
  };

  const onUpdateDriver = async (e) => {
    e.preventDefault();
    if (!editingDriverId) return;
    if (form.cnic.length !== 13) { setFormError("CNIC must be exactly 13 digits."); return; }
    if (form.phone_number && form.phone_number.length !== 10) { setFormError("Phone number must be exactly 10 digits."); return; }

    setSaving(true);
    setFormError("");
    setFormSuccess("");
    try {
      const updatePayload = { ...editPayload };
      if (!updatePayload.password) delete updatePayload.password;
      await companyApi.updateDriver(editingDriverId, updatePayload);
      setFormSuccess("Driver updated successfully.");
      setEditingDriverId("");
      setForm(initialForm);
      setShowModal(false);
      showToast("Driver updated.", "success");
      await loadDrivers(search.trim());
    } catch (err) {
      setFormError(err.message || "Unable to update driver.");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteDriver = async (driverId) => {
    setPageError("");
    try {
      await companyApi.deleteDriver(driverId);
      showToast("Driver deleted.", "success");
      await loadDrivers(search.trim());
    } catch (err) {
      setPageError(err.message || "Unable to delete driver.");
    } finally {
      setDriverToDelete(null);
    }
  };

  return (
    <div className="driver-page">
      <div className="page-header driver-header">
        <div>
          <h1 className="ds-heading-1 driver-title">Drivers</h1>
          <p className="ds-body driver-subtitle">Manage company drivers — create, update, search and remove records.</p>
        </div>
        <div className="driver-header-actions">
          <button
            onClick={() => { setEditingDriverId(""); setForm(initialForm); setShowModal(true); setFormError(""); setFormSuccess(""); }}
            className="btn btn-primary driver-add-btn"
          >
            <Plus size={16} /> Add Driver
          </button>
        </div>
      </div>

      <ErrorBanner message={pageError} />

      <div className="card">
        <form onSubmit={onSearchSubmit} className="driver-toolbar">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, CNIC, email, license"
            className="driver-search"
          />
          <button type="submit" className="btn btn-primary">Find</button>
        </form>

        {loading ? <TableSkeleton /> : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>CNIC</th>
                  <th>Email</th>
                  <th>License</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.length ? drivers.map((driver) => (
                  <tr key={driver.driver_id}>
                    <td>
                      <div className="driver-cell">
                        <div className="driver-avatar"><User size={16} /></div>
                        <div>
                          <div className="driver-name">{formatDisplayValue(driver.full_name)}</div>
                          <div className="driver-subtext tabular-nums">{driver.phone_number ? `+${driver.phone_number}` : ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="tabular-nums">{formatDisplayValue(driver.cnic)}</td>
                    <td>{formatDisplayValue(driver.email) || "-"}</td>
                    <td>{formatDisplayValue(driver.license_number) || "-"}</td>
                    <td className="tabular-nums">{formatDateTimeUS(driver.created_at)}</td>
                    <td className="tabular-nums">{formatDateTimeUS(driver.updated_at)}</td>
                    <td>{driver.is_active ? <StatusPill status="Active" /> : <StatusPill status="Inactive" />}</td>
                    <td className="driver-actions">
                      <button onClick={() => onStartEdit(driver)} className="btn-icon btn-icon-primary" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => setDriverToDelete(driver)} className="btn-icon btn-icon-danger" title="Remove">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" style={{ padding: 0 }}>
                      <EmptyState title="No drivers found" description="There are no drivers yet. Click Add Driver to register a new driver." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!driverToDelete}
        onClose={() => setDriverToDelete(null)}
        onConfirm={() => onDeleteDriver(driverToDelete?.driver_id)}
        title="Remove Driver"
        message={`Are you sure you want to remove driver ${driverToDelete?.full_name}?`}
        confirmText="Remove Driver"
        isDestructive={true}
      />

      {showModal && (
        <div className="driver-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="card driver-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="driver-modal-head">
              <h2 className="ds-heading-2">{editingDriverId ? "Update Driver" : "Add Driver"}</h2>
              <button onClick={() => setShowModal(false)} className="driver-modal-close">×</button>
            </div>

            {formError ? <div className="modal-alert error" style={{ marginBottom: '0.75rem' }}>{formError}</div> : null}
            {formSuccess ? <div className="modal-alert success" style={{ marginBottom: '0.75rem' }}>{formSuccess}</div> : null}

            <form onSubmit={editingDriverId ? onUpdateDriver : onCreateDriver} className="driver-form">
              <label className="driver-field">
                Full Name *
                <input name="full_name" value={form.full_name} onChange={onFormChange} required />
              </label>

              <label className="driver-field">
                CNIC *
                <input name="cnic" value={form.cnic} onChange={onFormChange} required />
                <small className="field-hint">13 digits</small>
              </label>

              <label className="driver-field">
                Password {editingDriverId ? "(optional)" : "*"}
                <input type="password" name="password" value={form.password} onChange={onFormChange} required={!editingDriverId} />
              </label>

              <label className="driver-field">
                Country Code
                <select name="country_code" value={form.country_code} onChange={onFormChange}>
                  {countryCodeOptions.map((option) => (
                    <option key={option.label} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="driver-field">
                Phone Number *
                <input name="phone_number" value={form.phone_number} onChange={onFormChange} inputMode="numeric" maxLength={10} required />
                <small className="field-hint">10 digits (excludes country code)</small>
              </label>

              <label className="driver-field">
                Email
                <input type="email" name="email" value={form.email} onChange={onFormChange} />
              </label>

              <label className="driver-field">
                License Number *
                <input name="license_number" value={form.license_number} onChange={onFormChange} required />
              </label>

              <label className="driver-field">
                License Expiry
                <input type="date" name="license_expiry" value={form.license_expiry} onChange={onFormChange} />
              </label>

              <label className="driver-field">
                Date of Birth
                <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={onFormChange} />
              </label>

              <label className="driver-field">
                Age
                <input type="number" name="age" value={form.age} onChange={onFormChange} />
              </label>

              <label className="driver-field">
                Gender
                <select name="gender" value={form.gender} onChange={onFormChange}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="driver-field">
                Country
                <select name="country" value={form.country} onChange={onFormChange}>
                  {Object.keys(cityMap).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <label className="driver-field">
                City
                <select name="city" value={form.city} onChange={onFormChange}>
                  {(cityMap[form.country] || []).map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
              </label>

              <label className="driver-field driver-field-full">
                Address
                <input name="address" value={form.address} onChange={onFormChange} />
              </label>

              <label className="driver-check driver-field-full">
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={onFormChange} />
                Is Active
              </label>

              <div className="driver-form-actions driver-field-full">
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? (editingDriverId ? "Updating..." : "Saving...") : (editingDriverId ? "Update Driver" : "Create Driver")}
                </button>
                <button type="button" onClick={() => { setShowModal(false); setEditingDriverId(""); setForm(initialForm); setFormError(""); setFormSuccess(""); }} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyDriversPage;
