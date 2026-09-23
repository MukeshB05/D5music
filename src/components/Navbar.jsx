```jsx
import { Link, useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import {
  getArtistbyQuery,
  getSearchData,
  getSongbyQuery,
  getSuggestionSong,
} from "../../fetch";
import MusicContext from "../context/MusicContext";
import he from "he";
import Theme from "../theme";
import { IoSearchOutline } from "react-icons/io5";

const Navbar = () => {
  const { playMusic } = useContext(MusicContext);
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // --------------------------------------------------
  // Fetch search suggestions
  // --------------------------------------------------
  const fetchSuggestions = async (searchQuery) => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setSuggestions([]);
      return;
    }

    try {
      const [result, song, artist] = await Promise.all([
        getSearchData(trimmedQuery),
        getSongbyQuery(trimmedQuery, 5),
        getArtistbyQuery(trimmedQuery, 5),
      ]);

      const allSuggestions = [];

      // --------------------------------------------------
      // Songs
      // --------------------------------------------------
      if (song?.data?.results && Array.isArray(song.data.results)) {
        allSuggestions.push(
          ...song.data.results.map((item) => ({
            type: "Song",
            name: item?.name || "",
            id: item?.id,
            duration: item?.duration || 0,
            artist: item?.artists || [],
            image:
              item?.image?.[2]?.url ||
              item?.image?.[1]?.url ||
              item?.image?.[0]?.url ||
              "",
            downloadUrl:
              item?.downloadUrl?.[4]?.url ||
              item?.downloadUrl?.[3]?.url ||
              item?.downloadUrl?.[2]?.url ||
              item?.downloadUrl?.[1]?.url ||
              item?.downloadUrl?.[0]?.url ||
              "",
          }))
        );
      }

      // --------------------------------------------------
      // Albums
      // --------------------------------------------------
      if (
        result?.data?.albums?.results &&
        Array.isArray(result.data.albums.results)
      ) {
        allSuggestions.push(
          ...result.data.albums.results.map((item) => ({
            type: "Album",
            name: item?.title || item?.name || "",
            id: item?.id,
            artist: item?.artist || item?.artists || "",
            image:
              item?.image?.[2]?.url ||
              item?.image?.[1]?.url ||
              item?.image?.[0]?.url ||
              "",
          }))
        );
      }

      // --------------------------------------------------
      // Playlists
      // --------------------------------------------------
      if (
        result?.data?.playlists?.results &&
        Array.isArray(result.data.playlists.results)
      ) {
        allSuggestions.push(
          ...result.data.playlists.results.map((item) => ({
            type: "Playlist",
            name: item?.title || item?.name || "",
            id: item?.id,
            image:
              item?.image?.[2]?.url ||
              item?.image?.[1]?.url ||
              item?.image?.[0]?.url ||
              "",
          }))
        );
      }

      // --------------------------------------------------
      // Artists
      // --------------------------------------------------
      if (
        artist?.data?.results &&
        Array.isArray(artist.data.results)
      ) {
        allSuggestions.push(
          ...artist.data.results.map((item) => ({
            type: "Artist",
            name: item?.name || "",
            id: item?.id,
            image:
              item?.image?.[2]?.url ||
              item?.image?.[1]?.url ||
              item?.image?.[0]?.url ||
              "",
          }))
        );
      }

      setSuggestions(allSuggestions);
    } catch (error) {
      console.error("Error fetching search suggestions:", error);
      setSuggestions([]);
    }
  };

  // --------------------------------------------------
  // Debounce search
  // --------------------------------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // --------------------------------------------------
  // Search input
  // --------------------------------------------------
  const handleSearchInputChange = (event) => {
    setQuery(event.target.value);
  };

  // --------------------------------------------------
  // Submit search
  // --------------------------------------------------
  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const searchTerm = query.trim();

    if (!searchTerm) return;

    navigate(`/search/${encodeURIComponent(searchTerm)}`);

    setSuggestions([]);
  };

  // --------------------------------------------------
  // Greeting
  // --------------------------------------------------
  const getGreeting = () => {
    const hours = new Date().getHours();

    if (hours < 12) {
      return "Good Morning";
    }

    if (hours < 18) {
      return "Good Afternoon";
    }

    if (hours < 21) {
      return "Good Evening";
    }

    return "Good Night";
  };

  // --------------------------------------------------
  // Get recommended songs
  // --------------------------------------------------
  const getData = async (suggestion) => {
    try {
      if (!suggestion?.id) {
        return [suggestion];
      }

      const response = await getSuggestionSong(suggestion.id);
      const suggestedSongs = Array.isArray(response?.data)
        ? response.data
        : [];

      return [suggestion, ...suggestedSongs];
    } catch (error) {
      console.error("Error fetching suggested songs:", error);
      return [suggestion];
    }
  };

  // --------------------------------------------------
  // Suggestion click
  // --------------------------------------------------
  const handleSuggestionClick = async (suggestion) => {
    setQuery("");
    setSuggestions([]);

    if (!suggestion) return;

    switch (suggestion.type) {
      case "Song": {
        try {
          const list = await getData(suggestion);

          if (typeof playMusic === "function") {
            playMusic(
              suggestion.downloadUrl || "",
              suggestion.name || "",
              suggestion.duration || 0,
              suggestion.image || "",
              suggestion.id,
              suggestion.artist || [],
              list
            );
          }
        } catch (error) {
          console.error("Unable to play song:", error);
        }

        break;
      }

      case "Album":
        if (suggestion.id) {
          navigate(`/albums/${suggestion.id}`);
        }
        break;

      case "Artist":
        if (suggestion.id) {
          navigate(`/artists/${suggestion.id}`);
        }
        break;

      case "Playlist":
        if (suggestion.id) {
          navigate(`/playlists/${suggestion.id}`);
        }
        break;

      default:
        console.warn("Unknown suggestion type:", suggestion.type);
    }
  };

  // --------------------------------------------------
  // Navbar
  // --------------------------------------------------
  return (
    <nav className="navbar flex flex-col lg:gap-10 lg:flex-row lg:items-center top-0 z-20 fixed w-full pl-1 pr-1 lg:px-2 lg:h-[4.5rem]">
      {/* Logo / Navigation */}
      <div className="flex items-center gap-[4rem] mb-2 lg:mb-0 w-fit">
        <div className="flex items-center lg:gap-[4rem] gap-5 h-[61px]">
          <Link to="/" className="flex items-center">
            <span className="bg"></span>

            <div>
              <span className="text-blue-700 font-extrabold text-2xl lg:text-3xl"></span>
              <span className="text-blue-700 font-extrabold text-2xl lg:text-3xl"></span>
            </div>
          </Link>

          {/* Mobile greeting */}
          <div className="text-lg pl-6 w-max flex self-center lg:hidden font-semibold">
            {getGreeting()}
          </div>

          {/* Theme */}
          <Theme />
        </div>

        {/* Desktop Navigation */}
        <div className="lg:flex gap-[2rem] w-[15rem] grey hidden font-semibold">
          <Link to="/Playlist">
            <h2 className="lg:text-xl text-lg">Playlist</h2>
          </Link>

          <Link to="/Favourite">
            <h2 className="lg:text-xl text-lg">Favourite</h2>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="flex-grow">
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex flex-col lg:flex-row items-center gap-2"
        >
          <div className="flex w-full">
            <input
              type="text"
              name="search"
              id="search"
              placeholder="Search for Songs, Artists, and Playlists"
              className="flex-grow h-11 p-1 pl-5 rounded-l-lg bg-transparent focus:outline-none"
              value={query}
              onChange={handleSearchInputChange}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />

            <button
              type="submit"
              aria-label="Search"
              className="search-btn h-11 w-11 rounded-r-lg flex items-center justify-center"
            >
              <IoSearchOutline className="text-2xl search" />
            </button>
          </div>

          {/* Suggestions */}
          <div
            className={`suggestionSection lg:shadow-xl absolute scroll-hide top-[2.74rem] lg:top-[4.5rem] left-0 lg:left-auto p-3 grid grid-cols-2 lg:grid-cols-3 gap-3 rounded-lg w-full max-h-[20rem] overflow-auto transition-all duration-200 ${
              suggestions.length > 0
                ? "visible opacity-100 pointer-events-auto"
                : "invisible opacity-0 pointer-events-none"
            }`}
          >
            {suggestions.map((suggestion, index) => (
              <button
                type="button"
                key={`${suggestion.type}-${suggestion.id}-${index}`}
                className="flex items-center gap-3 p-3 rounded cursor-pointer hover:opacity-80 text-left w-full"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.image ? (
                  <img
                    src={suggestion.image}
                    alt={suggestion.name || ""}
                    className="h-[3rem] w-[3rem] min-w-[3rem] rounded object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-[3rem] w-[3rem] min-w-[3rem] rounded bg-gray-500/20" />
                )}

                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm truncate">
                    {he.decode(String(suggestion.name || ""))}
                  </span>

                  <span className="text-xs">
                    {suggestion.type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </form>
      </div>
    </nav>
  );
};

export default Navbar;
```
