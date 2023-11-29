import Home from './Home';
import Discussion from './Discussion';
import Signin from './Signin';
import Profile from './Profile';
import { Routes, Route } from 'react-router-dom';
import './socket';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />}></Route>
      <Route path="/board/discussion" element={<Discussion />}></Route>
      <Route path="/user/signin" element={<Signin />}></Route>
      <Route path="/user/profile" element={<Profile />}></Route>
    </Routes>
  );
}

export default App;
