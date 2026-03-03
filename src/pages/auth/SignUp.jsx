import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { register } from '../../services/authService';

const SignUp = () => {
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
      // await register({
      //   fullName: formValues.fullName,
      //   email: formValues.email,
      //   password: formValues.password,
      // });
      console.log('Sign up values:', formValues);
    } catch (error) {
      console.error(error);
      setErrors({ form: 'Something went wrong. Please try again.' });
    }
  };

  return (
    <Card
      title="Create your account"
      subtitle="Start planning smarter meals."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
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

        <Button type="submit">
          Sign Up
        </Button>

        <p className="text-sm text-gray-600 text-center">
          Already have an account?{' '}
          <Link
            to="/signin"
            className="font-medium text-blue-600 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </Card>
  );
};

export default SignUp;

