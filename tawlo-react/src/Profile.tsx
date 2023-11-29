import React, { useEffect, useState } from 'react';
import Header from './components/HeaderElements/Header';
import Cookies from 'js-cookie';
import { Navigate } from 'react-router-dom';

const Profile = () => {
  //const [userName, setUserName] = useState<string | undefined>('');
  const [ifSignin, setIfSignin] = useState(true);
  useEffect(() => {
    const id = Cookies.get('userId');
    if (!id) {
      setIfSignin(false);
    } else {
      setIfSignin(true);
    }
  }, []);

  const logOut = () => {
    Cookies.remove('userId');
    Cookies.remove('jwtToken');
    Cookies.remove('userName');
    setIfSignin(false);
  };

  return (
    <>
      {!ifSignin && <Navigate to={'/user/signin'} replace={true}></Navigate>}
      <Header />
      <div>
        <button onClick={logOut}>Log out</button>
      </div>
    </>
  );
};

export default Profile;
