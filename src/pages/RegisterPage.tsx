import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { RegisterFormData, Gender } from '../types/database';

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    full_name: '',
    weight_kg: 0,
    height_cm: 0,
    gender: 'male',
    age: 18,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!formData.email || !formData.password || !formData.full_name) {
      setError('Vennligst fyll inn alle obligatoriske felt');
      setLoading(false);
      return;
    }

    if (formData.weight_kg <= 0 || formData.height_cm <= 0) {
      setError('Vekt og høyde må være positive tall');
      setLoading(false);
      return;
    }

    if (formData.age < 18) {
      setError('Du må være minst 18 år gammel');
      setLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await signUp(formData);

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // Success - redirect to home
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Kunne ikke registrere');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Opprett konto</h1>
        <p className="auth-subtitle">Registrer deg for å begynne å spore promillen din</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">E-post</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Passord</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              minLength={6}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="full_name">Fullt navn</label>
            <input
              id="full_name"
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="weight_kg">Vekt (kg)</label>
              <input
                id="weight_kg"
                type="number"
                step="0.1"
                value={formData.weight_kg || ''}
                onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="height_cm">Høyde (cm)</label>
              <input
                id="height_cm"
                type="number"
                step="0.1"
                value={formData.height_cm || ''}
                onChange={(e) => setFormData({ ...formData, height_cm: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gender">Kjønn</label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                required
              >
                <option value="male">Mann</option>
                <option value="female">Kvinne</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="age">Alder</label>
              <input
                id="age"
                type="number"
                value={formData.age || ''}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                min={18}
                max={120}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Oppretter konto...' : 'Registrer'}
          </button>
        </form>

        <p className="auth-footer">
          Har du allerede en konto? <Link to="/login">Logg inn her</Link>
        </p>
      </div>
    </div>
  );
}
