import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

interface TagsInterface {
  _id: string;
  name: string;
}

interface Props {
  handleCustomizeTags: (tags: string[]) => void;
}

const CustomizeSearch = ({ handleCustomizeTags }: Props) => {
  const [ifTagsDropDown, setIfTagsDropDown] = useState<boolean>(false);
  const [searchTagsInput, setSearchTagsInput] = useState('');
  const [tagsSelected, setTagsSelected] = useState<TagsInterface[]>([]);
  const [searchTags, setSearchTags] = useState<TagsInterface[]>([]);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      event.target instanceof Node &&
      !dropdownRef.current.contains(event.target)
    ) {
      // 點擊的位置在 dropdown 之外
      if (buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIfTagsDropDown(false);
      }
    }
  };

  useEffect(() => {
    // 添加全域點擊事件監聽器
    document.addEventListener('click', handleClickOutside);
    return () => {
      // 移除全域點擊事件監聽器
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const stringArray = tagsSelected.map((tag) => tag.name);
    handleCustomizeTags(stringArray);
  }, [tagsSelected]);

  useEffect(() => {
    const tagsStringInCookie = Cookies.get('customize_tags');
    if (tagsStringInCookie) {
      setTagsSelected(JSON.parse(tagsStringInCookie));
    }
  }, []);

  const handleTagInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTagsInput(event.target.value);
  };

  const handleTagChoose = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    setTagsSelected([
      ...tagsSelected,
      { _id: event.target.value, name: event.target.name },
    ]);
  };

  useEffect(() => {
    if (tagsSelected.length > 0) {
      const tagsSelectedString = JSON.stringify(tagsSelected);
      Cookies.set('customize_tags', tagsSelectedString);
    }
  }, [tagsSelected]);

  const handleTagCancel = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();

    const newArray = tagsSelected.filter(
      (tag) => tag.name !== event.target.name,
    );
    if (newArray.length === 0) {
      Cookies.remove('customize_tags');
    }

    setTagsSelected([...newArray]);
  };

  useEffect(() => {
    if (searchTagsInput) {
      axios
        .get(
          `${
            import.meta.env.VITE_DOMAIN
          }/api/post/tags/auto?search=${searchTagsInput}`,
        )
        .then((res) => {
          if (res.data.length > 0) {
            setSearchTags(res.data);
          }
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      setSearchTags([]);
    }
  }, [searchTagsInput]);

  return (
    <div className="mt-8 flex flex-col items-center">
      <div className="font-bold text-xl">貼文篩選</div>
      <div
        style={{ backgroundColor: import.meta.env.VITE_MAIN_COLOR }}
        id="customize_search"
        className=" rounded-lg w-32 mt-3 flex justify-center relative border-2 border-solid border-gray-400 bg-white p-2"
      >
        <div className="w-full">
          <div className="flex justify-center">
            <button
              ref={buttonRef}
              onClick={() => setIfTagsDropDown(!ifTagsDropDown)}
              style={{
                backgroundColor: import.meta.env.VITE_MAIN_STRING_COLOR,
              }}
              className="z-0 border-2 flex items-center border-solid border-gray-300 rounded-lg p-1"
            >
              標籤
              <div
                className={`${
                  ifTagsDropDown ? 'bg-right-arrow' : 'bg-caret-down'
                } ml-1 h-4 w-4 bg-contain`}
              ></div>
            </button>
          </div>

          {tagsSelected.length > 0 && (
            <div
              style={{
                backgroundColor: import.meta.env.VITE_MAIN_STRING_COLOR,
              }}
              className="border-solid border-2 border-gray-300 mt-3 p-2 rounded-lg flex flex-col items-center"
            >
              <div>已選擇</div>
              <div id="selected">
                {tagsSelected.map((tag) => (
                  <div key={tag._id} className="flex items-center">
                    <input
                      type="checkbox"
                      name={tag.name}
                      value={tag._id}
                      checked
                      onChange={handleTagCancel}
                    />
                    <label htmlFor={tag.name} className="ml-2">
                      {tag.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          {ifTagsDropDown && (
            <div
              ref={dropdownRef}
              className="absolute overflow-y-auto p-4 left-36 shadow-md -top-1 w-56 h-72 border-2 border-gray-300 border-solid bg-white rounded-lg"
            >
              <input
                value={searchTagsInput}
                type="text"
                onChange={handleTagInputChange}
                className="bg-search-image bg-no-repeat bg-right bg-contain border-2 border-solid pl-2 h-8 border-gray-400 rounded-lg"
              />
              {searchTags.filter(
                (tag) => !tagsSelected.map((el) => el.name).includes(tag.name),
              ).length > 0 && (
                <div className="border-solid border-2 border-gray-300 mt-3 p-2 rounded-lg">
                  <div id="search">
                    {searchTags.map((tag) => {
                      const stringArray = tagsSelected.map((el) => el.name);
                      if (!stringArray.includes(tag.name)) {
                        return (
                          <div key={tag._id} className="flex items-center">
                            <input
                              type="checkbox"
                              name={tag.name}
                              value={tag._id}
                              onChange={handleTagChoose}
                            />
                            <label htmlFor={tag.name} className="ml-2">
                              {tag.name}
                            </label>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomizeSearch;
