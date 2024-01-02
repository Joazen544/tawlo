import Notification from './Notification';
import { Link } from 'react-router-dom';
import MessageDropdown from './MessageDropDown';
import SearchBar from './SearchBar';
import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { SearchResultInterface } from './SearchBar';
import { socket } from '../../socket';

export interface FriendInterface {
  id: string;
  name: string;
  image: string;
}

interface Props {
  target?: { id: string; name: string; targetId: string } | null;
  handleSearch?: (searchResult: SearchResultInterface) => void;
  handleFriends?: (friends: FriendInterface[]) => void;
}

const Header = ({ target, handleSearch, handleFriends }: Props) => {
  const [userImage, setUserImage] = useState<string>('');
  const [onlineFriends, setOnlineFriends] = useState<FriendInterface[]>([]);
  const [ifNewFriend, setIfNewFriend] = useState<number>(0);
  const [ifFriendOffline, setIfFriendOffline] = useState<number>(0);

  const id = Cookies.get('userId');

  useEffect(() => {
    if (socket) {
      socket.on('friends', async (usersArray: string[]) => {
        // console.log('friends');
        // console.log(usersArray);

        const friendsArray: FriendInterface[] = [];
        for (let i = 0; i < usersArray.length; i++) {
          const userInfoRes = await axios.get(
            `${import.meta.env.VITE_DOMAIN}/api/user/info?id=${usersArray[i]}`,
          );
          friendsArray[i] = {
            id: usersArray[i],
            image: userInfoRes.data.image,
            name: userInfoRes.data.name,
          };
        }
        setOnlineFriends(friendsArray);
      });
    }

    return () => {
      if (socket) socket.off('friends');
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('friend-online', async (user) => {
        const userInfoRes = await axios.get(
          `${import.meta.env.VITE_DOMAIN}/api/user/info?id=${user}`,
        );

        setOnlineFriends((pre) => [
          ...pre,
          {
            id: user,
            image: userInfoRes.data.image,
            name: userInfoRes.data.name,
          },
        ]);
        setIfNewFriend((pre) => pre + 1);
      });
    }

    return () => {
      if (socket) socket.off('friend-online');
    };
  }, [ifNewFriend]);

  useEffect(() => {
    if (socket) {
      socket.on('friend-offline', (message) => {
        // const newArray = onlineFriends.filter((el) => el.id !== message);
        // console.log('newArray: ' + newArray);

        // console.log('friend offline: ' + message);

        setOnlineFriends((pre) => pre.filter((el) => el.id !== message));
        setIfFriendOffline((pre) => pre + 1);
      });
    }

    return () => {
      if (socket) socket.off('friend-offline');
    };
  }, [ifFriendOffline]);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_DOMAIN}/api/user/info?id=${id}`)
      .then((res) => {
        if (res.data.image) {
          setUserImage(res.data.image);
        } else {
          setUserImage('');
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  useEffect(() => {
    if (handleFriends) {
      handleFriends(onlineFriends);
    }
  }, [onlineFriends]);

  return (
    <>
      <div
        id="container"
        style={{
          boxShadow: '0 2px 3px -3px gray',
          backgroundColor: import.meta.env.VITE_MAIN_COLOR,
        }}
        className="top-0 fixed pr-3 z-20 w-full h-14 items-center bg-white flex justify-between"
      >
        <div id="left_part_header" className="w-96 h-12 flex items-center">
          <div id="logo" className="flex items-center ml-2">
            <Link
              to="/"
              style={{
                color: import.meta.env.VITE_MAIN_STRING_COLOR,
              }}
              className="text-2xl h-8"
            >
              TAWLO
            </Link>
          </div>
          <SearchBar
            handleSearchResult={(searchResult) => {
              if (handleSearch) handleSearch(searchResult);
            }}
          />
          <div
            id="meet"
            style={{ borderColor: import.meta.env.VITE_MAIN_STRING_COLOR }}
            className="h-8 p-2 rounded-lg flex items-center ml-10 border-solid border-2 border-gray-500 hover:bg-gray-500 hover:text-white"
          >
            <Link
              style={{ color: import.meta.env.VITE_MAIN_STRING_COLOR }}
              to="/meeting"
              className="text-xl h-8 w-28 flex items-center justify-center"
            >
              <p>認識新朋友</p>
            </Link>
          </div>
        </div>
        <div
          id="right_part_container"
          className=" w-36 h-12 flex items-center justify-around"
        >
          <MessageDropdown messageTarget={target} />
          <Notification />
          <Link
            to={`/user/profile/${Cookies.get('userId') || 'not-log-in'}`}
            className={`w-9 h-9 ${
              !userImage && 'bg-user-image'
            } bg-contain bg-no-repeat`}
          >
            {userImage && (
              <img
                style={{ objectFit: 'cover', borderWidth: '3px' }}
                src={userImage}
                alt="user-image"
                className="h-9 w-9 rounded-full border-white border-solid"
              />
            )}
          </Link>
        </div>
      </div>
    </>
  );
};

export default Header;
