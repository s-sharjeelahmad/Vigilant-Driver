import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import CompanySubnav from "../components/CompanySubnav";
import { companyApi } from "../lib/apiClient";
import { clearCompanySession } from "../lib/companySession";
import { formatDateTimeUS, formatDisplayValue } from "../lib/dateFormatter";

const countryCityMap = {
  Pakistan: ["Karachi", "Lahore", "Islamabad", "Multan", "Peshawar", "Quetta"],
  USA: ["New York", "Los Angeles", "Chicago", "Houston", "Dallas"],
  UK: ["London", "Manchester", "Birmingham", "Leeds", "Glasgow"],
  Canada: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"]
};

const countryOptions = Object.keys(countryCityMap);

function CompanyProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  const companyName = profile?.company_name || "Company";
  const companyInitials = companyName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await companyApi.getProfile();
        setProfile(data || {});
      } catch (err) {
        setError(err.message || "Unable to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = () => {
    clearCompanySession();
    navigate("/login", { replace: true });
  };

  const handleEditStart = () => {
    setEditForm({
      company_name: profile?.company_name || "",
      email: profile?.email || "",
      company_type: profile?.company_type || "",
      contact_number: profile?.contact_number || "",
      company_address: profile?.company_address || "",
      city: profile?.city || "",
      country: profile?.country || "",
      password: "",
      confirm_password: ""
    });
    setIsEditing(true);
    setEditError("");
    setEditSuccess("");
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditForm({});
    setEditError("");
    setEditSuccess("");
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateEditForm = () => {
    if (editForm.company_name && (editForm.company_name.length < 2 || editForm.company_name.length > 200)) {
      setEditError("Company name must be between 2 and 200 characters");
      return false;
    }
    if (editForm.email && !editForm.email.includes("@")) {
      setEditError("Please enter a valid email address");
      return false;
    }
    if (editForm.contact_number && editForm.contact_number.length < 10) {
      setEditError("Contact number must be at least 10 digits");
      return false;
    }
    if (editForm.password) {
      if (editForm.password.length < 8) {
        setEditError("Password must be at least 8 characters");
        return false;
      }
      if (editForm.password !== editForm.confirm_password) {
        setEditError("Passwords do not match");
        return false;
      }
    }
    return true;
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!validateEditForm()) return;

    setSavingEdit(true);
    setEditError("");
    setEditSuccess("");

    try {
      const updatePayload = {
        ...(editForm.company_name && editForm.company_name !== profile.company_name ? { company_name: editForm.company_name } : {}),
        ...(editForm.email && editForm.email !== profile.email ? { email: editForm.email } : {}),
        ...(editForm.company_type && editForm.company_type !== profile.company_type ? { company_type: editForm.company_type } : {}),
        ...(editForm.contact_number && editForm.contact_number !== profile.contact_number ? { contact_number: editForm.contact_number } : {}),
        ...(editForm.company_address && editForm.company_address !== profile.company_address ? { company_address: editForm.company_address } : {}),
        ...(editForm.city && editForm.city !== profile.city ? { city: editForm.city } : {}),
        ...(editForm.country && editForm.country !== profile.country ? { country: editForm.country } : {}),
        ...(editForm.password ? { password: editForm.password } : {})
      };

      if (Object.keys(updatePayload).length === 0) {
        setEditError("No changes to save");
        setSavingEdit(false);
        return;
      }

      const updatedProfile = await companyApi.updateProfile(updatePayload);
      setProfile(updatedProfile);
      setIsEditing(false);
      setEditForm({});
      setEditSuccess("Profile updated successfully");
    } catch (err) {
      setEditError(err.message || "Unable to update profile.");
    } finally {
      setSavingEdit(false);
    }
  };

  const cityOptions = editForm.country ? countryCityMap[editForm.country] || [] : [];

  return (
    <section className="section">
      <div className="container container-wide company-page-wrap">
        <div className="company-head">
          <SectionHeader
            eyebrow="Company Identity"
            title="Company Profile"
            text={isEditing ? "Edit your company information" : "Manage your company account details."}
          />
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>Logout</button>
        </div>

        <CompanySubnav />

        <article className="card">
          {loading ? <p className="state loading">Loading profile...</p> : null}
          {error ? <p className="state error">{error}</p> : null}

          {!loading && !error ? (
            <>
              {!isEditing && (
                <div className="profile-view">
                  <div className="profile-overview">
                    <div className="profile-overview-left">
                      <div className="profile-avatar">{companyInitials}</div>
                      <div className="profile-meta">
                        <h3>{companyName}</h3>
                        <p>{profile?.email || "-"}</p>
                        <div className="profile-tags">
                          <span className="profile-tag">{formatDisplayValue(profile?.subscription_plan)}</span>
                          <span className="profile-tag">{formatDisplayValue(profile?.subscription_status)}</span>
                        </div>
                      </div>
                    </div>
                    <button type="button" className="btn btn-primary edit-profile-button" onClick={handleEditStart}>
                      Edit Profile
                    </button>
                  </div>
                  <dl className="profile-grid">
                    <div><dt>Company ID</dt><dd>{formatDisplayValue(profile?.company_id)}</dd></div>
                    <div><dt>Company Name</dt><dd>{formatDisplayValue(profile?.company_name)}</dd></div>
                    <div><dt>Company Type</dt><dd>{formatDisplayValue(profile?.company_type)}</dd></div>
                    <div><dt>Email</dt><dd>{formatDisplayValue(profile?.email)}</dd></div>
                    <div><dt>Contact Number</dt><dd>{formatDisplayValue(profile?.contact_number)}</dd></div>
                    <div><dt>Address</dt><dd>{formatDisplayValue(profile?.company_address)}</dd></div>
                    <div><dt>City</dt><dd>{formatDisplayValue(profile?.city)}</dd></div>
                    <div><dt>Country</dt><dd>{formatDisplayValue(profile?.country)}</dd></div>
                    <div><dt>Subscription Plan</dt><dd>{formatDisplayValue(profile?.subscription_plan)}</dd></div>
                    <div><dt>Subscription Status</dt><dd>{formatDisplayValue(profile?.subscription_status)}</dd></div>
                    <div><dt>Subscription Expiry</dt><dd>{formatDateTimeUS(profile?.subscription_expiry)}</dd></div>
                    <div><dt>Verified</dt><dd>{typeof profile?.is_verified === "boolean" ? (profile.is_verified ? "Yes" : "No") : "-"}</dd></div>
                    <div><dt>Created At</dt><dd>{formatDateTimeUS(profile?.created_at)}</dd></div>
                    <div><dt>Updated At</dt><dd>{formatDateTimeUS(profile?.updated_at)}</dd></div>
                    <div><dt>Last Active</dt><dd>{formatDateTimeUS(profile?.last_active)}</dd></div>
                  </dl>
                </div>
              )}

              {isEditing && (
                <form className="profile-form" onSubmit={handleEditSave}>
                  <label>
                    Company Name
                    <input
                      type="text"
                      name="company_name"
                      value={editForm.company_name}
                      onChange={handleEditChange}
                      placeholder="Enter company name"
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      name="email"
                      value={editForm.email}
                      onChange={handleEditChange}
                      placeholder="Enter email"
                    />
                  </label>
                  <label>
                    Company Type
                    <input
                      type="text"
                      name="company_type"
                      value={editForm.company_type}
                      onChange={handleEditChange}
                      placeholder="e.g., Logistics, Taxi Service, Delivery"
                    />
                  </label>
                  <label>
                    Contact Number
                    <input
                      type="tel"
                      name="contact_number"
                      value={editForm.contact_number}
                      onChange={handleEditChange}
                      placeholder="Enter contact number"
                    />
                  </label>
                  <label>
                    Company Address
                    <input
                      type="text"
                      name="company_address"
                      value={editForm.company_address}
                      onChange={handleEditChange}
                      placeholder="Enter company address"
                    />
                  </label>
                  <label>
                    Country
                    <select
                      name="country"
                      value={editForm.country}
                      onChange={handleEditChange}
                    >
                      <option value="">Select a country</option>
                      {countryOptions.map((country) => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    City
                    <select
                      name="city"
                      value={editForm.city}
                      onChange={handleEditChange}
                      disabled={!editForm.country}
                    >
                      <option value="">Select a city</option>
                      {cityOptions.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    New Password
                    <input
                      type="password"
                      name="password"
                      value={editForm.password}
                      onChange={handleEditChange}
                      placeholder="Minimum 8 characters"
                    />
                  </label>
                  <label>
                    Confirm Password
                    <input
                      type="password"
                      name="confirm_password"
                      value={editForm.confirm_password}
                      onChange={handleEditChange}
                      placeholder="Re-enter new password"
                    />
                  </label>

                  {editError ? <p className="state error">{editError}</p> : null}
                  {editSuccess ? <p className="state success">{editSuccess}</p> : null}

                  <div className="profile-form-actions">
                    <button type="button" className="btn btn-ghost" onClick={handleEditCancel} disabled={savingEdit}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                      {savingEdit ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : null}
        </article>
      </div>
    </section>
  );
}

export default CompanyProfilePage;
