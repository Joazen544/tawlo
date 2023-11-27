import Home from './Home';
import Discussion from './Discussion';
import Signin from './Signin';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />}></Route>
      <Route path="/board/discussion" element={<Discussion />}></Route>
      <Route path="/user/signin" element={<Signin />}></Route>
    </Routes>
  );
}

export default App;
