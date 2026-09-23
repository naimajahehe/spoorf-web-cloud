import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { TextField } from '../components/ui/TextField';
import { Alert } from '../components/ui/Alert';
import { buttonClass } from '../components/ui/button';
import { getApiErrorMessage } from '../utils/apiError';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Return to the page that required sign-in (set by ProtectedRoute)
  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard';

  useDocumentTitle('Masuk');

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Email atau kata sandi tidak cocok. Periksa lalu coba lagi.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={
        <>
          Masuk ke <span className="font-serif italic font-normal text-brand">Spoorf Cloud</span>
        </>
      }
      description="Kelola lisensi dan perangkat desktop yang memakai akun Anda."
      footer={
        <>
          Belum punya akun?{' '}
          <Link to="/register" className="font-semibold text-brand hover:text-brand-hover underline-offset-4 hover:underline">
            Daftar gratis
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}

        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          disabled={isLoading}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@contoh.com"
        />

        <TextField
          id="password"
          label="Kata sandi"
          type="password"
          autoComplete="current-password"
          required
          disabled={isLoading}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" disabled={isLoading} className={buttonClass('primary', 'lg', { fullWidth: true })}>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          {isLoading ? 'Memproses…' : 'Masuk'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
