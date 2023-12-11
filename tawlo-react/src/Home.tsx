import { useEffect, useState } from 'react';
import Header from './components/HeaderElements/Header';
import Post from './components/PostElements/Post';
import DiscussPost from './components/PostElements/DiscussPost';
import CreatePost from './components/CreatePost';
import InfiniteScroll from 'react-infinite-scroll-component';
import axios from 'axios';
import Cookies from 'js-cookie';
import 'dotenv';
import { Link, Navigate } from 'react-router-dom';

export interface PostInterface {
  _id: string;
  category: string;
  title: string;
  tags: string[];
  publish_date: Date;
  update_date: Date;
  author: string;
  content: string;
  board: string;
  hot: number;
  score: number;
  time: number;
  liked: {
    number: number;
    users: string[];
  };
  sum_likes: number;
  sum_upvotes: number;
  sum_comments: number;
  sum_reply: number;
  upvote: {
    number: number;
    users: string[];
  };
  downvote: {
    number: number;
    users: string[];
  };
  comments: {
    number: number;
    data: [
      {
        user: string;
        content: string;
        time: Date;
        like: {
          number: number;
          users: string[];
        };
      },
    ];
  };
}

interface PostArray extends Array<PostInterface> {}

interface Board {
  _id: string;
  name: string;
}

const Home = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [postsRecommend, setPostsRecommend] = useState<PostArray>([]);
  const [postsRender, setPostsRender] = useState<PostArray>([]);

  const token = Cookies.get('jwtToken');

  const [boards, setBoards] = useState<Board[]>([]);

  useEffect(() => {
    // Fetch all board IDs
    const fetchBoardIds = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_DOMAIN}/api/boards`,
        );
        setBoards(response.data.boards);
      } catch (error) {
        console.error('Error fetching board IDs:', error);
      }
    };

    fetchBoardIds();
  }, []);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_DOMAIN}/api/posts/recommendation`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setPostsRecommend(res.data);

        renderNewPosts(postsRender, res.data);
      })
      .catch((err) => console.log(err));
    return;
  }, []);

  function renderNewPosts(
    postsNowRender: PostArray,
    postsRecommend: PostArray,
  ) {
    const nextPosts = [];
    const nextPostsId = [];
    const postsRemain = postsRecommend.length - postsNowRender.length;
    let renderTo;
    if (postsRemain > 6) {
      renderTo = postsNowRender.length + 6;
    } else {
      renderTo = postsNowRender.length + postsRemain;
    }
    for (let i = postsNowRender.length; i < renderTo; i++) {
      nextPosts.push(postsRecommend[i]);
      nextPostsId.push(postsRecommend[i]._id);
    }
    // console.log(nextPosts);
    // console.log(nextPostsId);
    axios.post(
      `${import.meta.env.VITE_DOMAIN}/api/user/read`,
      {
        posts: nextPostsId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    setPostsRender(postsNowRender.concat(nextPosts));
  }

  const handleNewPost = (newPost: PostInterface) => {
    setPostsRender([newPost, ...postsRender]);
  };

  const removePost = (postId: string) => {
    setPostsRecommend(postsRecommend.filter((post) => post._id !== postId));
    setPostsRender(postsRender.filter((post) => post._id !== postId));
  };

  return (
    <div>
      {!token && <Navigate to={'/user/signin'} replace={true}></Navigate>}
      <Header />
      <section
        id="posts_container"
        className="w-full bg-gray-50 min-h-screen flex flex-row"
      >
        <div
          id="sideBar"
          style={{ height: '20rem' }}
          className="flex-shrink-0 fixed left-0 top-48 w-48 p-4 bg-gray-200 rounded-3xl flex flex-col items-center"
        >
          <div className="mb-4 font-bold text-xl">Boards</div>
          <ul>
            {boards.map((board) => (
              <li key={board._id} className="mb-2">
                <Link
                  to={`/board?id=${board._id}`}
                  className="text-blue-400 hover:underline"
                >
                  {board.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div
          id="postsContainer"
          className="w-full bg-gray-50 min-h-screen flex flex-col items-center pt-10"
        >
          <CreatePost
            onPostCreated={(newPost: PostInterface) => handleNewPost(newPost)}
            category="native"
            motherPost=""
            board=""
          ></CreatePost>
          <InfiniteScroll
            dataLength={postsRender.length}
            next={() => {
              if (postsRender.length > 0) {
                return renderNewPosts(postsRender, postsRecommend);
              }
            }}
            hasMore={postsRender.length < postsRecommend.length}
            loader={<p>Loading...</p>}
            endMessage={<p>No more data to load</p>}
          >
            {postsRender.map((post, index) => {
              if (post.category === 'native') {
                return (
                  <Post
                    floor={index}
                    key={post._id}
                    _id={post._id}
                    tags={post.tags}
                    category="native"
                    title=""
                    board=""
                    publishDate={post.publish_date}
                    updateDate={post.update_date}
                    author={post.author}
                    content={post.content}
                    hot={post.hot}
                    score={Math.round(post.score)}
                    liked={post.liked}
                    upvote={post.upvote}
                    downvote={post.downvote}
                    comments={post.comments}
                    clickReply={() => {}}
                    clickDelete={(postId: string) => removePost(postId)}
                  />
                );
              } else {
                return (
                  <DiscussPost
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
                );
              }
            })}
          </InfiniteScroll>
        </div>
      </section>
    </div>
  );
};

export default Home;
