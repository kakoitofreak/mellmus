const audio = document.getElementById('audio');
let currentPlaylistKey = null;
let currentPlaylistTracks = [];
let currentTrackIndex = 0;
let repeatMode = 0; // 0: нет повтора, 1: повтор трека, 2: повтор плейлиста
let previousVolume = 0.7;

// Элементы управления
const playPauseBtn = document.getElementById('play-pause');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const repeatBtn = document.getElementById('repeat');
const progressSlider = document.getElementById('progress');
const volumeSlider = document.getElementById('volume');
const volumeIcon = document.getElementById('volume-icon');
const currentTimeSpan = document.getElementById('current-time');
const durationSpan = document.getElementById('duration');
const currentTrackNameSpan = document.getElementById('current-track-name');
const currentArtistSpan = document.getElementById('current-artist');
const currentCoverImg = document.getElementById('current-cover');

// --- Основные функции плеера ---
function playTrack(index) {
    if (!currentPlaylistTracks.length) return;
    if (index < 0) index = 0;
    if (index >= currentPlaylistTracks.length) index = 0;

    currentTrackIndex = index;
    const track = currentPlaylistTracks[currentTrackIndex];

    audio.src = track.src;
    audio.load();
    audio.play().catch(e => console.log("Автовоспроизведение заблокировано:", e));

    updateNowPlaying(track);
    highlightActiveTrack(currentTrackIndex);
}

function updateNowPlaying(track) {
    currentTrackNameSpan.innerText = track.name;
    currentArtistSpan.innerText = track.artist;
    currentCoverImg.src = track.cover || 'images/default_track.jpg';
}

function highlightActiveTrack(index) {
    document.querySelectorAll('.track-item').forEach((item, i) => {
        if (i === index) item.classList.add('active');
        else item.classList.remove('active');
    });
}

function nextTrack() {
    if (!currentPlaylistTracks.length) return;
    let next = currentTrackIndex + 1;
    if (next >= currentPlaylistTracks.length) {
        if (repeatMode === 2) {
            next = 0;
        } else {
            return; // не переключаем
        }
    }
    playTrack(next);
}

function prevTrack() {
    if (!currentPlaylistTracks.length) return;
    if (currentTrackIndex === 0) return;
    let prev = currentTrackIndex - 1;
    playTrack(prev);
}

function onTrackEnded() {
    const currentTrack = currentPlaylistTracks[currentTrackIndex];
    if (currentTrack) {
        incrementTrackPlays(currentTrack.src);
        // Если текущий плейлист — топ, обновляем сортировку и перерисовываем
        if (currentPlaylistKey === "Топ по прослушиваниям") {
            updateCurrentPlaylistTracksBySort();
            renderTrackList(currentPlaylistTracks, currentPlaylistKey);
            // Находим новый индекс этого же трека
            const newIndex = currentPlaylistTracks.findIndex(t => t.src === currentTrack.src);
            if (newIndex !== -1) currentTrackIndex = newIndex;
            highlightActiveTrack(currentTrackIndex);
        }
    }

    // Логика следующего трека
    if (repeatMode === 1) {
        playTrack(currentTrackIndex);
    } else if (repeatMode === 2) {
        let next = currentTrackIndex + 1;
        if (next >= currentPlaylistTracks.length) next = 0;
        playTrack(next);
    } else {
        let next = currentTrackIndex + 1;
        if (next < currentPlaylistTracks.length) playTrack(next);
    }
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function updateProgress() {
    if (audio.duration && isFinite(audio.duration)) {
        const percent = (audio.currentTime / audio.duration) * 100;
        progressSlider.value = percent;
        currentTimeSpan.innerText = formatTime(audio.currentTime);
    }
}

function onLoadedMetadata() {
    if (audio.duration && isFinite(audio.duration)) {
        durationSpan.innerText = formatTime(audio.duration);
        // Обновляем длительность в списке для текущего трека
        updateTrackDurationInList(currentTrackIndex, audio.duration);
    }
}

function updateTrackDurationInList(index, duration) {
    const trackItems = document.querySelectorAll('.track-item');
    if (trackItems[index]) {
        const durationElem = trackItems[index].querySelector('.track-duration');
        if (durationElem) {
            // Сохраняем только длительность, счётчик прослушиваний добавим отдельно
            durationElem.innerHTML = formatTime(duration);
            // Если это топ-плейлист, добавляем счётчик
            if (currentPlaylistKey === "Топ по прослушиваниям" && currentPlaylistTracks[index]) {
                const plays = getTrackPlays(currentPlaylistTracks[index].src);
                durationElem.innerHTML = `${formatTime(duration)} <span class="track-plays">🎧 ${plays}</span>`;
            }
        }
    }
}

// --- Управление громкостью ---
function updateVolumeIcon() {
    if (audio.muted || audio.volume === 0) {
        volumeIcon.className = 'fas fa-volume-mute';
    } else if (audio.volume < 0.5) {
        volumeIcon.className = 'fas fa-volume-down';
    } else {
        volumeIcon.className = 'fas fa-volume-up';
    }
}

function setVolume(value) {
    let newVolume = parseFloat(value);
    if (isNaN(newVolume)) newVolume = 1;
    newVolume = Math.min(1, Math.max(0, newVolume));
    audio.volume = newVolume;
    if (audio.muted && newVolume > 0) audio.muted = false;
    volumeSlider.value = newVolume;
    if (newVolume > 0) previousVolume = newVolume;
    updateVolumeIcon();
}

function toggleMute() {
    if (audio.muted) {
        audio.muted = false;
        setVolume(previousVolume);
    } else {
        previousVolume = audio.volume;
        setVolume(0);
        audio.muted = true;
    }
}

function syncVolumeSlider() {
    volumeSlider.value = audio.volume;
    updateVolumeIcon();
}

// --- Счётчики прослушиваний (localStorage) ---
const PLAYS_STORAGE_KEY = 'trackPlays';

function initPlaysCounter() {
    let plays = localStorage.getItem(PLAYS_STORAGE_KEY);
    if (!plays) {
        const initialPlays = {};
        allTracks.forEach(track => {
            initialPlays[track.src] = 0;
        });
        localStorage.setItem(PLAYS_STORAGE_KEY, JSON.stringify(initialPlays));
    } else {
        syncPlaysCounter();
    }
}

function syncPlaysCounter() {
    let plays = JSON.parse(localStorage.getItem(PLAYS_STORAGE_KEY) || '{}');
    let changed = false;
    allTracks.forEach(track => {
        if (plays[track.src] === undefined) {
            plays[track.src] = 0;
            changed = true;
        }
    });
    if (changed) {
        localStorage.setItem(PLAYS_STORAGE_KEY, JSON.stringify(plays));
    }
}

function getTrackPlays(src) {
    const plays = JSON.parse(localStorage.getItem(PLAYS_STORAGE_KEY) || '{}');
    return plays[src] || 0;
}

function incrementTrackPlays(src) {
    const plays = JSON.parse(localStorage.getItem(PLAYS_STORAGE_KEY));
    if (plays) {
        plays[src] = (plays[src] || 0) + 1;
        localStorage.setItem(PLAYS_STORAGE_KEY, JSON.stringify(plays));
    }
}

// --- Получение треков для плейлиста ---
function getTracksForPlaylist(playlistKey) {
    const playlist = playlists[playlistKey];
    if (!playlist) return [];
    if (playlist.sortType === "original") {
        return [...allTracks];
    } else if (playlist.sortType === "byPlays") {
        const sorted = [...allTracks].sort((a, b) => {
            const playsA = getTrackPlays(a.src);
            const playsB = getTrackPlays(b.src);
            return playsB - playsA;
        });
        return sorted;
    }
    return [];
}

function updateCurrentPlaylistTracksBySort() {
    if (currentPlaylistKey) {
        currentPlaylistTracks = getTracksForPlaylist(currentPlaylistKey);
    }
}

// --- Кнопка случайного трека ---
function playRandomTrack() {
    if (!currentPlaylistTracks.length) return;
    const randomIndex = Math.floor(Math.random() * currentPlaylistTracks.length);
    playTrack(randomIndex);
}

// --- Повтор ---
function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    updateRepeatButtonUI();
}

