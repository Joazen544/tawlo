// import { useState } from 'react';
import Home from './Home';
import { Routes, Route } from 'react-router-dom';
// import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />}></Route>
      {/* <Route path="/product" element={<ProductPage />}></Route>
      <Route path="/profile" element={<ProfilePage />}></Route>
      <Route path="/signupin" element={<SignupinPage />}></Route>
      <Route path="/thankyou" element={<ThankYouPage />}></Route>
      <Route path="*" element={<ThankYouPage />}></Route> */}
    </Routes>
  );
}

export default App;
