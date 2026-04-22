import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { login, register } from '../../services/authService';

const AuthPage = ({ initialTab = 'signin' }) => {
  const [activeTab, setActiveTab] = useState(
    initialTab === 'signup' ? 'signup' : 'signin',
  );
  const navigate = useNavigate();

  const isSignIn = activeTab === 'signin';

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    navigate(tab === 'signin' ? '/signin' : '/signup', { replace: true });
  };

  return (
    <Card>
      <div className="flex flex-col items-center w-full">
        <div className="mb-6 flex w-full justify-center">
          <div className="inline-flex w-full max-w-sm rounded-full bg-brand-beige/60 p-1">
            <button
              type="button"
              onClick={() => handleTabChange('signin')}
              className={`flex-1 rounded-full px-6 py-2.5 text-sm font-medium transition-colors ${
                isSignIn
                  ? 'bg-brand-beige text-brand-dark border border-brand-dark shadow-sm'
                  : 'bg-transparent text-brand-dark/75 hover:text-brand-dark'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('signup')}
              className={`flex-1 rounded-full px-6 py-2.5 text-sm font-medium transition-colors ${
                !isSignIn
                  ? 'bg-brand-beige text-brand-dark border border-brand-dark shadow-sm'
                  : 'bg-transparent text-brand-dark/75 hover:text-brand-dark'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        <div className="mb-6 space-y-1 text-center max-w-sm w-full">
          <h1 className="text-2xl font-semibold text-brand-dark">
            {isSignIn ? 'Welcome back, chef!' : 'Create your account'}
          </h1>
          <p className="text-sm text-brand-dark/70">
            {isSignIn
              ? 'Sign in to your account or create a new one.'
              : 'Start planning smarter meals with what’s already in your fridge.'}
          </p>
        </div>

        <div className="w-full max-w-sm">
          <div key={activeTab} className="animate-auth-fade-in w-full">
            {isSignIn ? <SignInForm /> : <SignUpForm />}
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <img
            src="/assets/let-us-cook-pan.png"
            alt="Let Us Cook pan illustration"
            className="h-16 w-auto opacity-90"
          />
        </div>

        <div className="mt-4 flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-dark/80 hover:text-brand-dark"
          >
            <span className="text-base">←</span>
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </Card>
  );
};

const SignInForm = () => {
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    setFormValues((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formValues.email.trim()) {
      newErrors.email = 'Email is required';
    }

    if (!formValues.password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const data = await login({
        email: formValues.email,
        password: formValues.password,
        time_zone: timeZone,
      });

      const accessToken = data?.data?.accessToken;
      const refreshToken = data?.data?.refreshToken;
      const userId = data?.data?.user_id;

      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      if (userId) {
        localStorage.setItem('userId', String(userId));
      }
      const fridgeId = data?.data?.fridge_id;
      if (fridgeId != null) {
        localStorage.setItem('fridgeId', String(fridgeId));
      }

      navigate('/dashboard');
      return;
    } catch (error) {
      console.error(error);
      const message =
        (error && error.message) ||
        (error && error.error) ||
        'Something went wrong. Please try again.';
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {errors.form && (
        <p className="text-sm text-red-600">{errors.form}</p>
      )}

      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={formValues.email}
        onChange={handleChange}
        error={errors.email}
      />

      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        value={formValues.password}
        onChange={handleChange}
        error={errors.password}
      />

      <Button type="submit" disabled={loading} className="mt-2 w-full">
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>

      <p className="text-xs text-center text-brand-dark/70 mt-2">
        Plan smarter meals with what&apos;s already in your fridge.
      </p>
    </form>
  );
};

const SignUpForm = () => {
  const [formValues, setFormValues] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: 'other',
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (event) => {
    setFormValues((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formValues.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formValues.email.trim()) {
      newErrors.email = 'Email is required';
    }

    if (!formValues.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formValues.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formValues.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formValues.confirmPassword !== formValues.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const payload = {
        full_name: formValues.fullName,
        email: formValues.email,
        password: formValues.password,
        // Temporary placeholder until phone field is added back
        phone_number: '0000000000',
        gender: formValues.gender,
        time_zone: timeZone,
      };

      const data = await register(payload);

      const accessToken = data?.data?.accessToken;
      const refreshToken = data?.data?.refreshToken;
      const userId = data?.data?.user_id;

      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      if (userId) {
        localStorage.setItem('userId', String(userId));
      }
      const fridgeId = data?.data?.fridge_id;
      if (fridgeId != null) {
        localStorage.setItem('fridgeId', String(fridgeId));
      }

      navigate('/dashboard');
      return;
    } catch (error) {
      console.error(error);
      const message =
        (error && error.message) ||
        (error && error.error) ||
        'Something went wrong. Please try again.';
      setErrors({ form: message });
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {errors.form && (
        <p className="text-sm text-red-600">{errors.form}</p>
      )}

      <Input
        label="Full name"
        name="fullName"
        type="text"
        autoComplete="name"
        value={formValues.fullName}
        onChange={handleChange}
        error={errors.fullName}
      />

      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={formValues.email}
        onChange={handleChange}
        error={errors.email}
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Gender
        </label>
        <select
          name="gender"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={formValues.gender}
          onChange={handleChange}
        >
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="other">Other</option>
        </select>
      </div>

      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        value={formValues.password}
        onChange={handleChange}
        error={errors.password}
      />

      <Input
        label="Confirm password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        value={formValues.confirmPassword}
        onChange={handleChange}
        error={
          errors.confirmPassword ||
          (formValues.confirmPassword &&
          formValues.confirmPassword !== formValues.password
            ? 'Passwords do not match'
            : undefined)
        }
      />

      <Button type="submit" className="mt-2 w-full">
        Sign Up
      </Button>
    </form>
  );
};

export default AuthPage;

