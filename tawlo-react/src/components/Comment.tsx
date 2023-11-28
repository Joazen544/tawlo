// import { useState } from 'react';

interface Props {
  index: number;
  name: string;
  comment: {
    content: string;
    like: {
      number: number;
      users: string[];
    };
  };
  time: Date;
}

const Comment = ({ index, name, comment, time }: Props) => {
  //   const [likeNum, setLikeNum] = useState(comment.like.number);
  //   const [ifLike,setIfLike]=useState()

  return (
    <div className="flex justify-between" key={index}>
      <div className="flex">
        <button id="commentName" className="w-20 text-left text-blue-400">
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
