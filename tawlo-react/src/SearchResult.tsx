import { useLocation } from 'react-router-dom';

const SearchResult = () => {
  const location = useLocation();

  return <div>{location.state.data.posts[0]._id}</div>;
};

export default SearchResult;
