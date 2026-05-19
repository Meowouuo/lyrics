// 歌曲：test

(function() {
    const song = {
        id: 392,
        title: "test",
        titleJyutping: ["","","",""],
        artist: "test",
        artistJyutping: ["","","",""],
        lyricist: "",
        lyricistJyutping: [],
        composer: "",
        composerJyutping: [],
        lyrics: [
            { chars: ["q","q","q"], jp: ["","",""] }
        ]
    };
    if (typeof window !== 'undefined' && window.__songs) {
        window.__songs.push(song);
    }
})();
