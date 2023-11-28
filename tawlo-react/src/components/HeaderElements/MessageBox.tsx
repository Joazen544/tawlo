import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

interface Props {
  targetName: string;
  targetId: string;
  groupId: string;
}

interface Message {
  liked: {
    number: number;
    users: string[];
  };
  _id: string;
  group: string;
  from: string;
  content: string;
  time: Date;
  is_removed: boolean;
  read: string[];
}

const MessageBox = ({ targetName, targetId, groupId }: Props) => {
  const user = Cookies.get('userId');
  const token = Cookies.get('jwtToken');

  const [messageInput, setMessageInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (messages.length === 0) {
      axios(`http://localhost:3000/api/messageGroup?group=${groupId}`).then(
        (res) => {
          setMessages(res.data.messages);
        },
      );
    }
  }, []);

  const handleMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setMessageInput(event.target.value);
  };

  const handleMessageSend = () => {
    try {
      axios
        .post(
          `http://localhost:3000/api/message`,
          {
            messageTo: targetId,
            messageGroup: groupId,
            content: messageInput,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              authorization: `Bearer ${token}`,
            },
          },
        )
        .finally(() => {
          console.log('sending message');

          setMessageInput('');
        });
    } catch (err) {
      console.log(err);
      alert('something is wrong' + err);
    }
  };

  return (
    <div
      style={{ width: '20rem', height: '25rem' }}
      className="fixed bottom-0 right-16 border-solid border-2 border-black bg-white"
    >
      <div
        id="infoBar"
        className="w-full h-10 border-b-2 border-solid  border-gray-400 flex items-center"
      >
        <p className="ml-3">{targetName}</p>
      </div>
      <div id="messagesArea" style={{ height: '19rem' }}>
        {messages.length > 0 &&
          messages.map((message) => {
            if (message.from === user) {
              return <p className="mr-0">{message.content}</p>;
            } else {
              return <p className="ml-0">{message.content}</p>;
            }
          })}
      </div>
      <div
        id="inputArea"
        className="h-15 box-content border-t-2 border-solid  border-gray-400 flex pt-1 justify-center items-center"
      >
        <input
          onChange={handleMessageChange}
          value={messageInput}
          type="text"
          className="ml-1 pl-2 w-full h-10 rounded-mdp-2 border border-gray-300 rounded-md"
        />
        <button
          onClick={handleMessageSend}
          className="h-8 px-4 py-2 mr-2 ml-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs"
        >
          send
        </button>
      </div>
    </div>
  );
};

export default MessageBox;
