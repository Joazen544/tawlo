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

const NativePost = ({
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

  useEffect(() => {
    axios
      .get(`http://localhost:3000/api/user/name?id=${author}`)
      .then((res) => {
        setAuthorName(res.data.name);
      })
      .catch((err) => console.log(err));
  });
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
              <div className="text-lg font-medium text-gray-900">
                {authorName}
              </div>
              <div className="text-gray-500">{publishTime.toDateString()}</div>
            </div>
            <div id="tags" className="ml-10 text-gray-500">
              {tags.map((tag, index) => (
                <p
                  className="border-solid border-2 rounded-md p-0.5"
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
                return (
                  <div className="flex" key={index}>
                    <button id="commentName">{comment.user}</button>
                    <p>{comment.content}</p>
                    <p>{time.toLocaleTimeString()}</p>
                    <p>{comment.like.number}</p>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </>
  );
};

export default NativePost;
