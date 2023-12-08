import Header from './components/HeaderElements/Header';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { PostInterface } from './Home';
import BoardPost from './components/PostElements/BoardPost';
import CreatePost from './components/CreatePost';

const Board = () => {
  const [searchParams] = useSearchParams({});
  const id = searchParams.get('id');

  const [postsData, setPostsData] = useState<PostInterface[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [boardName, setBoardName] = useState('');
  const [ifNextPage, setIfNextPage] = useState(false);
  const [ifAppendPostArea, setIfAppendPostArea] = useState(false);

  const fetchBoardData = async () => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_DOMAIN
        }/api/board/${id}/posts?paging=${currentPage}`,
      );
      setPostsData(response.data.posts);
      setIfNextPage(response.data.nextPage);
    } catch (error) {
      console.error('Error fetching board data:', error);
    }
  };

  useEffect(() => {
    // Fetch board data based on the board ID from the URL

    fetchBoardData();
  }, [id, currentPage]);

  useEffect(() => {
    const fetchBoardName = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_DOMAIN}/api/board/name?id=${id}`,
        );
        setBoardName(response.data.name);
      } catch (error) {
        console.error('Error fetching board data:', error);
      }
    };

    fetchBoardName();
  }, [postsData]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleNewPost = () => {
    setIfAppendPostArea(false);
    fetchBoardData();
  };

  return (
    <>
      <Header />
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-4">Board: {boardName}</h2>
        <button
          className="px-4 w-20 h-12 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-lg"
          onClick={() => setIfAppendPostArea(!ifAppendPostArea)}
        >
          Post
        </button>
        {ifAppendPostArea && (
          <CreatePost
            onPostCreated={() => handleNewPost()}
            category="mother"
            motherPost=""
            board={id || ''}
          ></CreatePost>
        )}
        <ul>
          {postsData.map((post) => (
            <BoardPost
              key={post._id}
              _id={post._id}
              tags={post.tags}
              board={post.board}
              publishDate={post.publish_date}
              updateDate={post.update_date}
              author={post.author}
              content={post.content}
              hot={post.hot}
              score={Math.round(post.score)}
              sumLikes={post.sum_likes}
              sumUpvotes={post.sum_upvotes}
              sumComments={post.sum_comments}
              sumReply={post.sum_reply}
              title={post.title}
            />
          ))}
        </ul>

        {/* Pagination */}
        {postsData.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="mr-2 bg-gray-200 px-3 py-1 rounded-md cursor-pointer"
            >
              Previous
            </button>
            <span className="mr-2">{currentPage + 1}</span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!ifNextPage}
              className="bg-gray-200 px-3 py-1 rounded-md cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Board;
