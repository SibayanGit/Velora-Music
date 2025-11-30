/* ---------------------------------------------------------
   YOUTUBE IFRAME API INITIALIZATION
--------------------------------------------------------- */

var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
document.body.appendChild(tag);

var player;
var isPlayerReady = false;

function onYouTubeIframeAPIReady() {
    player = new YT.Player("youtube-player", {
        height: "100%",
        width: "100%",
        playerVars: {
            playsinline: 1,
            controls: 1,
            rel: 0,
            origin: window.location.origin
        },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError: onPlayerError
        }
    });
}

function onPlayerReady() {
    isPlayerReady = true;
    setVolume();
}

/* ---------------------------------------------------------
   L I B R A R Y  (Loaded from songs.json)
--------------------------------------------------------- */

let library = [];

/* ---------------------------------------------------------
   LOAD LIBRARY FROM JSON
--------------------------------------------------------- */

function loadLibrary() {
    fetch("songs.json")
        .then(response => {
            if (!response.ok) throw new Error("Failed to load songs.json");
            return response.json();
        })
        .then(data => {
            library = data;
            renderTrendingRow();
        })
        .catch(error => {
            console.error("Library load error:", error);
            alert("Error loading songs.json — check file path.");
        });
}

/* ---------------------------------------------------------
   INITIAL LOAD
--------------------------------------------------------- */

window.onload = () => {
    loadLibrary();
};

/* ---------------------------------------------------------
   RENDER TRENDING SONGS
--------------------------------------------------------- */

function renderTrendingRow() {
    const container = document.getElementById("trending-container");

    if (!library || library.length === 0) {
        container.innerHTML = `<p class="text-gray-500 pl-2">Loading...</p>`;
        return;
    }

    const trending = library.filter(song => song.isTrending);

    container.innerHTML = trending.map(song => `
        <div onclick="playTrack('${song.id}')"
            class="min-w-[140px] w-[140px] bg-white/5 p-3 rounded-xl border border-white/5 cursor-pointer group transition snap-start">
            
            <div class="relative mb-2">
                <img src="${song.img}" class="w-full aspect-square object-cover rounded-lg shadow-lg">
                <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 
                    group-hover:opacity-100 transition rounded-lg backdrop-blur-[1px]">
                    <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black shadow-xl scale-0 
                        group-hover:scale-100 transition">
                        <i class="fas fa-play pl-0.5 text-xs"></i>
                    </div>
                </div>
            </div>

            <h3 class="font-bold text-white text-sm truncate">${song.title}</h3>
            <p class="text-[10px] text-gray-400 mt-0.5">${song.artist}</p>
        </div>
    `).join("");
}

/* ---------------------------------------------------------
   PLAY A TRACK
--------------------------------------------------------- */

function playTrack(videoId) {
    document.getElementById("music-player").classList.remove("translate-y-[200%]");
    document.getElementById("now-playing-section").classList.remove("hidden");

    const song = library.find(s => s.id === videoId);
    if (!song) return;

    currentSongIndex = library.indexOf(song);

    document.getElementById("player-title").innerText = song.title;
    document.getElementById("player-artist").innerText = song.artist;
    document.getElementById("player-art").src = song.img;

    document.getElementById("now-title").innerText = song.title;
    document.getElementById("now-artist").innerText = song.artist;

    document.getElementById("error-banner").classList.add("hidden");

    if (isPlayerReady) {
        player.loadVideoById(videoId);
    }
}

/* ---------------------------------------------------------
   PLAYER STATE HANDLING
--------------------------------------------------------- */

let currentSongIndex = 0;
let isPlaying = false;
let progressInterval;

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
        document.getElementById("play-icon").classList.remove("fa-play", "ml-0.5");
        document.getElementById("play-icon").classList.add("fa-pause");
        document.getElementById("player-art").style.animationPlayState = "running";

        startProgressLoop();
    }

    else if (event.data === YT.PlayerState.PAUSED) {
        isPlaying = false;
        document.getElementById("play-icon").classList.remove("fa-pause");
        document.getElementById("play-icon").classList.add("fa-play", "ml-0.5");
        document.getElementById("player-art").style.animationPlayState = "paused";

        stopProgressLoop();
    }

    else if (event.data === YT.PlayerState.ENDED) {
        const autoplay = document.getElementById("autoplay-toggle").checked;
        if (autoplay) nextSong();
    }
}

/* ---------------------------------------------------------
   ERROR HANDLING
--------------------------------------------------------- */

