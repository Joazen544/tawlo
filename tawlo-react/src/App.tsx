import Home from './Home';
import Discussion from './Discussion';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />}></Route>
      <Route path="/board/discussion" element={<Discussion />}></Route>
    </Routes>
  );
}

export default App;
