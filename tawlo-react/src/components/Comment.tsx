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
    <div className="flex justify-between" key={index}>
      <div className="flex">
        <Link
          to={`/user/profile/${userId}`}
          id="commentName"
          className="w-20 text-left text-blue-400"
        >
          {name}
        </Link>
        <p>{comment.content}</p>
      </div>
      <div className="flex w-52 justify-end">
        <p className="mr-1">{time.toLocaleString()}</p>
      </div>
    </div>
  );
};

export default Comment;
