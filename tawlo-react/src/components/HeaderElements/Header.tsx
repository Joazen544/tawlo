import { useState } from 'react';
import Notification from './Notification';
import { Link } from 'react-router-dom';
import MessageDropdown from './MessageDropDown';
import Cookies from 'js-cookie';

interface Props {
  target?: { id: string; name: string; targetId: string } | null;
}

const Header = ({ target }: Props) => {
  const [notification] = useState(0);

  return (
    <>
      <div
        id="container"
        className="w-full h-12 bg-gray-200 flex justify-between"
      >
        <div id="left_part_header" className="w-96 h-12 flex items-center">
          <div id="logo" className="flex items-center ml-2">
            <Link to="/" className="text-2xl h-8">
              TAWLO
            </Link>
          </div>
          <div id="search_bar" className="ml-3 flex items-center">
            <input
              type="text"
              style={{
                backgroundSize: '1.5rem',
                backgroundOrigin: 'content-box',
                paddingRight: '5px',
              }}
              className="w-52 h-9 border-solid border-slate-300 border-2 rounded-2xl bg-search-image bg-no-repeat bg-right bg-contain pl-3"
            />
          </div>
          <div
            id="meet"
            className="h-8 p-2 rounded-lg flex items-center ml-10 border-solid border-2 border-gray-500 hover:bg-gray-500 hover:text-white"
          >
            <Link to="/meeting" className="text-xl h-8">
              Meet
            </Link>
          </div>
        </div>
        <div
          id="right_part_container"
          className="w-32 h-12 flex items-center justify-around"
        >
          <MessageDropdown messageTarget={target} />
          <Notification notificationNumber={notification} />
          <Link
            to={`/user/profile/${Cookies.get('userId') || 'not-log-in'}`}
            className="w-8 h-8 bg-user-image bg-contain bg-no-repeat"
          ></Link>
        </div>
      </div>
    </>
  );
};

export default Header;
