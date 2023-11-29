import { useEffect, useState } from 'react';
import Header from './components/HeaderElements/Header';
import Post from './components/PostElements/Post';
import BoardPost from './components/PostElements/BoardPost';
import CreatePost from './components/CreatePost';
import InfiniteScroll from 'react-infinite-scroll-component';
import axios from 'axios';
import 'dotenv';
import Cookies from 'js-cookie';

export interface Post {
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

interface PostArray extends Array<Post> {}

const Home = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [postsRecommend, setPostsRecommend] = useState<PostArray>([]);
  const [postsRender, setPostsRender] = useState<PostArray>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [nowViewPosts] = useState(0);
  // const [authorsName, setAuthorsName] = useState<string[]>([]);

  const token = Cookies.get('jwtToken');

  useEffect(() => {
    axios
      .get(`http://localhost:3000/api/posts/recommendation`, {
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
    const postsRemain = postsRecommend.length - postsNowRender.length;
    let renderTo;
    if (postsRemain > 6) {
      renderTo = postsNowRender.length + 6;
    } else {
      renderTo = postsNowRender.length + postsRemain;
    }
    for (let i = postsNowRender.length; i < renderTo; i++) {
      nextPosts.push(postsRecommend[i]);
    }

    setPostsRender(postsNowRender.concat(nextPosts));
  }

  return (
    <div>
      <Header />
      <section
        id="posts_container"
        className="w-full bg-slate-300 min-h-screen flex flex-col items-center pt-10"
      >
        <CreatePost
          onPostCreated={() => console.log(1)}
          category="native"
          motherPost=""
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
          {postsRender.map((post) => {
            if (post.category === 'native') {
              return (
                <Post
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
                />
              );
            } else {
              return (
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
              );
            }
          })}
        </InfiniteScroll>
      </section>
    </div>
  );
};

export default Home;