function onPlayerError(event) {
    console.log("YouTube Error:", event.data);

    const errorBanner = document.getElementById("error-banner");

    if (event.data === 101 || event.data === 150) {
        errorBanner.innerText = "Embedding disabled by uploader. Choose another track.";
    } else {
        errorBanner.innerText = "Video unavailable. Choose another track.";
    }

    errorBanner.classList.remove("hidden");

    stopProgressLoop();
    isPlaying = false;

    document.getElementById("play-icon").classList.remove("fa-pause");
    document.getElementById("play-icon").classList.add("fa-play", "ml-0.5");
}

/* ---------------------------------------------------------
   CONTROLS (PLAY/PAUSE/NEXT/PREV)
--------------------------------------------------------- */

function togglePlay() {
    if (!isPlayerReady) return;

    isPlaying ? player.pauseVideo() : player.playVideo();
}

function nextSong() {
    currentSongIndex = (currentSongIndex + 1) % library.length;
    playTrack(library[currentSongIndex].id);
}

function prevSong() {
    currentSongIndex = (currentSongIndex - 1 + library.length) % library.length;
    playTrack(library[currentSongIndex].id);
}

/* ---------------------------------------------------------
   PROGRESS BAR
--------------------------------------------------------- */

function startProgressLoop() {
    clearInterval(progressInterval);

    progressInterval = setInterval(() => {
        if (!player || !player.getCurrentTime) return;

        const current = player.getCurrentTime();
        const total = player.getDuration();

        if (total > 0) {
            const percent = (current / total) * 100;
            document.getElementById("progress-slider").value = percent;
            document.getElementById("progress-fill").style.width = percent + "%";
        }
    }, 500);
}

function stopProgressLoop() {
    clearInterval(progressInterval);
}

document.getElementById("progress-slider").oninput = function () {
    if (!isPlayerReady) return;

    const val = this.value;
    const total = player.getDuration();

    player.seekTo((val / 100) * total, true);
};

/* ---------------------------------------------------------
   VOLUME CONTROL
--------------------------------------------------------- */

function setVolume() {
    if (!isPlayerReady) return;

    const vol = document.getElementById("volume-slider").value;
    player.setVolume(vol);
    document.getElementById("volume-fill").style.width = vol + "%";
}

document.getElementById("volume-slider").oninput = setVolume;

/* ---------------------------------------------------------
   SIDEBAR (QUEUE)
--------------------------------------------------------- */

function toggleSidebar() {
    const sidebar = document.getElementById("right-sidebar");

    if (sidebar.classList.contains("w-0")) {
        sidebar.classList.remove("w-0", "p-0", "opacity-0");
        sidebar.classList.add("w-[300px]", "p-4", "opacity-100");
    } else {
        sidebar.classList.add("w-0", "p-0", "opacity-0");
        sidebar.classList.remove("w-[300px]", "p-4", "opacity-100");
    }
}

/* ---------------------------------------------------------
   SEARCH FUNCTIONALITY
--------------------------------------------------------- */

document.getElementById("search-input").addEventListener("input", e => {
    const query = e.target.value.toLowerCase();
    const resultsGrid = document.getElementById("search-results-grid");

    const results = library.filter(song =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query)
    );

    if (results.length === 0) {
        resultsGrid.innerHTML = `<p class="text-gray-500 col-span-full text-center mt-10">No results found.</p>`;
        return;
    }

    resultsGrid.innerHTML = results.map(song => `
        <div onclick="playTrack('${song.id}')"
            class="bg-white/5 p-3 rounded-2xl border border-white/5 cursor-pointer">
            
            <img src="${song.img}" class="w-full rounded-xl mb-2 aspect-square object-cover">

            <h3 class="font-bold text-white text-sm truncate">${song.title}</h3>
            <p class="text-xs text-gray-400">${song.artist}</p>
        </div>
    `).join("");
});

/* ---------------------------------------------------------
   TAB SWITCHING (HOME / SEARCH)
--------------------------------------------------------- */

function switchTab(id) {
    document.getElementById("view-home").classList.add("hidden");
    document.getElementById("view-search").classList.add("hidden");
    document.getElementById("view-" + id).classList.remove("hidden");

    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active", "inactive"));
    document.getElementById("d-nav-" + id).classList.add("active");

    document.querySelectorAll(".mobile-nav-item").forEach(el => el.classList.remove("active"));
    document.getElementById("m-nav-" + id).classList.add("active");

    document.getElementById("search-bar-container").classList.toggle("hidden", id !== "search");
}
