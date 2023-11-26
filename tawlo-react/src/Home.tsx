import { useEffect, useState } from 'react';
import Header from './components/HeaderElements/Header';
import NativePost from './components/PostElements/NativePost';
import MotherPost from './components/PostElements/MotherPost';
import axios from 'axios';
import 'dotenv';

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

  useEffect(() => {
    axios
      .get(`http://localhost:3000/api/posts/recommendation`, {
        headers: {
          Authorization:
            'Bearer ' +
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTU3NmYxZDY1ODg2Y2QyZTFjMGZhYmUiLCJpYXQiOjE3MDAzNjc2NjEsImV4cCI6MTczNjM2NzY2MX0.NwRllZjIivGtQMXIXmjPq6gRCnzw_OeERGCEB32aPWs',
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

  useEffect(() => {
    if (postsRecommend.length) {
      renderNewPosts(postsRender, postsRecommend);
      return;
    }
  }, [nowViewPosts]);

  return (
    <div>
      <Header />
      <section
        id="posts_container"
        className="w-full bg-slate-300 min-h-screen flex flex-col items-center pt-20"
      >
        {postsRender.map((post) => {
          if (post.category === 'native') {
            return (
              <NativePost
                key={post._id}
                _id={post._id}
                tags={post.tags}
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
              />
            );
          } else {
            return <MotherPost key={post._id} />;
          }
        })}
      </section>
    </div>
  );
};

export default Home;
