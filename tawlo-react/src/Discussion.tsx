import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from './components/HeaderElements/Header';
import MotherPost from './components/PostElements/MotherPost';
import ReplyPost from './components/PostElements/ReplyPost';
import InfiniteScroll from 'react-infinite-scroll-component';
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

const Discussion = () => {
  const [searchParams] = useSearchParams({});
  const id = searchParams.get('id')!;
  console.log('id: ');
  console.log(id);

  const [postsRender, setPostsRender] = useState<PostArray>([]);
  const [paging, setPaging] = useState(0);
  const [isNextPage, setIsNextPage] = useState(true);

  useEffect(() => {
    if (isNextPage) {
      axios
        .get(
          `http://localhost:3000/api/board/post/detail?id=${id}&paging=${paging}`,
        )
        .then((res) => {
          const newArray = postsRender.concat(res.data.posts);

          setPostsRender([...newArray]);
          setIsNextPage(res.data.nextPage);
          console.log(res.data);
        })
        .catch((err) => console.log(err));
    }
    return;
  }, []);

  function renderNewPosts() {
    if (paging > 0) {
      axios
        .get(
          `http://localhost:3000/api/board/post/detail?id=${id}&paging=${
            paging + 1
          }`,
        )
        .then((res) => {
          const newArray = postsRender.concat(res.data.posts);

          setPostsRender([...newArray]);
          setIsNextPage(res.data.nextPage);
          setPaging(paging + 1);
        })
        .catch((err) => console.log(err));
    }
  }

  return (
    <div>
      <Header />
      <section
        id="posts_container"
        className="w-full bg-slate-300 min-h-screen flex flex-col items-center pt-10"
      >
        <InfiniteScroll
          dataLength={postsRender.length}
          next={() => renderNewPosts()}
          hasMore={isNextPage}
          loader={<p>Loading...</p>}
          endMessage={<p>No more data to load</p>}
        >
          {postsRender.map((post) => {
            console.log('posts render: ');

            console.log(postsRender);
            if (post.category === 'mother') {
              return (
                <MotherPost
                  key={post._id}
                  _id={post._id}
                  title={post.title}
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
              return (
                <ReplyPost
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
            }
          })}
        </InfiniteScroll>
      </section>
    </div>
  );
};

export default Discussion;
