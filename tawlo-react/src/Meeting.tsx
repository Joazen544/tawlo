import React from 'react';
import Header from './components/HeaderElements/Header';
import { Link, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import { socket } from './socket';

interface Item {
  id: number;
  text: string;
}

const Meeting = () => {
  const token = Cookies.get('jwtToken');

  const [meetingStatus, setMeetingStatus] = useState('');
  const [meetingStatusChange, setMeetingStatusChange] = useState<number>(0);
  const [meetingId, setMeetingId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [toAskInputText, setToAskInputText] = useState<string>('');
  const [toAskItems, setToAskItems] = useState<Item[]>([]);
  const [toShareInputText, setToShareInputText] = useState<string>('');
  const [toShareItems, setToShareItems] = useState<Item[]>([]);
  const [selfIntro, setSelfIntro] = useState<string>('');
  const [postError, setPostError] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [userIntro, setUserIntro] = useState<string>('');
  const [userToShare, setUserToShare] = useState<string[]>([]);
  const [userToAsk, setUserToAsk] = useState<string[]>([]);
  const [targetRole, setTargetRole] = useState<string>('');
  const [targetIntro, setTargetIntro] = useState<string>('');
  const [targetToShare, setTargetToShare] = useState<string[]>([]);
  const [targetToAsk, setTargetToAsk] = useState<string[]>([]);
  const [targetRating, setTargetRating] = useState<number>(0);
  const [targetComments, setTargetComments] = useState<string[]>([]);
  const [targetId, setTargetId] = useState<string>('');
  const [targetName, setTargetName] = useState<string>('');
  const [score, setScore] = useState<number>();
  const [comment, setComment] = useState<string>('');
  const [commentError, setCommentError] = useState<string>('');

  const [peopleSharings, setPeopleSharing] = useState<string[]>([]);
  const [peopleAskings, setPeopleAsking] = useState<string[]>([]);

  useEffect(() => {
    if (toShareInputText === '') {
      setPeopleAsking([]);
    }
    if (toShareInputText) {
      axios
        .get(
          `${
            import.meta.env.VITE_DOMAIN
          }/api/meeting/ask?search=${toShareInputText}`,
        )
        .then((res) => {
          setPeopleAsking(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [toShareInputText]);

  useEffect(() => {
    if (toAskInputText === '') {
      setPeopleSharing([]);
    }
    if (toAskInputText) {
      axios
        .get(
          `${
            import.meta.env.VITE_DOMAIN
          }/api/meeting/share?search=${toAskInputText}`,
        )
        .then((res) => {
          setPeopleSharing(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [toAskInputText]);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_DOMAIN}/api/meeting`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setMeetingStatus(res.data.status);
      });
  }, [meetingStatusChange]);

  useEffect(() => {
    if (meetingStatus === 'pending') {
      axios
        .get(`${import.meta.env.VITE_DOMAIN}/api/meeting`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          // console.log(res.data);
          setUserRole(res.data.meeting.user.role);
          setUserIntro(res.data.meeting.user.user_intro);
          setUserToShare(res.data.meeting.user.to_share);
          setUserToAsk(res.data.meeting.user.to_ask);
        });
    } else if (meetingStatus === 'checking' || meetingStatus === 'waiting') {
      axios
        .get(`${import.meta.env.VITE_DOMAIN}/api/meeting`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          // console.log(res.data);
          setUserRole(res.data.meeting.user.role);
          setUserIntro(res.data.meeting.user.user_intro);
          setUserToShare(res.data.meeting.user.to_share);
          setUserToAsk(res.data.meeting.user.to_ask);
          setTargetRole(res.data.meeting.target.role);
          setTargetIntro(res.data.meeting.target.user_intro);
          setTargetRating(res.data.meeting.target.rating);
          setTargetComments(res.data.meeting.target.meeting_comment);
          setTargetToShare(res.data.meeting.target.to_share);
          setTargetToAsk(res.data.meeting.target.to_ask);
          setMeetingId(res.data.meeting._id);
        });
    } else if (meetingStatus === 'end') {
      axios
        .get(`${import.meta.env.VITE_DOMAIN}/api/meeting`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          // console.log(res.data);
          setUserRole(res.data.meeting.user.role);
          setUserIntro(res.data.meeting.user.user_intro);
          setUserToShare(res.data.meeting.user.to_share);
          setUserToAsk(res.data.meeting.user.to_ask);
          setTargetRole(res.data.meeting.target.role);
          setTargetIntro(res.data.meeting.target.user_intro);
          setTargetRating(res.data.meeting.target.rating);
          setTargetComments(res.data.meeting.target.meeting_comment);
          setTargetToShare(res.data.meeting.target.to_share);
          setTargetToAsk(res.data.meeting.target.to_ask);
          setTargetId(res.data.meeting.target.userId);
          setMeetingId(res.data.meeting._id);
        });
    }
  }, [meetingStatus]);

  useEffect(() => {
    if (socket) {
      socket.on('notificate_2', (data) => {
        // console.log('yoyo');

        const category = data.category;
        // console.log(data);

        if (
          category === 'meet_match' ||
          category === 'meet_success' ||
          category === 'meet_fail'
        ) {
          setMeetingStatusChange((pre) => pre + 1);
        }
      });
    }
    return () => {
      if (socket) {
        socket.off('notificate_2');
      }
    };
  }, [meetingStatus]);

  useEffect(() => {
    if (targetId) {
      axios
        .get(`${import.meta.env.VITE_DOMAIN}/api/user/info?id=${targetId}`)
        .then((res) => {
          setTargetName(res.data.name);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [targetId]);

  const handleJobTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJobTitle(e.target.value);
  };

  const handleToAskInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToAskInputText(e.target.value);
  };

  const handleAddToAskItem = () => {
    if (toAskInputText.trim() !== '') {
      if (toAskItems.length > 4) {
        return;
      }
      const array = toAskItems.map((item) => item.text);
      if (array.includes(toAskInputText)) {
        return;
      }
      const newItem: Item = {
        id: new Date().getTime(),
        text: toAskInputText,
      };
      setToAskItems([...toAskItems, newItem]);
      setToAskInputText('');
    }
  };

  const handleRemoveToAskItem = (id: number) => {
    const updatedItems = toAskItems.filter((item) => item.id !== id);
    setToAskItems(updatedItems);
  };

  const handleToShareInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToShareInputText(e.target.value);
  };

  const handleAddToShareItem = () => {
    if (toShareInputText.trim() !== '') {
      if (toShareItems.length > 4) {
        return;
      }
      const array = toShareItems.map((item) => item.text);
      if (array.includes(toShareInputText)) {
        return;
      }
      const newItem: Item = {
        id: new Date().getTime(),
        text: toShareInputText,
      };
      setToShareItems([...toShareItems, newItem]);
      setToShareInputText('');
    }
  };

  const handleRemoveToShareItem = (id: number) => {
    const updatedItems = toShareItems.filter((item) => item.id !== id);
    setToShareItems(updatedItems);
  };

  const handleSelfIntroInputChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setSelfIntro(e.target.value);
  };

  const handleMeetingSubmit = () => {
    if (!jobTitle) {
      setPostError('請提供現在的職稱！或是專長');
      return;
    }
    if (!toAskItems[0]) {
      setPostError('請至少新增一項想了解的領域');
      return;
    }
    if (!toShareItems[0]) {
      setPostError('請至少新增一項可以分享的領域');
      return;
    }
    if (!selfIntro) {
      setPostError('請簡單介紹一下自己！或是有沒有想跟對方說的資訊');
      return;
    }

    // all fields have value

    axios
      .post(
        `${import.meta.env.VITE_DOMAIN}/api/meeting`,
        {
          role: jobTitle,
          userIntro: selfIntro,
          toShare: toShareItems.map((item) => item.text),
          toAsk: toAskItems.map((item) => item.text),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
        },
      )
      .then((res) => {
        setJobTitle('');
        setSelfIntro('');
        setToShareItems([]);
        setToAskItems([]);
        setToShareInputText('');
        setToAskInputText('');
        if (res.data.joinResult) {
          setMeetingStatus('checking');
        } else {
          setMeetingStatus('pending');
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleCancelPending = () => {
    axios
      .delete(`${import.meta.env.VITE_DOMAIN}/api/meeting`, {
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
      })
      .then(() => {
        setMeetingStatus('none');
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleRefuseMeeting = () => {
    axios
      .post(
        `${import.meta.env.VITE_DOMAIN}/api/meeting/${meetingId}`,
        {
          reply: 'deny',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
        },
      )
      .then(() => {
        setMeetingStatus('pending');
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleAcceptMeeting = () => {
    axios
      .post(
        `${import.meta.env.VITE_DOMAIN}/api/meeting/${meetingId}`,
        {
          reply: 'accept',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
        },
      )
      .then((res) => {
        if (res.data.situation && res.data.situation === 'first') {
          setMeetingStatus('waiting');
          return;
        } else if (res.data.situation && res.data.situation === 'second') {
          setMeetingStatus('end');
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScore(+e.target.value);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };

  const handleCommentSubmit = () => {
    if (!score) {
      setCommentError('記得給對方一個分數！');
      return;
    }
    if (score > 5 || score < 1) {
      setCommentError('分數要介於 1~5！');
      return;
    }
    if (!comment) {
      setCommentError('記得給對方一些評價，讓其他人可以參考！');
      return;
    }
    if (!targetId) {
      console.log('something is wrong, target id is missing');
      return;
    }

    axios
      .post(
        `${import.meta.env.VITE_DOMAIN}/api/meeting/${meetingId}/score`,
        {
          targetUser: targetId,
          comment: comment,
          score: score,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
        },
      )
      .then(() => {
        setMeetingStatus('none');
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <>
      {!token && <Navigate to={'/user/signin'} replace={true}></Navigate>}
      <Header />
      <div
        style={{ backgroundColor: import.meta.env.VITE_BACKGROUND_COLOR }}
        className="w-full  min-h-screen pt-14 flex justify-center"
      >
        <div className=" w-1/2 mt-20 mb-8 rounded-3xl">
          <div
            style={{
              backgroundColor: import.meta.env.VITE_SIDE_COLOR,
              color: import.meta.env.VITE_MAIN_STRING_COLOR,
            }}
            className="flex flex-col rounded-3xl items-center pl-10 pr-10 pt-10 w-full"
          >
            {meetingStatus === 'none' && (
              <>
                <h1 className="text-2xl">請填寫配對資訊</h1>
                <div id="meetingFormContainer" className="w-full h-full  m-10">
                  <div id="role">
                    <div className="mb-2">你的職稱？</div>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={handleJobTitleChange}
                      className="pl-2 text-gray-800 rounded-md"
                      placeholder="輸入職稱..."
                      maxLength={14}
                    />
                  </div>
                  <div id="to_ask" className="mt-8">
                    <div className="mb-2">你想了解哪些領域？（最多五項）</div>
                    <input
                      type="text"
                      value={toAskInputText}
                      onChange={handleToAskInputChange}
                      className="pl-2 text-gray-800 rounded-md"
                      placeholder="想分享..."
                      list="peopleSharing"
                      maxLength={14}
                    />
                    <datalist id="peopleSharing">
                      {peopleSharings.length > 0 &&
                        peopleSharings.map((tag) => (
                          <option key={tag}>{tag}</option>
                        ))}
                    </datalist>
                    <button
                      className="ml-2  rounded-md bg-blue-500 hover:bg-blue-600 p-1"
                      onClick={handleAddToAskItem}
                    >
                      新增
                    </button>
                    <div
                      style={{ minHeight: '3rem' }}
                      className="pl-2 flex items-center border-solid border-b-2  mt-2 mb-2"
                    >
                      {toAskItems.map((item) => (
                        <div
                          key={item.id}
                          className="ml-2 border-solid border-2 border-blue-300 rounded-md bg-blue-400 text-white p-1"
                        >
                          <span>{item.text}</span>
                          <button
                            className="ml-1"
                            onClick={() => handleRemoveToAskItem(item.id)}
                          >
                            X
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div id="to_share" className="mt-8">
                    <div className="mb-2">你想分享哪些領域？（最多五項）</div>
                    <input
                      type="text"
                      value={toShareInputText}
                      onChange={handleToShareInputChange}
                      className="pl-2 text-gray-800 rounded-md"
                      placeholder="想了解..."
                      list="peopleAsking"
                      maxLength={14}
                    />
                    <datalist id="peopleAsking">
                      {peopleAskings.length > 0 &&
                        peopleAskings.map((tag) => (
                          <option key={tag}>{tag}</option>
                        ))}
                    </datalist>
                    <button
                      className="ml-2 bg-blue-500 hover:bg-blue-600 rounded-md  p-1"
                      onClick={handleAddToShareItem}
                    >
                      新增
                    </button>
                    <div
                      style={{ minHeight: '3rem' }}
                      className="pl-2 flex items-center border-solid border-b-2  mt-2 mb-2"
                    >
                      {toShareItems.map((item) => (
                        <div
                          key={item.id}
                          className="ml-2 border-solid border-2 border-blue-300 rounded-md bg-blue-400 text-white p-1"
                        >
                          <span>{item.text}</span>
                          <button
                            className="ml-1"
                            onClick={() => handleRemoveToShareItem(item.id)}
                          >
                            X
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div id="to_share" className="mt-8">
                    <div>介紹一下自己，或是你期待聽到什麼</div>
                    <textarea
                      value={selfIntro}
                      onChange={handleSelfIntroInputChange}
                      className="pl-2 mt-2 w-full h-48 text-gray-800 rounded-md"
                      placeholder="我是怎麼樣的人、我想了解某些領域的動機..."
                    />
                  </div>
                  <div className="mt-8">
                    <button
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      onClick={handleMeetingSubmit}
                    >
                      開始配對
                    </button>
                  </div>
                  {postError && <p className="text-red-500">{postError}</p>}
                </div>
              </>
            )}
            {meetingStatus === 'pending' && (
              <>
                <h1 className="text-2xl">
                  等一下喔，在看有沒有適合聊天的對象出現
                </h1>
                <div id="userInfoContainer" className="w-full h-full  m-10">
                  <div id="role">
                    <div>你的職稱</div>
                    <div className="bg-gray-300 p-2 text-black rounded-md mt-2 h-8 flex items-center">
                      {userRole}
                    </div>
                  </div>
                  <div id="toAsk" className="mt-5">
                    <div>你想了解的領域</div>
                    <div className="bg-gray-300 p-2 rounded-md mt-2 h-10 flex items-center">
                      {userToAsk.map((item, index) => (
                        <div
                          key={item + index}
                          className="ml-2 border-solid border-2 border-blue-300 rounded-md bg-blue-400 text-white p-1 h-8"
                        >
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div id="toShare" className="mt-5">
                    <div>你想分享的領域</div>
                    <div className="bg-gray-300 p-2 rounded-md mt-2 h-10 flex items-center">
                      {userToShare.map((item, index) => (
                        <div
                          key={item + index}
                          className="ml-2 border-solid border-2 border-blue-300 rounded-md bg-blue-400 text-white p-1 h-8"
                        >
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div id="userIntro" className="mt-5">
                    <div>你的自我介紹</div>
                    <div className="bg-gray-300 p-2 text-black rounded-md mt-2 min-h-10 flex items-center">
                      <p>{userIntro}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCancelPending}
                    className="mt-6 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    取消
                  </button>
                </div>
              </>
            )}
            {meetingStatus === 'checking' && (
              <>
                <h1 className="text-2xl">配對到了！</h1>
                <div id="userInfoContainer" className="w-full h-full  m-10">
                  <div id="role">
                    <div>他的職稱</div>
                    <div className="bg-gray-300 text-black p-2 rounded-md mt-2 h-8 flex items-center">
                      {targetRole}
                    </div>
                  </div>
                  <div id="score" className="mt-5">
                    <div>他的評分</div>
                    <div className="bg-gray-300 text-black p-2 rounded-md mt-2 h-8 flex items-center">
                      {targetRating}
                    </div>
                  </div>
                  <div id="comments" className="mt-5">
                    <div>他的評價</div>
                    <div
                      style={{ minHeight: '2rem' }}
                      className="bg-gray-300 text-black max-h-32 overflow-y-auto p-2 rounded-md mt-2 flex flex-col justify-center"
                    >
                      {targetComments.length > 0 &&
                        targetComments.map((comment) => <p>{comment}</p>)}
                    </div>
                  </div>
                  <div id="toAsk" className="mt-5">
                    <div>他想了解的領域</div>
                    <div className="bg-gray-300 text-black p-2 rounded-md mt-2 h-10 flex items-center">
                      {targetToAsk.map((item, index) => (
                        <div
                          key={item + index}
                          className="ml-2 border-solid border-2 border-blue-300 rounded-md bg-blue-400 text-white p-1 h-8"
                        >
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div id="toShare" className="mt-5">
                    <div>他想分享的領域</div>
                    <div className="bg-gray-300 text-black p-2 rounded-md mt-2 h-10 flex items-center">
                      {targetToShare.map((item, index) => (
                        <div
                          key={item + index}
                          className="ml-2 border-solid border-2 border-blue-300 rounded-md bg-blue-400 text-white p-1 h-8"
                        >
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div id="userIntro" className="mt-5">
                    <div>他的自我介紹</div>
                    <div className="bg-gray-300 text-black p-2 rounded-md mt-2 min-h-10 flex items-center">
                      <p style={{ whiteSpace: 'pre-line' }}>{targetIntro}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleAcceptMeeting}
                    className=" bg-blue-500 hover:bg-blue-600 rounded-md px-3 mr-4 py-2"
                  >
                    接受
                  </button>
                  <button
                    onClick={handleRefuseMeeting}
                    className="mt-6 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    拒絕
                  </button>
                </div>
              </>
            )}
            {meetingStatus === 'waiting' && (
              <>
                <h1 className="text-2xl">已同意配對，等對方一下子</h1>
                <div id="userInfoContainer" className="w-full h-full  m-10">
                  <div id="role">
                    <div>他的職稱</div>
                    <div className="bg-gray-300 text-black p-2 rounded-md mt-2 h-8 flex items-center">
                      {targetRole}
                    </div>
                  </div>
                  <div id="score" className="mt-5">
                    <div>他的評分</div>
                    <div className="bg-gray-300 text-black p-2 rounded-md mt-2 h-8 flex items-center">
                      {targetRating}
                    </div>
                  </div>
                  <div id="comments" className="mt-5">
                    <div>他的評價</div>
                    <div
                      style={{ minHeight: '2rem' }}
                      className="bg-gray-300 text-black max-h-32 overflow-y-auto p-2 rounded-md mt-2 flex flex-col justify-center"
                    >
                      {targetComments.length > 0 &&
                        targetComments.map((comment) => <p>{comment}</p>)}
                    </div>
                  </div>
                  <div id="toAsk" className="mt-5">
                    <div>他想了解的領域</div>
                    <div className="bg-gray-300 text-black p-2 rounded-md mt-2 h-10 flex items-center">
                      {targetToAsk.map((item, index) => (
                        <div
                          key={item + index}
                          className="ml-2 border-solid border-2 border-blue-300 rounded-md bg-blue-400 text-white p-1 h-8"
                        >
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div id="toShare" className="mt-5">
                    <div>他想分享的領域</div>
                    <div className="bg-gray-300 text-black p-2 rounded-md mt-2 h-10 flex items-center">
                      {targetToShare.map((item, index) => (
                        <div
                          key={item + index}
                          className="ml-2 border-solid border-2 border-blue-300 rounded-md bg-blue-400 text-white p-1 h-8"
                        >
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div id="userIntro" className="mt-5">
                    <div>他的自我介紹</div>
                    <div className="bg-gray-300 text-black p-2 rounded-md mt-2 min-h-10 flex items-center">
                      <p>{targetIntro}</p>
                    </div>
                  </div>

                  <button
                    disabled
                    className=" bg-blue-400  rounded-md  px-3 mr-4 py-2"
                  >
                    已接受
                  </button>
                  <button
                    onClick={handleRefuseMeeting}
                    className="mt-6 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    拒絕
                  </button>
                </div>
              </>
            )}
            {meetingStatus === 'end' && (
              <>
                <h1 className="text-2xl">
                  成功配對！與 {targetName} 的聊天室已建立
                </h1>
                <div id="userInfoContainer" className="w-full h-full  m-10">
                  <div id="name" className="mb-2">
                    <div className="mb-2">對方的名字</div>

                    <Link
                      to={`/user/profile/${targetId}`}
                      className="w-20 text-left text-blue-400 text-xl"
                    >
                      {targetName}
                    </Link>
                  </div>
                  <div id="role">
                    <div>他的職稱</div>
                    <div className="bg-gray-300 text-black p-2 rounded-md mt-2 h-8 flex items-center">
                      {targetRole}
                    </div>
                  </div>
                  <div id="score" className="mt-5">
                    <div>他的評分</div>
                    <div className="bg-gray-300 text-black p-2 rounded-md mt-2 h-8 flex items-center">
                      {targetRating}
                    </div>
                  </div>
                  <div id="comments" className="mt-5">
                    <div>他的評價</div>
                    <div
                      style={{ minHeight: '2rem' }}
                      className="bg-gray-300 text-black max-h-32 overflow-y-auto p-2 rounded-md mt-2 flex flex-col justify-center"
                    >
                      {targetComments.length > 0 &&
                        targetComments.map((comment) => <p>{comment}</p>)}
                    </div>
                  </div>
                  <div id="toAsk" className="mt-5">
                    <div>他想了解的領域</div>
                    <div className="bg-gray-300 p-2 rounded-md mt-2 h-10 flex items-center">
                      {targetToAsk.map((item, index) => (
                        <div
                          key={item + index}
                          className="ml-2 border-solid border-2 border-blue-300 rounded-md bg-blue-400 text-white p-1 h-8"
                        >
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div id="toShare" className="mt-5">
                    <div>他想分享的領域</div>
                    <div className="bg-gray-300 p-2 rounded-md mt-2 h-10 flex items-center">
                      {targetToShare.map((item, index) => (
                        <div
                          key={item + index}
                          className="ml-2 border-solid border-2 border-blue-300 rounded-md bg-blue-400 text-white p-1 h-8"
                        >
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div id="userIntro" className="mt-5">
                    <div>他的自我介紹</div>
                    <div className="bg-gray-300 text-black p-2 rounded-md mt-2 min-h-10 flex items-center">
                      <p>{targetIntro}</p>
                    </div>
                  </div>

                  <div className="mt-10">
                    <div id="score" className="mb-2">
                      <div className="mb-2">給這位分享者 1~5 分的評價</div>
                      <input
                        type="number"
                        value={score}
                        onChange={handleScoreChange}
                        className="pl-2 w-20 text-black"
                        max={5}
                        min={1}
                        placeholder="1~5"
                      />
                    </div>
                    <div id="comment">
                      <div className="mb-2">
                        這位分享者如何？給其他配對者一個參考
                      </div>
                      <textarea
                        value={comment}
                        onChange={handleCommentChange}
                        className="pl-2 w-full h-32 text-black"
                      />
                    </div>
                    <div className="mt-5">
                      注意：送出評論後，這個頁面會消失。並且可以重新配對新的對象
                    </div>
                    <button
                      onClick={handleCommentSubmit}
                      className=" mt-3 bg-blue-500 hover:bg-blue-600 rounded-md  p-1"
                    >
                      送出評論
                    </button>
                    {commentError && (
                      <p className="text-red-500">{commentError}</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Meeting;
