import { Link, useNavigate } from "react-router-dom";
import { useState, useContext, useEffect, useRef } from "react";
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

const FALLBACK_IMAGE = "/Unknown.png";

/* =========================================================
   HELPERS
========================================================= */

const decodeText = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  try {
    return he.decode(String(value));
  } catch {
    return String(value);
  }
};

const getImageUrl = (value) => {
  if (!value) {
    return FALLBACK_IMAGE;
  }

  // String
  if (typeof value === "string") {
    return value || FALLBACK_IMAGE;
  }

  // Array
  if (Array.isArray(value)) {
    for (let i = value.length - 1; i >= 0; i -= 1) {
      const item = value[i];

      if (typeof item === "string" && item) {
        return item;
      }

      if (item && typeof item === "object") {
        const url = item.url || item.link || item.src;

        if (url) {
          return url;
        }
      }
    }

    return FALLBACK_IMAGE;
  }

  // Object
  if (typeof value === "object") {
    return (
      value.url ||
      value.link ||
      value.src ||
      FALLBACK_IMAGE
    );
  }

  return FALLBACK_IMAGE;
};

const getAudioUrl = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    for (let i = value.length - 1; i >= 0; i -= 1) {
      const item = value[i];

      if (typeof item === "string" && item) {
        return item;
      }

      if (item && typeof item === "object") {
        const url =
          item.url ||
          item.link ||
          item.src;

        if (url) {
          return url;
        }
      }
    }

    return "";
  }

  if (typeof value === "object") {
    return (
      value.url ||
      value.link ||
      value.src ||
      ""
    );
  }

  return "";
};

const getArtistName = (artists) => {
  if (!artists) {
    return "";
  }

  if (typeof artists === "string") {
    return decodeText(artists);
  }

  if (Array.isArray(artists)) {
    return artists
      .map((artist) => {
        if (!artist) {
          return "";
        }

        if (typeof artist === "string") {
          return decodeText(artist);
        }

        return decodeText(
          artist.name ||
            artist.title ||
            artist.artist ||
            ""
        );
      })
      .filter(Boolean)
      .join(", ");
  }

  if (typeof artists === "object") {
    return decodeText(
      artists.name ||
        artists.title ||
        artists.artist ||
        ""
    );
  }

  return "";
};

const getSongId = (song) => {
  if (!song) {
    return "";
  }

  return (
    song.id ||
    song.songId ||
    song.song_id ||
    song.trackId ||
    ""
  );
};

/* =========================================================
   NAVBAR
========================================================= */

