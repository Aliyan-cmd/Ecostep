import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Leaf, Eye, EyeOff, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/useAuth';

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium">
      {met ? (
        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-slate-300" />
      )}
      <span className={met ? 'text-emerald-700' : 'text-slate-400'}>{label}</span>
    </div>
  );
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { name: '', email: '', password: '' },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      email: Yup.string().email('Invalid email').required('Required'),
      password: Yup.string()
        .min(8, 'At least 8 characters')
        .matches(/[A-Z]/, 'One uppercase letter')
        .matches(/[a-z]/, 'One lowercase letter')
        .matches(/\d/, 'One digit')
        .required('Required'),
    }),
    onSubmit: async (values) => {
      setServerError(null);
      try {
        await register(values.email, values.password, values.name);
        navigate('/dashboard', { replace: true });
      } catch (err: unknown) {
        setServerError(err instanceof Error ? err.message : 'Registration failed');
      }
    },
  });

  const pw = formik.values.password;
  const pwMet = {
    min8: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    digit: /\d/.test(pw),
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Leaf className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">EcoStep.</h1>
          <p className="text-slate-500 font-medium mt-2">Start tracking your carbon footprint</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Create Account</h2>

          {serverError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700 font-medium text-sm">
              <UserPlus className="w-4 h-4 mr-2 shrink-0" />
              {serverError}
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                name="name"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.name}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="Jane Doe"
              />
              {formik.touched.name && formik.errors.name && (
                <p className="text-amber-500 font-medium text-xs mt-1">{formik.errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="you@example.com"
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-amber-500 font-medium text-xs mt-1">{formik.errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.password}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="text-amber-500 font-medium text-xs mt-1">{formik.errors.password}</p>
              )}
              {pw.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-y-1.5 bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <PasswordRequirement met={pwMet.min8} label="8+ characters" />
                  <PasswordRequirement met={pwMet.upper} label="Uppercase letter" />
                  <PasswordRequirement met={pwMet.lower} label="Lowercase letter" />
                  <PasswordRequirement met={pwMet.digit} label="One digit" />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="w-full py-3.5 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formik.isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 font-medium mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-700 font-bold hover:text-emerald-800 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
