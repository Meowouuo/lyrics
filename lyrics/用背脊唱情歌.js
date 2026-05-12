// 歌曲：用背脊唱情歌

(function() {
    const song = {
        id: 19,
        title: "用背脊唱情歌",
        titleJyutping: ["jung6","bui3","zik3","coeng3","cing4","go1"],
        artist: "汤令山",
        artistJyutping: ["tong1","ling6","saan1"],
        lyricist: "黄伟文",
        lyricistJyutping: ["wong4","wai5","man4"],
        composer: "汤令山",
        composerJyutping: ["tong1","ling6","saan1"],
        lyrics: [
            { chars: ["麻","烦"," ","各","位","都","不","望","我"], jp: ["maa4","faan4","","gok3","wai6","dou1","bat1","mong6","ngo5"] },
            { chars: ["望","住"," ","我","怎","么","敢","去","唱"," ","情","歌"], jp: ["mong6","zyu6","","ngo5","zam2","mo1","gam2","heoi3","coeng3","","cing4","go1"] },
            { chars: ["然","而"," ","我","想","拣","今","日"," ","来","流","露","我","凄","楚"], jp: ["jin4","ji4","","ngo5","soeng2","gaan2","gam1","jat6","","loi4","lau4","lou6","ngo5","cai1","co2"] },
            { chars: ["听","完","的","人"," ","请","你","扮","傻"], jp: ["ting1","jyun4","dik1","jan4","","cing2","nei5","baan3","so4"] },
            { chars: ["但","唱","毕"," ","全","场","静"," ","其","实"," ","路","人"," ","并","不","傻"], jp: ["daan6","coeng3","bat1","","cyun4","coeng4","zing6","","kei4","sat6","","lou6","jan4","","bing6","bat1","so4"] },
            { chars: ["都","猜","中","我"," ","为","你","挨","尽","折","磨"], jp: ["dou1","caai1","zung3","ngo5","","wai4","nei5","ngaai4","zeon6","zit3","mo4"] },
            { paragraphBreak: true },
            { chars: ["眼","泪","若","嫌","多"," ","用","背","脊","唱","情","歌"], jp: ["ngaan5","leoi6","joek6","jim4","do1","","jung6","bui3","zik3","coeng3","cing4","go1"] },
            { chars: ["难","道","从","后","脑"," ","可","以","望","穿","我"," ","心","里","痛","什","么"], jp: ["naan4","dou6","cung4","hau6","nou5","","ho2","ji5","mong6","cyun1","ngo5","","sam1","leoi5","tung3","sam6","mo1"] },
            { chars: ["正","面","像","全","裸"], jp: ["zing3","min6","zoeng6","cyun4","lo2"] },
            { chars: ["遮","丑","的","布"," ","就","别","来","戳","破"], jp: ["ze1","cau2","dik1","bou3","","zau6","bit6","loi4","cok3","po3"] },
            { chars: ["愿","这","歌"," ","悲","到"," ","一","转","背"," ","人","间","都"," ","忘","掉","我"], jp: ["jyun6","ze5","go1","","bei1","dou3","","jat1","zyun3","bui3","","jan4","gaan1","dou1","","mong4","diu6","ngo5"] },
            { paragraphBreak: true },
            { chars: ["原","来"," ","我","不","懂","怎","样","爱"], jp: ["jyun4","loi4","","ngo5","bat1","dung2","zam2","joeng6","ngoi3"] },
            { chars: ["但","是"," ","作","的","恋","歌","也","算","精","彩"], jp: ["daan6","si6","","zok3","dik1","lyun2","go1","jaa5","syun3","zing1","coi2"] },
            { chars: ["忘","形"," ","到","真","失","恋","后"," ","偿","还","十","倍","悲","哀"], jp: ["mong4","jing4","","dou3","zan1","sat1","lyun2","hau6","","soeng4","waan4","sap6","pui5","bei1","oi1"] },
            { chars: ["终","于","一","个","人"," ","站","在","舞","台"], jp: ["zung1","jyu1","jat1","go3","jan4","","zaam6","zoi6","mou5","toi4"] },
            { chars: ["愿","这","歌"," ","流","行","着"," ","遗","下"," ","二","人"," ","没","将","来"], jp: ["jyun6","ze5","go1","","lau4","hang4","zoek6","","wai4","haa6","","ji6","jan4","","mut6","zoeng1","loi4"] },
            { chars: ["歌","者","痛","了"," ","人","们","还","在","喝","彩"], jp: ["go1","ze2","tung3","liu5","","jan4","mun4","waan4","zoi6","hot3","coi2"] },
            { paragraphBreak: true },
            { chars: ["眼","泪","若","嫌","多"," ","用","背","脊","唱","情","歌"], jp: ["ngaan5","leoi6","joek6","jim4","do1","","jung6","bui3","zik3","coeng3","cing4","go1"] },
            { chars: ["难","道","从","后","脑"," ","可","以","望","穿","我"," ","心","里","痛","什","么"], jp: ["naan4","dou6","cung4","hau6","nou5","","ho2","ji5","mong6","cyun1","ngo5","","sam1","leoi5","tung3","sam6","mo1"] },
            { chars: ["正","面","像","全","裸"], jp: ["zing3","min6","zoeng6","cyun4","lo2"] },
            { chars: ["遮","丑","的","布"," ","就","别","来","戳","破"], jp: ["ze1","cau2","dik1","bou3","","zau6","bit6","loi4","cok3","po3"] },
            { chars: ["愿","这","歌"," ","悲","到"," ","一","转","背"," ","人","间","都"," ","忘","掉","我"], jp: ["jyun6","ze5","go1","","bei1","dou3","","jat1","zyun3","bui3","","jan4","gaan1","dou1","","mong4","diu6","ngo5"] },
            { paragraphBreak: true },
            { chars: ["尚","有"," ","沉","重","的","几","句"," ","非","要","唱","不","可"], jp: ["soeng6","jau5","","cam4","zung6","dik1","gei2","geoi3","","fei1","jiu3","coeng3","bat1","ho2"] },
            { paragraphBreak: true },
            { chars: ["世","事","没","如","果"," ","别","再","冀","盼","如","果"], jp: ["sai3","si6","mut6","jyu4","gwo2","","bit6","zoi3","kei3","paan3","jyu4","gwo2"] },
            { chars: ["明","明"," ","放","低","的","你"," ","经","已","唱","新","歌"], jp: ["ming4","ming4","","fong3","dai1","dik1","nei5","","ging1","ji5","coeng3","san1","go1"] },
            { chars: ["我","尚","在","如","此"," ","不","知","丑"," ","唱","着","别","离","开","我"], jp: ["ngo5","soeng6","zoi6","jyu4","ci2","","bat1","zi1","cau2","","coeng3","zoek6","bit6","lei4","hoi1","ngo5"] },
            { chars: ["失","去","你"," ","唯","有","等","歌","迷","去"," ","喜","欢","我"], jp: ["sat1","heoi3","nei5","","wai4","jau5","dang2","go1","mai4","heoi3","","hei2","fun1","ngo5"] }
        ]
    };
    window.__songs.push(song);
})();
