/* import logo from './logo.svg'; */
import './App.css';
import * as React from 'react';

 const Action = {
  StoriesFetchSuccess: 'STORIES_FETCH_SUCCESS',
  StoriesFetchFailure: 'STORIES_FETCH_FAILURE',
  RemoveStory: 'REMOVE_STORY',
  StoriesFetchInit: 'STORIES_FETCH_INIT'
}

const API_ENDPOINT = 'https://hn.algolia.com/api/v1/search?query=';

const storiesReducer = (state, action) => {
  switch(action.type) {
    case Action.StoriesFetchInit:
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case Action.StoriesFetchSuccess:
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case Action.StoriesFetchFailure:
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    case Action.RemoveStory:
      return {
        ...state,
        data: state.filter(
          story => action.payload.objectID !== story.objectID
        ),
      };
    default:
      throw new Error();
  }
};

const useSemiPersistentState = (key, initialState) => {
  const [value, setValue] = React.useState(
    localStorage.getItem(key) || initialState
  );

  React.useEffect(() => {
    localStorage.setItem(key, value);
  }, [value, key]);

  return [value, setValue];
};

const App = () => {

  const [searchTerm, setSearchTerm] = useSemiPersistentState('search', '');

  const [url, setUrl] = React.useState(
    `${API_ENDPOINT}${searchTerm}`
  );

  const [stories, dispatchStories] = React.useReducer(
    storiesReducer,
    {data: [], isLoading: false, isError: false}
  )

  const handleFetchStories = React.useCallback(() => {
    dispatchStories({type: Action.StoriesFetchInit});

    fetch(url)
    .then((response) => response.json())
    .then(result => {
      dispatchStories({
        type: Action.StoriesFetchSuccess,
        payload: result.hits
      });
    })
    .catch(() =>
      dispatchStories({type: Action.StoriesFetchFailure})
    );
  }, [url])

  React.useEffect(() => {
    handleFetchStories();

  }, [handleFetchStories]);

  const handleRemoveStory = item => {
    dispatchStories({
      type: Action.RemoveStory,
      payload: item,
    });
  }

  const handleSearchInput = event => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = event => {
    setUrl(`${API_ENDPOINT}${searchTerm}`);
    event.preventDefault();
  };

  return(
    <div>
      <h1>My Hacker Stories</h1>

    <SearchForm
      searchTerm={searchTerm}
      onSearchInput={handleSearchInput}
      onSearchSubmit={handleSearchSubmit}
    />

      <hr />

    {stories.isError && <p>Something went wrong...</p>}
    {stories.isLoading ? (
      <p>Loading...</p>
    ) : (
      <List list={stories.data} onRemoveItem={handleRemoveStory}/>
    )}
    </div>
  );
}

const List = ({list, onRemoveItem}) => {
  return (
    <ul> 
      {list.map(item => {
        return (
          <Item
            key={item.objectID}
            item={item}
            onRemoveItem={onRemoveItem}
          />
        );
      })}
    </ul>
  )
}

const Item = ({item, onRemoveItem}) => {
  return (
    <li>
      <span>
        <a href={item.url}>{item.title}</a>
      </span>
      <span> {item.author}</span>
      <span> {item.num_comments}</span>
      <span> {item.points}</span>
      <span>
        <button type="button" onClick={onRemoveItem.bind(null, item)}>
          Dismiss
        </button>
      </span>
    </li>
  )
}

const InputWithLabel = ({
  id,
  label,
  value,
  type = 'text',
  onInputChange,
  isFocused,
  children,
}) => {
  const inputRef = React.useRef();

  React.useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused])
  return (
    <>
      <label htmlFor={id}>{children}</label>
      &nbsp;
      <input
        ref={inputRef}
        id={id}
        type={type}
        value={value}
        autoFocus={isFocused}
        onChange={onInputChange}
      />
    </>
  )
}

const SearchForm = ({
  searchTerm,
  onSearchInput,
  onSearchSubmit,
}) => {
  <form onSubmit={onSearchSubmit}>
    <InputWithLabel
      id="search"
      value={searchTerm}
      isFocused
      onInputChange={onSearchInput}
    >
      <strong>Search:</strong>
    </InputWithLabel>

    <button type="submit" disabled={!searchTerm}>
      Submit
    </button>
  </form>
}

export default App;