const Navbar = () => {
  const { playMusic } = useContext(MusicContext);
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const mountedRef = useRef(true);
  const searchRequestRef = useRef(0);

  /* =======================================================
     COMPONENT CLEANUP
  ======================================================= */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* =======================================================
     FETCH SEARCH SUGGESTIONS
  ======================================================= */

  const fetchSuggestions = async (searchQuery) => {
    const value = String(searchQuery || "").trim();

    if (!value) {
      if (mountedRef.current) {
        setSuggestions([]);
        setIsSearching(false);
      }

      return;
    }

    const requestId = ++searchRequestRef.current;

    if (mountedRef.current) {
      setIsSearching(true);
    }

    try {
      const [result, song, artist] =
        await Promise.allSettled([
          getSearchData(value),
          getSongbyQuery(value, 5),
          getArtistbyQuery(value, 5),
        ]);

      // Ignore an older request
      if (
        requestId !== searchRequestRef.current ||
        !mountedRef.current
      ) {
        return;
      }

      const allSuggestions = [];

      /* =====================================================
         SONGS
      ===================================================== */

      if (song.status === "fulfilled") {
        const songResults =
          song.value?.data?.results ||
          song.value?.results ||
          [];

        if (Array.isArray(songResults)) {
          songResults.forEach((item) => {
            if (!item) {
              return;
            }

            const id = getSongId(item);

            if (!id) {
              return;
            }

            const downloadUrl = getAudioUrl(
              item.downloadUrl ||
                item.download_url ||
                item.audio ||
                item.audioUrl ||
                item.url
            );

            allSuggestions.push({
              type: "Song",

              name: decodeText(
                item.name ||
                  item.title ||
                  "Unknown Song"
              ),

              id,

              duration:
                Number(item.duration) || 0,

              artist: getArtistName(
                item.artists ||
                  item.artist ||
                  item.primaryArtists
              ),

              image: getImageUrl(item.image),

              downloadUrl,

              album:
                item.album?.name ||
                item.album?.title ||
                item.albumName ||
                "",

              original: item,
            });
          });
        }
      }

      /* =====================================================
         ALBUMS
      ===================================================== */

      if (result.status === "fulfilled") {
        const albumResults =
          result.value?.data?.albums?.results ||
          result.value?.albums?.results ||
          [];

        if (Array.isArray(albumResults)) {
          albumResults.forEach((item) => {
            if (!item || !item.id) {
              return;
            }

            allSuggestions.push({
              type: "Album",

              name: decodeText(
                item.title ||
                  item.name ||
                  "Unknown Album"
              ),

              id: item.id,

              artist: getArtistName(
                item.artist ||
                  item.artists
              ),

              image: getImageUrl(item.image),

              original: item,
            });
          });
        }
      }

      /* =====================================================
         PLAYLISTS
      ===================================================== */

      if (result.status === "fulfilled") {
        const playlistResults =
          result.value?.data?.playlists?.results ||
          result.value?.playlists?.results ||
          [];

        if (Array.isArray(playlistResults)) {
          playlistResults.forEach((item) => {
            if (!item || !item.id) {
              return;
            }

            allSuggestions.push({
              type: "Playlist",

              name: decodeText(
                item.title ||
                  item.name ||
                  "Unknown Playlist"
              ),

              id: item.id,

              image: getImageUrl(item.image),

              original: item,
            });
          });
        }
      }

      /* =====================================================
         ARTISTS
      ===================================================== */

      if (artist.status === "fulfilled") {
        const artistResults =
          artist.value?.data?.results ||
          artist.value?.results ||
          [];

        if (Array.isArray(artistResults)) {
          artistResults.forEach((item) => {
            if (!item || !item.id) {
              return;
            }

            allSuggestions.push({
              type: "Artist",

              name: decodeText(
                item.name ||
                  item.title ||
                  "Unknown Artist"
              ),

              id: item.id,

              image: getImageUrl(item.image),

              original: item,
            });
          });
        }
      }

      /* =====================================================
         REMOVE DUPLICATES
      ===================================================== */

      const uniqueSuggestions = [];
      const seen = new Set();

      allSuggestions.forEach((item) => {
        const key = `${item.type}-${item.id}`;

        if (!seen.has(key)) {
          seen.add(key);
          uniqueSuggestions.push(item);
        }
      });

      setSuggestions(uniqueSuggestions);
    } catch (error) {
      console.error(
        "Navbar search error:",
        error
      );

      if (
        requestId === searchRequestRef.current &&
        mountedRef.current
      ) {
        setSuggestions([]);
      }
    } finally {
      if (
        requestId === searchRequestRef.current &&
        mountedRef.current
      ) {
        setIsSearching(false);
      }
    }
  };

  /* =======================================================
     DEBOUNCE SEARCH
  ======================================================= */

  useEffect(() => {
    const value = String(query || "").trim();

    if (!value) {
      setSuggestions([]);
      setIsSearching(false);

      return undefined;
    }

    const timer = setTimeout(() => {
      fetchSuggestions(value);
    }, 350);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  /* =======================================================
     SEARCH INPUT
  ======================================================= */

  const handleSearchInputChange = (event) => {
    setQuery(event.target.value);
  };

  /* =======================================================
     SEARCH SUBMIT
  ======================================================= */

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const searchTerm = String(query || "").trim();

    if (!searchTerm) {
      return;
    }

    setSuggestions([]);
    setIsSearching(false);

    navigate(
      `/search/${encodeURIComponent(searchTerm)}`
    );
  };

  /* =======================================================
     GREETING
  ======================================================= */

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

  /* =======================================================
     GET SUGGESTION SONGS
  ======================================================= */

  const getData = async (suggestion) => {
    if (!suggestion?.id) {
      return [suggestion];
    }

    try {
      const response =
        await getSuggestionSong(suggestion.id);

      let suggestedSongs =
        response?.data?.results ||
        response?.data ||
        response?.results ||
        [];

      if (!Array.isArray(suggestedSongs)) {
        suggestedSongs = [];
      }

      return [
        suggestion,
        ...suggestedSongs,
      ];
    } catch (error) {
      console.error(
        "Suggestion songs error:",
        error
      );

      return [suggestion];
    }
  };

  /* =======================================================
     SUGGESTION CLICK
  ======================================================= */

  const handleSuggestionClick = async (
    suggestion
  ) => {
    if (!suggestion) {
      return;
    }

    setQuery("");
    setSuggestions([]);
    setIsSearching(false);

    /* =====================================================
       SONG
    ===================================================== */

    if (suggestion.type === "Song") {
      try {
        const list = await getData(
          suggestion
        );

        const audio =
          suggestion.downloadUrl ||
          getAudioUrl(
            suggestion.original?.downloadUrl
          ) ||
          getAudioUrl(
            suggestion.original?.download_url
          ) ||
          getAudioUrl(
            suggestion.original?.audio
          ) ||
          getAudioUrl(
            suggestion.original?.audioUrl
          ) ||
          getAudioUrl(
            suggestion.original?.url
          );

        if (!audio) {
          console.error(
            "No audio URL found for song:",
            suggestion
          );

          if (suggestion.id) {
            navigate(
              `/search/${encodeURIComponent(
                suggestion.name || ""
              )}`
            );
          }

          return;
        }

        if (
          typeof playMusic !== "function"
        ) {
          console.error(
            "playMusic is not available in MusicContext."
          );

          return;
        }

        /*
          Queue:
          clicked song + API suggestions.

          This allows the Player context to handle
          Next / Previous / Autoplay.
        */

        const queue = Array.isArray(list)
          ? list
          : [suggestion];

        playMusic(
          audio,
          suggestion.name ||
            "Unknown Song",
          suggestion.duration || 0,
          suggestion.image ||
            FALLBACK_IMAGE,
          suggestion.id,
          suggestion.artist || "",
          queue
        );
      } catch (error) {
        console.error(
          "Song playback error:",
          error
        );
      }

      return;
    }

    /* =====================================================
       ALBUM
    ===================================================== */

    if (suggestion.type === "Album") {
      navigate(
        `/albums/${encodeURIComponent(
          String(suggestion.id)
        )}`
      );

      return;
    }

    /* =====================================================
       ARTIST
    ===================================================== */

    if (suggestion.type === "Artist") {
      navigate(
        `/artists/${encodeURIComponent(
          String(suggestion.id)
        )}`
      );

      return;
    }

    /* =====================================================
       PLAYLIST
    ===================================================== */

    if (suggestion.type === "Playlist") {
      navigate(
        `/playlists/${encodeURIComponent(
          String(suggestion.id)
        )}`
      );

      return;
    }

    console.warn(
      "Unknown suggestion type:",
      suggestion.type
    );
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <nav className="navbar flex flex-col lg:gap-10 lg:flex-row lg:items-center top-0 z-20 fixed w-full pl-1 pr-1 lg:px-2 lg:h-[4.5rem]">

      {/* ===================================================
          LOGO / NAVIGATION
      =================================================== */}

      <div className="flex items-center gap-[4rem] mb-2 lg:mb-0 w-fit">

        <div className="flex items-center lg:gap-[4rem] gap-5 h-[61px]">

          {/* Logo */}

          <Link
            to="/"
            className="flex items-center"
          >
            <span className="bg"></span>

            <div>
              <span className="text-blue-700 font-extrabold text-2xl lg:text-3xl">
                MusicMax
              </span>
            </div>
          </Link>

          {/* Mobile Greeting */}

          <div className="text-lg pl-6 w-max flex self-center lg:hidden font-semibold">
            {getGreeting()}
          </div>

          {/* Theme */}

          <Theme />

        </div>

        {/* Desktop Navigation */}

        <div className="lg:flex gap-[2rem] w-[15rem] grey hidden font-semibold">

          <Link to="/Playlist">
            <h2 className="lg:text-xl text-lg">
              Playlist
            </h2>
          </Link>

          <Link to="/Favourite">
            <h2 className="lg:text-xl text-lg">
              Favourite
            </h2>
          </Link>

        </div>
      </div>

      {/* ===================================================
          SEARCH
      =================================================== */}

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
              onChange={
                handleSearchInputChange
              }
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

          {/* =================================================
              SEARCH SUGGESTIONS
          ================================================= */}

          <div
            className={`suggestionSection lg:shadow-xl absolute scroll-hide top-[2.74rem] lg:top-[4.5rem] left-0 lg:left-auto p-3 grid grid-cols-2 lg:grid-cols-3 gap-3 rounded-lg w-full max-h-[20rem] overflow-auto transition-all duration-200 ${
              suggestions.length > 0
                ? "visible opacity-100 pointer-events-auto"
                : "invisible opacity-0 pointer-events-none"
            }`}
          >

            {suggestions.map(
              (suggestion, index) => (

                <button
                  type="button"
                  key={`${suggestion.type}-${suggestion.id}-${index}`}
                  className="flex items-center gap-3 p-3 rounded cursor-pointer hover:opacity-80 text-left w-full"
                  onClick={() =>
                    handleSuggestionClick(
                      suggestion
                    )
                  }
                >

                  {/* Image */}

                  {suggestion.image ? (
                    <img
                      src={suggestion.image}
                      alt={
                        suggestion.name || ""
                      }
                      className="h-[3rem] w-[3rem] rounded object-cover flex-shrink-0"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.src =
                          FALLBACK_IMAGE;
                      }}
                    />
                  ) : (
                    <div className="h-[3rem] w-[3rem] rounded bg-gray-500/20 flex-shrink-0" />
                  )}

                  {/* Information */}

                  <div className="flex flex-col overflow-hidden min-w-0">

                    <span className="text-sm truncate">
                      {decodeText(
                        suggestion.name
                      )}
                    </span>

                    <span className="text-xs opacity-70">
                      {suggestion.type}
                    </span>

                    {suggestion.type ===
                      "Song" &&
                      suggestion.artist && (
                        <span className="text-xs opacity-60 truncate">
                          {decodeText(
                            suggestion.artist
                          )}
                        </span>
                      )}

                  </div>

                </button>

              )
            )}

          </div>

        </form>

        {/* Search indicator */}

        {isSearching &&
          query.trim() && (
            <div className="text-xs opacity-60 mt-1">
              Searching...
            </div>
          )}

      </div>
    </nav>
  );
};

export default Navbar;
