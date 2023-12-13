import { useEffect, useState } from 'react';
import Header from './components/HeaderElements/Header';
import Cookies from 'js-cookie';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import ProfileSideBar from './ProfileSideBar';
import axios from 'axios';

interface FriendInfo {
  id: string;
  name: string;
  image: string;
}

const Friends = () => {
  const { userId } = useParams();
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [requestedFriends, setRequestedFriends] = useState<FriendInfo[]>([]);
  const [receiveFriends, setReceiveFriends] = useState<FriendInfo[]>([]);
  const [ifFetchFriends, setIfFetchFriends] = useState<boolean>(false);

  const token = Cookies.get('jwtToken');
  const navigate = useNavigate();

  const getInfo = async (user: string) => {
    const res = await axios.get(
      `${import.meta.env.VITE_DOMAIN}/api/user/info?id=${user}`,
    );

    return res.data;
  };

  const getUsersInfo = async () => {
    const requestedUserInfoArray = [...requestedFriends];
    for (let i = 0; i < requestedFriends.length; i++) {
      const userInfo = await getInfo(requestedFriends[i].id);

      requestedUserInfoArray[i].name = userInfo.name;
      requestedUserInfoArray[i].image = userInfo.image;
    }
    setRequestedFriends([...requestedUserInfoArray]);

    const friendUserInfoArray = [...friends];
    for (let i = 0; i < friends.length; i++) {
      const userInfo = await getInfo(friends[i].id);

      friendUserInfoArray[i].name = userInfo.name;
      friendUserInfoArray[i].image = userInfo.image;
    }
    setFriends([...friendUserInfoArray]);

    const receiveUserInfoArray = [...receiveFriends];
    for (let i = 0; i < receiveFriends.length; i++) {
      const userInfo = await getInfo(receiveFriends[i].id);

      receiveUserInfoArray[i].name = userInfo.name;
      receiveUserInfoArray[i].image = userInfo.image;
    }
    setReceiveFriends([...receiveUserInfoArray]);
  };

  //   useEffect(() => {
  //     axios
  //       .get(`${import.meta.env.VITE_DOMAIN}/api/user/friends`, {
  //         headers: {
  //           authorization: `Bearer ${token}`,
  //         },
  //       })
  //       .then((res) => {
  //         const friends = res.data.map((friendId: string) => {
  //           return { id: friendId, name: '', image: '' };
  //         });
  //         setFriends(friends);
  //       })
  //       .catch((err) => {
  //         console.log(err);
  //       });
  //   }, [userId]);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_DOMAIN}/api/user/friends/all`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        const friends = res.data.friend.map((friendId: string) => {
          return { id: friendId, name: '', image: '' };
        });
        const requestedFriends = res.data.requested.map((friendId: string) => {
          return { id: friendId, name: '', image: '' };
        });
        const receiveFriends = res.data.receive.map((friendId: string) => {
          return { id: friendId, name: '', image: '' };
        });
        setFriends(friends);
        setRequestedFriends(requestedFriends);
        setReceiveFriends(receiveFriends);
        setIfFetchFriends(!ifFetchFriends);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [userId]);

  useEffect(() => {
    if (ifFetchFriends === true) {
      getUsersInfo();
    }
  }, [ifFetchFriends]);

  const cancelRequest = (userId: string) => {
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
        const userArray = requestedFriends.filter((user) => user.id !== userId);

        setRequestedFriends([...userArray]);
      })
      .catch((err) => {
        console.log(err);

        console.log('cancel invite fail');
      });
  };

  const acceptRequest = (userId: string) => {
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
        const userArray = receiveFriends.filter((user) => user.id !== userId);

        setReceiveFriends([...userArray]);
      })
      .catch((err) => {
        console.log(err);

        console.log('cancel invite fail');
      });
  };

  const refuseRequest = (userId: string) => {
    axios
      .post(
        `${import.meta.env.VITE_DOMAIN}/api/user/request/refuse?id=${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then(() => {
        const userArray = receiveFriends.filter((user) => user.id !== userId);

        setReceiveFriends([...userArray]);
      })
      .catch((err) => {
        console.log(err);

        console.log('cancel invite fail');
      });
  };

  const handleNavigate = (user: string) => {
    navigate(`/user/profile/${user}`);
  };

  return (
    <div className="h-screen bg-gray-50">
      {!token && <Navigate to={'/user/signin'} replace={true}></Navigate>}
      <Header />
      <div className="flex justify-center  pt-40">
        <div style={{ width: '70rem', minHeight: '50rem' }} className="flex">
          <ProfileSideBar page="friends" />
          <div
            id="friends_list"
            style={{ width: '50rem' }}
            className="bg-white"
          >
            {requestedFriends.length > 0 && (
              <div className="pl-10 pt-10">
                <h1 className="text-lg">已發送邀請</h1>
                <div className="flex flex-wrap mt-4">
                  {requestedFriends.map((friendInfo, index) => (
                    <div
                      key={friendInfo.id}
                      className="w-48 h-48 border-solid border-2 border-gray-200 m-2 flex flex-col items-center"
                    >
                      <div
                        className="pt-2 cursor-pointer flex flex-col items-center"
                        onClick={() => handleNavigate(friendInfo.id)}
                      >
                        <div className="pt-2">
                          {!requestedFriends[index].image && (
                            <div className="bg-user-image h-20 w-20 bg-contain bg-no-repeat"></div>
                          )}
                          {requestedFriends[index].image && (
                            <img
                              src={requestedFriends[index].image}
                              alt="user image"
                              className="h-20 w-20"
                            />
                          )}
                        </div>
                        <div className="mt-2">
                          {requestedFriends[index].name}
                        </div>
                      </div>
                      <div className="mt-3">
                        <button
                          className={
                            'bg-red-400 hover:bg-red-500 text-white px-4 py-2 rounded'
                          }
                          id="sentRequest"
                          onClick={() => cancelRequest(friendInfo.id)}
                        >
                          取消邀請
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {receiveFriends.length > 0 && (
              <div className="pl-10 pt-10">
                <h1 className="text-lg">發送邀請給你</h1>
                <div className="flex flex-wrap mt-4">
                  {receiveFriends.map((friendInfo, index) => (
                    <div
                      key={friendInfo.id}
                      className="w-48 h-48 border-solid border-2 border-gray-200 m-2 flex flex-col items-center"
                    >
                      <div
                        className="pt-2 cursor-pointer flex flex-col items-center"
                        onClick={() => handleNavigate(friendInfo.id)}
                      >
                        <div className="pt-2">
                          {!receiveFriends[index].image && (
                            <div className="bg-user-image h-20 w-20 bg-contain bg-no-repeat"></div>
                          )}
                          {receiveFriends[index].image && (
                            <img
                              src={receiveFriends[index].image}
                              alt="user image"
                              className="h-20 w-20"
                            />
                          )}
                        </div>
                        <div className="mt-2">{receiveFriends[index].name}</div>
                      </div>

                      <div className="mt-3">
                        <button
                          className={
                            'bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded'
                          }
                          id="sentRequest"
                          onClick={() => acceptRequest(friendInfo.id)}
                        >
                          接受
                        </button>
                        <button
                          className={
                            'bg-red-400 hover:bg-red-500 text-white px-4 py-2 rounded ml-2'
                          }
                          id="sentRequest"
                          onClick={() => refuseRequest(friendInfo.id)}
                        >
                          拒絕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="pl-10 pt-10">
              <h1 className="text-lg">朋友清單</h1>
              <div className="flex flex-wrap mt-4">
                {friends.map((friendInfo, index) => (
                  <div
                    key={friendInfo.id}
                    className="w-48 h-48 cursor-pointer border-solid border-2 border-gray-200 m-2 flex flex-col items-center"
                    onClick={() => handleNavigate(friendInfo.id)}
                  >
                    <div className="pt-2">
                      {!friends[index].image && (
                        <div className="mt-3 bg-user-image h-20 w-20 bg-contain bg-no-repeat"></div>
                      )}
                      {friends[index].image && (
                        <img
                          src={friends[index].image}
                          alt="user image"
                          className="h-20 w-20 mt-3"
                        />
                      )}
                    </div>
                    <div className="mt-2">{friends[index].name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Friends;
