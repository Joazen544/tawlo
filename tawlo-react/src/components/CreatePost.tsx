import React, { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { PostInterface } from '../Home';

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
  const [title, setTitle] = useState('');
  const [relevantTags, setRelevantTags] = useState<string[]>([]);
  const [autoCompleteTags, setAutoCompleteTags] = useState<string[]>([]);

  const handleContentChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setContent(event.target.value);
  };

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

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  const token = Cookies.get('jwtToken');

  const handleCreatePost = async () => {
    if (category === 'mother' && !title) {
      setPostError('A mother post must have title');
      return;
    }

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
            title,
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
      className=" mx-auto mt-8 bg-white shadow-lg rounded-lg overflow-hidden border-solid border-2 border-gray-400"
    >
      <div id="createPostContent" className="p-4">
        {category === 'mother' && (
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="w-full mt-4 p-2 border border-gray-300 rounded-md mb-3"
            placeholder="這篇貼文的標題是什麼 （最多 40 個字符）"
            maxLength={40}
          />
        )}
        <textarea
          value={content}
          onChange={handleContentChange}
          className="w-full h-32 p-2 border border-gray-300 rounded-md"
          placeholder="內文..."
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
              className="ml-2 border-2 border-solid border-black rounded-md bg-white p-1"
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
    </div>
  );
};

export default CreatePost;
