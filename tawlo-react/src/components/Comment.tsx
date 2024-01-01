import { Link } from 'react-router-dom';

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
  return (
    <div className="flex justify-between mt-1" key={index}>
      <div className="flex w-full">
        <Link
          to={`/user/profile/${userId}`}
          id="commentName"
          style={{ width: '80px' }}
          className="mr-2 text-left text-blue-400"
        >
          {name}
        </Link>
        <p className="block w-full">{comment.content}</p>
      </div>
      <div style={{ width: '250px' }} className="flex justify-end">
        <p className="mr-1">{time.toLocaleString()}</p>
      </div>
    </div>
  );
};

export default Comment;
