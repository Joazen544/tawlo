import Home from './Home';
import Discussion from './Discussion';
import Signin from './Signin';
import Profile from './components/Profile/Profile';
import Board from './Board';
import Meeting from './Meeting';
import PostPage from './PostPage';
import Friends from './components/Profile/Friends';
import { Routes, Route } from 'react-router-dom';
import './socket';
import SearchResult from './SearchResult';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />}></Route>
      <Route path="/board/discussion" element={<Discussion />}></Route>
      <Route path="/user/signin" element={<Signin />}></Route>
      <Route path="/user/profile/:userId" element={<Profile />}></Route>
      <Route path="/user/profile/:userId/friends" element={<Friends />}></Route>
      <Route path="/board" element={<Board />}></Route>
      <Route path="/meeting" element={<Meeting />}></Route>
      <Route path="/post/:postId" element={<PostPage />}></Route>
      <Route path="/post/search" element={<SearchResult />}></Route>
    </Routes>
  );
}

export default App;
