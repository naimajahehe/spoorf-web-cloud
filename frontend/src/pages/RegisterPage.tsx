import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { TextField } from '../components/ui/TextField';
import { Alert } from '../components/ui/Alert';
import { buttonClass } from '../components/ui/button';
import { getApiErrorMessage } from '../utils/apiError';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useDocumentTitle('Daftar');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register(email, password, name.trim() || undefined);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Akun belum bisa dibuat. Periksa data Anda lalu coba lagi.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={
        <>
          Buat akun <span className="font-serif italic font-normal text-brand">Spoorf</span>
        </>
      }
      description="Paket Free langsung aktif untuk satu perangkat desktop. Tidak perlu kartu kredit."
      footer={
        <>
          Sudah punya akun?{' '}
          <Link to="/login" className="font-semibold text-brand hover:text-brand-hover underline-offset-4 hover:underline">
            Masuk
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}

        <TextField
          id="name"
          label="Nama"
          type="text"
          autoComplete="name"
          minLength={2}
          maxLength={100}
          disabled={isLoading}
          value={name}
          onChange={(e) => setName(e.target.value)}
          hint="Opsional. Ditampilkan di dashboard dan aplikasi desktop."
        />

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
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          disabled={isLoading}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="Minimal 8 karakter."
        />

        <button type="submit" disabled={isLoading} className={buttonClass('primary', 'lg', { fullWidth: true })}>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          {isLoading ? 'Membuat akun…' : 'Buat akun'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
