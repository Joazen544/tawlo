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
      className="w-60 mr-16 rounded-lg bg-white border-solid border-2 border-black h-96"
    >
      <div
        style={{ backgroundColor: import.meta.env.VITE_THIRD_COLOR }}
        className={`ml-3 pl-3 w-28 rounded-lg mt-6 border-solid ${
          page !== 'profile' && 'border-white'
        } border-l-8 ${page === 'profile' && 'border-gray-500'}`}
      >
        <Link to={`/user/profile/${id}`} className="text-lg">
          個人檔案
        </Link>
      </div>
      <div
        style={{ backgroundColor: import.meta.env.VITE_THIRD_COLOR }}
        className={`ml-3 pl-3 w-28 rounded-lg mt-6 border-solid ${
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
