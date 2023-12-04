import React from 'react';
import Header from './components/HeaderElements/Header';
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';

interface Item {
  id: number;
  text: string;
}

const Meeting = () => {
  const token = Cookies.get('jwtToken');

  const [meetingStatus, setMeetingStatus] = useState('');
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

  useEffect(() => {
    axios
      .get(`http://localhost:3000/api/meeting`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        console.log(res.data);

        setMeetingStatus(res.data.status);
      });
  }, []);

  useEffect(() => {
    if (meetingStatus === 'pending') {
      axios
        .get(`http://localhost:3000/api/meeting`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          console.log(res.data);
          setUserRole(res.data.meeting.user.role);
          setUserIntro(res.data.meeting.user.user_intro);
          setUserToShare(res.data.meeting.user.to_share);
          setUserToAsk(res.data.meeting.user.to_ask);
        });
    }
  }, [meetingStatus]);

  const handleJobTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJobTitle(e.target.value);
  };

  const handleToAskInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToAskInputText(e.target.value);
  };

  const handleAddToAskItem = () => {
    if (toAskInputText.trim() !== '') {
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

  const handleSubmit = () => {
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
        'http://localhost:3000/api/meeting',
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
      .delete('http://localhost:3000/api/meeting', {
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

  return (
    <>
      {!token && <Navigate to={'/user/signin'} replace={true}></Navigate>}
      <Header />
      <div className="w-full flex justify-center">
        <div className="bg-gray-200 w-1/2 mt-52">
          {meetingStatus === 'none' && (
            <div className="flex flex-col items-center pl-10 pr-10 pt-10 w-full h-full">
              <h1 className="text-2xl">請填寫配對資訊</h1>
              <div id="meetingFormContainer" className="w-full h-full  m-10">
                <div id="role">
                  <div>你的職稱？</div>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={handleJobTitleChange}
                    className="pl-2"
                    placeholder="輸入職稱..."
                  />
                </div>
                <div id="to_ask" className="mt-8">
                  <span>你想了解哪些領域？</span>
                  <div className="pl-2 flex items-center h-10 border-solid border-gray-400 border-2 rounded-lg bg-gray-200 mt-2 mb-2">
                    {toAskItems.map((item) => (
                      <div
                        key={item.id}
                        className="border-solid border-2 border-blue-300 rounded-md bg-blue-400 text-white p-1"
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
                  <input
                    type="text"
                    value={toAskInputText}
                    onChange={handleToAskInputChange}
                    className="pl-2"
                    placeholder="想分享..."
                  />
                  <button
                    className="ml-2 border-2 border-solid border-black rounded-md bg-white p-1"
                    onClick={handleAddToAskItem}
                  >
                    新增
                  </button>
                </div>
                <div id="to_share" className="mt-8">
                  <span>你想分享哪些領域？</span>
                  <div className="pl-2 flex items-center h-10 border-solid border-gray-400 border-2 rounded-lg bg-gray-200 mt-2 mb-2">
                    {toShareItems.map((item) => (
                      <div
                        key={item.id}
                        className="border-solid border-2 border-blue-300 rounded-md bg-blue-400 text-white p-1"
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
                  <input
                    type="text"
                    value={toShareInputText}
                    onChange={handleToShareInputChange}
                    className="pl-2"
                    placeholder="想了解..."
                  />
                  <button
                    className="ml-2 border-2 border-solid border-black rounded-md bg-white p-1"
                    onClick={handleAddToShareItem}
                  >
                    新增
                  </button>
                </div>
                <div id="to_share" className="mt-8">
                  <div>介紹一下自己，或是你期待聽到什麼</div>
                  <textarea
                    value={selfIntro}
                    onChange={handleSelfIntroInputChange}
                    className="pl-2 mt-2 w-full h-48"
                    placeholder="我是怎麼樣的人、我想了解某些領域的動機..."
                  />
                </div>
                <div className="mt-8">
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    onClick={handleSubmit}
                  >
                    開始配對
                  </button>
                </div>
                {postError && <p className="text-red-500">{postError}</p>}
              </div>
            </div>
          )}
          {meetingStatus === 'pending' && (
            <div className="flex flex-col items-center pl-10 pr-10 pt-10 w-full h-full">
              <h1 className="text-2xl">
                等一下喔，在看有沒有適合聊天的對象出現
              </h1>
              <div id="userInfoContainer" className="w-full h-full  m-10">
                <div id="role">
                  <div>你的職稱</div>
                  <div className="bg-gray-300 p-2 rounded-md mt-2 h-8 flex items-center">
                    {userRole}
                  </div>
                </div>
                <div id="toAsk" className="mt-5">
                  <div>你想了解的領域</div>
                  <div className="bg-gray-300 p-2 rounded-md mt-2 h-10 flex items-center">
                    {userToAsk.map((item, index) => (
                      <div
                        key={item + index}
                        className="border-solid border-2 border-blue-300 rounded-md bg-blue-400 text-white p-1 h-8"
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
                        className="border-solid border-2 border-blue-300 rounded-md bg-blue-400 text-white p-1 h-8"
                      >
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div id="userIntro" className="mt-5">
                  <div>你的自我介紹</div>
                  <div className="bg-gray-300 p-2 rounded-md mt-2 min-h-10 flex items-center">
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
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Meeting;
