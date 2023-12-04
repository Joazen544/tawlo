import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import MessageBox from './MessageBox';
import { socket } from '../../socket';

export interface MessageGroup {
  _id: string;
  users: string[];
  category: string;
  start_time: Date;
  update_time: Date;
  last_message: string;
  last_sender: string;
  unread: number;
}

interface Props {
  messageTarget?: { id: string; name: string; targetId: string } | null;
}

const MessageDropdown = ({ messageTarget }: Props) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [messagesGroup, setMessagesGroup] = useState<MessageGroup[]>([]);
  const [messagesName, setMessagesName] = useState<string[]>([]);
  const [ifChatBoxOpen, setIfChatBoxOpen] = useState(false);
  const [chatGroupId, setChatGroupId] = useState<string>('');
  const [chatName, setChatName] = useState('');
  const [messageTargetId, setMessageTargetId] = useState<string>('');

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  const token = Cookies.get('jwtToken');
  const user = Cookies.get('userId');

  useEffect(() => {
    if (messagesGroup.length === 0) {
      axios
        .get('http://localhost:3000/api/messageGroups', {
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setMessagesGroup(res.data.messageGroups);
          console.log('weeee');
          //console.log(res.data.messageGroups);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, []);

  useEffect(() => {
    socket.on('message', (data) => {
      console.log('a');
      console.log(data);

      axios
        .get('http://localhost:3000/api/messageGroups', {
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setMessagesGroup(res.data.messageGroups);
          //console.log(res.data.messageGroups);
        })
        .catch((err) => {
          console.log(err);
        });
    });

    socket.on('myself', (data) => {
      console.log('b');
      console.log(data);

      axios
        .get('http://localhost:3000/api/messageGroups', {
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setMessagesGroup(res.data.messageGroups);
          //console.log(res.data.messageGroups);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }, []);

  useEffect(() => {
    if (messageTarget) {
      openChatGroup(
        messageTarget.id,
        messageTarget.name,
        messageTarget.targetId,
      );
    }
  }, [messageTarget]);

  useEffect(() => {
    const nameArray: string[] = [];
    messagesGroup.forEach((message, index) => {
      axios
        .get(`http://localhost:3000/api/user/name?id=${message.users[0]}`)
        .then((res) => {
          const userName = res.data.name as string;
          nameArray[index] = userName;
          setMessagesName([...nameArray]);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }, [messagesGroup]);

  const openChatGroup = (id: string, name: string, targetId: string) => {
    if (ifChatBoxOpen) {
      closeChatGroup();
      console.log('123');
    }

    setIfChatBoxOpen(true);
    setChatGroupId(id);
    setChatName(name);
    setMessageTargetId(targetId);
  };

  const closeChatGroup = () => {
    setIfChatBoxOpen(false);
    setChatGroupId('');
    setChatName('');
    setMessageTargetId('');
  };

  return (
    <>
      <div className="relative inline-block">
        <button
          onClick={toggleDropdown}
          className="w-8 h-8 bg-message-image bg-contain cursor-pointer"
        ></button>
        {isDropdownOpen && messagesGroup.length > 0 && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-md">
            <ul>
              {messagesGroup.map((message, index) => (
                <li
                  key={message._id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() =>
                    openChatGroup(
                      message._id,
                      messagesName[index],
                      message.users[0],
                    )
                  }
                >
                  <div className="flex items-center w-full justify-left">
                    <span className="font-bold mr-2">
                      {messagesName[index]}
                    </span>
                    <span className="text-gray-500 text-sm mr-2">
                      {new Date(message.update_time).toLocaleTimeString()}
                    </span>
                    {message.last_sender !== user ? (
                      message.unread > 0 && (
                        <span className="ml-3">{message.unread}</span>
                      )
                    ) : (
                      <></>
                    )}
                  </div>
                  <p>{message.last_message}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {isDropdownOpen && messagesGroup.length === 0 && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-md">
            <p className="text-center">No messages</p>
          </div>
        )}
      </div>
      {ifChatBoxOpen && (
        <MessageBox
          targetName={chatName}
          targetId={messageTargetId}
          groupId={chatGroupId}
          closeBox={() => closeChatGroup()}
        />
      )}
    </>
  );
};

export default MessageDropdown;
