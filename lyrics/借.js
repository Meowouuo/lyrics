// 歌曲：借

(function() {
    const song = {
        id: 24,
        title: "借",
        titleJyutping: ["ze3"],
        artist: "郑融",
        artistJyutping: ["zeng6","jung4"],
        lyricist: "陈少琪",
        lyricistJyutping: ["can4","siu2","kei4"],
        composer: "邓智伟",
        composerJyutping: ["dang6","zi3","wai5"],
        lyrics: [
            { chars: ["传","闻","说","你","正","与","她","吵","架","不","见","面","了"], jp: ["cyun4","man4","syut3","nei5","zing3","jyu5","taa1","caau2","gaa3","bat1","gin3","min6","liu5"] },
            { chars: ["传","闻","说","你","仍","留","下","共","她","所","有","合","照"], jp: ["cyun4","man4","syut3","nei5","jing4","lau4","haa6","gung6","taa1","so2","jau5","hap6","ziu3"] },
            { chars: ["上","分","钟"," ","上","一","秒"," ","你","说","心","不","再","困","扰"], jp: ["soeng6","fan1","zung1","","soeng6","jat1","miu5","","nei5","syut3","sam1","bat1","zoi3","kwan3","jiu2"] },
            { chars: ["下","分","钟"," ","下","一","秒"," ","你","眼","睛","通","红","似","发","烧"], jp: ["haa6","fan1","zung1","","haa6","jat1","miu5","","nei5","ngaan5","zing1","tung1","hung4","ci5","faat3","siu1"] },
            { paragraphBreak: true },
            { chars: ["为","何","每","个","礼","拜","消","遣","都","早","约","定","了"], jp: ["wai4","ho4","mui5","go3","lai5","baai3","siu1","hin2","dou1","zou2","joek3","ding6","liu5"] },
            { chars: ["谁","人","个","唱","那","里","自","助","餐","都","已","订","票"], jp: ["seoi4","jan4","go3","coeng3","naa5","lei5","zi6","zo6","caan1","dou1","ji5","ding3","piu3"] },
            { chars: ["是","开","始"," ","又","不","对"," ","对","你","所","知","道","太","少"], jp: ["si6","hoi1","ci2","","jau6","bat1","deoi3","","deoi3","nei5","so2","zi1","dou6","taai3","siu2"] },
            { chars: ["是","知","己"," ","亦","不","对"," ","你","太","好","的","人","缘"," ","知","己","哪","会","缺","少"], jp: ["si6","zi1","gei2","","jik6","bat1","deoi3","","nei5","taai3","hou2","dik1","jan4","jyun4","","zi1","gei2","naa5","wui6","kyut3","siu2"] },
            { paragraphBreak: true },
            { chars: ["如","果","你","习","惯"," ","有","备","无","患"," ","只","怕","独","个","晚","餐"], jp: ["jyu4","gwo2","nei5","zaap6","gwaan3","","jau5","bei6","mou4","waan6","","zi2","paa3","duk6","go3","maan5","caan1"] },
            { chars: ["才","想","到","让","我","借","用","时","间"," ","借","用","完","没","法","还"], jp: ["coi4","soeng2","dou3","joeng6","ngo5","ze3","jung6","si4","gaan1","","ze3","jung6","jyun4","mut6","faat3","waan4"] },
            { chars: ["如","果","破","掉","灯","泡","借","烛","光","用","一","晚"," ","是","你","是","你","大","贪"], jp: ["jyu4","gwo2","po3","diu6","dang1","paau1","ze3","zuk1","gwong1","jung6","jat1","maan5","","si6","nei5","si6","nei5","daai6","taam1"] },
            { chars: ["大","贪","得","竟","搅","错","我","是","哪","种","人"," ","接","吻","就","能","合","眼"], jp: ["daai6","taam1","dak1","ging2","gaau2","co3","ngo5","si6","naa5","zung2","jan4","","zip3","man5","zau6","nang4","hap6","ngaan5"] },
            { paragraphBreak: true },
            { chars: ["明","明","每","次","你","说","她","喜","欢","加","上","盛","赞"], jp: ["ming4","ming4","mui5","ci3","nei5","syut3","taa1","hei2","fun1","gaa1","soeng6","sing6","zaan3"] },
            { chars: ["明","明","每","次","留","神","望","电","话","都","看","十","眼"], jp: ["ming4","ming4","mui5","ci3","lau4","san4","mong6","din6","waa6","dou1","hon3","sap6","ngaan5"] },
            { chars: ["是","专","心"," ","又","不","对"," ","你","眼","光","总","爱","转","弯"], jp: ["si6","zyun1","sam1","","jau6","bat1","deoi3","","nei5","ngaan5","gwong1","zung2","ngoi3","zyun2","waan1"] },
            { chars: ["是","分","心"," ","亦","不","对"," ","变","了","这","种","闲","人"," ","比","不","去","爱","更","惨"], jp: ["si6","fan1","sam1","","jik6","bat1","deoi3","","bin3","liu5","ze5","zung2","haan4","jan4","","bei2","bat1","heoi3","ngoi3","gang1","caam2"] },
            { paragraphBreak: true },
            { chars: ["如","果","你","习","惯"," ","有","备","无","患"," ","只","怕","独","个","晚","餐"], jp: ["jyu4","gwo2","nei5","zaap6","gwaan3","","jau5","bei6","mou4","waan6","","zi2","paa3","duk6","go3","maan5","caan1"] },
            { chars: ["才","想","到","让","我","借","用","时","间"," ","借","用","完","没","法","还"], jp: ["coi4","soeng2","dou3","joeng6","ngo5","ze3","jung6","si4","gaan1","","ze3","jung6","jyun4","mut6","faat3","waan4"] },
            { chars: ["如","果","破","掉","灯","泡","借","烛","光","用","一","晚"," ","是","你","是","你","大","贪"], jp: ["jyu4","gwo2","po3","diu6","dang1","paau1","ze3","zuk1","gwong1","jung6","jat1","maan5","","si6","nei5","si6","nei5","daai6","taam1"] },
            { chars: ["大","贪","得","竟","搅","错","我","是","哪","种","人"," ","接","吻","就","能","合","眼"], jp: ["daai6","taam1","dak1","ging2","gaau2","co3","ngo5","si6","naa5","zung2","jan4","","zip3","man5","zau6","nang4","hap6","ngaan5"] },
            { paragraphBreak: true },
            { chars: ["有","雨","没","提","着","伞"], jp: ["jau5","jyu5","mut6","tai4","zoek6","saan3"] }
        ]
    };
    window.__songs.push(song);
}());

// ⚠️ 重要：请在 index.html 的 songFiles 数组中添加以下一行：
// 'lyrics/借.js',
