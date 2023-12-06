import { useEffect, useState, useRef } from 'react';
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
  const [unreadNum, setUnreadNum] = useState(0);
  const [messageFromOthers, setMessageFromOthers] = useState(0);
  // const [messageFromMyself, setMessageFromMyself] = useState(0);

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
    axios
      .get(`${import.meta.env.VITE_DOMAIN}/api/messageGroups`, {
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setMessagesGroup(res.data.messageGroups);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const token = Cookies.get('jwtToken');
  const user = Cookies.get('userId');

  const dropdownRef = useRef<HTMLButtonElement | null>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      event.target instanceof Node &&
      !dropdownRef.current.contains(event.target)
    ) {
      // 點擊的位置在 dropdown 之外
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    // 添加全域點擊事件監聽器
    document.addEventListener('click', handleClickOutside);
    return () => {
      // 移除全域點擊事件監聽器
      document.removeEventListener('click', handleClickOutside);
    };
  }, []); // 空的依賴陣列表示只在 component 被建立時設定一次

  useEffect(() => {
    if (messagesGroup.length === 0) {
      axios
        .get(`${import.meta.env.VITE_DOMAIN}/api/messageGroups`, {
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setMessagesGroup(res.data.messageGroups);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, []);

  useEffect(() => {
    if (messagesGroup.length > 0) {
      setUnreadNum(0);
      messagesGroup.forEach((messageGroup: MessageGroup) => {
        if (messageGroup.unread > 0 && messageGroup.last_sender !== user) {
          setUnreadNum((pre) => pre + messageGroup.unread);
        }
      });
    }
  }, [messagesGroup]);

  useEffect(() => {
    // console.log('getting socket from drop down box');

    //const socket = getSocket();
    // console.log('socket is: ' + socket?.connected);

    if (socket)
      socket.on('message', () => {
        axios
          .get(`${import.meta.env.VITE_DOMAIN}/api/messageGroups`, {
            headers: {
              'Content-Type': 'application/json',
              authorization: `Bearer ${token}`,
            },
          })
          .then((res) => {
            setMessagesGroup(res.data.messageGroups);
            setMessageFromOthers((pre) => pre + 1);

            if (ifChatBoxOpen) {
              setUnreadNum(0);

              messagesGroup.forEach((messageGroup: MessageGroup) => {
                if (messageGroup._id !== chatGroupId) {
                  if (
                    messageGroup.unread > 0 &&
                    messageGroup.last_sender !== user
                  ) {
                    setUnreadNum((pre) => pre + messageGroup.unread);
                  }
                }
              });
            }
          })
          .catch((err) => {
            console.log(err);
          });
      });

    return () => {
      if (socket) socket.off('message');
    };
  }, [messagesGroup, ifChatBoxOpen, messageFromOthers]);

  useEffect(() => {
    // console.log('getting socket from drop down box');

    //const socket = getSocket();
    // console.log('socket is: ' + socket?.connected);

    if (socket)
      socket.on('myself', () => {
        axios
          .get(`${import.meta.env.VITE_DOMAIN}/api/messageGroups`, {
            headers: {
              'Content-Type': 'application/json',
              authorization: `Bearer ${token}`,
            },
          })
          .then((res) => {
            setMessagesGroup(res.data.messageGroups);
            // setMessageFromMyself(messageFromMyself + 1);
          })
          .catch((err) => {
            console.log(err);
          });
      });
    return () => {
      if (socket) socket.off('myself');
    };
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
        .get(
          `${import.meta.env.VITE_DOMAIN}/api/user/name?id=${message.users[0]}`,
        )
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
    } else {
      setUnreadNum(0);
      messagesGroup.forEach((messageGroup: MessageGroup) => {
        if (messageGroup._id !== id) {
          if (messageGroup.unread > 0 && messageGroup.last_sender !== user) {
            setUnreadNum((pre) => pre + messageGroup.unread);
          }
        }
      });
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
          ref={dropdownRef}
          onClick={toggleDropdown}
          className="w-8 h-8 bg-message-image bg-contain cursor-pointer"
        >
          <div className="ml-4 mt-3 rounded-full bg-red-100 text-center">
            {unreadNum}
          </div>
        </button>
        {isDropdownOpen && messagesGroup.length > 0 && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-md">
            <ul>
              {messagesGroup.map((message, index) => {
                return (
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
                );
              })}
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
          //handleReadMessage={(groupId: string) => cleanReadMessages(groupId)}
        />
      )}
    </>
  );
};

export default MessageDropdown;
