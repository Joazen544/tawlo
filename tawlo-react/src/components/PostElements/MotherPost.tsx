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

const MotherPost = ({
  _id,
  publishDate,
  author,
  // floor,
  tags,
  content,
  // hot,
  // score,
  board,
  // liked,
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
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [isDownvoted, setIsDownvoted] = useState(false);
  const [upvoteSum, setUpvoteSum] = useState(upvote.number - downvote.number);
  const [commentsData, setCommentsData] = useState<CommentsData[]>(
    comments.data,
  );
  const [commentNumber, setCommentNumber] = useState(comments.number);
  const [commentCreate, setCommentCreate] = useState('');
  const [authorImage, setAuthorImage] = useState();
  const [isSettingAppend, setIsSettingAppend] = useState(false);
  const [isFolded, setIsFolded] = useState<boolean>(true);
  const [isPostLong, setIsPostLong] = useState<boolean>(false);
  const [ifEditing, setIfEditing] = useState<boolean>(false);
  const [editContent, setEditContent] = useState<string>('');
  const [postContent, setPostContent] = useState<string>(content);

  const token = Cookies.get('jwtToken');
  const userId = Cookies.get('userId');

  const navigate = useNavigate();

  useEffect(() => {
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
      .get(`${import.meta.env.VITE_DOMAIN}/api/user/info?id=${author}`)
      .then((res) => {
        setAuthorName(res.data.name);
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_DOMAIN}/api/user/info?id=${author}`)
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
        .get(`${import.meta.env.VITE_DOMAIN}/api/user/info?id=${comment.user}`)
        .then((res) => {
          const userName = res.data.name as string;
          nameArray[index] = userName;
          setCommentNames([...nameArray]);
        });
    });
  }, [commentsData]);

  useEffect(() => {
    if (postContent) {
      setEditContent(postContent);
    }
  }, [postContent]);

  const handleEditChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(event.target.value);
  };

  const handleEditSubmit = async () => {
    axios
      .post(
        `${import.meta.env.VITE_DOMAIN}/api/post/edit`,
        {
          post: _id,
          content: editContent,
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
        setPostContent(editContent);
        setEditContent('');
        setIfEditing(false);
      });
  };

  const handleEditCancel = () => {
    setEditContent('');
    setIfEditing(false);
  };

  useEffect(() => {
    setEditContent(postContent);
  }, [ifEditing]);

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
  const contentPageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (contentPageRef.current) {
      if (contentPageRef.current.offsetHeight >= 384) {
        setIsFolded(true);
        setIsPostLong(true);
      } else {
        setIsFolded(false);
      }
    }
  }, [content]);

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
          navigate(`/board?id=${board}`);
        }
        clickDelete(_id);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const publishTime = new Date(publishDate);

  return (
    <>
      <div className="w-full mx-auto mt-2 pb-6 flex">
        <div id="user_info">
          <div
            id="authorInfo"
            className="pr-4 flex items-center justify-center w-44 h-full"
          >
            <div className="flex flex-col items-center">
              <div className="flex-shrink-0">
                <div
                  id="userImage"
                  className={`h-28 w-28  ${
                    !authorImage && 'bg-user-image'
                  } bg-contain bg-no-repeat`}
                >
                  {authorImage && (
                    <img
                      style={{ objectFit: 'cover' }}
                      src={authorImage}
                      alt="user-image"
                      className="h-full w-full rounded-full"
                    />
                  )}
                </div>
              </div>
              <div className="flex mt-5 flex-col items-center">
                <Link
                  style={{ backgroundColor: import.meta.env.VITE_THIRD_COLOR }}
                  to={`/user/profile/${author}`}
                  id="commentName"
                  className="w-20 text-center rounded-xl shadow-lg text-lg text-blue-400"
                >
                  {authorName}
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div
          id="post_body"
          style={{ width: '720px' }}
          className="bg-white rounded-2xl  border-solid border-2 shadow-lg border-gray-300"
        >
          <div
            id="title"
            className="p-4 border-b border-gray-200 flex justify-between items-center"
          >
            <div className="text-gray-500">
              <div className="text-2xl">#標題：{title}</div>
              {publishTime.toLocaleDateString()}
            </div>
            <div id="tags" className="ml-4 w-40 text-gray-500 flex flex-wrap">
              {category !== 'reply' &&
                tags.map((tag, index) => (
                  <p
                    className="border-solid border-2 rounded-md p-1.5 mr-3 mt-1"
                    key={index}
                  >
                    {tag}
                  </p>
                ))}
            </div>
            <div className="flex w-32 justify-between">
              {author === userId && (
                <div id="settings" className="flex items-center relative">
                  {isSettingAppend && (
                    <div className="w-14 absolute rounded-lg right-0 top-8 border-2 bg-white border-gray-400 border-solid overflow-hidden">
                      <button
                        onClick={() => setIfEditing(true)}
                        className="hover:bg-blue-400 h-full w-full"
                      >
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
                  <button
                    onClick={handleSettingAppend}
                    ref={settingRef}
                    className="w-8 h-10 bg-more-image bg-no-repeat bg-contain"
                  ></button>
                </div>
              )}
              <button
                className="pl-2 pr-2 w-20 h-10 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
                onClick={clickReply}
              >
                回覆貼文
              </button>
            </div>
          </div>

          <div id="postContent" className="p-4 flex mt-3 mb-3">
            {ifEditing && (
              <>
                <div className="m-2 flex items-end">
                  <textarea
                    style={{ width: '30rem', minHeight: '10rem' }}
                    className="border-2 border-solid border-gray-500 rounded-lg p-3"
                    name=""
                    id=""
                    value={editContent}
                    onChange={handleEditChange}
                  ></textarea>
                  <button
                    onClick={handleEditCancel}
                    className="w-14 h-8 p-1 ml-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleEditSubmit}
                    className="w-14 h-8 p-1 ml-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                  >
                    送出
                  </button>
                </div>
              </>
            )}
            {!ifEditing && (
              <>
                <div
                  id="useful"
                  className="pl-14 w-10 h-25 flex flex-col justify-start items-center"
                >
                  <button
                    id="upvote"
                    style={{ backgroundSize: '1rem' }}
                    className={`w-10 h-10 bg-up-arrow  bg-no-repeat bg-center border-solid border-2 border-black rounded-full ${
                      isUpvoted ? 'bg-blue-200' : 'bg-white hover:bg-gray-100'
                    }`}
                    onClick={handleUpvote}
                  ></button>
                  <span className="text-gray-900">{upvoteSum}</span>
                  <button
                    id="downvote"
                    style={{ backgroundSize: '1rem' }}
                    className={`w-10 h-10 bg-down-arrow  bg-no-repeat bg-center border-solid border-2 border-black rounded-full ${
                      isDownvoted ? 'bg-blue-200' : 'bg-white hover:bg-gray-100'
                    }`}
                    onClick={handleDownvote}
                  ></button>
                </div>
                <div ref={contentPageRef} id="content" className="ml-4">
                  <p
                    style={{ whiteSpace: 'pre-line' }}
                    className={`ml-10 pr-8 pl-3 ${
                      isFolded ? 'max-h-96 overflow-hidden' : null
                    }`}
                  >
                    {postContent}
                  </p>
                  {isPostLong && (
                    <div
                      className="ml-10 text-blue-400 cursor-pointer"
                      onClick={() => setIsFolded(!isFolded)}
                    >
                      {isFolded ? '顯示更多' : '收起'}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

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
              className="w-20 h-10 px-1 mb-2 mr-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
            >
              留言
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MotherPost;
