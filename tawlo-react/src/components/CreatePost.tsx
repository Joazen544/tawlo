import React, { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

interface CreatePostProps {
  onPostCreated: () => void; // Callback function to execute after a post is created
  category: string;
  motherPost: string;
}

const CreatePost: React.FC<CreatePostProps> = ({
  onPostCreated,
  category,
  motherPost,
}) => {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string>('');

  const handleContentChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setContent(event.target.value);
  };

  const handleTagsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTags(event.target.value);
  };

  const token = Cookies.get('jwtToken');

  const handleCreatePost = async () => {
    try {
      // Make a request to create a new post
      const post = await axios.post(
        'http://localhost:3000/api/post',
        {
          category: category,
          content,
          motherPost,
          tags: tags.split(',').map((tag) => tag.trim()), // Split tags by comma and trim whitespace
        },
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
        },
      );

      console.log(post);

      // Clear input fields
      setContent('');
      setTags('');

      // Trigger the callback function to notify parent component about the new post
      onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  return (
    <div
      style={{ width: '50rem' }}
      className="max-w-3xl mx-auto mt-8 bg-white shadow-lg rounded-lg overflow-hidden"
    >
      <div id="createPostContent" className="p-4">
        <textarea
          value={content}
          onChange={handleContentChange}
          className="w-full h-32 p-2 border border-gray-300 rounded-md"
          placeholder="Write your post content..."
        />
        {category === 'native' && (
          <input
            type="text"
            value={tags}
            onChange={handleTagsChange}
            className="w-full mt-4 p-2 border border-gray-300 rounded-md"
            placeholder="Enter up to three tags (comma-separated)"
          />
        )}

        <button
          onClick={handleCreatePost}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Create Post
        </button>
      </div>
    </div>
  );
};

export default CreatePost;
