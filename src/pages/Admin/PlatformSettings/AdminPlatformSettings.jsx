import React, { useState, useEffect } from 'react';
import AdminLayout from '../layout/AdminLayout';
import adminService from '../services/adminService';

const AdminPlatformSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form Fields
  const [platformName, setPlatformName] = useState('');
  const [platformLogo, setPlatformLogo] = useState('');
  const [defaultProfileImage, setDefaultProfileImage] = useState('');
  
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [requireEmailVerification, setRequireEmailVerification] = useState(true);
  
  const [maxImageSizeMb, setMaxImageSizeMb] = useState(5);
  const [maxVideoSizeMb, setMaxVideoSizeMb] = useState(20);
  
  const [allowedImageTypes, setAllowedImageTypes] = useState('');
  const [allowedVideoTypes, setAllowedVideoTypes] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await adminService.getSettings();
        if (res.success) {
          const s = res.data;
          setSettings(s);
          setPlatformName(s.platformName || '');
          setPlatformLogo(s.platformLogo || '');
          setDefaultProfileImage(s.defaultProfileImage || '');
          setMaintenanceMode(s.maintenanceMode || false);
          setAllowRegistration(s.allowRegistration !== undefined ? s.allowRegistration : true);
          setRequireEmailVerification(s.requireEmailVerification !== undefined ? s.requireEmailVerification : true);
          setMaxImageSizeMb((s.maxImageSize || 5 * 1024 * 1024) / (1024 * 1024));
          setMaxVideoSizeMb((s.maxVideoSize || 20 * 1024 * 1024) / (1024 * 1024));
          setAllowedImageTypes((s.allowedImageTypes || []).join(', '));
          setAllowedVideoTypes((s.allowedVideoTypes || []).join(', '));
        }
      } catch (err) {
        setError(err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setSuccess('');
    setError('');

    const parsedImageTypes = allowedImageTypes.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const parsedVideoTypes = allowedVideoTypes.split(',').map(s => s.trim()).filter(s => s.length > 0);

    const updateData = {
      platformName: platformName.trim(),
      platformLogo: platformLogo.trim(),
      defaultProfileImage: defaultProfileImage.trim(),
      maintenanceMode,
      allowRegistration,
      requireEmailVerification,
      maxImageSize: parseFloat(maxImageSizeMb) * 1024 * 1024,
      maxVideoSize: parseFloat(maxVideoSizeMb) * 1024 * 1024,
      allowedImageTypes: parsedImageTypes,
      allowedVideoTypes: parsedVideoTypes
    };

    try {
      const res = await adminService.updateSettings(updateData);
      if (res.success) {
        setSuccess('Platform settings updated successfully!');
      }
    } catch (err) {
      setError(err.message || 'Failed to update platform settings');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <h1 className="admin-page-title">Loading Settings...</h1>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Platform Configuration</h1>
          <p className="admin-page-desc">Manage registrations, email audits, maintenance status, and upload criteria</p>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
        {success && (
          <div style={{ padding: '12px', backgroundColor: '#d1fae5', borderLeft: '4px solid var(--admin-success)', color: '#065f46', borderRadius: '4px', marginBottom: '20px', fontSize: '0.9rem' }}>
            {success}
          </div>
        )}

        {error && (
          <div style={{ padding: '12px', backgroundColor: '#fee2e2', borderLeft: '4px solid var(--admin-danger)', color: '#991b1b', borderRadius: '4px', marginBottom: '20px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Section 1: General Info */}
          <div>
            <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--admin-border)', paddingBottom: '8px', color: 'var(--admin-primary)' }}>General Metadata</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Platform Title</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Platform Logo Image URL</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. /favicon.png or external link"
                  value={platformLogo}
                  onChange={(e) => setPlatformLogo(e.target.value)}
                />
              </div>
              <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
                <label className="admin-form-label">Default Profile Image URL</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. /uploads/default-avatar.png"
                  value={defaultProfileImage}
                  onChange={(e) => setDefaultProfileImage(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Platform Toggles */}
          <div>
            <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--admin-border)', paddingBottom: '8px', color: 'var(--admin-primary)' }}>Moderation & Toggles</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--admin-bg)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Maintenance Mode</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>Denies access to the platform for all regular users immediately.</div>
                </div>
                <label className="admin-switch">
                  <input
                    type="checkbox"
                    className="admin-switch-input"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                  />
                  <span className="admin-switch-slider"></span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--admin-bg)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Allow User Registrations</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>Disable to pause new user accounts sign-ups.</div>
                </div>
                <label className="admin-switch">
                  <input
                    type="checkbox"
                    className="admin-switch-input"
                    checked={allowRegistration}
                    onChange={(e) => setAllowRegistration(e.target.checked)}
                  />
                  <span className="admin-switch-slider"></span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--admin-bg)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Require Email OTP Verification</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>Disable to verify user sign-ups immediately without email verification.</div>
                </div>
                <label className="admin-switch">
                  <input
                    type="checkbox"
                    className="admin-switch-input"
                    checked={requireEmailVerification}
                    onChange={(e) => setRequireEmailVerification(e.target.checked)}
                  />
                  <span className="admin-switch-slider"></span>
                </label>
              </div>

            </div>
          </div>

          {/* Section 3: Upload Constraints */}
          <div>
            <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--admin-border)', paddingBottom: '8px', color: 'var(--admin-primary)' }}>File Upload Constraints</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Maximum Image Upload Size (MB)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="admin-form-input"
                  value={maxImageSizeMb}
                  onChange={(e) => setMaxImageSizeMb(e.target.value)}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Maximum Video Upload Size (MB)</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  className="admin-form-input"
                  value={maxVideoSizeMb}
                  onChange={(e) => setMaxVideoSizeMb(e.target.value)}
                  required
                />
              </div>
              <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
                <label className="admin-form-label">Allowed Image Mime-Types (comma-separated)</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={allowedImageTypes}
                  onChange={(e) => setAllowedImageTypes(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>e.g. image/jpeg, image/png, image/webp</span>
              </div>
              <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
                <label className="admin-form-label">Allowed Video Mime-Types (comma-separated)</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={allowedVideoTypes}
                  onChange={(e) => setAllowedVideoTypes(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>e.g. video/mp4, video/webm, video/quicktime</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--admin-border)', paddingTop: '20px' }}>
            <button 
              type="submit" 
              className="admin-btn admin-btn-primary" 
              disabled={updating}
            >
              {updating ? 'Updating Configs...' : 'Save Settings'}
            </button>
          </div>

        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminPlatformSettings;
