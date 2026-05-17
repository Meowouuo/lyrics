// 歌曲：笑忘书

(function() {
    const song = {
        id: 214,
        title: "笑忘书",
        titleJyutping: ["siu3","mong4","syu1"],
        artist: "张敬轩",
        artistJyutping: ["zoeng1","ging3","hin1"],
        lyricist: "林若宁",
        lyricistJyutping: ["lam4","joek6","ning4"],
        composer: "伍卓贤",
        composerJyutping: ["ng5","coek3","jin4"],
        lyrics: [
            { chars: ["要","　","背","负","个","包","袱"], jp: ["jiu3","","bui3","fu6","go3","baau1","fuk6"] },
            { chars: ["再","　","跳","落","大","峡","谷"], jp: ["zoi3","","tiu3","lok6","daai6","haap6","guk1"] },
            { chars: ["烦","恼","　","用","个","大","网","将","你","捕","捉"], jp: ["faan4","nou5","","jung6","go3","daai6","mong5","zoeng1","nei5","bou6","zuk1"] },
            { chars: ["还","是","你"], jp: ["waan4","si6","nei5"] },
            { chars: ["抛","不","开","拘","束"], jp: ["paau1","bat1","hoi1","keoi1","cuk1"] },
            { chars: ["你","　","昨","夜","发","的","梦"], jp: ["nei5","","zok6","je6","faat3","dik1","mung6"] },
            { chars: ["到","　","这","夜","已","告","终"], jp: ["dou3","","ze5","je6","ji5","gou3","zung1"] },
            { chars: ["沉","下","去"], jp: ["cam4","haa6","heoi3"] },
            { chars: ["头","上","散","落","雨","点","没","有","彩","虹"], jp: ["tau4","soeng6","saan3","lok6","jyu5","dim2","mut6","jau5","coi2","hung4"] },
            { chars: ["你","　","还","在","抱","着","记","忆"], jp: ["nei5","","waan4","zoi6","pou5","zoek6","gei3","jik1"] },
            { chars: ["就","似","块","石","头","很","重"], jp: ["zau6","ci5","faai3","sek6","tau4","han2","cung5"] },
            { chars: ["得","到","同","样","快","乐"], jp: ["dak1","dou3","tung4","joeng6","faai3","lok6"] },
            { chars: ["彼","此","亦","有","沮","丧"], jp: ["bei2","ci2","jik6","jau5","zeoi1","song1"] },
            { chars: ["童","话","书","从","成","长","中","难","免","要","学","会","失","望"], jp: ["tung4","waa6","syu1","cung4","sing4","coeng4","zung1","naan4","min5","jiu3","hok6","wui6","sat1","mong6"] },
            { chars: ["经","过","同","样","上","落"], jp: ["ging1","gwo3","tung4","joeng6","soeng6","lok6"] },
            { chars: ["彼","此","堕","进","灰","网"], jp: ["bei2","ci2","do6","zeon3","fui1","mong5"] },
            { chars: ["沉","溺","　","烦","扰","　","磨","折","　","何","苦","　","多","讲"], jp: ["cam4","nik6","","faan4","jiu2","","mo4","zit3","","ho4","fu2","","do1","gong2"] },
            { chars: ["我","　","快","乐","到","孤","独"], jp: ["ngo5","","faai3","lok6","dou3","gu1","duk6"] },
            { chars: ["我","　","缺","乏","到","满","足"], jp: ["ngo5","","kyut3","fat6","dou3","mun5","zuk1"] },
            { chars: ["游","戏","　","就","算","愉","快","不","会","幸","福"], jp: ["jau4","hei3","","zau6","syun3","jyu4","faai3","bat1","wui6","hang6","fuk1"] },
            { chars: ["人","大","了"], jp: ["jan4","daai6","liu5"] },
            { chars: ["开","心","都","想","哭"], jp: ["hoi1","sam1","dou1","soeng2","huk1"] },
            { chars: ["我","　","每","日","要","生","活"], jp: ["ngo5","","mui5","jat6","jiu3","sang1","wut6"] },
            { chars: ["我","　","每","日","要","斗","苦"], jp: ["ngo5","","mui5","jat6","jiu3","dau3","fu2"] },
            { chars: ["挨","下","去"], jp: ["aai1","haa6","heoi3"] },
            { chars: ["连","上","帝","亦","也","许","没","法","搀","扶"], jp: ["lin4","soeng6","dai3","jik6","jaa5","heoi2","mut6","faat3","caam1","fu4"] },
            { chars: ["我","　","前","路","有","右","与","左"], jp: ["ngo5","","cin4","lou6","jau5","jau6","jyu5","zo2"] },
            { chars: ["面","对","抉","择","难","兼","顾"], jp: ["min6","deoi3","kyut3","zaak6","naan4","gim1","gu3"] },
            { chars: ["得","到","同","样","快","乐"], jp: ["dak1","dou3","tung4","joeng6","faai3","lok6"] },
            { chars: ["彼","此","亦","有","沮","丧"], jp: ["bei2","ci2","jik6","jau5","zeoi1","song1"] },
            { chars: ["童","话","书","从","成","长","中","难","免","要","学","会","失","望"], jp: ["tung4","waa6","syu1","cung4","sing4","coeng4","zung1","naan4","min5","jiu3","hok6","wui6","sat1","mong6"] },
            { chars: ["经","过","同","样","上","落"], jp: ["ging1","gwo3","tung4","joeng6","soeng6","lok6"] },
            { chars: ["彼","此","堕","进","灰","网"], jp: ["bei2","ci2","do6","zeon3","fui1","mong5"] },
            { chars: ["沉","溺","　","烦","扰","　","磨","折","　","何","苦","　","多","讲"], jp: ["cam4","nik6","","faan4","jiu2","","mo4","zit3","","ho4","fu2","","do1","gong2"] },
            { chars: ["拥","有","同","样","寄","望"], jp: ["jung2","jau5","tung4","joeng6","gei3","mong6"] },
            { chars: ["彼","此","亦","有","苦","况"], jp: ["bei2","ci2","jik6","jau5","fu2","fong3"] },
            { chars: ["棉","花","糖","从","成","长","中","曾","送","你","愉","快","天","堂"], jp: ["min4","faa1","tong4","cung4","sing4","coeng4","zung1","zang1","sung3","nei5","jyu4","faai3","tin1","tong4"] },
            { chars: ["经","过","同","样","跌","荡"], jp: ["ging1","gwo3","tung4","joeng6","dit3","dong6"] },
            { chars: ["可","会","学","会","释","放"], jp: ["ho2","wui6","hok6","wui6","sik1","fong3"] },
            { chars: ["童","话","　","情","书","　","遗","书","　","寻","找","　","答","案"], jp: ["tung4","waa6","","cing4","syu1","","wai4","syu1","","cam4","zaau2","","daap3","on3"] },
            { chars: ["曾","经","　","曾","经"], jp: ["zang1","ging1","","zang1","ging1"] },
            { chars: ["回","忆","当","天","三","岁","的","波","板","糖"], jp: ["wui4","jik1","dong1","tin1","saam1","seoi3","dik1","bo1","baan2","tong4"] }
        ]
    };
    if (typeof window !== 'undefined' && window.__songs) {
        window.__songs.push(song);
    }
})();
