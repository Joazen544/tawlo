import React from 'react';
import Header from './components/HeaderElements/Header';
import { Navigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';

const Meeting = () => {
  const { userId } = useParams();
  const token = Cookies.get('jwtToken');

  const [meetingStatus, setMeetingStatus] = useState('');

  useEffect(() => {
    axios
      .get(`http://localhost:3000/api/meeting`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setMeetingStatus(res.data.meeting_status);
      });
  }, []);
  return (
    <>
      {userId === 'not-log-in' && (
        <Navigate to={'/user/signin'} replace={true}></Navigate>
      )}
      <Header />
      {meetingStatus === 'none' && <div>weee</div>}
    </>
  );
};

export default Meeting;
