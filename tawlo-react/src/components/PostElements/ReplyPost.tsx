import axios from 'axios';
import { useEffect, useState } from 'react';

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

const Post = ({
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
    comments.data.forEach((comment, index) => {
      axios
        .get(`http://localhost:3000/api/user/name?id=${comment.user}`)
        .then((res) => {
          const userName = res.data.name as string;
          nameArray[index] = userName;
          setCommentNames([...nameArray]);
        });
    });
  }, []);

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
            className="w-10 h-20 flex flex-col justify-center items-center"
          >
            <button
              id="upvote"
              className="w-10 h-5 bg-up-arrow bg-contain bg-no-repeat bg-center"
            ></button>
            <span className="text-gray-900">
              {upvote.number - downvote.number}
            </span>
            <button
              id="downvote"
              className="w-10 h-5 bg-down-arrow bg-contain bg-no-repeat bg-center"
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
              <span className="text-gray-600">Like:</span>
              <span className="text-gray-900">{liked.number}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="text-gray-600">Comments:</button>
              <span className="text-gray-900">{comments.number}</span>
            </div>
            {/* Add more details as needed */}
          </div>
        </div>
        {comments.number > 0 && (
          <div id="comments" className="p-4 border-t border-gray-200">
            {comments.data &&
              comments.data.map((comment, index) => {
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
