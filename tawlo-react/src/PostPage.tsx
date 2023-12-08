import Post from './components/PostElements/Post';
import axios from 'axios';
import { PostInterface } from './Home';
import { Navigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from './components/HeaderElements/Header';

const PostPage = () => {
  const [postInfo, setPostInfo] = useState<PostInterface>();
  const [motherPostId, setMotherPostId] = useState<string>('');
  const [ifDiscussion, setIfDiscussion] = useState<boolean>(false);

  const { postId } = useParams();

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_DOMAIN}/api/post?id=${postId}`)
      .then((res) => {
        if (res.data.category === 'native') {
          setPostInfo(res.data);
        } else if (res.data.category === 'mother') {
          setMotherPostId(res.data._id);
          setIfDiscussion(true);
        } else if (res.data.category === 'reply') {
          setMotherPostId(res.data.mother_post);
          setIfDiscussion(true);
        }
        console.log('getting data');

        console.log(res.data);
      })
      .catch((err) => {
        console.log('logging error');

        console.log(err);
      });
  }, []);

  return (
    <div>
      {ifDiscussion && (
        <Navigate to={`/board/discussion?id=${motherPostId}`}></Navigate>
      )}
      <Header />
      <section
        id="posts_container"
        className="w-full bg-gray-50 min-h-screen flex flex-row"
      >
        <div
          id="postsContainer"
          className="w-full bg-gray-50 min-h-screen flex flex-col items-center pt-10"
        >
          {postInfo && (
            <Post
              floor={0}
              key={postInfo._id}
              _id={postInfo._id}
              tags={postInfo.tags}
              category={postInfo.category}
              title={postInfo.title || ''}
              board={postInfo.board || ''}
              publishDate={postInfo.publish_date}
              updateDate={postInfo.update_date}
              author={postInfo.author}
              content={postInfo.content}
              hot={postInfo.hot}
              score={Math.round(postInfo.score)}
              liked={postInfo.liked}
              upvote={postInfo.upvote}
              downvote={postInfo.downvote}
              comments={postInfo.comments}
              clickReply={() => {}}
            />
          )}
        </div>
      </section>
    </div>
  );
};

export default PostPage;
