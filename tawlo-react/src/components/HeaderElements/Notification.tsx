import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { socket } from '../../socket';

export interface Notification {
  _id: string;
  time: Date;
  category: string;
  action_users: string[];
  target_post: string;
  users_num: number;
  read: boolean;
  message: string;
}

const Notification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [notificationsName, setNotificationsName] = useState<string[][]>([]);
  const [notificationsId, setNotificationsId] = useState<string[][]>([]);

  const navigate = useNavigate();

  const token = Cookies.get('jwtToken');

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_DOMAIN}/api/user/notification`,
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      );
      const resNotifications: Notification[] = response.data;
      setNotifications(resNotifications);
      // 計算未讀通知的數量
      const unreadNotifications = resNotifications.filter(
        (notification) => !notification.read,
      );

      setUnreadCount(unreadNotifications.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const dropdownRef = useRef<HTMLButtonElement | null>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      event.target instanceof Node &&
      !dropdownRef.current.contains(event.target)
    ) {
      // 點擊的位置在 dropdown 之外
      setIsNotificationOpen(false);
    }
  };

  useEffect(() => {
    // Add listener to all elements
    document.addEventListener('click', handleClickOutside);
    return () => {
      // remove it
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchFunction = async () => {
      const nameArray: string[][] = [];
      const idArray: string[][] = [];
      for (let i = 0; i < notifications.length; i++) {
        for (let j = 0; j < notifications[i].action_users.length; j++) {
          const res = await axios.get(
            `${import.meta.env.VITE_DOMAIN}/api/user/info?id=${
              notifications[i].action_users[j]
            }`,
          );

          if (res.data.name) {
            const userName = res.data.name as string;

            if (!nameArray[i]) {
              nameArray[i] = [userName];
            } else if (!nameArray[i].includes(userName)) {
              nameArray[i].push(userName);
            }

            if (!idArray[i]) {
              idArray[i] = [notifications[i].action_users[j]];
            } else if (!idArray[i].includes(notifications[i].action_users[j])) {
              idArray[i].push(notifications[i].action_users[j]);
            }
          } else {
            nameArray.push([]);
            idArray.push([]);
          }
        }
      }
      setNotificationsName([...nameArray]);
      setNotificationsId([...idArray]);
    };
    fetchFunction();
  }, [notifications]);

  useEffect(() => {
    if (socket) {
      socket.on('notificate', (data) => {
        const category = data.category;
        // console.log('receiving notification!!');

        if (
          category === 'reply_post' ||
          category === 'comment_post' ||
          category === 'upvote_post' ||
          category === 'like_post' ||
          category === 'comment_replied' ||
          category === 'like_comment'
        ) {
          const actionUser: string = data.actionUser;
          const targetPost: string = data.targetPost;
          const message: string = data.message;
          axios
            .get(
              `${import.meta.env.VITE_DOMAIN}/api/user/info?id=${actionUser}`,
            )
            .then((res) => {
              const name = res.data.name;

              const CustomToastWithLink = () => (
                <div>
                  <Link to={`/post/${targetPost}`}>{`${name} ${message}`}</Link>
                </div>
              );
              toast.info(CustomToastWithLink, {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'light',
              });
            })
            .catch((err) => {
              console.log(err);
            })
            .finally(() => {
              setUnreadCount((pre) => pre + 1);
            });
        }

        if (
          category === 'meet_match' ||
          category === 'meet_success' ||
          category === 'meet_fail'
        ) {
          const message: string = data.message;
          const CustomToastWithLink = () => (
            <div>
              <Link to="/meeting">{`${message}`}</Link>
            </div>
          );
          toast.info(CustomToastWithLink, {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: 'light',
          });

          setUnreadCount((pre) => pre + 1);
        }

        if (category === 'friend_request' || category === 'request_accepted') {
          const message: string = data.message;
          const actionUser: string = data.actionUser;

          axios
            .get(
              `${import.meta.env.VITE_DOMAIN}/api/user/info?id=${actionUser}`,
            )
            .then((res) => {
              const CustomToastWithLink = () => (
                <div>
                  <Link
                    to={`/user/profile/${actionUser}`}
                  >{`${message} : ${res.data.name}`}</Link>
                </div>
              );
              toast.info(CustomToastWithLink, {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'light',
              });
              setUnreadCount((pre) => pre + 1);
            })
            .catch((err) => {
              console.log(err);
            });
        }
      });
    }
    return () => {
      if (socket) {
        socket.off('notificate');
      }
    };
  }, [unreadCount]);

  const handleClick = async () => {
    // console.log('click');
    fetchNotifications();
    setIsNotificationOpen(!isNotificationOpen);
    // update
    if (!isNotificationOpen) {
      // console.log('updating');
      // console.log('token is: ' + token);

      await axios.post(
        `${import.meta.env.VITE_DOMAIN}/api/user/notification`,
        {},
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      );

      setUnreadCount(0);
    }
  };

  const handleTurnPage = (
    category: string,
    targetPost: string,
    targetUser?: string,
  ) => {
    if (
      category === 'reply_post' ||
      category === 'comment_post' ||
      category === 'upvote_post' ||
      category === 'like_post' ||
      category === 'comment_replied' ||
      category === 'like_comment'
    ) {
      navigate(`/post/${targetPost}`);
    }

    if (
      category === 'meet_match' ||
      category === 'meet_success' ||
      category === 'meet_fail'
    ) {
      navigate('/meeting');
    }

    if (category === 'friend_request' || category === 'request_accepted') {
      navigate(`/user/profile/${targetUser}`);
    }
  };

  return (
    <>
      <div className="relative inline-block">
        <button
          className="w-9 h-9 bg-bell-image bg-white rounded-full bg-contain bg-no-repeat"
          style={{ backgroundSize: '1.5rem', backgroundPosition: 'center' }}
          ref={dropdownRef}
          onClick={handleClick}
        >
          <div className="ml-6 mt-4 w-3 rounded-full bg-red-100 text-center">
            {unreadCount}
          </div>
        </button>
        {isNotificationOpen && notifications.length > 0 && (
          <div className="absolute h-64 overflow-y-auto right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-md">
            <ul>
              {notifications.map((notification, index) => {
                const date = new Date(notification.time);

                return (
                  <li
                    key={notification._id}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() =>
                      handleTurnPage(
                        notification.category,
                        notification.target_post,
                        notification.action_users[0],
                      )
                    }
                  >
                    <div className="flex items-center w-full justify-left">
                      <span className="text-gray-500 text-sm mr-2">
                        {`${date.toLocaleDateString()}`}
                      </span>
                      <span className="text-gray-500 text-sm mr-2">
                        {`${date.toLocaleTimeString()}`}
                      </span>
                    </div>
                    {notificationsName[index] && (
                      <div id="name_info" className="flex flex-wrap">
                        {notificationsName[index].map((_name, num) => {
                          return (
                            <div key={notificationsId[index][num]}>
                              <Link
                                to={`/user/profile/${notificationsId[index][num]}`}
                                className="font-bold mr-2 z-10 hover:underline"
                                onClick={(event) => event.stopPropagation()}
                              >
                                {notificationsName[index][num]}
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <p>{notification.message}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      <ToastContainer />
    </>
  );
};

export default Notification;
