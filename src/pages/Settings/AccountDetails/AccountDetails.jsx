import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import settingsService from '../../../services/settingsService';
import Spinner from '../../../components/Loader/Spinner';

const AccountDetails = () => {
  const { currentUser, updateLocalUser } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    bio: '',
    phone: '',
    website: '',
    birthday: '',
    gender: '',
    location: ''
  });

  const [previews, setPreviews] = useState({
    profilePicture: '/uploads/default-avatar.png',
    coverPhoto: '/uploads/default-cover.png'
  });

  const [files, setFiles] = useState({
    profilePicture: null,
    coverPhoto: null
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Fetch current user settings on mount
  useEffect(() => {
    const fetchUserSettings = async () => {
      try {
        const res = await settingsService.getSettings();
        if (res.success) {
          const data = res.data;
          setFormData({
            username: data.username || '',
            fullName: data.fullName || '',
            email: data.email || '',
            bio: data.bio || '',
            phone: data.phone || '',
            website: data.website || '',
            birthday: data.birthday ? data.birthday.split('T')[0] : '',
            gender: data.gender || '',
            location: data.location || ''
          });
          setPreviews({
            profilePicture: data.profilePicture || '/uploads/default-avatar.png',
            coverPhoto: data.coverPhoto || '/uploads/default-cover.png'
          });
        }
      } catch (err) {
        console.error('Failed to load settings details:', err);
        setStatus({ type: 'error', message: 'Failed to load account settings details' });
      } finally {
        setLoading(false);
      }
    };
    fetchUserSettings();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setFiles({ ...files, [type]: file });
      setPreviews({ ...previews, [type]: URL.createObjectURL(file) });
    }
  };

  const triggerFileInput = (ref) => {
    if (ref.current) ref.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });

    // Validate inputs
    if (!formData.fullName.trim()) {
      setStatus({ type: 'error', message: 'Full name is required' });
      setSaving(false);
      return;
    }
    if (formData.username.trim().length < 3) {
      setStatus({ type: 'error', message: 'Username must be at least 3 characters' });
      setSaving(false);
      return;
    }

    try {
      const dataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        dataToSend.append(key, formData[key]);
      });
      if (files.profilePicture) {
        dataToSend.append('profilePicture', files.profilePicture);
      }
      if (files.coverPhoto) {
        dataToSend.append('coverPhoto', files.coverPhoto);
      }

      const res = await settingsService.updateAccount(dataToSend);
      if (res.success) {
        setStatus({ type: 'success', message: 'Profile details updated successfully!' });
        // Sync with authentication state context so header, sidebar, profile updates instantly
        updateLocalUser({
          username: res.data.username,
          fullName: res.data.fullName,
          profilePicture: res.data.profilePicture,
          coverPhoto: res.data.coverPhoto
        });
      } else {
        setStatus({ type: 'error', message: res.error || 'Failed to save changes' });
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Something went wrong. Please check your inputs.';
      setStatus({ type: 'error', message: errMsg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="32px" />
      </div>
    );
  }

  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <h2 className="settings-card-title">Account Details</h2>
        <p className="settings-card-desc">Update your profile avatar, biography details, contact information, and locations.</p>
      </div>

      {status.message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '0.9rem',
          fontWeight: 600,
          backgroundColor: status.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: status.type === 'success' ? 'var(--success)' : 'var(--danger)',
          border: `1px solid ${status.type === 'success' ? 'var(--success)' : 'var(--danger)'}`
        }}>
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Images Selection Section */}
        <div className="settings-images-section">
          {/* Cover Photo */}
          <div 
            className="settings-cover-preview"
            style={{ backgroundImage: `url(${previews.coverPhoto})` }}
            onClick={() => triggerFileInput(coverInputRef)}
          >
            <div className="settings-cover-overlay">
              <span>📷 Change Cover Photo</span>
            </div>
          </div>
          <input 
            type="file" 
            ref={coverInputRef} 
            style={{ display: 'none' }} 
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'coverPhoto')}
          />

          {/* Profile Picture (Avatar) */}
          <div className="settings-avatar-wrapper">
            <div 
              className="settings-avatar-preview"
              style={{ backgroundImage: `url(${previews.profilePicture})` }}
              onClick={() => triggerFileInput(profileInputRef)}
            >
              <div className="settings-avatar-overlay">
                <span>📷 Change Photo</span>
              </div>
            </div>
            <input 
              type="file" 
              ref={profileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'profilePicture')}
            />
          </div>
        </div>

        {/* Text Form Fields Grid */}
        <div className="settings-form-grid">
          <div className="settings-form-group">
            <label className="settings-label">Full Name</label>
            <input 
              type="text" 
              name="fullName"
              className="settings-input"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div className="settings-form-group">
            <label className="settings-label">Username</label>
            <input 
              type="text" 
              name="username"
              className="settings-input"
              value={formData.username}
              onChange={handleChange}
              placeholder="username"
              required
            />
          </div>

          <div className="settings-form-group">
            <label className="settings-label">Email Address</label>
            <input 
              type="email" 
              name="email"
              className="settings-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@example.com"
              required
            />
          </div>

          <div className="settings-form-group">
            <label className="settings-label">Location</label>
            <input 
              type="text" 
              name="location"
              className="settings-input"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Seattle, WA"
            />
          </div>

          <div className="settings-form-group">
            <label className="settings-label">Phone Number (optional)</label>
            <input 
              type="tel" 
              name="phone"
              className="settings-input"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. +123456789"
            />
          </div>

          <div className="settings-form-group">
            <label className="settings-label">Website (optional)</label>
            <input 
              type="url" 
              name="website"
              className="settings-input"
              value={formData.website}
              onChange={handleChange}
              placeholder="e.g. https://mywebsite.com"
            />
          </div>

          <div className="settings-form-group">
            <label className="settings-label">Date of Birth</label>
            <input 
              type="date" 
              name="birthday"
              className="settings-input"
              value={formData.birthday}
              onChange={handleChange}
            />
          </div>

          <div className="settings-form-group">
            <label className="settings-label">Gender (optional)</label>
            <select 
              name="gender" 
              className="settings-select"
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div className="settings-form-group full-width">
            <label className="settings-label">Biography</label>
            <textarea 
              name="bio"
              className="settings-textarea"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell others about yourself..."
              maxLength={200}
            />
          </div>
        </div>

        <div className="settings-actions">
          <button 
            type="submit" 
            className="settings-btn settings-btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccountDetails;
