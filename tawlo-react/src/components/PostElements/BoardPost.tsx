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
  sequence: number;
}

const BoardPost = ({
  _id,
  publishDate,
  updateDate,
  author,
  lastReply,
  tags,
  content,
  sequence,
  // sumLikes,
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
        style={{
          width: '60rem',
          backgroundColor: import.meta.env.VITE_BACKGROUND_COLOR,
        }}
        className=" mx-auto mt-16 z-10 relative  "
      >
        <div
          style={{
            backgroundColor: `${
              sequence === 0
                ? import.meta.env.VITE_SIDE_COLOR
                : import.meta.env.VITE_THIRD_COLOR
            }`,
            color: `${
              sequence === 0
                ? import.meta.env.VITE_THIRD_COLOR
                : import.meta.env.VITE_SIDE_COLOR
            }`,
          }}
          className="absolute left-16 -top-4 z-10 px-8 rounded-2xl border-solid border-gray-400 border-2"
        >
          <div id="info" className="flex">
            <div
              id="interactionInfo"
              className=" mr-12 flex justify-center items-center "
            >
              <span
                className={`${
                  sumUpvotes > HOT_POST_SCORE ? 'text-red-500' : ''
                } text-3xl `}
              >
                {sumUpvotes}
              </span>
            </div>
            <div className="flex w-20 items-center">
              <span className="">總回覆:</span>
              <span className="ml-1">{sumReply}</span>
            </div>
          </div>
        </div>
        <div
          id="postContent"
          className="px-4 pt-6 pb-6 flex justify-between items-center shadow-lg rounded-2xl border-solid border-gray-400 border-2"
          style={{
            backgroundColor: `${
              sequence === 0
                ? import.meta.env.VITE_THIRD_COLOR
                : import.meta.env.VITE_SIDE_COLOR
            }`,
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
                textDecorationColor: `${
                  sequence === 0
                    ? import.meta.env.VITE_SIDE_COLOR
                    : import.meta.env.VITE_THIRD_COLOR
                }`,
              }}
              className="mt-2 hover:underline flex items-center"
            >
              <div className="text-2xl font-medium w-72 mr-5 mt-1 overflow-hidden">
                <div
                  style={{
                    color: `${
                      sequence === 0
                        ? import.meta.env.VITE_SIDE_COLOR
                        : import.meta.env.VITE_THIRD_COLOR
                    }`,
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
                    color: `${
                      sequence === 0
                        ? import.meta.env.VITE_SIDE_COLOR
                        : import.meta.env.VITE_THIRD_COLOR
                    }`,
                    borderColor: `${
                      sequence === 0
                        ? import.meta.env.VITE_SIDE_COLOR
                        : import.meta.env.VITE_THIRD_COLOR
                    }`,
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
                style={{
                  color: `${
                    sequence === 0
                      ? import.meta.env.VITE_SIDE_COLOR
                      : import.meta.env.VITE_THIRD_COLOR
                  }`,
                }}
              >
                <Link
                  to={`/user/profile/${author}`}
                  className={`text-md mr-3 font-medium hover:underline`}
                >
                  {authorName}
                </Link>
                {new Date(publishDate).toDateString()}
              </div>
              {lastReply && (
                <div
                  className="flex justify-between"
                  style={{
                    color: `${
                      sequence === 0
                        ? import.meta.env.VITE_SIDE_COLOR
                        : import.meta.env.VITE_THIRD_COLOR
                    }`,
                  }}
                >
                  <Link
                    to={`/user/profile/${lastReply}`}
                    className={`text-md mr-3 font-medium hover:underline`}
                  >
                    {lastReplyName}
                  </Link>
                  {new Date(updateDate).toDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BoardPost;
