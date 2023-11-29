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
  hot,
  score,
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
      .get(`http://localhost:3000/api/user/name?id=${author}`)
      .then((res) => {
        setAuthorName(res.data.name);
      })
      .catch((err) => console.log(err));
  }, [author]);

  useEffect(() => {
    console.log(board);

    axios
      .get(`http://localhost:3000/api/board/name?id=${board}`)
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
        <div id="postContent" className="p-4 flex">
          <div
            id="interactionInfo"
            className="w-40 h-32 mr-1 box-content flex flex-col justify-center items-left border-r border-gray-200"
          >
            <span className="text-gray-900">有用 {sumUpvotes}</span>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Score:</span>
              <span className="text-gray-900">{score}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Hot:</span>
              <span className="text-gray-900">{Math.round(hot)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Sum Likes:</span>
              <span className="text-gray-900">{sumLikes}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="text-gray-600">Replies:</button>
              <span className="text-gray-900">{sumReply}</span>
            </div>
          </div>
          <div
            id="content"
            className="ml-10 flex flex-col justify-between w-full"
          >
            <div>
              <div className="text-2xl text-gray-500">
                <Link to={`/board/discussion?id=${_id}`}>{title}</Link>
              </div>
              <p className="text-gray-500 text-sm mt-3">{content}</p>
            </div>
            <div id="posterInfo" className="flex justify-between">
              <div id="leftPart" className="flex items-center">
                <div id="boardName" className="text-blue-400">
                  <button className="border-solid border-2 border-blue-400 rounded-md p-0.5">
                    {boardName}
                  </button>
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

              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {/* Add user avatar or profile image here */}
                </div>
                <div className="ml-3 flex">
                  <button className="text-lg font-medium text-gray-900 mr-5">
                    {authorName}
                  </button>
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
