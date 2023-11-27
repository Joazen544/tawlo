import React, { useState } from 'react';
import axios from 'axios';

interface CreateNativePostProps {
  onPostCreated: () => void; // Callback function to execute after a post is created
}

const CreateNativePost: React.FC<CreateNativePostProps> = ({
  onPostCreated,
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

  const handleCreatePost = async () => {
    try {
      // Make a request to create a new post
      const post = await axios.post(
        'http://localhost:3000/api/post',
        {
          category: 'native', // Assuming 'native' as the category for native posts
          content,
          tags: tags.split(',').map((tag) => tag.trim()), // Split tags by comma and trim whitespace
        },
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTU3NmYxZDY1ODg2Y2QyZTFjMGZhYmUiLCJpYXQiOjE3MDAzNjc2NjEsImV4cCI6MTczNjM2NzY2MX0.NwRllZjIivGtQMXIXmjPq6gRCnzw_OeERGCEB32aPWs`,
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
        <input
          type="text"
          value={tags}
          onChange={handleTagsChange}
          className="w-full mt-4 p-2 border border-gray-300 rounded-md"
          placeholder="Enter up to three tags (comma-separated)"
        />
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

export default CreateNativePost;
