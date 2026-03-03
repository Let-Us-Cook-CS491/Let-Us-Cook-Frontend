import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { login } from '../../services/authService';

const SignIn = () => {
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
      // await login({ email: formValues.email, password: formValues.password });
      console.log('Sign in values:', formValues);
    } catch (error) {
      console.error(error);
      setErrors({ form: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Sign in to Let Us Cook"
      subtitle="Welcome back, chef."
    >
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

        <Button type="submit" disabled={loading} className="mt-2">
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>

        <p className="text-sm text-brand-dark/80 text-center">
          Don&apos;t have an account?{' '}
          <Link
            to="/signup"
            className="font-medium text-brand-brown hover:underline"
          >
            Sign up
          </Link>
        </p>
      </form>
    </Card>
  );
};

export default SignIn;

