/* ------------------------------------------------------
   🎵 VELORA MUSIC — UPDATED SCRIPT WITH:
   ✔ JSON library loader
   ✔ Thumbnail fallback (maxres → sd → hq → mq)
   ✔ Trending + Search thumbnail injection
------------------------------------------------------- */

let library = [];
let isPlayerReady = false;
let player;
let isPlaying = false;
let currentSongIndex = 0;
let progressInterval;

/* ------------------------------------------------------
   LOAD SONG LIBRARY
------------------------------------------------------- */
function loadLibrary() {
    fetch("songs.json")
        .then(res => res.json())
        .then(data => {
            library = data;
            renderTrendingRow();
        })
        .catch(err => console.error("Library load failed:", err));
}

/* ------------------------------------------------------
   THUMBNAIL FALLBACK SYSTEM
------------------------------------------------------- */
function getBestThumbnail(videoId, callback) {
    const qualities = [
        "maxresdefault.jpg",
        "sddefault.jpg",
        "hqdefault.jpg",
        "mqdefault.jpg"
    ];

    let index = 0;

    function checkNext() {
        if (index >= qualities.length) {
            callback(`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`);
            return;
        }

        const url = `https://i.ytimg.com/vi/${videoId}/${qualities[index]}`;
        const img = new Image();

        img.onload = () => {
            if (img.width >= 200) callback(url);
            else { index++; checkNext(); }
        };

        img.onerror = () => { index++; checkNext(); };
        img.src = url;
    }

    checkNext();
}

/* ------------------------------------------------------
   RENDER TRENDING ROW
------------------------------------------------------- */
function renderTrendingRow() {
    const container = document.getElementById("trending-container");
    const trending = library.filter(s => s.isTrending);

    container.innerHTML = trending.map(song => `
        <div onclick="playTrack('${song.id}')" class="min-w-[140px] w-[140px] bg-white/5 p-3 rounded-xl border border-white/5 cursor-pointer group transition snap-start">
            
            <div class="relative mb-2 w-full aspect-square rounded-lg overflow-hidden bg-black/20" id="thumb-${song.id}">
                <!-- Thumbnail loads here -->
            </div>

            <h3 class="font-bold text-white text-sm truncate">${song.title}</h3>
            <p class="text-[10px] text-gray-400">${song.artist}</p>
        </div>
    `).join("");

    trending.forEach(song => {
        getBestThumbnail(song.id, (url) => {
            document.getElementById(`thumb-${song.id}`).innerHTML =
                `<img src="${url}" class="w-full h-full object-cover rounded-lg">`;
        });
    });
}

/* ------------------------------------------------------
   SEARCH RESULTS
------------------------------------------------------- */
const searchInput = document.getElementById("search-input");

searchInput.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    const resultsGrid = document.getElementById("search-results-grid");

    const results = library.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q)
    );

    if (results.length === 0) {
        resultsGrid.innerHTML = `<p class="col-span-full text-center text-gray-400 mt-6">No results found.</p>`;
        return;
    }

    resultsGrid.innerHTML = results.map(song => `
        <div onclick="playTrack('${song.id}')" class="bg-white/5 p-3 rounded-2xl border border-white/5 cursor-pointer">

            <div class="w-full aspect-square rounded-xl overflow-hidden bg-black/20" id="search-thumb-${song.id}">
                <!-- thumb -->
            </div>

            <h3 class="font-bold text-white text-sm mt-2 truncate">${song.title}</h3>
            <p class="text-xs text-gray-400">${song.artist}</p>
        </div>
    `).join("");

    results.forEach(song => {
        getBestThumbnail(song.id, (url) => {
            document.getElementById(`search-thumb-${song.id}`).innerHTML =
                `<img src="${url}" class="w-full h-full object-cover rounded-xl">`;
        });
    });
});

/* ------------------------------------------------------
   YOUTUBE PLAYER INITIALIZATION
------------------------------------------------------- */
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);

function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtube-player', {
        height: "100%",
        width: "100%",
        playerVars: { playsinline: 1, controls: 1 },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange
        }
    });
}

function onPlayerReady() {
    isPlayerReady = true;
}

function onPlayerStateChange(e) {
    if (e.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
    } else {
        isPlaying = false;
    }
}

/* ------------------------------------------------------
   PLAY, NEXT, PREVIOUS
------------------------------------------------------- */
function playTrack(videoId) {
    const song = library.find(s => s.id === videoId);
    currentSongIndex = library.indexOf(song);

    document.getElementById("music-player").classList.remove("translate-y-[200%]");
    document.getElementById("player-title").textContent = song.title;
    document.getElementById("player-artist").textContent = song.artist;

    // Load thumbnail to player art
    getBestThumbnail(videoId, url => {
        document.getElementById("player-art").src = url;
    });

    if (isPlayerReady) {
        player.loadVideoById(videoId);
    }
}

function nextSong() {
    currentSongIndex = (currentSongIndex + 1) % library.length;
    playTrack(library[currentSongIndex].id);
}

function prevSong() {
    currentSongIndex--;
    if (currentSongIndex < 0) currentSongIndex = library.length - 1;
    playTrack(library[currentSongIndex].id);
}

/* ------------------------------------------------------
   INITIALIZE
------------------------------------------------------- */
window.onload = loadLibrary;
