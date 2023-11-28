import { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const Signin = () => {
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [signinData, setSigninData] = useState({
    email: '',
    password: '',
  });

  const [signupError, setSignupError] = useState('');
  const [signinError, setSigninError] = useState('');

  const handleSignupChange = (e: React.FormEvent<HTMLInputElement>) => {
    setSignupData({
      ...signupData,
      [e.currentTarget.name]: e.currentTarget.value,
    });
  };

  const handleSigninChange = (e: React.FormEvent<HTMLInputElement>) => {
    setSigninData({
      ...signinData,
      [e.currentTarget.name]: e.currentTarget.value,
    });
  };

  const handleSignupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate signup data
    if (!signupData.name || !signupData.email || !signupData.password) {
      setSignupError('All fields are required');
      return;
    }

    if (signupData.password.length < 8) {
      setSignupError('Password must be at least 8 characters long');
      return;
    }

    if (!validateEmail(signupData.email)) {
      setSignupError('Invalid email format');
      return;
    }

    // Send signup request
    try {
      const response = await axios.post(
        'http://localhost:3000/api/user/signup',
        signupData,
        { withCredentials: true },
      );
      console.log('Signup success:', response.data);
      console.log(response.data);
      Cookies.set('userId', response.data.user.id);
      Cookies.set('userName', response.data.user.name);

      setSignupData({ name: '', email: '', password: '' });

      // Handle success, e.g., redirect or show a success message
    } catch (error) {
      console.log(error);

      setSignupError('Error signing up');
    }
  };

  const handleSigninSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate signin data
    if (!signinData.email || !signinData.password) {
      setSigninError('All fields are required');
      return;
    }

    // Send signin request
    try {
      const response = await axios.post(
        'http://localhost:3000/api/user/signin',
        signinData,
        { withCredentials: true },
      );
      console.log('Signin success:', response.data);
      Cookies.set('userId', response.data.user.id);
      Cookies.set('userName', response.data.user.name);

      setSigninData({ email: '', password: '' });

      // Handle success, e.g., redirect or show a success message
    } catch (error) {
      console.log(error);

      setSigninError('Invalid email or password');
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Sign Up</h2>
      <form onSubmit={handleSignupSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Name:
          </label>
          <input
            type="text"
            name="name"
            value={signupData.name}
            onChange={handleSignupChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Email:
          </label>
          <input
            type="email"
            name="email"
            value={signupData.email}
            onChange={handleSignupChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Password:
          </label>
          <input
            type="password"
            name="password"
            value={signupData.password}
            onChange={handleSignupChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="mb-4">
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Sign Up
          </button>
        </div>
        {signupError && <p className="text-red-500">{signupError}</p>}
      </form>

      <h2 className="text-2xl font-bold mb-4">Sign In</h2>
      <form onSubmit={handleSigninSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Email:
          </label>
          <input
            type="email"
            name="email"
            value={signinData.email}
            onChange={handleSigninChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Password:
          </label>
          <input
            type="password"
            name="password"
            value={signinData.password}
            onChange={handleSigninChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Sign In
          </button>
        </div>
        {signinError && <p className="text-red-500">{signinError}</p>}
      </form>
    </div>
  );
};

export default Signin;
