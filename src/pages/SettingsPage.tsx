import { useState, useEffect, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import { supabase } from '../lib/supabase';
import type { Gender } from '../types/database';

export function SettingsPage() {
  const navigate = useNavigate();
  const { profile, user, retryFetchProfile } = useAuth();
  const { updateProfile, loading: updateLoading } = useUpdateProfile();

  const [fullName, setFullName] = useState('');
  const [weightKg, setWeightKg] = useState(0);
  const [heightCm, setHeightCm] = useState(0);
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setWeightKg(profile.weight_kg);
      setHeightCm(profile.height_cm);
      setGender(profile.gender);
      setAge(profile.age);
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  useEffect(() => {
    if (user?.email) {
      setNewEmail(user.email);
    }
  }, [user]);

  // Handle file selection
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Vennligst velg en bildefil');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Bildet må være mindre enn 5MB');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload avatar to Supabase Storage
  const handleUploadAvatar = async () => {
    if (!selectedFile || !user) return;

    setUploadLoading(true);
    setUploadError(null);

    try {
      // Create a unique file name with user ID folder
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Delete old avatar if exists
      if (avatarUrl) {
        // Extract the file path from the public URL
        // URL format: .../storage/v1/object/public/avatars/{user_id}/{filename}
        const urlParts = avatarUrl.split('/avatars/');
        if (urlParts.length > 1) {
          const oldFilePath = urlParts[1];
          await supabase.storage
            .from('avatars')
            .remove([oldFilePath]);
        }
      }

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: publicUrl });

      // Force refresh profile to get the updated avatar
      await retryFetchProfile();

      setAvatarUrl(publicUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
      setProfileSuccess('Profilbildet ble oppdatert!');

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      setUploadError(err.message || 'Kunne ikke laste opp profilbilde');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    try {
      await updateProfile({
        full_name: fullName,
        weight_kg: weightKg,
        height_cm: heightCm,
        gender: gender,
        age: age,
      });

      setProfileSuccess('Profilen ble oppdatert!');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setProfileError(err.message || 'Kunne ikke oppdatere profilen');
    }
  };

  const handleUpdateEmail = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      setAuthSuccess('E-post oppdatert! Sjekk innboksen din.');
      setAuthLoading(false);
    } catch (err: any) {
      setAuthError(err.message || 'Kunne ikke oppdatere e-post');
      setAuthLoading(false);
    }
  };

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (newPassword !== confirmPassword) {
      setAuthError('Passordene matcher ikke');
      return;
    }

    if (newPassword.length < 6) {
      setAuthError('Passordet må være minst 6 tegn');
      return;
    }

    setAuthLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setAuthSuccess('Passordet ble oppdatert!');
      setNewPassword('');
      setConfirmPassword('');
      setAuthLoading(false);
    } catch (err: any) {
      setAuthError(err.message || 'Kunne ikke oppdatere passord');
      setAuthLoading(false);
    }
  };

  const getAvatarDisplay = () => {
    if (previewUrl) return previewUrl;
    if (avatarUrl) return avatarUrl;
    return null;
  };

  const avatarDisplay = getAvatarDisplay();

  return (
    <div className="settings-page">
      <div className="settings-content">
        <div className="settings-card">
          <h2>Profilinnstillinger</h2>
          {profileError && <div className="error-message">{profileError}</div>}
          {profileSuccess && <div className="success-message">{profileSuccess}</div>}

          <form onSubmit={handleUpdateProfile} className="settings-form">
            {/* Profile Picture Section */}
            <div className="form-group avatar-section">
              <label>Profilbilde</label>
              <div className="avatar-container">
                <div className="avatar-preview">
                  {avatarDisplay ? (
                    <img src={avatarDisplay} alt="Profilbilde" className="avatar-image" />
                  ) : (
                    <div className="avatar-placeholder">
                      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="avatar-controls">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="avatar-file-input"
                    id="avatar-upload"
                  />
                  <label htmlFor="avatar-upload" className="btn-secondary avatar-select-btn">
                    Velg bilde
                  </label>
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={handleUploadAvatar}
                      disabled={uploadLoading}
                      className="btn-primary"
                    >
                      {uploadLoading ? 'Laster opp...' : 'Last opp'}
                    </button>
                  )}
                </div>
                {uploadError && <div className="error-message avatar-error">{uploadError}</div>}
                {selectedFile && (
                  <div className="avatar-file-info">
                    Valgt fil: {selectedFile.name}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="full_name">Visningsnavn</label>
              <input id="full_name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="weight">Vekt (kg)</label>
              <input id="weight" type="number" step="0.1" value={weightKg} onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)} required />
            </div>
            <div className="form-group">
              <label htmlFor="height">Høyde (cm)</label>
              <input id="height" type="number" value={heightCm} onChange={(e) => setHeightCm(parseInt(e.target.value) || 0)} required />
            </div>
            <div className="form-group">
              <label htmlFor="gender">Kjønn</label>
              <select id="gender" value={gender} onChange={(e) => setGender(e.target.value as Gender)} required>
                <option value="male">Mann</option>
                <option value="female">Kvinne</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="age">Alder</label>
              <input id="age" type="number" value={age} onChange={(e) => setAge(parseInt(e.target.value) || 0)} required />
            </div>
            <button type="submit" className="btn-primary" disabled={updateLoading}>
              {updateLoading ? 'Lagrer...' : 'Lagre endringer'}
            </button>
          </form>
        </div>

        <div className="settings-card">
          <h2>Endre e-post</h2>
          {authError && <div className="error-message">{authError}</div>}
          {authSuccess && <div className="success-message">{authSuccess}</div>}

          <form onSubmit={handleUpdateEmail} className="settings-form">
            <div className="form-group">
              <label htmlFor="email">E-post</label>
              <input id="email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary" disabled={authLoading}>
              {authLoading ? 'Oppdaterer...' : 'Oppdater e-post'}
            </button>
          </form>
        </div>

        <div className="settings-card">
          <h2>Endre passord</h2>
          <form onSubmit={handleUpdatePassword} className="settings-form">
            <div className="form-group">
              <label htmlFor="new_password">Nytt passord</label>
              <input id="new_password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
            </div>
            <div className="form-group">
              <label htmlFor="confirm_password">Bekreft passord</label>
              <input id="confirm_password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} required />
            </div>
            <button type="submit" className="btn-primary" disabled={authLoading}>
              {authLoading ? 'Oppdaterer...' : 'Endre passord'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
