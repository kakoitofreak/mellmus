// Все треки (единый источник)
const allTracks = [
    { name: "Мальчик Андрей", artist: "кис-кис и меллстройность", src: "music/track1.mp3", cover: "images/track1.jpg" },
    { name: "Свидание с Андреем", artist: "Швец с друном", src: "music/track2.mp3", cover: "images/track2.jpg" },
    { name: "Звонок от Андрея", artist: "Toxis с бурмалдой", src: "music/track3.mp3", cover: "images/track3.jpg" },
    { name: "Цыганский Андрей", artist: "Бля я уже заебался придумывать", src: "music/track4.mp3", cover: "images/track4.jpg" },
    { name: "Андрей замерз", artist: "2 Андрея", src: "music/track5.mp3", cover: "images/track5.jpg" },
    {name: "SugarCrash! от андрея", artist: "Мел под салями", src: "music/track6.mp3", cover: "images/track6.jpg" },
     { name: "Андрей стал режиссером", artist: "Режиссер андруа", src: "music/track7.mp3", cover: "images/track7.jpg" },
      { name: "и я такой пам", artist: "андрей и котеки", src: "music/track8.mp3", cover: "images/track8.jpg" }
];

// Описание плейлистов
const playlists = {
    "Вся музычка": {
        cover: "images/for_you.jpg",
        description: "Все треки что есть",
        sortType: "original"
    },
    "Топ по прослушиваниям": {
        cover: "images/top.jpg",
        description: "Треки, которые ты слушаешь чаще всего",
        sortType: "byPlays"
    }
};