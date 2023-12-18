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
    axios
      .get(`${import.meta.env.VITE_DOMAIN}/api/board/name?id=${board}`)
      .then((res) => {
        setBoardName(res.data.name);
      })
      .catch((err) => console.log(err));
  }, [board]);

  //const publishTime = new Date(publishDate);

  return (
    <>
      <div style={{ width: '60rem' }} className="mx-auto mt-8  relative ">
        <div
          style={{
            backgroundColor: import.meta.env.VITE_MAIN_STRING_COLOR,
            color: import.meta.env.VITE_MAIN_COLOR,
          }}
          className="absolute left-16 -top-4 z-10 px-8 rounded-2xl border-solid border-gray-400 border-2"
        >
          <div id="info" className="flex">
            <div
              id="interactionInfo"
              className=" mr-12 flex justify-center items-center "
            >
              <span className="text-3xl ">{sumUpvotes}</span>
            </div>
            <div className="flex w-20 items-center">
              <span className="">總回覆:</span>
              <span className="ml-1">{sumReply}</span>
            </div>
            <div id="boardName" className="flex items-center ml-2">
              <div>討論版：</div>
              <Link to={`/board?id=${board}`} className="text-blue-400">
                {boardName}
              </Link>
            </div>
          </div>
        </div>
        <div
          id="postContent"
          className="px-4 pt-6 pb-6 flex justify-between items-center shadow-lg rounded-2xl border-solid border-gray-400 border-2"
          style={{
            backgroundColor: import.meta.env.VITE_MAIN_COLOR,
          }}
        >
          <div
            id="content"
            // style={{ width: '40rem' }}
            className="ml-10 flex flex-col"
          >
            <Link
              to={`/board/discussion?id=${_id}`}
              id="postContent"
              style={{
                textDecorationColor: import.meta.env.VITE_MAIN_STRING_COLOR,
              }}
              className="mt-2 hover:underline flex items-center"
            >
              <div className="text-2xl font-medium w-72 mr-5 mt-1 overflow-hidden">
                <div
                  style={{
                    color: import.meta.env.VITE_MAIN_STRING_COLOR,
                  }}
                >
                  {title}
                </div>
              </div>
              <div
                //style={{ height: '3.5rem' }}
                className="w-60  flex items-start overflow-hidden"
              >
                <p
                  style={{ maxHeight: '3.6rem' }}
                  className="text-gray-400 text-sm"
                >
                  {content}
                </p>
              </div>
            </Link>
          </div>
          <div id="right-part" className=" w-56">
            <div id="tags" className=" flex flex-wrap">
              {tags.map((tag, index) => (
                <p
                  style={{
                    color: import.meta.env.VITE_MAIN_STRING_COLOR,
                  }}
                  className={`w-24 mb-2 overflow-hidden mr-2 pl-2 pr-2 border-solid border-2 rounded-md p-0.5 text-center`}
                  key={index}
                >
                  {tag}
                </p>
              ))}
            </div>
            <div id="timeInfo" className="w-56 text-sm mt-2">
              <div
                className=" flex justify-between"
                style={{ color: import.meta.env.VITE_MAIN_STRING_COLOR }}
              >
                <Link
                  to={`/user/profile/${author}`}
                  className={`text-md mr-3 font-medium hover:underline`}
                >
                  {authorName}
                </Link>
                {new Date(publishDate).toDateString()}
              </div>
            </div>
          </div>
        </div>
        {/* <div className="ml-6 mt-6 flex text-lg items-center justify-between">
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
              <div id="leftPart" className="flex items-center"></div>

              <div className="flex items-center">
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
        </div> */}
      </div>
    </>
  );
};

export default DisscussPost;
