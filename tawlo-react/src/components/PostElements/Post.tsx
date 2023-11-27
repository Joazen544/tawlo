import axios from 'axios';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

interface Props {
  _id: string;
  publishDate: Date;
  updateDate: Date;
  author: string;
  content: string;
  hot: number;
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
  tags,
  content,
  hot,
  score,
  liked,
  upvote,
  downvote,
  comments,
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
  // const [token, setToken] = useState<string | undefined>('');
  // const [userId, setUserId] = useState<string | undefined>('');
  const token = Cookies.get('jwtToken');
  const userId = Cookies.get('userId');

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
      .get(`http://localhost:3000/api/user/name?id=${author}`)
      .then((res) => {
        setAuthorName(res.data.name);
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    const nameArray: string[] = [];
    commentsData.forEach((comment, index) => {
      axios
        .get(`http://localhost:3000/api/user/name?id=${comment.user}`)
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
        `http://localhost:3000/api/post/${_id}/like`,
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
        `http://localhost:3000/api/post/${_id}/upvote`,
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
        `http://localhost:3000/api/post/${_id}/downvote`,
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

  const handleComment = async () => {
    const commentContent = prompt('Enter your comment:');

    if (commentContent) {
      try {
        await axios
          .post(
            `http://localhost:3000/api/post/${_id}/comment`,
            {
              content: commentContent,
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
                content: commentContent,
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
        // You may want to fetch the updated post data after adding a comment
      } catch (error) {
        console.error('Error adding comment:', error);
      }
    }
  };

  const publishTime = new Date(publishDate);

  return (
    <>
      <div
        style={{ width: '50rem' }}
        className="max-w-3xl mx-auto mt-8 bg-white shadow-lg rounded-lg overflow-hidden"
      >
        <div id="authorInfo" className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {/* Add user avatar or profile image here */}
            </div>
            <div className="ml-3">
              <button className="text-lg font-medium text-blue-400">
                {authorName}
              </button>
              <div className="text-gray-500">{publishTime.toDateString()}</div>
            </div>
            <div id="tags" className="ml-10 text-gray-500 flex">
              {tags.map((tag, index) => (
                <p
                  className="border-solid border-2 rounded-md p-0.5 mr-3"
                  key={index}
                >
                  {tag}
                </p>
              ))}
            </div>
          </div>
        </div>
        <div id="postContent" className="p-4 flex">
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
        <div id="postInfo" className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Score:</span>
              <span className="text-gray-900">{score}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Hot:</span>
              <span className="text-gray-900">{hot}</span>
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
              <button
                className="text-gray-600 cursor-pointer"
                onClick={handleComment}
              >
                Comments:
              </button>
              <span className="text-gray-900">{commentNumber}</span>
            </div>
            {/* Add more details as needed */}
          </div>
        </div>
        {commentsData.length > 0 && (
          <div id="comments" className="p-4 border-t border-gray-200">
            {commentsData &&
              commentsData.map((comment, index) => {
                const time = new Date(comment.time);
                const name = commentNames[index];

                return (
                  <div className="flex justify-between" key={index}>
                    <div className="flex">
                      <button
                        id="commentName"
                        className="w-20 text-left text-blue-400"
                      >
                        {name}
                      </button>
                      <p>{comment.content}</p>
                    </div>
                    <div className="flex">
                      <p className="mr-5">{time.toLocaleTimeString()}</p>
                      <p>like:{comment.like.number}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </>
  );
};

export default Post;
