import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import CompanySubnav from "../components/CompanySubnav";
import { companyApi } from "../lib/apiClient";
import { clearCompanySession } from "../lib/companySession";
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
  if (!combinedPhone) {
    return { country_code: "+92", phone_number: "" };
  }

  const digits = String(combinedPhone).replace(/\D/g, "");
  if (digits.length <= 10) {
    return { country_code: "+92", phone_number: digits };
  }

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
    if (typeof payload[key] === "string" && payload[key].trim() === "") {
      payload[key] = null;
    }
  });

  delete payload.country;

  return payload;
}

function CompanyDriversPage() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listError, setListError] = useState("");
  const [listSuccess, setListSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingDriverId, setEditingDriverId] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadDrivers = async (searchTerm = "") => {
    setLoading(true);
    setListError("");
    try {
      const data = await companyApi.getDrivers(searchTerm);
      setDrivers(Array.isArray(data) ? data : []);
    } catch (err) {
      if ((err.message || "").toLowerCase().includes("no drivers found")) {
        setDrivers([]);
      } else {
        setListError(err.message || "Unable to load drivers.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const onSearchSubmit = async (event) => {
    event.preventDefault();
    await loadDrivers(search.trim());
  };

  const onFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (name === "cnic") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 13);
      setForm((prev) => ({ ...prev, cnic: digitsOnly }));
      return;
    }

    if (name === "phone_number") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setForm((prev) => ({ ...prev, phone_number: digitsOnly }));
      return;
    }

    if (name === "country") {
      const firstCity = cityMap[value]?.[0] || "";
      setForm((prev) => ({ ...prev, country: value, city: firstCity }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const editPayload = useMemo(() => normalizeDriverPayload(form), [form]);

  const onCreateDriver = async (event) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!form.cnic.trim() || !form.full_name.trim() || !form.password || !form.license_number.trim()) {
      setFormError("CNIC, full name, password, and license number are required.");
      return;
    }

    if (form.cnic.length !== 13) {
      setFormError("CNIC must be exactly 13 digits.");
      return;
    }

    if (form.phone_number.length !== 10) {
      setFormError("Phone number must be exactly 10 digits.");
      return;
    }

    setSaving(true);
    try {
      const createPayload = { ...editPayload };
      await companyApi.addDriver(createPayload);
      setFormSuccess("Driver created successfully.");
      setForm(initialForm);
      setShowForm(false);
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
    setShowForm(true);
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

  const onUpdateDriver = async (event) => {
    event.preventDefault();
    if (!editingDriverId) {
      return;
    }

    if (form.cnic.length !== 13) {
      setFormError("CNIC must be exactly 13 digits.");
      return;
    }

    if (form.phone_number && form.phone_number.length !== 10) {
      setFormError("Phone number must be exactly 10 digits.");
      return;
    }

    setSaving(true);
    setFormError("");
    setFormSuccess("");
    try {
      const updatePayload = { ...editPayload };
      if (!updatePayload.password) {
        delete updatePayload.password;
      }
      await companyApi.updateDriver(editingDriverId, updatePayload);
      setFormSuccess("Driver updated successfully.");
      setEditingDriverId("");
      setForm(initialForm);
      setShowForm(false);
      await loadDrivers(search.trim());
    } catch (err) {
      setFormError(err.message || "Unable to update driver.");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteDriver = async (driverId) => {
    setListError("");
    setListSuccess("");
    try {
      await companyApi.deleteDriver(driverId);
      setListSuccess("Driver deleted successfully.");
      await loadDrivers(search.trim());
    } catch (err) {
      setListError(err.message || "Unable to delete driver.");
    }
  };

  const onCancelEdit = () => {
    setEditingDriverId("");
    setForm(initialForm);
    setShowForm(false);
    setFormError("");
    setFormSuccess("");
  };

  const openAddForm = () => {
    setEditingDriverId("");
    setForm(initialForm);
    setShowForm(true);
    setFormError("");
    setFormSuccess("");
  };

  const handleCloseForm = () => {
    if (editingDriverId) {
      onCancelEdit();
      return;
    }
    setForm(initialForm);
    setShowForm(false);
    setFormError("");
    setFormSuccess("");
  };

  const handleLogout = () => {
    clearCompanySession();
    navigate("/login", { replace: true });
  };

  return (
    <section className="section">
      <div className="container container-wide company-page-wrap">
        <div className={`page-content ${showForm ? "is-blurred" : ""}`}>
          <div className="company-head">
            <SectionHeader eyebrow="Company Drivers" title="Driver Management" text="Search, create, update, and remove drivers linked to your company account." />
            <button type="button" className="btn btn-ghost" onClick={handleLogout}>Logout</button>
          </div>

          <CompanySubnav />

          <article className="card">
            <div className="card-header">
              <h3>Driver List</h3>
              <button type="button" className="btn btn-primary" onClick={openAddForm}>Add Driver</button>
            </div>
            <form className="admin-inline-form" onSubmit={onSearchSubmit}>
              <label>
                Search
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name, CNIC, email, license"
                />
              </label>
              <button type="submit" className="btn btn-primary">Find</button>
            </form>

            {loading ? <p className="state loading">Loading drivers...</p> : null}
            {listError ? <p className="state error">{listError}</p> : null}
            {listSuccess ? <p className="state success">{listSuccess}</p> : null}

            {!loading && !listError ? (
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>CNIC</th>
                      <th>Email</th>
                      <th>License</th>
                      <th>Created</th>
                      <th>Updated</th>
                      <th>Risk Score</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.length ? drivers.map((driver) => (
                      <tr key={driver.driver_id}>
                        <td>{formatDisplayValue(driver.full_name)}</td>
                        <td>{formatDisplayValue(driver.cnic)}</td>
                        <td>{formatDisplayValue(driver.email)}</td>
                        <td>{formatDisplayValue(driver.license_number)}</td>
                        <td>{formatDateTimeUS(driver.created_at)}</td>
                        <td>{formatDateTimeUS(driver.updated_at)}</td>
                        <td>{formatDisplayValue(driver.risk_score)}</td>
                        <td className="action-row">
                          <button type="button" className="btn btn-ghost" onClick={() => onStartEdit(driver)}>Edit</button>
                          <button type="button" className="btn btn-danger" onClick={() => onDeleteDriver(driver.driver_id)}>Delete</button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="8">No data available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}
          </article>
        </div>

        {showForm ? (
          <div className="modal-backdrop" onClick={handleCloseForm}>
            <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>{editingDriverId ? "Update Driver" : "Add Driver"}</h3>
                <button type="button" className="modal-close" onClick={handleCloseForm}>✕</button>
              </div>
              {formError ? <div className="modal-alert error">{formError}</div> : null}
              {formSuccess ? <div className="modal-alert success">{formSuccess}</div> : null}
              <form className="admin-form" onSubmit={editingDriverId ? onUpdateDriver : onCreateDriver}>
                <label>
                  CNIC *
                  <input name="cnic" value={form.cnic} onChange={onFormChange} placeholder="1234567890123" required />
                  <small className="field-hint">CNIC must be exactly 13 digits.</small>
                </label>
                <label>Full Name *<input name="full_name" value={form.full_name} onChange={onFormChange} placeholder="e.g., Ahmed Khan" required /></label>
                <label>Password {editingDriverId ? "(optional)" : "*"}<input type="password" name="password" value={form.password} onChange={onFormChange} placeholder="Minimum 8 characters" required={!editingDriverId} /></label>
                <label>
                  Country Code
                  <select name="country_code" value={form.country_code} onChange={onFormChange}>
                    {countryCodeOptions.map((option) => (
                      <option key={option.label} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Phone Number *
                  <input name="phone_number" value={form.phone_number} onChange={onFormChange} placeholder="3361234567" inputMode="numeric" maxLength={10} required />
                  <small className="field-hint">Must be exactly 10 digits (excluding country code).</small>
                </label>
                <label>Email<input type="email" name="email" value={form.email} onChange={onFormChange} placeholder="driver@example.com" /></label>
                <label>License Number *<input name="license_number" value={form.license_number} onChange={onFormChange} placeholder="e.g., KHI-12345-ABC" required /></label>
                <label>License Expiry<input type="date" name="license_expiry" value={form.license_expiry} onChange={onFormChange} /></label>
                <label>Date of Birth<input type="date" name="date_of_birth" value={form.date_of_birth} onChange={onFormChange} /></label>
                <label>Age<input type="number" name="age" value={form.age} onChange={onFormChange} /></label>
                <label>
                  Gender
                  <select name="gender" value={form.gender} onChange={onFormChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <small className="field-hint">Select driver's gender.</small>
                </label>
                <label>Address<input name="address" value={form.address} onChange={onFormChange} placeholder="Street address" /></label>
                <label>
                  Country
                  <select name="country" value={form.country} onChange={onFormChange}>
                    {Object.keys(cityMap).map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </label>
                <label>
                  City
                  <select name="city" value={form.city} onChange={onFormChange}>
                    {(cityMap[form.country] || []).map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <small className="field-hint">Select operating city.</small>
                </label>
                <label className="inline-check">
                  <input type="checkbox" name="is_active" checked={form.is_active} onChange={onFormChange} />
                  Is Active <span className="hint">(Check if driver is currently employed)</span>
                </label>

                <button type="submit" className="btn btn-primary full" disabled={saving}>
                  {saving ? "Saving..." : editingDriverId ? "Update Driver" : "Create Driver"}
                </button>
                {editingDriverId ? (
                  <button type="button" className="btn btn-ghost full" onClick={onCancelEdit}>Cancel Update</button>
                ) : (
                  <button type="button" className="btn btn-ghost full" onClick={handleCloseForm}>Cancel</button>
                )}
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default CompanyDriversPage;