function updateRepeatButtonUI() {
    if (repeatMode === 1 || repeatMode === 2) {
        repeatBtn.style.color = '#1db954';
    } else {
        repeatBtn.style.color = '#ffffff';
    }
}

// --- Предзагрузка длительностей ---
const durationsCache = {};

function getTrackDuration(trackSrc, callback) {
    if (durationsCache[trackSrc]) {
        callback(durationsCache[trackSrc]);
        return;
    }
    const tempAudio = new Audio();
    tempAudio.preload = 'metadata';
    tempAudio.src = trackSrc;
    tempAudio.addEventListener('loadedmetadata', () => {
        const duration = tempAudio.duration;
        if (isFinite(duration)) {
            durationsCache[trackSrc] = duration;
            callback(duration);
        } else {
            callback(null);
        }
        tempAudio.src = '';
        tempAudio.load();
    });
    tempAudio.addEventListener('error', () => {
        callback(null);
    });
}

function preloadAllDurations(tracks, playlistKey) {
    tracks.forEach((track, index) => {
        getTrackDuration(track.src, (duration) => {
            if (duration !== null) {
                const trackItems = document.querySelectorAll('.track-item');
                if (trackItems[index]) {
                    const durationElem = trackItems[index].querySelector('.track-duration');
                    if (durationElem) {
                        let text = formatTime(duration);
                        if (playlistKey === "Топ по прослушиваниям") {
                            const plays = getTrackPlays(track.src);
                            text = `${formatTime(duration)} <span class="track-plays">🎧 ${plays}</span>`;
                        }
                        durationElem.innerHTML = text;
                    }
                }
            }
        });
    });
}

// --- События плеера ---
audio.addEventListener('loadedmetadata', onLoadedMetadata);
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('ended', onTrackEnded);
audio.addEventListener('play', () => playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>');
audio.addEventListener('pause', () => playPauseBtn.innerHTML = '<i class="fas fa-play"></i>');
audio.addEventListener('volumechange', syncVolumeSlider);

volumeSlider.addEventListener('input', (e) => setVolume(e.target.value));
volumeIcon.addEventListener('click', toggleMute);
playPauseBtn.addEventListener('click', () => {
    if (audio.paused) audio.play();
    else audio.pause();
});
nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);
repeatBtn.addEventListener('click', toggleRepeat);
progressSlider.addEventListener('input', (e) => {
    if (audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration;
});

// --- Инициализация ---
setVolume(0.7);
initPlaysCounter();
updateRepeatButtonUI();