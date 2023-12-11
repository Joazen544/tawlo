import axios from 'axios';
import { useEffect, useState, useRef } from 'react';
import Cookies from 'js-cookie';
import Comment from '../Comment';
import { Link, useNavigate } from 'react-router-dom';

interface Props {
  _id: string;
  publishDate: Date;
  updateDate: Date;
  author: string;
  title: string;
  board: string;
  category: string;
  content: string;
  hot: number;
  floor: number;
  tags: string[];
  score: number;
  liked: {
    number: number;
    users: string[];
  };
  upvote: {
    number: number;
    users: string[];
  };
  downvote: {
    number: number;
    users: string[];
  };
  comments: {
    number: number;
    data: [
      {
        user: string;
        content: string;
        time: Date;
        like: {
          number: number;
          users: string[];
        };
      },
    ];
  };
  clickReply: () => void;
  clickDelete: (postId: string) => void;
}

interface CommentsData {
  user: string;
  content: string;
  time: Date;
  like: {
    number: number;
    users: string[];
  };
}

const Post = ({
  _id,
  publishDate,
  author,
  floor,
  tags,
  content,
  hot,
  score,
  board,
  liked,
  upvote,
  downvote,
  comments,
  title,
  category,
  clickReply,
  clickDelete,
}: Props) => {
  const [authorName, setAuthorName] = useState('');
  const [commentNames, setCommentNames] = useState<string[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [isDownvoted, setIsDownvoted] = useState(false);
  const [likeNumber, setLikeNumber] = useState(liked.number);
  const [upvoteSum, setUpvoteSum] = useState(upvote.number - downvote.number);
  const [commentsData, setCommentsData] = useState<CommentsData[]>(
    comments.data,
  );
  const [commentNumber, setCommentNumber] = useState(comments.number);
  const [commentCreate, setCommentCreate] = useState('');
  const [authorImage, setAuthorImage] = useState();
  const [isSettingAppend, setIsSettingAppend] = useState(false);

  const token = Cookies.get('jwtToken');
  const userId = Cookies.get('userId');

  const navigate = useNavigate();

  useEffect(() => {
    // setToken(Cookies.get('jwtToken'));
    // setUserId(Cookies.get('userId'));
    if (liked.number && userId) {
      if (liked.users.includes(userId)) {
        setIsLiked(true);
      }
    }
    if (upvote.number && userId) {
      if (upvote.users.includes(userId)) {
        setIsUpvoted(true);
      }
    }
    if (downvote.number && userId) {
      if (downvote.users.includes(userId)) {
        setIsDownvoted(true);
      }
    }
  }, [userId]);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_DOMAIN}/api/user/name?id=${author}`)
      .then((res) => {
        setAuthorName(res.data.name);
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_DOMAIN}/api/user/image?id=${author}`)
      .then((res) => {
        setAuthorImage(res.data.image);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  useEffect(() => {
    const nameArray: string[] = [];
    commentsData.forEach((comment, index) => {
      axios
        .get(`${import.meta.env.VITE_DOMAIN}/api/user/name?id=${comment.user}`)
        .then((res) => {
          const userName = res.data.name as string;
          nameArray[index] = userName;
          setCommentNames([...nameArray]);
        });
    });
  }, [commentsData]);

  const handleLike = async () => {
    const likeStatus = !isLiked;
    if (isLiked) {
      setLikeNumber(likeNumber - 1);
    } else {
      setLikeNumber(likeNumber + 1);
    }
    setIsLiked(likeStatus);

    try {
      await axios.post(
        `${import.meta.env.VITE_DOMAIN}/api/post/${_id}/like`,
        {
          like: likeStatus,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
        },
      );
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleUpvote = async () => {
    const upvoteStatus = !isUpvoted;
    if (isDownvoted) {
      setIsDownvoted(false);
      setUpvoteSum(upvoteSum + 2);
    } else if (isUpvoted) {
      setUpvoteSum(upvoteSum - 1);
    } else {
      setUpvoteSum(upvoteSum + 1);
    }

    setIsUpvoted(upvoteStatus);

    try {
      await axios.post(
        `${import.meta.env.VITE_DOMAIN}/api/post/${_id}/upvote`,
        {
          upvote: upvoteStatus,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
        },
      );
    } catch (error) {
      console.error('Error upvoting post:', error);
    }
  };

  const handleDownvote = async () => {
    const downvoteStatus = !isDownvoted;
    if (isUpvoted) {
      setIsUpvoted(false);
      setUpvoteSum(upvoteSum - 2);
    } else if (isDownvoted) {
      setUpvoteSum(upvoteSum + 1);
    } else {
      setUpvoteSum(upvoteSum - 1);
    }
    setIsDownvoted(downvoteStatus);

    try {
      await axios.post(
        `${import.meta.env.VITE_DOMAIN}/api/post/${_id}/downvote`,
        {
          downvote: downvoteStatus,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
        },
      );
    } catch (error) {
      console.error('Error downvoting post:', error);
    }
  };

  const handleCreateComment = async () => {
    if (!commentCreate) {
      return;
    }
    try {
      // Make a request to create a new post
      await axios
        .post(
          `${import.meta.env.VITE_DOMAIN}/api/post/${_id}/comment`,
          {
            content: commentCreate,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              authorization: `Bearer ${token}`,
            },
          },
        )
        .then(() => {
          const array = commentsData.concat([
            {
              user: userId as string,
              content: commentCreate,
              time: new Date(),
              like: {
                number: 0,
                users: [],
              },
            },
          ]);
          setCommentsData(array);
          setCommentNumber(commentNumber + 1);
        });

      setCommentCreate('');
      // Clear input fields
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleCommentChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setCommentCreate(event.target.value);
  };

  const handleSettingAppend = () => {
    setIsSettingAppend(!isSettingAppend);
  };

  const settingRef = useRef<HTMLButtonElement | null>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      settingRef.current &&
      event.target instanceof Node &&
      !settingRef.current.contains(event.target)
    ) {
      // 點擊的位置在 dropdown 之外
      setIsSettingAppend(false);
    }
  };

  useEffect(() => {
    // 添加全域點擊事件監聽器
    document.addEventListener('click', handleClickOutside);
    return () => {
      // 移除全域點擊事件監聽器
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleDelete = () => {
    axios
      .delete(`${import.meta.env.VITE_DOMAIN}/api/post?id=${_id}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      })
      .then(() => {
        if (category === 'mother') {
          console.log('board is');
          console.log(board);

          navigate(`/board?id=${board}`);
          console.log('123');
        }
        clickDelete(_id);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const publishTime = new Date(publishDate);
  let postContainer;
  if (category === 'native') {
    postContainer =
      'max-w-3xl mx-auto mt-8 bg-white shadow-lg rounded-lg  overflow-hidden border-solid border-2 border-gray-400';
  } else {
    postContainer =
      'w-full mx-auto mt-2 pb-6  bg-white overflow-hidden border-solid border-b-2 border-gray-200';
  }

  return (
    <>
      <div style={{ width: '50rem' }} className={postContainer}>
        {/* only mother post has title */}
        {category === 'mother' && (
          <div
            id="title"
            className="p-4 border-b border-gray-200 flex justify-between items-center"
          >
            <span className="text-2xl">#問題：{title}</span>
            <button
              className="px-4 w-20 h-16 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
              onClick={clickReply}
            >
              Reply
            </button>
          </div>
        )}
        {category === 'reply' && (
          <>
            {author === userId && (
              <div
                id="settings"
                className="relative ml-2 flex justify-end mt-10"
              >
                <button
                  onClick={handleSettingAppend}
                  ref={settingRef}
                  className="w-8 h-8 bg-more-image bg-no-repeat bg-contain mr-5 mb-5"
                ></button>
                {isSettingAppend && (
                  <div className="absolute w-14 rounded-lg top-7 right-0 border-2 bg-white border-gray-400 border-solid overflow-hidden">
                    <button className="hover:bg-blue-400 h-full w-full">
                      編輯
                    </button>
                    <button
                      onClick={handleDelete}
                      className="hover:bg-red-400 h-full w-full"
                    >
                      刪除
                    </button>
                  </div>
                )}
              </div>
            )}
            <div
              id="title"
              className="pr-4 mt-2 border-gray-200 flex justify-between items-center"
            >
              <span className="text-2xl">#{floor} 回答</span>
              <div id="authorInfo" className="r-4 flex">
                <div className="flex items-center">
                  <div className="ml-3">
                    <Link
                      to={`/user/profile/${author}`}
                      id="commentName"
                      className="w-20 text-left text-blue-400"
                    >
                      {authorName}
                    </Link>
                    <div className="text-gray-500">
                      {publishTime.toDateString()}
                    </div>
                  </div>
                  <div id="tags" className="ml-10 text-gray-500 flex">
                    {category !== 'reply' &&
                      tags.map((tag, index) => (
                        <p
                          className="border-solid border-2 rounded-md p-0.5 mr-3"
                          key={index}
                        >
                          {tag}
                        </p>
                      ))}
                  </div>
                  <div className="flex-shrink-0">
                    <div
                      id="userImage"
                      className={`h-12 w-12 border-2 border-solid border-gray-400 ${
                        !authorImage && 'bg-user-image'
                      } bg-contain bg-no-repeat`}
                    >
                      {authorImage && (
                        <img
                          style={{ objectFit: 'cover' }}
                          src={authorImage}
                          alt="user-image"
                          className="h-full w-full"
                        />
                      )}
                    </div>{' '}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        {category !== 'reply' && (
          <div
            id="authorInfo"
            className="p-4 flex items-center justify-between"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div
                  id="userImage"
                  className={`h-12 w-12 border-2 border-solid border-gray-400 ${
                    !authorImage && 'bg-user-image'
                  } bg-contain bg-no-repeat`}
                >
                  {authorImage && (
                    <img
                      style={{ objectFit: 'cover' }}
                      src={authorImage}
                      alt="user-image"
                      className="h-full w-full"
                    />
                  )}
                </div>
              </div>
              <div className="ml-3">
                <Link
                  to={`/user/profile/${author}`}
                  id="commentName"
                  className="w-20 text-left text-blue-400"
                >
                  {authorName}
                </Link>
                <div className="text-gray-500">
                  {publishTime.toDateString()}
                </div>
              </div>
              <div id="tags" className="ml-10 text-gray-500 flex">
                {category !== 'reply' &&
                  tags.map((tag, index) => (
                    <p
                      className="border-solid border-2 rounded-md p-0.5 mr-3"
                      key={index}
                    >
                      {tag}
                    </p>
                  ))}
              </div>
            </div>
            {author === userId && (
              <div id="settings" className="relative">
                <button
                  onClick={handleSettingAppend}
                  ref={settingRef}
                  className="w-8 h-8 bg-more-image bg-no-repeat bg-contain"
                ></button>
                {isSettingAppend && (
                  <div className="absolute w-14 rounded-lg right-0 border-2 bg-white border-gray-400 border-solid overflow-hidden">
                    <button className="hover:bg-blue-400 h-full w-full">
                      編輯
                    </button>
                    <button
                      onClick={handleDelete}
                      className="hover:bg-red-400 h-full w-full"
                    >
                      刪除
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <div id="postContent" className="p-4 flex mt-3 mb-3">
          <div
            id="useful"
            className="w-10 h-25 flex flex-col justify-center items-center"
          >
            <button
              id="upvote"
              style={{ backgroundSize: '1rem' }}
              className={`w-10 h-10 bg-up-arrow  bg-no-repeat bg-center border-solid border-2 border-black rounded-full ${
                isUpvoted ? 'bg-blue-200' : 'bg-white'
              }`}
              onClick={handleUpvote}
            ></button>
            <span className="text-gray-900">{upvoteSum}</span>
            <button
              id="downvote"
              style={{ backgroundSize: '1rem' }}
              className={`w-10 h-10 bg-down-arrow  bg-no-repeat bg-center border-solid border-2 border-black rounded-full ${
                isDownvoted ? 'bg-blue-200' : 'bg-white'
              }`}
              onClick={handleDownvote}
            ></button>
          </div>
          <div id="content" className="ml-10">
            <p className="text-gray-800">{content}</p>
          </div>
        </div>
        {category === 'native' && (
          <div id="postInfo" className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Score:</span>
                <span className="text-gray-900">{score}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Hot:</span>
                <span className="text-gray-900">{Math.round(hot)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className={`text-gray-600 cursor-pointer ${
                    isLiked ? 'text-blue-500' : ''
                  }`}
                  onClick={handleLike}
                >
                  Like
                </button>
                <span className="text-gray-900">{likeNumber}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-gray-600">Comments:</div>
                <span className="text-gray-900">{commentNumber}</span>
              </div>
              {/* Add more details as needed */}
            </div>
          </div>
        )}

        {commentsData.length > 0 && (
          <div id="comments" className="p-4 border-t border-gray-200">
            {commentsData &&
              commentsData.map((comment, index) => {
                const time = new Date(comment.time);
                const name = commentNames[index];

                return (
                  <Comment
                    key={index}
                    userId={comment.user}
                    index={index}
                    name={name}
                    comment={comment}
                    time={time}
                  ></Comment>
                );
              })}
          </div>
        )}
        <div id="commentCreate" className="flex items-center">
          <input
            type="text"
            value={commentCreate}
            onChange={handleCommentChange}
            className="w-full h-10 p-3 ml-2 mb-2 mr-2 border border-gray-300 rounded-md"
            placeholder="輸入留言"
          />
          <button
            onClick={handleCreateComment}
            className=" h-10 px-4 mb-2 mr-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
          >
            Comment
          </button>
        </div>
      </div>
    </>
  );
};

export default Post;
