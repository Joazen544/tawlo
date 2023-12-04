import { useEffect, useState } from 'react';
import Header from './components/HeaderElements/Header';
import Cookies from 'js-cookie';
import { Navigate, useParams } from 'react-router-dom';
import axios from 'axios';

interface MessageTarget {
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
      .get(`http://localhost:3000/api/user/name?id=${userId}`)
      .then((res) => {
        setUserName(res.data.name);
      });
  }, [userId]);

  useEffect(() => {
    axios
      .get(`http://localhost:3000/api/user/relation?id=${userId}`, {
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
  }, []);

  const logOut = () => {
    Cookies.remove('userId');
    Cookies.remove('jwtToken');
    Cookies.remove('userName');
    setIfOwnProfile(false);
  };

  const sendInvite = () => {
    axios
      .post(
        `http://localhost:3000/api/user/request?id=${userId}`,
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
        `http://localhost:3000/api/user/cancelRequest?id=${userId}`,
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
      .get(`http://localhost:3000/api/messageGroup?target=${userId}`, {
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
          `http://localhost:3000/api/user/name?id=${targetId}`,
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

  return (
    <>
      {userId === 'not-log-in' && (
        <Navigate to={'/user/signin'} replace={true}></Navigate>
      )}
      <Header target={messageTarget} />
      {ifOwnProfile && (
        <div>
          <button onClick={logOut}>Log out</button>
        </div>
      )}
      {!ifOwnProfile && (
        <div className="max-w-md mx-auto mt-8 p-4 bg-white shadow-md">
          <h1 className="text-2xl font-bold mb-4">{userName}</h1>
          <div className="mb-4 flex">
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
      )}
    </>
  );
};

export default Profile;
