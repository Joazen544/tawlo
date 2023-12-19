import { useEffect, useState } from 'react';
import Header from '../HeaderElements/Header';
import Cookies from 'js-cookie';
import { Navigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { socket } from '../../socket';
import ProfileSideBar from './ProfileSideBar';

export interface MessageTarget {
  id: string;
  name: string;
  targetId: string;
}

const Profile = () => {
  const [ifOwnProfile, setIfOwnProfile] = useState(false);
  const [relationship, setRelationship] = useState<string | null>('');
  const [messageTarget, setMessageTarget] = useState<MessageTarget | null>(
    null,
  );
  const [userName, setUserName] = useState('');
  const [ifLogOut, setIfLogOut] = useState(false);
  const [userImage, setUserImage] = useState<string>();

  const { userId } = useParams();

  const token = Cookies.get('jwtToken');

  const id = Cookies.get('userId');

  useEffect(() => {
    if (id === userId) {
      setIfOwnProfile(true);
    } else {
      setIfOwnProfile(false);
    }
    axios
      .get(`${import.meta.env.VITE_DOMAIN}/api/user/info?id=${userId}`)
      .then((res) => {
        setUserName(res.data.name);
      });
  }, [userId]);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_DOMAIN}/api/user/relation?id=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setRelationship(res.data.relation);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [userId]);

  const logOut = () => {
    Cookies.remove('userId');
    Cookies.remove('jwtToken');
    Cookies.remove('userName');
    setIfOwnProfile(false);
    setIfLogOut(true);
    if (socket) {
      socket.disconnect();
    }
  };

  const sendInvite = () => {
    axios
      .post(
        `${import.meta.env.VITE_DOMAIN}/api/user/request?id=${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then(() => {
        if (relationship === null) {
          setRelationship('requested');
        } else {
          setRelationship('friends');
        }
      })
      .catch((err) => {
        console.log(err);

        console.log('send invite fail');
      });
  };

  const cancelRequest = () => {
    axios
      .post(
        `${import.meta.env.VITE_DOMAIN}/api/user/request/cancel?id=${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then(() => {
        setRelationship(null);
      })
      .catch((err) => {
        console.log(err);

        console.log('cancel invite fail');
      });
  };

  const sendMessage = () => {
    axios
      .get(`${import.meta.env.VITE_DOMAIN}/api/messageGroup?target=${userId}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      })
      .then(async (res) => {
        let targetId;
        const users = res.data.users as string[];
        users.forEach((user) => {
          if (user && user !== id) {
            targetId = user;
          }
        });
        const nameRes = await axios.get(
          `${import.meta.env.VITE_DOMAIN}/api/user/info?id=${targetId}`,
        );

        if (targetId) {
          setMessageTarget({
            id: res.data.groupId,
            name: nameRes.data.name,
            targetId,
          });
        }
      });
  };

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_DOMAIN}/api/user/info?id=${userId}`)
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
  }, [userId]);

  const handleUserImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const formData = new FormData();
      formData.append('image', file);
      axios
        .post(`${import.meta.env.VITE_DOMAIN}/api/user/image`, formData, {
          headers: {
            authorization: `Bearer ${token}`,
            'content-type': 'multipart/form-data',
          },
        })
        .then((res) => {
          setUserImage(res.data.image);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  return (
    <>
      {userId === 'not-log-in' && (
        <Navigate to={'/user/signin'} replace={true}></Navigate>
      )}
      {!token && <Navigate to={'/user/signin'} replace={true}></Navigate>}
      {ifLogOut && <Navigate to={'/user/signin'} replace={true}></Navigate>}
      <Header target={messageTarget} />
      {ifOwnProfile && (
        <div
          style={{ backgroundColor: import.meta.env.VITE_BACKGROUND_COLOR }}
          className="flex justify-center  min-h-screen pt-40"
        >
          <div style={{ width: '70rem' }} className="flex">
            <ProfileSideBar page="profile" />
            <div>
              <div className="max-w-md h-60 p-4 rounded-lg border-black border-2 bg-white shadow-md flex">
                <div>
                  <h1 className="text-2xl font-bold mb-4">{userName}</h1>
                  <div
                    id="userImage"
                    className={`h-32 w-32 border-2 border-solid border-gray-400 ${
                      !userImage && 'bg-user-image'
                    } bg-contain bg-no-repeat`}
                  >
                    {userImage && (
                      <img
                        style={{ objectFit: 'cover' }}
                        src={userImage}
                        alt="user-image"
                        className="h-full w-full"
                      />
                    )}
                  </div>
                </div>

                <div className="mb-4 flex ml-10">
                  <div id="logOutButton">
                    <button
                      className={
                        'bg-red-500 text-white px-4 py-2 text-xs rounded hover:bg-red-600'
                      }
                      onClick={logOut}
                    >
                      登出
                    </button>
                  </div>
                  <div id="logOutButton" className="ml-10">
                    <label
                      htmlFor="changeImage"
                      className={
                        'bg-gray-400 text-white px-4 py-2 text-xs rounded hover:bg-gray-500 cursor-pointer'
                      }
                    >
                      更換頭貼
                    </label>
                    <input
                      id="changeImage"
                      type="file"
                      style={{ display: 'none' }}
                      accept=".png,.jpeg,.jpg"
                      onChange={handleUserImageChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {!ifOwnProfile && (
        <div
          style={{ backgroundColor: import.meta.env.VITE_BACKGROUND_COLOR }}
          className="flex flex-col items-center pt-40  min-h-screen"
        >
          <div className="max-w-md mx-auto p-4 bg-white shadow-md flex">
            <div>
              <h1 className="text-2xl font-bold mb-4">{userName}</h1>
              <div
                id="userImage"
                className={`h-32 w-32 border-2 border-solid border-gray-400 ${
                  !userImage && 'bg-user-image'
                } bg-contain bg-no-repeat`}
              >
                {userImage && (
                  <img
                    style={{ objectFit: 'cover' }}
                    src={userImage}
                    alt="user-image"
                    className="h-full w-full"
                  />
                )}
              </div>
            </div>
            <div className="mb-4 flex ml-10">
              <div id="friendButton">
                {relationship === 'friends' && (
                  <span className="text-green-500">已是朋友</span>
                )}
                {relationship === null && (
                  <button
                    className={'bg-blue-500 text-white px-4 py-2 rounded'}
                    onClick={sendInvite}
                  >
                    發送邀請
                  </button>
                )}
                {relationship === 'received' && (
                  <button
                    className={'bg-blue-500 text-white px-4 py-2 rounded'}
                    onClick={sendInvite}
                  >
                    接受邀請
                  </button>
                )}
                {relationship === 'requested' && (
                  <button
                    className={'bg-blue-300 text-white px-4 py-2 rounded'}
                    onClick={cancelRequest}
                  >
                    已發送邀請
                  </button>
                )}
              </div>
              <div id="sendMessage" className="ml-10">
                <button
                  className={'bg-blue-500 text-white px-4 py-2 rounded'}
                  onClick={sendMessage}
                >
                  發送訊息
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;
