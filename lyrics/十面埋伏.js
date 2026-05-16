// 歌曲：十面埋伏

(function() {
    const song = {
        id: 39,
        title: "十面埋伏",
        titleJyutping: ["sap6","min6","maai4","fuk6"],
        artist: "陈奕迅",
        artistJyutping: ["can4","jik6","seon3"],
        lyricist: "黄伟文",
        lyricistJyutping: ["wong4","wai5","man4"],
        composer: "Eric Kwok",
        composerJyutping: ["","","","","","","","",""],
        lyrics: [
            { chars: ["闻","说","你","时","常","在","下","午"," ","来","这","里","寄","信","件"], jp: ["man4","syut3","nei5","si4","soeng4","zoi6","haa6","ng5","","loi4","ze5","lei5","gei3","seon3","gin6"] },
            { chars: ["逢","礼","拜","留","连","艺","术","展"," ","还","是","未","间","断"], jp: ["fung4","lai5","baai3","lau4","lin4","ngai6","seot6","zin2","","waan4","si6","mei6","gaan1","dyun6"] },
            { chars: ["何","以","我","来","回","巡","逻","遍"," ","仍","然","和","你","擦","肩"], jp: ["ho4","ji5","ngo5","loi4","wui4","ceon4","lo4","pin3","","jing4","jin4","wo4","nei5","caat3","gin1"] },
            { chars: ["还","仍","然","在","各","自","宇","宙"," ","错","过","了","春","天"], jp: ["waan4","jing4","jin4","zoi6","gok3","zi6","jyu5","zau6","","co3","gwo3","liu5","ceon1","tin1"] },
            { paragraphBreak: true },
            { chars: ["只","差","一","点","点","即","可","以","再","会","面"], jp: ["zi2","caa1","jat1","dim2","dim2","zik1","ho2","ji5","zoi3","wui6","min6"] },
            { chars: ["可","惜","偏","偏","刚","刚","擦","过"," ","十","面","埋","伏","过"," ","孤","单","感","更","赤","裸"], jp: ["ho2","sik1","pin1","pin1","gong1","gong1","caat3","gwo3","","sap6","min6","maai4","fuk6","gwo3","","gu1","daan1","gam2","gang1","cek3","lo2"] },
            { chars: ["总","差","一","点","点","先","可","以","再","会","面"], jp: ["zung2","caa1","jat1","dim2","dim2","sin1","ho2","ji5","zoi3","wui6","min6"] },
            { chars: ["彷","彿","应","该","一","早","见","过"," ","但","直","行","直","过"], jp: ["pong4","fat1","jing3","goi1","jat1","zou2","gin3","gwo3","","daan6","zik6","hang4","zik6","gwo3"] },
            { chars: ["只","差","一","个","眼","波"," ","将","彼","此","错","过"], jp: ["zi2","caa1","jat1","go3","ngaan5","bo1","","zoeng1","bei2","ci2","co3","gwo3"] },
            { paragraphBreak: true },
            { chars: ["迟","两","秒","搭","上","地","下","铁"," ","能","与","你","碰","上","么"], jp: ["ci4","loeng5","miu5","daap3","soeng6","dei6","haa6","tit3","","nang4","jyu5","nei5","pung3","soeng6","maa1"] },
            { chars: ["如","提","前","十","步","入","电","梯"," ","谁","又","被","错","过"], jp: ["jyu4","tai4","cin4","sap6","bou6","jap6","din6","tai1","","seoi4","jau6","bei6","co3","gwo3"] },
            { chars: ["和","某","某","从","来","未","预","约"," ","为","何","能","见","更","多"], jp: ["wo4","mau5","mau5","cung4","loi4","mei6","jyu6","joek3","","wai4","ho4","nang4","gin3","gang1","do1"] },
            { chars: ["全","城","来","撞","你"," ","但","最","后","处","处","有","险","阻"], jp: ["cyun4","sing4","loi4","zong6","nei5","","daan6","zeoi3","hau6","cyu5","cyu5","jau5","him2","zo2"] },
            { paragraphBreak: true },
            { chars: ["只","差","一","点","点","即","可","以","再","会","面"], jp: ["zi2","caa1","jat1","dim2","dim2","zik1","ho2","ji5","zoi3","wui6","min6"] },
            { chars: ["可","惜","偏","偏","刚","刚","擦","过"," ","十","面","埋","伏","过"," ","孤","单","感","更","赤","裸"], jp: ["ho2","sik1","pin1","pin1","gong1","gong1","caat3","gwo3","","sap6","min6","maai4","fuk6","gwo3","","gu1","daan1","gam2","gang1","cek3","lo2"] },
            { chars: ["总","差","一","点","点","先","可","以","再","会","面"], jp: ["zung2","caa1","jat1","dim2","dim2","sin1","ho2","ji5","zoi3","wui6","min6"] },
            { chars: ["彷","彿","应","该","一","早","见","过"," ","但","直","行","直","过"], jp: ["pong4","fat1","jing3","goi1","jat1","zou2","gin3","gwo3","","daan6","zik6","hang4","zik6","gwo3"] },
            { chars: ["只","等","一","个","眼","波"], jp: ["zi2","dang2","jat1","go3","ngaan5","bo1"] },
            { paragraphBreak: true },
            { chars: ["轨","迹","改","变","角","度","交","错"," ","寂","寞","城","市","又","再","探","戈"], jp: ["gwai2","zik1","goi2","bin3","gok3","dou6","gaau1","co3","","zik6","mok6","sing4","si5","jau6","zoi3","taam3","gwo1"] },
            { chars: ["天","空","闪","过","灿","烂","花","火"," ","和","你","不","再","为","爱","奔","波"], jp: ["tin1","hung1","sim2","gwo3","caan3","laan6","faa1","fo2","","wo4","nei5","bat1","zoi3","wai4","ngoi3","ban1","bo1"] },
            { paragraphBreak: true },
            { chars: ["总","差","一","点","点","先","可","以","再","会","面"], jp: ["zung2","caa1","jat1","dim2","dim2","sin1","ho2","ji5","zoi3","wui6","min6"] },
            { chars: ["悔","不","当","初","轻","轻","放","过"," ","现","在","惩","罚","我"," ","分","手","分","错","了","么"], jp: ["fui3","bat1","dong1","co1","hing1","hing1","fong3","gwo3","","jin6","zoi6","cing4","fat6","ngo5","","fan1","sau2","fan1","co3","liu5","maa1"] },
            { chars: ["分","开","一","千","天"," ","天","天","盼","再","会","面"], jp: ["fan1","hoi1","jat1","cin1","tin1","","tin1","tin1","paan3","zoi3","wui6","min6"] },
            { chars: ["只","怕","是","你","先","找","到","我"," ","但","直","行","直","过"], jp: ["zi2","paa3","si6","nei5","sin1","zaau2","dou3","ngo5","","daan6","zik6","hang4","zik6","gwo3"] },
            { chars: ["天","都","帮","你","去","躲"," ","躲","开","不","见","我"], jp: ["tin1","dou1","bong1","nei5","heoi3","do2","","do2","hoi1","bat1","gin3","ngo5"] }
        ]
    };
    if (typeof window !== 'undefined' && window.__songs) {
        window.__songs.push(song);
    }
})();
