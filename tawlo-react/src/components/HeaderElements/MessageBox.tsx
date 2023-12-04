import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { socket } from '../../socket';

interface Props {
  targetName: string;
  targetId: string;
  groupId: string;
  closeBox: () => void;
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

const MessageBox = ({ targetName, targetId, groupId, closeBox }: Props) => {
  const user = Cookies.get('userId');
  const token = Cookies.get('jwtToken');

  const [messageInput, setMessageInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [ifBoxShow, setIfBoxShow] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [ifNewMessage, setIfNewMessage] = useState(0);

  useEffect(() => {
    axios
      .get(`http://localhost:3000/api/messageGroup?group=${groupId}`, {
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setMessages(res.data.messages);
        setIfNewMessage(ifNewMessage + 1);
      });
  }, [targetName, targetId, groupId]);

  useEffect(() => {
    console.log('receiving message');

    socket.on('myself', (data) => {
      //console.log(data);
      console.log('1');

      if (data.group === groupId && user) {
        const newMessage: Message = {
          liked: {
            number: 0,
            users: [],
          },
          _id: '',
          group: groupId,
          from: user,
          content: data.message,
          time: new Date(),
          is_removed: false,
          read: [],
        };
        updateMessage(newMessage);
      }
    });

    socket.on('message', (data) => {
      //console.log(data);
      console.log('2');

      if (data.group === groupId && user) {
        const newMessage: Message = {
          liked: {
            number: 0,
            users: [],
          },
          _id: '',
          group: groupId,
          from: data.from,
          content: data.message,
          time: new Date(),
          is_removed: false,
          read: [],
        };
        axios
          .post(
            `http://localhost:3000/api/messageGroup/read`,
            {
              messageGroupId: groupId,
            },
            {
              headers: {
                'Content-Type': 'application/json',
                authorization: `Bearer ${token}`,
              },
            },
          )
          .catch((err) => {
            console.log(err);
          })
          .finally(() => {
            updateMessage(newMessage);
          });
      }
    });
  }, [messages]);

  const handleBoxShow = () => {
    setIfBoxShow(!ifBoxShow);
  };

  const updateMessage = (newMessage: Message) => {
    const array = [...messages];
    setIfNewMessage(ifNewMessage + 1);

    setMessages(array.concat(newMessage));
    console.log('updating messages');
  };

  const handleMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setMessageInput(event.target.value);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    // 'keypress' event misbehaves on mobile so we track 'Enter' key via 'keydown' event
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      handleMessageSend();
    }
  };

  const messagesAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesAreaRef.current) {
      messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
    }
  }, [ifBoxShow]);

  useEffect(() => {
    if (messagesAreaRef.current) {
      messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
    }
  }, [ifNewMessage]);

  //   useEffect(() => {
  //     if (messagesAreaRef.current && messagesAreaRef.current.scrollTop !== 0) {
  //       messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
  //     }
  //   }, [messages]);

  const handleMessageSend = () => {
    if (messageInput) {
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
            setIfNewMessage(ifNewMessage + 1);
            setMessageInput('');
          });
      } catch (err) {
        console.log(err);
        alert('something is wrong' + err);
      }
    }
  };

  const handleScroll = () => {
    if (messagesAreaRef.current) {
      const { scrollTop } = messagesAreaRef.current;
      // , scrollHeight, clientHeight
      if (scrollTop === 0 && !isLoading) {
        console.log('scroll position is at the top');

        // Scroll position is at the top, load more messages
        setIsLoading(true);

        // Perform your request to load previous messages here
        // For example, call a function like loadMoreMessages()
        loadMoreMessages().finally(() => {
          setIsLoading(false);
        });
      }
    }
  };

  const loadMoreMessages = async () => {
    try {
      // Make your request to load previous messages
      // For example, using axios and updating the state with setMessages
      console.log('loading more messages');

      const response = await axios.get(
        `http://localhost:3000/api/messages?group=${groupId}&lastMessage=${messages[0]._id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
        },
      );
      const newMessages = response.data.messages;
      console.log(newMessages);

      // Update the state with the new messages
      if (response) {
        setMessages([...newMessages, ...messages]);
        setIfNewMessage(ifNewMessage + 1);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    }
  };

  return (
    <div
      style={
        ifBoxShow
          ? { width: '20rem', height: '25rem' }
          : { width: '20rem', height: '2.5rem' }
      }
      className="fixed bottom-0 right-16 border-solid border-2 border-black bg-white"
    >
      <div
        id="infoBar"
        className="w-full h-10 border-b-2 border-solid  border-gray-400 flex items-center justify-between cursor-pointer"
        onClick={handleBoxShow}
        onScroll={handleScroll}
      >
        <button className="ml-3 hover:text-blue-400 z-10">{targetName}</button>
        <button className="mr-3 hover:text-blue-400" onClick={closeBox}>
          X
        </button>
      </div>
      {ifBoxShow && (
        <>
          <div
            id="messagesArea"
            style={{ height: '19rem', overflowY: 'auto' }}
            className="p-2"
            ref={messagesAreaRef}
            onScroll={handleScroll}
          >
            {messages.length > 0 &&
              messages.map((message) => {
                const isCurrentUser = message.from === user;
                if (isCurrentUser) {
                  return (
                    <div className="flex justify-end">
                      <p className="px-4 py-1 mt-1 mb-1 border-solid border-2 border-gray-400 rounded-md">
                        {message.content}
                      </p>
                    </div>
                  );
                } else {
                  return (
                    <div className="flex justify-start">
                      <p className="px-4 py-1 mt-1 mb-1 bg-blue-300 rounded-md">
                        {message.content}
                      </p>
                    </div>
                  );
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
              onKeyDown={onKeyDown}
            />
            <button
              onClick={handleMessageSend}
              className="h-8 px-4 py-2 mr-2 ml-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs"
            >
              send
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MessageBox;
