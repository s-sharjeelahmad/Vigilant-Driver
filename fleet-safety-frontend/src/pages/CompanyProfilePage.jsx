import { useEffect, useState } from "react";
import { Building2, Mail, Phone, MapPin, Tag, CheckCircle2, Shield, Calendar, Edit2, Key } from "lucide-react";
import ErrorBanner from "../components/ErrorBanner";
import StatusPill from "../components/StatusPill";
import { companyApi } from "../lib/apiClient";
import { formatDateTimeUS, formatDisplayValue } from "../lib/dateFormatter";

const countryCityMap = {
  Pakistan: ["Karachi", "Lahore", "Islamabad", "Multan", "Peshawar", "Quetta"],
  USA: ["New York", "Los Angeles", "Chicago", "Houston", "Dallas"],
  UK: ["London", "Manchester", "Birmingham", "Leeds", "Glasgow"],
  Canada: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"]
};

const countryOptions = Object.keys(countryCityMap);

function CompanyProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  const companyName = profile?.company_name || "Company Profile";
  const companyInitials = companyName.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await companyApi.getProfile();
        setProfile(data || {});
      } catch (err) {
        setError(err.message || "Unable to load profile information.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

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
    setEditForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "country") next.city = ""; // Reset city when country changes
      return next;
    });
  };

  const validateEditForm = () => {
    if (editForm.company_name && (editForm.company_name.length < 2 || editForm.company_name.length > 200)) {
      setEditError("Company name must be between 2 and 200 characters.");
      return false;
    }
    if (editForm.email && !editForm.email.includes("@")) {
      setEditError("Please enter a valid email address.");
      return false;
    }
    if (editForm.contact_number && editForm.contact_number.length < 10) {
      setEditError("Contact number must be at least 10 digits.");
      return false;
    }
    if (editForm.password) {
      if (editForm.password.length < 8) {
        setEditError("Password must be at least 8 characters.");
        return false;
      }
      if (editForm.password !== editForm.confirm_password) {
        setEditError("Passwords do not match.");
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
        setEditError("No changes to save.");
        setSavingEdit(false);
        return;
      }

      const updatedProfile = await companyApi.updateProfile(updatePayload);
      setProfile(updatedProfile);
      setIsEditing(false);
      setEditForm({});
      setEditSuccess("Profile updated successfully.");
    } catch (err) {
      setEditError(err.message || "Unable to update profile.");
    } finally {
      setSavingEdit(false);
    }
  };

  const cityOptions = editForm.country ? countryCityMap[editForm.country] || [] : [];

  if (loading) {
    return (
      <div style={{ padding: '2rem', animation: 'pulse 2s infinite', opacity: 0.5 }}>
        <div style={{ height: '40px', width: '200px', background: 'var(--color-surface-elevated)', borderRadius: '8px', marginBottom: '2rem' }}></div>
        <div className="card" style={{ height: '400px', background: 'var(--color-surface)' }}></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="ds-heading-1" style={{ margin: 0, color: 'var(--color-text-primary)' }}>Company Identity</h1>
          <p className="ds-body" style={{ margin: '0.25rem 0 0 0' }}>Manage your fleet's organizational details and subscription.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={handleEditStart}
            style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', padding: '0.6rem 1rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Edit2 size={16} /> Edit Profile
          </button>
        )}
      </div>

      <ErrorBanner message={error} />
      {editSuccess && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: 'rgba(36, 161, 72, 0.1)', borderLeft: '4px solid var(--color-success)', borderRadius: '4px', color: 'var(--color-status-safe)', marginBottom: '1.5rem' }}>
          <CheckCircle2 size={20} />
          <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{editSuccess}</span>
        </div>
      )}

      {profile && !isEditing && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Cover / Header Area */}
          <div style={{ height: '120px', background: 'linear-gradient(to right, var(--color-primary), var(--color-primary-hover))' }}></div>
          <div style={{ padding: '0 2rem 2rem 2rem', position: 'relative' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '-40px', marginBottom: '2rem' }}>
              <div style={{ width: '80px', height: '80px', background: 'var(--color-surface)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)', border: '4px solid var(--color-bg)', boxShadow: 'var(--shadow-low)' }}>
                {companyInitials}
              </div>
              <div>
                {profile.is_verified ? <StatusPill status="Verified Account" /> : <StatusPill status="Unverified" />}
              </div>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
              <h2 className="ds-display-small" style={{ margin: '0 0 0.5rem 0' }}>{companyName}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: 'var(--color-text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={16} /> {profile.email || "No email"}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={16} /> {profile.contact_number || "No contact number"}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Tag size={16} /> {formatDisplayValue(profile.company_type)}</div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-divider)', margin: '0 0 2rem 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 className="ds-heading-3" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building2 size={18} /> Organization Details</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <div className="ds-caption" style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Company ID</div>
                    <div className="ds-body" style={{ fontFamily: 'monospace' }}>{profile.company_id}</div>
                  </div>
                  <div>
                    <div className="ds-caption" style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Full Address</div>
                    <div className="ds-body">{profile.company_address || "-"}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div className="ds-caption" style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>City</div>
                      <div className="ds-body">{formatDisplayValue(profile.city)}</div>
                    </div>
                    <div>
                      <div className="ds-caption" style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Country</div>
                      <div className="ds-body">{formatDisplayValue(profile.country)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 className="ds-heading-3" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={18} /> Subscription & Status</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div className="ds-caption" style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Current Plan</div>
                      <div><StatusPill status={profile.subscription_plan || "None"} /></div>
                    </div>
                    <div>
                      <div className="ds-caption" style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Plan Status</div>
                      <div><StatusPill status={profile.subscription_status || "Unknown"} /></div>
                    </div>
                  </div>
                  <div>
                    <div className="ds-caption" style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Subscription Expiry</div>
                    <div className="ds-body">{formatDateTimeUS(profile.subscription_expiry) || "N/A"}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px dashed var(--color-divider)' }}>
                    <div>
                      <div className="ds-caption" style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Account Created</div>
                      <div className="ds-body-small">{formatDateTimeUS(profile.created_at)}</div>
                    </div>
                    <div>
                      <div className="ds-caption" style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Last Active</div>
                      <div className="ds-body-small">{formatDateTimeUS(profile.last_active)}</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="card" style={{ padding: '2rem' }}>
          <h2 className="ds-heading-2" style={{ margin: '0 0 1.5rem 0' }}>Edit Company Profile</h2>
          
          <ErrorBanner message={editError} />

          <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* General Info */}
            <div>
              <h3 className="ds-heading-3" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>General Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
                <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  Company Name
                  <input type="text" name="company_name" value={editForm.company_name} onChange={handleEditChange} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </label>
                <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  Company Type
                  <input type="text" name="company_type" value={editForm.company_type} onChange={handleEditChange} placeholder="e.g. Logistics" style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </label>
              </div>
            </div>

            {/* Contact & Location */}
            <div>
              <h3 className="ds-heading-3" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Contact & Location</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  Email Address
                  <input type="email" name="email" value={editForm.email} onChange={handleEditChange} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </label>
                <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  Contact Number
                  <input type="tel" name="contact_number" value={editForm.contact_number} onChange={handleEditChange} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </label>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  Street Address
                  <input type="text" name="company_address" value={editForm.company_address} onChange={handleEditChange} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    Country
                    <select name="country" value={editForm.country} onChange={handleEditChange} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>
                      <option value="">Select Country</option>
                      {countryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                  <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    City
                    <select name="city" value={editForm.city} onChange={handleEditChange} disabled={!editForm.country} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>
                      <option value="">Select City</option>
                      {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                </div>
              </div>
            </div>

            {/* Security */}
            <div>
              <h3 className="ds-heading-3" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Key size={18} /> Security</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
                <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  New Password
                  <input type="password" name="password" value={editForm.password} onChange={handleEditChange} placeholder="Leave blank to keep current" style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </label>
                <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  Confirm Password
                  <input type="password" name="confirm_password" value={editForm.confirm_password} onChange={handleEditChange} placeholder="Confirm new password" style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
              <button type="submit" disabled={savingEdit} style={{ background: 'var(--color-primary)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 600, cursor: savingEdit ? 'not-allowed' : 'pointer' }}>
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
              <button type="button" onClick={handleEditCancel} disabled={savingEdit} style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default CompanyProfilePage;
