import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface Props {
  _id: string;
  publishDate: Date;
  updateDate: Date;
  author: string;
  lastReply: string;
  content: string;
  hot: number;
  board: string;
  tags: string[];
  score: number;
  sumLikes: number;
  sumUpvotes: number;
  sumComments: number;
  sumReply: number;
  title: string;
}

const BoardPost = ({
  _id,
  publishDate,
  updateDate,
  author,
  lastReply,
  tags,
  content,
  // hot,
  sumLikes,
  sumUpvotes,
  sumReply,
  title,
}: Props) => {
  const [authorName, setAuthorName] = useState('');
  const [lastReplyName, setlastReplyName] = useState('');

  const HOT_POST_SCORE = 50;

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_DOMAIN}/api/user/info?id=${author}`)
      .then((res) => {
        setAuthorName(res.data.name);
      })
      .catch((err) => console.log(err));
  }, [author]);

  useEffect(() => {
    if (lastReply) {
      axios
        .get(`${import.meta.env.VITE_DOMAIN}/api/user/info?id=${lastReply}`)
        .then((res) => {
          setlastReplyName(res.data.name);
        })
        .catch((err) => console.log(err));
    }
  }, [lastReply]);

  return (
    <>
      <div
        style={{ width: '50rem' }}
        className="max-w-3xl mx-auto mt-8 bg-white shadow-lg rounded-lg overflow-hidden border-solid border-2 border-gray-400"
      >
        <div id="postContent" className="p-4 flex items-center">
          <div
            id="interactionInfo"
            className="w-20 h-20 box-content flex justify-center items-center border-r border-gray-200"
          >
            <span
              className={`${
                sumUpvotes > HOT_POST_SCORE ? 'text-red-500' : 'text-gray-900'
              } text-3xl `}
            >
              {sumUpvotes}
            </span>
          </div>
          <div
            id="content"
            className="ml-10 flex flex-col justify-between w-full"
          >
            <div id="info" className="flex justify-between">
              <div id="left" className="flex">
                <div className="flex items-center space-x-2 mr-6">
                  <span className="text-gray-600">總喜歡:</span>
                  <span className="text-gray-900">{sumLikes}</span>
                </div>
                <div className="flex items-center space-x-2 mr-4">
                  <span className="text-gray-600">總回覆:</span>
                  <span className="text-gray-900">{sumReply}</span>
                </div>
                {/* <div className="flex items-center space-x-2 mr-4">
                  <span className="text-gray-600">Hot:</span>
                  <span className="text-gray-900">{Math.round(hot)}</span>
                </div> */}
                <div id="tags" className=" text-gray-500 flex flex-wrap">
                  {tags.map((tag, index) => (
                    <p
                      className="mr-2 pl-2 pr-2 border-solid border-2 rounded-md p-0.5 text-center"
                      key={index}
                    >
                      {tag}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div id="postContent" className="max-w-md">
              <div className="text-2xl mt-1 text-gray-500">
                <Link to={`/board/discussion?id=${_id}`}>{title}</Link>
              </div>
              <p className="text-gray-500 text-sm mt-3 w-96 h-16 truncate">
                {content}
              </p>
            </div>
          </div>
          <div id="timeInfo" className="w-56 text-sm">
            <div className="ml-3 flex flex-col justify-center">
              {new Date(publishDate).toDateString()}
              <Link
                to={`/user/profile/${author}`}
                className="text-md font-medium text-blue-400 hover:text-blue-500 mr-5"
              >
                {authorName}
              </Link>
            </div>
            {lastReply && (
              <div className="ml-3 flex flex-col justify-center mt-2">
                {new Date(updateDate).toDateString()}
                <Link
                  to={`/user/profile/${lastReply}`}
                  className="text-md font-medium text-blue-400 hover:text-blue-500 mr-5"
                >
                  {lastReplyName}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BoardPost;
