import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { SearchResultInterface } from './components/HeaderElements/SearchBar';
// import { PostInterface } from './Home';
import Cookies from 'js-cookie';
import { Navigate } from 'react-router-dom';
import Header from './components/HeaderElements/Header';
import Post from './components/PostElements/Post';
import DiscussPost from './components/PostElements/DiscussPost';

const SearchResult = () => {
  const location = useLocation();
  const [searchResults, setSearchResults] = useState<SearchResultInterface>();
  useEffect(() => {
    setSearchResults(location.state.data);
  }, []);

  const token = Cookies.get('jwtToken');

  const removePost = (postId: string) => {
    if (!searchResults) {
      return;
    }

    const newArray = searchResults.posts.filter((post) => post._id !== postId);

    setSearchResults({ nextPage: searchResults.nextPage, posts: newArray });
  };

  return (
    <div>
      {!token && <Navigate to={'/user/signin'} replace={true}></Navigate>}
      <Header handleSearch={(results) => setSearchResults(results)} />
      <section
        id="posts_container"
        style={{ backgroundColor: import.meta.env.VITE_BACKGROUND_COLOR }}
        className="w-full  min-h-screen flex flex-row"
      >
        <div
          id="postsContainer"
          style={{ backgroundColor: import.meta.env.VITE_BACKGROUND_COLOR }}
          className="w-full  min-h-screen flex flex-col items-center pt-16"
        >
          <div className="text-xl">搜尋結果：</div>
          {searchResults &&
            searchResults.posts.map((post, index) => {
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
        </div>
      </section>
    </div>
  );
};

export default SearchResult;
