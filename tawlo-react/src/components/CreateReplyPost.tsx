import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { PostInterface } from '../Home';
import { Link } from 'react-router-dom';

interface CreatePostProps {
  onPostCreated: (postCreated: PostInterface) => void; // Callback function to execute after a post is created
  category: string;
  motherPost: string;
  board: string;
}

interface Tag {
  id: number;
  text: string;
}

interface TagAuto {
  _id: string;
  name: string;
}

const CreatePost: React.FC<CreatePostProps> = ({
  onPostCreated,
  category,
  motherPost,
  board,
}) => {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [postError, setPostError] = useState('');
  const [relevantTags, setRelevantTags] = useState<string[]>([]);
  const [autoCompleteTags, setAutoCompleteTags] = useState<string[]>([]);
  const [userImage, setUserImage] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  const token = Cookies.get('jwtToken');
  const user = Cookies.get('userId');

  const handleContentChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setContent(event.target.value);
  };

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_DOMAIN}/api/user/info?id=${user}`)
      .then((res) => {
        setUserImage(res.data.image);
        setUserName(res.data.name);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const handleTagInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(event.target.value);
    if (event.target.value !== '') {
      axios
        .get(
          `${import.meta.env.VITE_DOMAIN}/api/post/tags/auto?search=${
            event.target.value
          }`,
        )
        .then((res) => {
          if (res.data && res.data.length > 0) {
            const resArray = res.data as TagAuto[];
            const arr = resArray.map((el) => el.name);
            setAutoCompleteTags(arr);
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
    if (event.target.value === '') {
      setAutoCompleteTags([]);
    }
  };

  const handleAddToTags = () => {
    if (tagInput.trim() !== '') {
      if (tags.length > 3) {
        setPostError('標籤最多只能四個');
        return;
      }
      let ifDuplicate = false;

      tags.forEach((el) => {
        if (el.text === tagInput) {
          ifDuplicate = true;
        }
      });

      if (ifDuplicate) {
        return;
      }

      const newItem: Tag = {
        id: new Date().getTime(),
        text: tagInput,
      };
      setTags([...tags, newItem]);

      axios
        .get(
          `${
            import.meta.env.VITE_DOMAIN
          }/api/post/tags/relevant?tag=${tagInput}`,
        )
        .then((res) => {
          const newArray = res.data.filter(
            (el: string) => !relevantTags.includes(el),
          );
          console.log(newArray);

          if (newArray.length > 0) {
            setRelevantTags([...relevantTags].concat(newArray));
          }
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          setTagInput('');
          setAutoCompleteTags([]);
        });
    }
  };

  const handleAddRecommendToTags = (tag: string) => {
    if (!tag) {
      return;
    }

    let ifDuplicate = false;

    tags.forEach((el) => {
      if (el.text === tag) {
        ifDuplicate = true;
      }
    });

    if (ifDuplicate) {
      return;
    }

    const newItem: Tag = {
      id: new Date().getTime(),
      text: tag,
    };
    setTags([...tags, newItem]);

    axios
      .get(`${import.meta.env.VITE_DOMAIN}/api/post/tags/relevant?tag=${tag}`)
      .then((res) => {
        const newArray = res.data.filter(
          (el: string) => !relevantTags.includes(el),
        );
        console.log(newArray);

        if (newArray.length > 0) {
          setRelevantTags([...relevantTags].concat(newArray));
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setTagInput('');
      });
  };

  const handleRemoveTag = (id: number) => {
    const updatedTags = tags.filter((tag) => tag.id !== id);
    setTags(updatedTags);
  };

  const handleCreatePost = async () => {
    if (category !== 'reply' && tags.length === 0) {
      setPostError('貼文至少要有一個標籤');
      return;
    }

    if (content) {
      try {
        // Make a request to create a new post
        const tagsArray = tags.map((tag) => tag.text);
        const res = await axios.post(
          `${import.meta.env.VITE_DOMAIN}/api/post`,
          {
            category: category,
            content,
            motherPost,
            board,
            tags: tagsArray,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              authorization: `Bearer ${token}`,
            },
          },
        );

        // Clear input fields
        setContent('');
        setTags([]);
        setRelevantTags([]);

        console.log(res.data.postData);

        // Trigger the callback function to notify parent component about the new post
        onPostCreated(res.data.postData);
      } catch (error) {
        console.error('Error creating post:', error);
      }
    } else {
      setPostError('A post must have content and at least one tag');
    }
  };

  return (
    <div
      style={{ width: '60rem' }}
      className=" mx-auto mt-8 mb-10 flex  overflow-hidden "
    >
      <div
        id="createPostContent"
        className="p-4 w-full bg-white shadow-lg rounded-lg border-solid border-2 border-gray-400"
      >
        <textarea
          value={content}
          onChange={handleContentChange}
          className="w-full h-32 p-2 border border-gray-300 rounded-md"
          placeholder="回答..."
        />
        {category !== 'reply' && (
          <>
            <div className="pl-2 flex items-center h-10 rounded-lg mt-2 mb-2">
              <div>標籤：</div>
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="ml-2 border-solid border-2 border-blue-300 rounded-md bg-blue-400 text-white p-1"
                >
                  <span>{tag.text}</span>
                  <button
                    className="ml-1"
                    onClick={() => handleRemoveTag(tag.id)}
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={handleTagInputChange}
              className="w-48 mt-4 p-2 border border-gray-300 rounded-md"
              placeholder="這篇貼文跟什麼相關"
              list="tagAuto"
              maxLength={15}
            />
            <datalist id="tagAuto">
              {autoCompleteTags &&
                autoCompleteTags.map((tag) => <option key={tag}>{tag}</option>)}
            </datalist>
            <button
              className="ml-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 p-1"
              onClick={handleAddToTags}
            >
              新增
            </button>
            <div className="mt-3 ml-2 flex">
              <p>其他人用了這些標籤：</p>
              {relevantTags && (
                <div className="flex flex-wrap">
                  {relevantTags.map((tag) => (
                    <div
                      key={tag}
                      onClick={() => handleAddRecommendToTags(tag)}
                      className="ml-2 border-solid border-2 border-blue-300 rounded-md bg-blue-400 hover:bg-blue-500 text-white p-1 cursor-pointer"
                    >
                      <span className="w-full">{tag}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        <div className="flex justify-end">
          <button
            onClick={handleCreatePost}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            {category === 'reply' ? '回覆' : '發布貼文'}
          </button>
        </div>

        {postError && <p className="text-red-500">{postError}</p>}
      </div>
      <div id="user_info">
        <div
          id="authorInfo"
          className="pl-6 flex items-center justify-center w-44 h-full"
        >
          <div className="flex flex-col items-center">
            <div className="flex-shrink-0">
              <div
                id="userImage"
                className={`h-28 w-28 ${
                  !userImage && 'bg-user-image'
                } bg-contain bg-no-repeat`}
              >
                {userImage && (
                  <img
                    style={{ objectFit: 'cover' }}
                    src={userImage}
                    alt="user-image"
                    className="h-full w-full rounded-full"
                  />
                )}
              </div>
            </div>
            <div className="flex mt-5 flex-col items-center">
              <Link
                to={`/user/profile/${user}`}
                style={{ backgroundColor: import.meta.env.VITE_THIRD_COLOR }}
                id="commentName"
                className="w-20 text-center text-lg rounded-lg shadow-lg text-blue-400"
              >
                {userName}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
