import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from './components/HeaderElements/Header';
import Post from './components/PostElements/Post';
import MotherPost from './components/PostElements/MotherPost';
import InfiniteScroll from 'react-infinite-scroll-component';
import axios from 'axios';
import 'dotenv';
import CreateReplyPost from './components/CreateReplyPost';
import { PostInterface } from './Home';
import ReplyPost from './components/PostElements/ReplyPost';

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

interface PostArray extends Array<PostInterface> {}

const Discussion = () => {
  const [searchParams] = useSearchParams({});
  const id = searchParams.get('id')!;

  const [postsRender, setPostsRender] = useState<PostArray>([]);
  const [paging, setPaging] = useState(0);
  const [isNextPage, setIsNextPage] = useState(true);
  const [ifAppendReplyArea, setIfAppendReplyArea] = useState(false);

  useEffect(() => {
    if (isNextPage) {
      axios
        .get(
          `${
            import.meta.env.VITE_DOMAIN
          }/api/board/post/detail?id=${id}&paging=${paging}`,
        )
        .then((res) => {
          const newArray = postsRender.concat(res.data.posts);

          setPostsRender([...newArray]);
          setIsNextPage(res.data.nextPage);
          setPaging(paging + 1);
          // console.log(res.data);
        })
        .catch((err) => console.log(err));
    }
    return;
  }, []);

  const renderNewPosts = () => {
    if (paging > 0) {
      axios
        .get(
          `${
            import.meta.env.VITE_DOMAIN
          }/api/board/post/detail?id=${id}&paging=${paging}`,
        )
        .then((res) => {
          const newArray = postsRender.concat(res.data.posts);

          setPostsRender([...newArray]);
          setIsNextPage(res.data.nextPage);
          setPaging(paging + 1);
        })
        .catch((err) => console.log(err));
    }
  };

  const handleCreatePost = (postCreated: PostInterface) => {
    setIfAppendReplyArea(false);
    setPostsRender([...postsRender, postCreated]);
  };

  const removePost = (postId: string) => {
    setPostsRender(postsRender.filter((post) => post._id !== postId));
  };

  return (
    <div>
      <Header />
      <section
        id="postsBackground"
        style={{ backgroundColor: import.meta.env.VITE_BACKGROUND_COLOR }}
        className="w-full min-h-screen flex flex-col items-center pt-28"
      >
        {postsRender[0] && (
          <div style={{ width: '37rem' }} className="h-6">
            <Link
              style={{ backgroundColor: import.meta.env.VITE_MAIN_COLOR }}
              className="px-4 w-20 h-16 ml-14 mt-3 py-2 text-white rounded-md hover:underline text-sm"
              to={`/board?id=${postsRender[0].board}`}
            >
              回到討論版
            </Link>
          </div>
        )}
        <div id="postsContainer" className="mb-14">
          <InfiniteScroll
            dataLength={postsRender.length}
            next={() => renderNewPosts()}
            hasMore={isNextPage}
            loader={<p>Loading...</p>}
            endMessage={<div className="h-6"></div>}
          >
            {postsRender[0] && (
              <MotherPost
                key={postsRender[0]._id}
                _id={postsRender[0]._id}
                floor={0}
                title={postsRender[0].title}
                tags={postsRender[0].tags}
                category="mother"
                board={postsRender[0].board}
                publishDate={postsRender[0].publish_date}
                updateDate={postsRender[0].update_date}
                author={postsRender[0].author}
                content={postsRender[0].content}
                hot={postsRender[0].hot}
                score={Math.round(postsRender[0].score)}
                liked={postsRender[0].liked}
                upvote={postsRender[0].upvote}
                downvote={postsRender[0].downvote}
                comments={postsRender[0].comments}
                clickReply={() => setIfAppendReplyArea(!ifAppendReplyArea)}
                clickDelete={(postId: string) => removePost(postId)}
              />
            )}
            {ifAppendReplyArea && (
              <CreateReplyPost
                onPostCreated={(postCreated: PostInterface) =>
                  handleCreatePost(postCreated)
                }
                category="reply"
                motherPost={id}
                board=""
              ></CreateReplyPost>
            )}
            {postsRender.map((post, index) => {
              if (index > 0) {
                return (
                  <ReplyPost
                    key={post._id}
                    _id={post._id}
                    title={postsRender[0].title}
                    board=""
                    floor={index}
                    category="reply"
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
                    clickReply={() => {}}
                    clickDelete={(postId: string) => removePost(postId)}
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

export default Discussion;
