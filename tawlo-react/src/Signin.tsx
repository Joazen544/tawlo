import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
//import Header from './components/HeaderElements/Header';
import { Navigate } from 'react-router-dom';
//import { Navigate } from 'react-router-dom';
import { initSocket } from './socket';
import loading from './assets/loading.gif';

const Signin = () => {
  const [ifSignIn, setIfSignIn] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>();
  const [uploadImage, setUploadImage] = useState<File>();
  const [isFetching, setIsFetching] = useState(false);

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

  useEffect(() => {
    const userId = Cookies.get('userId');
    if (userId) {
      setIfSignIn(true);
    } else {
      setIfSignIn(false);
    }
  }, []);

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

    const formData = new FormData();

    formData.append('name', signupData.name);
    formData.append('email', signupData.email);
    formData.append('password', signupData.password);
    if (uploadImage) {
      formData.append('image', uploadImage);
    }

    axios
      .post(`${import.meta.env.VITE_DOMAIN}/api/user/signup`, formData, {
        headers: { 'content-type': 'multipart/form-data' },
        withCredentials: true,
      })
      .then((response) => {
        // console.log('Signup success:', response.data);
        // console.log(response.data);
        Cookies.set('userId', response.data.user.id);
        Cookies.set('userName', response.data.user.name);
        setIfSignIn(!ifSignIn);
        initSocket();
      })
      .catch((err) => {
        console.log(err);

        setSignupError('Error signing up');
      })
      .finally(() => {
        setSignupData({
          name: '',
          email: '',
          password: '',
        });
      });

    // Handle success, e.g., redirect or show a success message
  };

  const handleSigninSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate signin data
    if (!signinData.email || !signinData.password) {
      setSigninError('All fields are required');
      return;
    }

    // Send signin request
    await axios
      .post(`${import.meta.env.VITE_DOMAIN}/api/user/signin`, signinData, {
        withCredentials: true,
      })
      .then((response) => {
        // console.log('Signin success:', response.data);
        Cookies.set('userId', response.data.user.id);
        Cookies.set('userName', response.data.user.name);
        setIfSignIn(!ifSignIn);
        initSocket();
      })
      .catch((err) => {
        console.log(err);

        setSigninError('Invalid email or password');
      })
      .finally(() => {
        setSigninData({ email: '', password: '' });
      });

    // Handle success, e.g., redirect or show a success message
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleUserImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      console.log(file);

      setUploadImage(file);

      const fileReader = new FileReader();
      fileReader.addEventListener('load', () => {
        if (fileReader.result) {
          setPreviewImage(fileReader.result.toString());
        }
      });
      fileReader.readAsDataURL(file);
    }
  };

  const fetchDogApi = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    try {
      setIsFetching(true);
      const res = await axios.get('https://dog.ceo/api/breeds/image/random');
      if (res.data.status === 'success') {
        setPreviewImage(res.data.message);
        setIsFetching(false);

        fetch(res.data.message).then(async (response) => {
          // const contentType = response.headers.get('content-type');
          const blob = await response.blob();
          const file = new File([blob], 'userImage', { type: 'image/jpg' });
          // access file here
          setUploadImage(file);
        });

        // const file = {
        //   uri: res.data.message,
        //   name: 'image',
        //   type: 'image/jpg', // if you can get image type from cropping replace here
        // } as File;
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      {ifSignIn && <Navigate to="/" replace={true}></Navigate>}
      {/* <Header /> */}
      <div className="max-w-3xl mx-auto mt-8">
        <h2 className="text-2xl font-bold mb-4">註冊</h2>
        <form onSubmit={handleSignupSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              姓名:
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
              密碼（至少 8 個字）:
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
            <label className="block text-sm font-medium text-gray-700">
              個人照片:
            </label>
            <div className="flex">
              <div className="flex flex-col">
                <label
                  htmlFor="image"
                  className="mt-2 px-3 py-2 border rounded-md cursor-pointer text-sm w-28"
                >
                  自己上傳頭貼
                </label>
                <input
                  id="image"
                  type="file"
                  style={{ display: 'none' }}
                  accept=".png,.jpeg,.jpg"
                  name="image"
                  onChange={handleUserImageChange}
                  className="w-48 px-3 py-2 border rounded-md"
                />
                <button
                  onClick={fetchDogApi}
                  className="mt-2 px-3 py-2 border rounded-md cursor-pointer text-sm w-28"
                >
                  生成狗狗頭貼
                </button>
              </div>
              <div className="ml-10 h-32 w-32">
                {previewImage && isFetching ? (
                  <img
                    style={{ objectFit: 'cover' }}
                    src={loading}
                    alt="loading-image"
                    className="h-32 w-32"
                  />
                ) : (
                  <img
                    style={{ objectFit: 'cover' }}
                    src={previewImage}
                    alt="preview-image"
                    className="h-32 w-32"
                  />
                )}
              </div>
            </div>
          </div>
          <div className="mb-4">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              註冊
            </button>
          </div>
          {signupError && <p className="text-red-500">{signupError}</p>}
        </form>

        <h2 className="text-2xl font-bold mb-4">登入</h2>
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
              密碼:
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
              登入
            </button>
          </div>
          {signinError && <p className="text-red-500">{signinError}</p>}
        </form>
      </div>
    </>
  );
};

export default Signin;
