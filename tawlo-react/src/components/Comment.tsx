import Cookies from 'js-cookie';
import axios from 'axios';

interface Props {
  index: number;
  name: string;
  userId: string;
  comment: {
    content: string;
    like: {
      number: number;
      users: string[];
    };
  };
  time: Date;
}

const Comment = ({ index, name, comment, time, userId }: Props) => {
  const token = Cookies.get('jwtToken');

  const openChatGroup = () => {
    axios.get(`http://localhost:3000/api/messageGroup?target=${userId}`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
  };

  return (
    <div className="flex justify-between" key={index}>
      <div className="flex">
        <button
          onClick={openChatGroup}
          id="commentName"
          className="w-20 text-left text-blue-400"
        >
          {name}
        </button>
        <p>{comment.content}</p>
      </div>
      <div className="flex">
        <p className="mr-5">{time.toLocaleString()}</p>
        {/* <p>like:{comment.like.number}</p> */}
      </div>
    </div>
  );
};

export default Comment;
