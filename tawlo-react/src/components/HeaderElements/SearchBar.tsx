import { useState, useRef, useEffect } from 'react';
import { PostInterface } from '../../Home';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Tag {
  id: number;
  text: string;
}

interface TagAuto {
  _id: string;
  name: string;
}

export interface SearchResultInterface {
  posts: PostInterface[];
  nextPage: boolean;
}

interface Props {
  handleSearchResult?: (searchResult: SearchResultInterface) => void;
}

const SearchBar = ({ handleSearchResult }: Props) => {
  const [ifSelected, setIfSelected] = useState<boolean>(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [autoCompleteTags, setAutoCompleteTags] = useState<string[]>([]);
  const [postError, setPostError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResultInterface>();

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      event.target instanceof Node &&
      !dropdownRef.current.contains(event.target)
    ) {
      console.log('123');

      setIfSelected(false);
    }
  };

  useEffect(() => {
    if (searchResult && handleSearchResult) {
      handleSearchResult(searchResult);
    }
  }, [searchResult]);

  const handleTagInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(event.target.value);
    if (event.target.value !== '') {
      axios
        .get(
          `${import.meta.env.VITE_DOMAIN}/api/post/tags/auto?search=${
            event.target.value
          }`,
        )
        .then((res) => {
          if (res.data && res.data.length > 0) {
            const resArray = res.data as TagAuto[];
            const arr = resArray.map((el) => el.name);
            setAutoCompleteTags(arr);
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
    if (event.target.value === '') {
      setAutoCompleteTags([]);
    }
  };

  const handleSearchInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setSearchInput(event.target.value);
  };

  const handleAddToTags = () => {
    if (tagInput.trim() !== '') {
      if (tags.length > 3) {
        setPostError('標籤最多只能四個');
        return;
      }
      let ifDuplicate = false;

      tags.forEach((el) => {
        if (el.text === tagInput) {
          ifDuplicate = true;
        }
      });

      if (ifDuplicate) {
        return;
      }

      const newItem: Tag = {
        id: new Date().getTime(),
        text: tagInput,
      };
      setTagInput('');
      setTags([...tags, newItem]);
    }
  };

  const handleSearchSubmit = () => {
    const stringArray: string[] = searchInput.split(' ');
    const shouldArray: string[] = [];
    const mustArray: string[] = [];

    stringArray.forEach((word) => {
      if (word.startsWith('"') && word.endsWith('"')) {
        mustArray.push(word);
      } else {
        shouldArray.push(word);
      }
    });
    const tagsArray = tags.map((tag) => tag.text);

    axios
      .get(`${import.meta.env.VITE_DOMAIN}/api/post/search`, {
        params: {
          should: shouldArray,
          must: mustArray,
          tags: tagsArray,
        },
        paramsSerializer: {
          indexes: null,
        },
      })
      .then((res) => {
        console.log(res.data);
        setSearchResult(res.data);
        navigate('/post/search', { state: { data: res.data } });
        // if (handleSearchResult) {
        //   handleSearchResult(res.data);
        // }
      })
      .catch((err) => {
        console.log(err);
      });
    console.log(stringArray);
  };

  const handleRemoveTag = (id: number, event: React.MouseEvent) => {
    event.stopPropagation();

    const updatedTags = tags.filter((tag) => tag.id !== id);
    setTags(updatedTags);
  };

  useEffect(() => {
    // 添加全域點擊事件監聽器
    document.addEventListener('click', handleClickOutside);
    return () => {
      // 移除全域點擊事件監聽器
      document.removeEventListener('click', handleClickOutside);
    };
  }, [tags]);

  return (
    <div
      id="search_bar"
      ref={dropdownRef}
      className="ml-3 flex items-center"
      onClick={() => setIfSelected(true)}
    >
      <div className="ml-3 flex items-center h-9 ">
        <input
          type="text"
          style={{
            backgroundSize: '1.5rem',
            backgroundOrigin: 'content-box',
            paddingRight: '5px',
          }}
          onChange={handleSearchInputChange}
          className={`${
            ifSelected ? 'w-96' : 'w-52'
          } h-8 border-solid border-slate-300 border-2 rounded-2xl  bg-right bg-contain pl-3`}
        />
        <div
          style={{ backgroundOrigin: 'content-box' }}
          onClick={handleSearchSubmit}
          className="bg-search-image bg-no-repeat bg-right bg-contain h-10 w-10 pr-3 cursor-pointer"
        ></div>
      </div>
      {ifSelected && (
        <div className="absolute h-64 overflow-y-auto left-28 top-10 mt-2 w-96 bg-white border border-gray-200 rounded-md shadow-md">
          <div className="ml-3 mt-4">
            <h1 className="text-lg">搜尋輸入建議</h1>
            <div className="mt-1">「後端」或「資料庫」，例： 後端 資料庫</div>
            <div>結果包含「後端」，例： "後端" 資料庫</div>
          </div>
          <div className="ml-2 mt-4 pr-5">
            <h1 className="text-lg">搜尋特定標籤文章</h1>
            <div className=" flex w-full items-center h-10 rounded-lg bg-gray-200 mt-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="ml-2 border-solid border-2 border-blue-300 rounded-md bg-blue-400 text-white p-1"
                >
                  <span>{tag.text}</span>
                  <button
                    className="ml-1"
                    onClick={(event) => handleRemoveTag(tag.id, event)}
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
            <div className="w-full">
              <input
                type="text"
                value={tagInput}
                onChange={handleTagInputChange}
                className="w-36 mt-4 p-2 border border-gray-300 rounded-md"
                placeholder="輸入標籤"
                list="tagAuto"
                maxLength={15}
              />
              <datalist id="tagAuto">
                {autoCompleteTags &&
                  autoCompleteTags.map((tag) => (
                    <option key={tag}>{tag}</option>
                  ))}
              </datalist>
              <button
                className="ml-2 mt-2 border-2 border-solid border-black rounded-md bg-white hover:bg-gray-50 p-1"
                onClick={handleAddToTags}
              >
                新增
              </button>
              {postError && (
                <span className="text-red-300 ml-2">{postError}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
