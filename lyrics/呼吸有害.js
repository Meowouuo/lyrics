// 歌曲：呼吸有害

(function() {
    const song = {
        id: 30,
        title: "呼吸有害",
        titleJyutping: ["fu1","kap1","jau5","hoi6"],
        artist: "莫文蔚",
        artistJyutping: ["mok6","man4","wai3"],
        lyricist: "罗健成",
        lyricistJyutping: ["lo4","gin6","sing4"],
        composer: "邓智伟",
        composerJyutping: ["dang6","zi3","wai5"],
        lyrics: [
            { chars: ["缺","氧","到","似","有","幻","象"," ","乏","力","地","躺","于","地","上"], jp: ["kyut3","joeng5","dou3","ci5","jau5","waan6","zoeng6","","fat6","lik6","dei6","tong2","jyu1","dei6","soeng6"] },
            { chars: ["合","上","双","眼","用","皮","肤","感","应","无","常"], jp: ["hap6","soeng6","soeng1","ngaan5","jung6","pei4","fu1","gam2","jing3","mou4","soeng4"] },
            { chars: ["这","里","有","过","你"," ","未","及","步","离","场"], jp: ["ze5","lei5","jau5","gwo3","nei5","","mei6","kap6","bou6","lei4","coeng4"] },
            { chars: ["被","你","的","气","味"," ","筑","起","了","围","墙"], jp: ["bei6","nei5","dik1","hei3","mei6","","zuk1","hei2","liu5","wai4","coeng4"] },
            { paragraphBreak: true },
            { chars: ["从","头","再","呼","吸"," ","残","存","那","种","美"], jp: ["cung4","tau4","zoi3","fu1","kap1","","caan4","cyun4","naa5","zung2","mei5"] },
            { chars: ["现","在","向","到","的","苦"," ","从","前","是","最","动","人","甜","味"], jp: ["jin6","zoi6","hoeng3","dou3","dik1","fu2","","cung4","cin4","si6","zeoi3","dung6","jan4","tim4","mei6"] },
            { paragraphBreak: true },
            { chars: ["旧","事","物","充","斥","空","气","内"," ","一","呼","一","吸","都","有","害"], jp: ["gau6","si6","mat6","cung1","cik1","hung1","hei3","noi6","","jat1","fu1","jat1","kap1","dou1","jau5","hoi6"] },
            { chars: ["床","边","有","你"," ","厅","有","你"," ","进","出","于","脑","海"], jp: ["cong4","bin1","jau5","nei5","","teng1","jau5","nei5","","zeon3","ceot1","jyu1","nou5","hoi2"] },
            { chars: ["寂","寞","充","斥","空","气","内"," ","抑","郁","吸","入","来"], jp: ["zik6","mok6","cung1","cik1","hung1","hei3","noi6","","jik1","juk1","kap1","jap6","loi4"] },
            { chars: ["宁","愿","闭","气"," ","吸","进","你","会","沾","湿","眼","袋"], jp: ["ning4","jyun6","bai3","hei3","","kap1","zeon3","nei5","wui6","zim1","sap1","ngaan5","doi6"] },
            { paragraphBreak: true },
            { chars: ["勉","强","再","试","试","站","立"," ","自","愿","地","展","开","学","习"], jp: ["min5","koeng4","zoi3","si3","si3","zaam6","lap6","","zi6","jyun6","dei6","zin2","hoi1","hok6","zaap6"] },
            { chars: ["尽","快","适","应","着","残","忍","的","低","气","压"], jp: ["zeon6","faai3","sik1","jing3","zoek6","caan4","jan2","dik1","dai1","hei3","aat3"] },
            { chars: ["似","欠","缺","勇","气"," ","不","敢","失","去","你"], jp: ["ci5","him3","kyut3","jung5","hei3","","bat1","gam2","sat1","heoi3","nei5"] },
            { chars: ["亦","欠","骨","气","让","身","心","也","逃","离"], jp: ["jik6","him3","gwat1","hei3","joeng6","san1","sam1","jaa5","tou4","lei4"] },
            { paragraphBreak: true },
            { chars: ["从","头","再","呼","吸"," ","沉","沉","那","死","气"], jp: ["cung4","tau4","zoi3","fu1","kap1","","cam4","cam4","naa5","sei2","hei3"] },
            { chars: ["渗","满","氧","化","浪","漫"," ","沉","迷","在","这","耐","人","寻","味"], jp: ["sam3","mun5","joeng5","faa3","long6","maan6","","cam4","mai4","zoi6","ze5","noi6","jan4","cam4","mei6"] },
            { paragraphBreak: true },
            { chars: ["旧","事","物","充","斥","空","气","内"," ","一","呼","一","吸","都","有","害"], jp: ["gau6","si6","mat6","cung1","cik1","hung1","hei3","noi6","","jat1","fu1","jat1","kap1","dou1","jau5","hoi6"] },
            { chars: ["床","边","有","你"," ","厅","有","你"," ","进","出","于","脑","海"], jp: ["cong4","bin1","jau5","nei5","","teng1","jau5","nei5","","zeon3","ceot1","jyu1","nou5","hoi2"] },
            { chars: ["寂","寞","充","斥","空","气","内"," ","抑","郁","吸","入","来"], jp: ["zik6","mok6","cung1","cik1","hung1","hei3","noi6","","jik1","juk1","kap1","jap6","loi4"] },
            { chars: ["宁","愿","闭","气"," ","吸","进","你","会","沾","湿","眼","袋"], jp: ["ning4","jyun6","bai3","hei3","","kap1","zeon3","nei5","wui6","zim1","sap1","ngaan5","doi6"] },
            { paragraphBreak: true },
            { chars: ["窒","息","都","不","意","外"," ","不","呼","不","吸","不","盼","待"], jp: ["zat6","sik1","dou1","bat1","ji3","ngoi6","","bat1","fu1","bat1","kap1","bat1","paan3","doi6"] },
            { chars: ["不","要","你"," ","不","要","你"," ","要","清","空","脑","袋"], jp: ["bat1","jiu3","nei5","","bat1","jiu3","nei5","","jiu3","cing1","hung1","nou5","doi6"] },
            { chars: ["尽","量","振","作","也","应","该"," ","每","一","扇","窗","也","打","开"], jp: ["zeon6","loeng4","zan3","zok3","jaa5","jing3","goi1","","mui5","jat1","sin3","coeng1","jaa5","daa2","hoi1"] },
            { chars: ["不","怕","你"," ","不","怕","你"," ","怕","呼","吸","有","害"], jp: ["bat1","paa3","nei5","","bat1","paa3","nei5","","paa3","fu1","kap1","jau5","hoi6"] }
        ]
    };
    if (typeof window !== 'undefined' && window.__songs) {
        window.__songs.push(song);
    }
})();
