// 歌曲：明年今日

(function() {
    const song =     {
        id: 5,
        title: "明年今日",
        titleJyutping: ["ming4","nin4","gam1","jat6"],
        artist: "陈奕迅",
        artistJyutping: ["can4","jan6","hin3"],
        lyricist: "林夕",
        lyricistJyutping: ["lam4","zik6"],
        composer: "陈小霞",
        composerJyutping: ["can4","siu2","haa4"],
        lyrics: [
            { chars: ["若","这","一","束","吊","灯","倾","泻","下","来"], jp: ["joek6","ze5","jat1","cuk1","diu3","dang1","king1","se3","haa6","loi4"] },
            { chars: ["或","者","我","已","不","会","存","在"], jp: ["waak6","ze2","ngo5","ji5","bat1","wui5","cyun4","zoi6"] },
            { chars: ["即","使","你","不","爱"], jp: ["zik1","si2","nei5","bat1","oi3"] },
            { chars: ["亦","不","需","要","分","开"], jp: ["jik6","bat1","seoi1","jiu3","fan1","hoi1"] },
            { paragraphBreak: true },
            { chars: ["若","这","一","刻","我","竟","严","重","痴","呆"], jp: ["joek6","ze5","jat1","hak1","ngo5","ging2","jim4","cung5","ci1","toi4"] },
            { chars: ["根","本","不","需","要","被","爱"], jp: ["gan1","bun2","bat1","seoi1","jiu3","bei6","oi3"] },
            { chars: ["永","远","在","床","上","发","梦"], jp: ["wing5","jyun5","zoi6","cong4","soeng6","faat3","mung6"] },
            { chars: ["余","生","都","不","会","再","悲","哀"], jp: ["jyu4","saang1","dou1","bat1","wui5","zoi3","bei1","oi1"] },
            { paragraphBreak: true },
            { chars: ["人","总","需","要","勇","敢","生","存"], jp: ["jan4","zung2","seoi1","jiu3","jung5","gam2","saang1","cyun4"] },
            { chars: ["我","还","是","重","新","许","愿"], jp: ["ngo5","waan4","si6","cung4","san1","heoi2","jyun6"] },
            { chars: ["例","如","学","会","承","受","失","恋"], jp: ["lai6","jyu4","hok6","wui5","sing4","sau6","sat1","lyun2"] },
            { paragraphBreak: true },
            { chars: ["明","年","今","日"," ","别","要","再","失","眠"], jp: ["ming4","nin4","gam1","jat6","","bit6","jiu3","zoi3","sat1","min4"] },
            { chars: ["床","褥","都","改","变"," ","如","果","有","幸","会","面"], jp: ["cong4","juk6","dou1","goi2","bin3","","jyu4","gwo2","jau5","hang6","wui5","min6"] },
            { chars: ["或","在","同","伴","新","婚","的","盛","宴"], jp: ["waak6","zoi6","tung4","bun6","san1","fan1","dik1","sing6","jin3"] },
            { chars: ["惶","惑","地","等","待","你","出","现"], jp: ["wong4","waak6","dei6","dang2","doi6","nei5","ceot1","jin6"] },
            { paragraphBreak: true },
            { chars: ["明","年","今","日","未","见","你","一","年"], jp: ["ming4","nin4","gam1","jat6","mei6","gin3","nei5","jat1","nin4"] },
            { chars: ["谁","舍","得","改","变","？"," ","离","开","你","60","年"], jp: ["seoi4","se2","dak1","goi2","bin3","","","lei4","hoi1","nei5","60","nin4"] },
            { chars: ["但","愿","能","认","得","出","你","的","子","女"], jp: ["daan6","jyun6","nang4","jing6","dak1","ceot1","nei5","dik1","zi2","neoi5"] },
            { chars: ["临","别","亦","听","得","到","你","讲","再","见"], jp: ["lam4","bit6","jik6","ting3","dak1","dou3","nei5","gong2","zoi3","gin3"] },
            { paragraphBreak: true },
            { chars: ["人","总","需","要","勇","敢","生","存"], jp: ["jan4","zung2","seoi1","jiu3","jung5","gam2","saang1","cyun4"] },
            { chars: ["我","还","是","重","新","许","愿"], jp: ["ngo5","waan4","si6","cung4","san1","heoi2","jyun6"] },
            { chars: ["例","如","学","会","承","受","失","恋"], jp: ["lai6","jyu4","hok6","wui5","sing4","sau6","sat1","lyun2"] },
            { paragraphBreak: true },
            { chars: ["明","年","今","日"," ","别","要","再","失","眠"], jp: ["ming4","nin4","gam1","jat6","","bit6","jiu3","zoi3","sat1","min4"] },
            { chars: ["床","褥","都","改","变"," ","如","果","有","幸","会","面"], jp: ["cong4","juk6","dou1","goi2","bin3","","jyu4","gwo2","jau5","hang6","wui5","min6"] },
            { chars: ["或","在","同","伴","新","婚","的","盛","宴"], jp: ["waak6","zoi6","tung4","bun6","san1","fan1","dik1","sing6","jin3"] },
            { chars: ["惶","惑","地","等","待","你","出","现"], jp: ["wong4","waak6","dei6","dang2","doi6","nei5","ceot1","jin6"] },
            { paragraphBreak: true },
            { chars: ["明","年","今","日","未","见","你","一","年"], jp: ["ming4","nin4","gam1","jat6","mei6","gin3","nei5","jat1","nin4"] },
            { chars: ["谁","舍","得","改","变","？"," ","离","开","你","60","年"], jp: ["seoi4","se2","dak1","goi2","bin3","","","lei4","hoi1","nei5","60","nin4"] },
            { chars: ["但","愿","能","认","得","出","你","的","子","女"], jp: ["daan6","jyun6","nang4","jing6","dak1","ceot1","nei5","dik1","zi2","neoi5"] },
            { chars: ["临","别","亦","听","得","到","你","讲","再","见"], jp: ["lam4","bit6","jik6","ting3","dak1","dou3","nei5","gong2","zoi3","gin3"] },
            { paragraphBreak: true },
            { chars: ["在","有","生","的","瞬","间","能","遇","到","你"], jp: ["zoi6","jau5","saang1","dik1","seon3","gaan1","nang4","jyu6","dou3","nei5"] },
            { chars: ["竟","花","光","所","有","运","气"], jp: ["ging2","faa1","gwong1","so2","jau5","wan6","hei3"] },
            { chars: ["到","这","日","才","发","现"], jp: ["dou3","ze5","jat6","coi4","faat3","jin6"] },
            { chars: ["曾","呼","吸","过","空","气"], jp: ["cang4","fu1","kap1","gwo3","hung1","hei3"] }
        ]
;
    if (typeof window !== 'undefined' && window.__songs) {
        window.__songs.push(song);
    }
})();
