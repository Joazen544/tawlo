import { useEffect } from 'react';
import { FriendInterface } from './HeaderElements/Header';
import { MessageTarget } from '../Profile';
import { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

interface Props {
  friends: FriendInterface[];
  handleMessageTarget: (messageTarget: MessageTarget) => void;
}

const FriendsTable = ({ friends, handleMessageTarget }: Props) => {
  const [messageTarget, setMessageTarget] = useState<MessageTarget>();

  const token = Cookies.get('jwtToken');

  const id = Cookies.get('userId');

  useEffect(() => {
    if (messageTarget) {
      handleMessageTarget(messageTarget);
    }
  }, [messageTarget]);

  const sendMessage = (target: string) => {
    axios
      .get(`${import.meta.env.VITE_DOMAIN}/api/messageGroup?target=${target}`, {
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

  return (
    <div
      id="sideBar"
      style={{ height: '20rem' }}
      className="flex-shrink-0 fixed left-0 top-96 w-48 p-4 bg-gray-200 rounded-3xl flex flex-col items-center"
    >
      <div>好友上線</div>
      <div className="overflow-y-auto">
        {friends &&
          friends.map((friend) => (
            <div
              className="flex items-center mt-2 cursor-pointer"
              onClick={() => sendMessage(friend.id)}
            >
              {friend.image ? (
                <img
                  className={'w-10 h-10 block rounded-full'}
                  src={friend.image}
                  alt="用戶照片"
                />
              ) : (
                <div className="w-10 h-10 bg-user-image bg-contain bg-no-repeat"></div>
              )}

              <div className="ml-2">{friend.name}</div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default FriendsTable;
