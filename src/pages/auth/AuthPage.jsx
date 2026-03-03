import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

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
      <div className="mb-6 flex items-center justify-center">
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

      <div className="mb-6 space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-brand-dark">
          Welcome to Let Us Cook
        </h1>
        <p className="text-sm text-brand-dark/70">
          {isSignIn
            ? 'Sign in to your account or create a new one.'
            : 'Create your account to start planning smarter meals.'}
        </p>
      </div>

      <div className="relative overflow-hidden">
        <div
          className={`flex w-[200%] transition-transform duration-300 ease-out ${
            isSignIn ? 'translate-x-0' : '-translate-x-1/2'
          }`}
        >
          <div className="w-1/2 pr-3">
            <SignInForm />
          </div>

          <div className="w-1/2 pl-3">
            <SignUpForm />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-dark/80 hover:text-brand-dark"
        >
          <span className="text-base">←</span>
          <span>Back to Home</span>
        </Link>
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
      await new Promise((resolve) => setTimeout(resolve, 800));
      console.log('Sign in values:', formValues);
    } catch (error) {
      console.error(error);
      setErrors({ form: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
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
    </form>
  );
};

const SignUpForm = () => {
  const [formValues, setFormValues] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

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
      console.log('Sign up values:', formValues);
    } catch (error) {
      console.error(error);
      setErrors({ form: 'Something went wrong. Please try again.' });
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
        error={errors.confirmPassword}
      />

      <Button type="submit" className="mt-2 w-full">
        Sign Up
      </Button>
    </form>
  );
};

export default AuthPage;

