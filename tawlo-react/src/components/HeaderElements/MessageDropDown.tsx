import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

interface MessageGroup {
  _id: string;
  users: string[];
  category: string;
  start_time: Date;
  update_time: Date;
  last_message: string;
}

const MessageDropdown = () => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [messages, setMessages] = useState<MessageGroup[]>([]);
  const [messagesName, setMessagesName] = useState<string[]>([]);

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  const token = Cookies.get('jwtToken');

  // Dummy message data, replace it with actual messages
  useEffect(() => {
    if (messages.length === 0) {
      axios
        .get('http://localhost:3000/api/messageGroups', {
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setMessages(res.data.messageGroups);
          console.log('weeee');
          console.log(res.data.messageGroups);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, []);

  useEffect(() => {
    const nameArray: string[] = [];
    messages.forEach((message, index) => {
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
  }, [messages]);

  return (
    <div className="relative inline-block">
      <button
        onClick={toggleDropdown}
        className="w-8 h-8 bg-message-image bg-contain cursor-pointer"
      ></button>
      {isDropdownOpen && messages.length > 0 && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-md">
          <ul>
            {messages.map((message, index) => (
              <li
                key={message._id}
                className="p-2 hover:bg-gray-100 cursor-pointer"
              >
                <div className="flex items-center space-x-2 justify-left">
                  <span className="font-bold">{messagesName[index]}</span>
                  <span className="text-gray-500 text-sm">
                    {new Date(message.update_time).toLocaleTimeString()}
                  </span>
                </div>
                <p>{message.last_message}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {isDropdownOpen && messages.length === 0 && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-md">
          <p className="text-center">No messages</p>
        </div>
      )}
    </div>
  );
};

export default MessageDropdown;
