import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface Props {
  _id: string;
  publishDate: Date;
  updateDate: Date;
  author: string;
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

const DisscussPost = ({
  _id,
  publishDate,
  author,
  tags,
  content,
  // hot,
  // score,
  sumLikes,
  sumUpvotes,
  sumReply,
  board,
  title,
}: Props) => {
  const [authorName, setAuthorName] = useState('');
  const [boardName, setBoardName] = useState<string>();

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_DOMAIN}/api/user/info?id=${author}`)
      .then((res) => {
        setAuthorName(res.data.name);
      })
      .catch((err) => console.log(err));
  }, [author]);

  useEffect(() => {
    console.log(board);

    axios
      .get(`${import.meta.env.VITE_DOMAIN}/api/board/name?id=${board}`)
      .then((res) => {
        setBoardName(res.data.name);
      })
      .catch((err) => console.log(err));
  }, [board]);

  const publishTime = new Date(publishDate);

  return (
    <>
      <div
        style={{ width: '50rem' }}
        className="max-w-3xl mx-auto mt-8 bg-white shadow-lg rounded-lg overflow-hidden border-solid border-2 border-gray-400"
      >
        <div className="ml-6 mt-6 flex text-lg items-center justify-between">
          <div id="boardName" className="text-blue-400">
            <Link to={`/board?id=${board}`} className=" p-1.5 text-xl">
              討論版： {boardName}
            </Link>
          </div>
          <div className="ml-5 flex text-base items-center mr-5">
            <div id="tags" className=" text-gray-500 flex flex-wrap">
              {tags.map((tag, index) => (
                <p
                  style={{ maxWidth: '7rem' }}
                  className="overflow-hidden mr-2 pr-2 border-solid border-2 rounded-md p-1.5 text-center"
                  key={index}
                >
                  {tag}
                </p>
              ))}
            </div>
          </div>
        </div>
        <div id="postContent" className="p-4 flex items-center">
          <div
            id="interactionInfo"
            className="w-40 h-32 mr-1 box-content flex flex-col justify-center items-left border-r border-gray-200"
          >
            <span className="text-gray-900">有用 {sumUpvotes}</span>
            {/* <div className="flex items-center space-x-2">
              <span className="text-gray-600">Score:</span>
              <span className="text-gray-900">{score}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Hot:</span>
              <span className="text-gray-900">{Math.round(hot)}</span>
            </div> */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">總喜歡:</span>
              <span className="text-gray-900">{sumLikes}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="text-gray-600">回覆篇數:</button>
              <span className="text-gray-900">{sumReply}</span>
            </div>
          </div>
          <div
            id="content"
            className="ml-10 flex flex-col justify-between w-full"
          >
            <Link to={`/board/discussion?id=${_id}`} className="max-w-lg">
              <div className="overflow-hidden text-2xl text-black mt-5">
                <div className="font-medium">{title}</div>
              </div>
              <p className="text-gray-500 text-sm mt-3 truncate h-10 w-96">
                {content}
              </p>
            </Link>
            <div id="posterInfo" className="flex justify-between">
              <div id="leftPart" className="flex items-center">
                {/* <div id="boardName" className="text-blue-400 w-36">
                  <Link
                    to={`/board?id=${board}`}
                    className=" border-solid border-2 border-blue-400 rounded-md p-1.5"
                  >
                    {boardName}
                  </Link>
                </div>
                <div id="tags" className="ml-5 text-gray-500 flex flex-wrap">
                  {tags.map((tag, index) => (
                    <p
                      className="w-24 overflow-hidden mr-2 mt-1 pr-2 border-solid border-2 rounded-md p-1.5 text-center"
                      key={index}
                    >
                      {tag}
                    </p>
                  ))}
                </div> */}
              </div>

              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {/* Add user avatar or profile image here */}
                </div>
                <div className="ml-3">
                  <Link
                    to={`/user/profile/${author}`}
                    className="text-lg font-medium text-gray-900 mr-5"
                  >
                    發文者：{authorName}
                  </Link>
                  <div className="text-gray-500">
                    {publishTime.toDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DisscussPost;
