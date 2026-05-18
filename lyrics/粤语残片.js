// 歌曲：粤语残片

(function() {
    const song = {
        id: 26,
        title: "粤语残片",
        titleJyutping: ["jyut6","jyu5","caan4","pin3"],
        artist: "陈奕迅",
        artistJyutping: ["can4","jik6","seon3"],
        lyricist: "周博贤",
        lyricistJyutping: ["zau1","bok3","jin4"],
        composer: "江志仁/陈奕迅",
        composerJyutping: ["gong1","zi3","jan4","","can4","jik6","seon3"],
        lyrics: [
            { chars: ["乔","迁","那","日","打","扫","废","物"," ","家","居","仿","似","开","战"], jp: ["kiu4","cin1","naa5","jat6","daa2","sou3","fai3","mat6","","gaa1","geoi1","fong2","ci5","hoi1","zin3"] },
            { chars: ["无","意","发","现","当","天","穿","返","学","夏","季","衬","衣"], jp: ["mou4","ji3","faat3","jin6","dong1","tin1","cyun1","faan2","hok6","haa6","gwai3","can3","ji1"] },
            { chars: ["奇", "怪", "却", "是", "茄", "汁", "污", "垢", " ", "渗", "在", "这", "衬", "衣", "布", "章", "外", "边"], jp: ["kei4", "gwaai3", "koek3", "si6", "ke2", "zap1", "wu1", "gau3", "", "sam3", "zoi6", "ze5", "can3", "ji1", "bou3", "zoeng1", "ngoi6", "bin1"] },
            { chars: ["极","其","大","意"," ","为","何","如","此"], jp: ["gik6","kei4","daai6","ji3","","wai4","ho4","jyu4","ci2"] },
            { paragraphBreak: true },
            { chars: ["想","那","日","初","次","约","会"," ","心","惊"," ","手","震"," ","胆","颤"], jp: ["soeng2","naa5","jat6","co1","ci3","joek3","wui6","","sam1","ging1","","sau2","zan3","","daam2","zin3"] },
            { chars: ["忙","里","泄","露","各","种","的","丑","态","像","丧","尸"], jp: ["mong4","lei5","sit3","lou6","gok3","zung2","dik1","cau2","taai3","zoeng6","song1","si1"] },
            { chars: ["而","尴","尬","是","快","餐","厅","里"," ","我","误","把","酱","汁","四","周","乱","溅"], jp: ["ji4","gaam1","gaai3","si6","faai3","caan1","teng1","lei5","","ngo5","ng6","baa2","zoeng3","zap1","sei3","zau1","lyun6","zin3"] },
            { chars: ["骇","人","场","面","相","当","讽","刺"], jp: ["haai5","jan4","coeng4","min6","soeng1","dong1","fung3","ci3"] },
            { paragraphBreak: true },
            { chars: ["你","及","时","递","上","餐","纸","去","为","我","清","洗","衬","衣"], jp: ["nei5","kap6","si4","dai6","soeng6","caan1","zi2","heoi3","wai4","ngo5","cing1","sai2","can3","ji1"] },
            { chars: ["刹","那","间","身","体","的","触","碰"," ","大","件","事"], jp: ["caat3","naa5","gaan1","san1","tai2","dik1","zuk1","pung3","","daai6","gin6","si6"] },
            { paragraphBreak: true },
            { chars: ["今","天","看","这","段","历","史","像","褪","色","午","夜","残","片"], jp: ["gam1","tin1","hon3","ze5","dyun6","lik6","si2","zoeng6","tan3","sik1","ng5","je6","caan4","pin3"] },
            { chars: ["笑","话","情","节"," ","此","刻","变","窝","心","故","事"], jp: ["siu3","waa6","cing4","zit3","","ci2","hak1","bin3","wo1","sam1","gu3","si6"] },
            { chars: ["现","时","大","了"," ","那","种","心","跳","难","重","演"], jp: ["jin6","si4","daai6","liu5","","naa5","zung2","sam1","tiu3","naan4","cung5","jin2"] },
            { chars: ["极","灿","烂","时","光","一","去"," ","难","再","遇","上","一","次"], jp: ["gik6","caan3","laan6","si4","gwong1","jat1","heoi3","","naan4","zoi3","jyu6","soeng6","jat1","ci3"] },
            { paragraphBreak: true },
            { chars: ["怎","努","力","都","想","不","起","初","恋","怎","会","改","变"], jp: ["zam2","nou5","lik6","dou1","soeng2","bat1","hei2","co1","lyun2","zam2","wui6","goi2","bin3"] },
            { chars: ["情","侣","数","字","我","屈","指","一","算","大","概","知"], jp: ["cing4","leoi5","sou3","zi6","ngo5","wat1","zi2","jat1","syun3","daai6","koi3","zi1"] },
            { chars: ["奇","怪","却","是","每","恋","一","次"," ","震","撼","总","逐","渐","变","得","越","浅"], jp: ["kei4","gwaai3","koek3","si6","mui5","lyun2","jat1","ci3","","zan3","ham6","zung2","zuk6","zim6","bin3","dak1","jyut6","cin2"] },
            { chars: ["令","人","动","心","只","得","那","次"], jp: ["ling6","jan4","dung6","sam1","zi2","dak1","naa5","ci3"] },
            { paragraphBreak: true },
            { chars: ["有","没","捱","坏","了","身","子"," ","会","为","哪","位","披","嫁","衣"], jp: ["jau5","mut6","ngaai4","waai6","liu5","san1","zi2","","wui6","wai4","naa5","wai6","pei1","gaa3","ji1"] },
            { chars: ["你","有","否","挂","念","当","天","这","丑","小","子"], jp: ["nei5","jau5","fau2","gwaa3","nim6","dong1","tin1","ze5","cau2","siu2","zi2"] },
            { paragraphBreak: true },
            { chars: ["今","天","看","那","段","历","史","像","褪","色","午","夜","残","片"], jp: ["gam1","tin1","hon3","naa5","dyun6","lik6","si2","zoeng6","tan3","sik1","ng5","je6","caan4","pin3"] },
            { chars: ["笑","话","情","节"," ","此","刻","变","窝","心","故","事"], jp: ["siu3","waa6","cing4","zit3","","ci2","hak1","bin3","wo1","sam1","gu3","si6"] },
            { chars: ["现","时","大","了"," ","那","种","心","跳","难","重","演"], jp: ["jin6","si4","daai6","liu5","","naa5","zung2","sam1","tiu3","naan4","cung5","jin2"] },
            { chars: ["极","灿","烂","时","光","一","去"," ","难","再","遇","上","一","次"], jp: ["gik6","caan3","laan6","si4","gwong1","jat1","heoi3","","naan4","zoi3","jyu6","soeng6","jat1","ci3"] },
            { paragraphBreak: true },
            { chars: ["在","混","乱","杂","物","当","中","找","到","失","去","的","往","事"], jp: ["zoi6","wan6","lyun6","zaap6","mat6","dong1","zung1","zaau2","dou3","sat1","heoi3","dik1","wong5","si6"] },
            { chars: ["但","现","在","杂","物","与","我","举","家","将","会","搬","迁"], jp: ["daan6","jin6","zoi6","zaap6","mat6","jyu5","ngo5","geoi2","gaa1","zoeng1","wui6","bun1","cin1"] },
            { chars: ["让","记","念","成","历","史"], jp: ["joeng6","gei3","nim6","sing4","lik6","si2"] },
            { paragraphBreak: true },
            { chars: ["想","想","那","旧","时","日","子","像","褪","色","午","夜","残","片"], jp: ["soeng2","soeng2","naa5","gau6","si4","jat6","zi2","zoeng6","tan3","sik1","ng5","je6","caan4","pin3"] },
            { chars: ["任","何","情","节"," ","今","天","多","一","种","意","义"], jp: ["jam6","ho4","cing4","zit3","","gam1","tin1","do1","jat1","zung2","ji3","ji6"] },
            { chars: ["现","时","大","了"," ","那","种","心","跳","难","重","演"], jp: ["jin6","si4","daai6","liu5","","naa5","zung2","sam1","tiu3","naan4","cung5","jin2"] },
            { chars: ["极","爆","裂","场","面","想","再","遇","确","实","靠","天","意"], jp: ["gik6","baau3","lit6","coeng4","min6","soeng2","zoi3","jyu6","kok3","sat6","kaau3","tin1","ji3"] }
        ]
    };
    window.__songs.push(song);
}());

// ⚠️ 重要：请在 index.html 的 songFiles 数组中添加以下一行：
// 'lyrics/粤语残片.js',
