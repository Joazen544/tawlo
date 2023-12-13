import React from 'react';
import Cookies from 'js-cookie';
import { Link } from 'react-router-dom';

interface Props {
  page: string;
}

const ProfileSideBar = ({ page }: Props) => {
  const id = Cookies.get('userId');
  return (
    <div
      id="profile_side_bar"
      className="w-60 mr-16 bg-white border-solid border-2 border-black h-96"
    >
      <div
        className={`ml-3 pl-3 mt-6 border-solid ${
          page !== 'profile' && 'border-white'
        } border-l-8 ${page === 'profile' && 'border-gray-500'}`}
      >
        <Link to={`/user/profile/${id}`} className="text-lg">
          個人檔案
        </Link>
      </div>
      <div
        className={`ml-3 pl-3 mt-6 border-solid ${
          page !== 'friends' && 'border-white'
        } border-l-8 ${page === 'friends' && 'border-gray-500'}`}
      >
        <Link to={`/user/profile/${id}/friends`} className="text-lg">
          朋友
        </Link>
      </div>
    </div>
  );
};

export default ProfileSideBar;
