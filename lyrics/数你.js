// 歌曲：数你

(function() {
    const song = {
        id: 340,
        title: "数你",
        titleJyutping: ["sou3","nei5"],
        artist: "杨千嬅",
        artistJyutping: ["joeng4","cin1","waa6"],
        lyricist: "林夕",
        lyricistJyutping: ["lam4","zik6"],
        composer: "蔡德才",
        composerJyutping: ["coi3","dak1","coi4"],
        lyrics: [
            { chars: ["想","　","从","幽","幽","的","眼","圈"], jp: ["soeng2","","cung4","jau1","jau1","dik1","ngaan5","hyun1"] },
            { chars: ["逐","公","分","那","样","转"], jp: ["zuk6","gung1","fan1","naa5","joeng6","zyun2"] },
            { chars: ["为","你","点","算","着","疲","倦"], jp: ["wai4","nei5","dim2","syun3","zoek6","pei4","gyun6"] },
            { chars: ["愿","岁","月","难","被","我","数","完"], jp: ["jyun6","seoi3","jyut6","naan4","bei6","ngo5","sou3","jyun4"] },
            { chars: ["地","老","天","荒","能","转","多","少","个","圈"], jp: ["dei6","lou5","tin1","fong1","nang4","zyun2","do1","siu2","go3","hyun1"] },
            { paragraphBreak: true },
            { chars: ["想","　","从","撕","开","的","戏","飞"], jp: ["soeng2","","cung4","si1","hoi1","dik1","hei3","fei1"] },
            { chars: ["逐","分","钟","挂","念","你"], jp: ["zuk6","fan1","zung1","gwaa3","nim6","nei5"] },
            { chars: ["是","哪","一","套","最","回","味"], jp: ["si6","naa5","jat1","tou3","zeoi3","wui4","mei6"] },
            { chars: ["从","每","日","然","后","每","星","期"], jp: ["cung4","mui5","jat6","jin4","hau6","mui5","sing1","kei4"] },
            { chars: ["你","我","一","起","能","看","多","少","套","戏"], jp: ["nei5","ngo5","jat1","hei2","nang4","hon3","do1","siu2","tou3","hei3"] },
            { paragraphBreak: true },
            { chars: ["无","奈","肉","眼","看","不","到"], jp: ["mou4","noi6","juk6","ngaan5","hon3","bat1","dou3"] },
            { chars: ["用","两","手","摸","不","到"], jp: ["jung6","loeng5","sau2","mo2","bat1","dou3"] },
            { chars: ["怎","么","计","算","亦","难","料","沈","迷","程","度"], jp: ["zam2","maa1","gai3","syun3","jik6","naan4","liu6","sam2","mai4","cing4","dou6"] },
            { paragraphBreak: true },
            { chars: ["同","偕","到","老","还","余","下","多","少","步"], jp: ["tung4","gaai1","dou3","lou5","waan4","jyu4","haa6","do1","siu2","bou6"] },
            { chars: ["还","能","捏","着","你","抱","紧","几","秒","钟","拥","抱"], jp: ["waan4","nang4","nip6","zoek6","nei5","pou5","gan2","gei2","miu5","zung1","jung2","pou5"] },
            { chars: ["谁","又","会","知","道"], jp: ["seoi4","jau6","wui6","zi1","dou6"] },
            { chars: ["凭","每","下","心","跳","继","续","数","继","续","数"], jp: ["pang4","mui5","haa6","sam1","tiu3","gai3","zuk6","sou3","gai3","zuk6","sou3"] },
            { chars: ["只","愿","延","续","下","去","数","得","到","苍","老"], jp: ["zi2","jyun6","jin4","zuk6","haa6","heoi3","sou3","dak1","dou3","cong1","lou5"] },
            { paragraphBreak: true },
            { chars: ["想","　","从","汹","涌","的","发","埋","逐","公","分","看","下","去"], jp: ["soeng2","","cung4","hung1","cung1","dik1","faat3","maai4","zuk6","gung1","fan1","hon3","haa6","heoi3"] },
            { chars: ["直","到","拥","抱","着","沈","睡"], jp: ["zik6","dou3","jung2","pou5","zoek6","sam2","seoi6"] },
            { chars: ["命","与","运","埋","在","你","手","里"], jp: ["ming6","jyu5","wan6","maai4","zoi6","nei5","sau2","lei5"] },
            { chars: ["你","那","些","掌","纹","有","多","少","爱","侣"], jp: ["nei5","naa5","se1","zoeng2","man4","jau5","do1","siu2","ngoi3","leoi5"] },
            { chars: ["谁","愿","意","知","道"], jp: ["seoi4","jyun6","ji3","zi1","dou6"] },
            { chars: ["凭","每","下","心","跳","继","续","数","继","续","数"], jp: ["pang4","mui5","haa6","sam1","tiu3","gai3","zuk6","sou3","gai3","zuk6","sou3"] },
            { chars: ["数","着","何","时","流","泪","才","能","被","看","到"], jp: ["sou3","zoek6","ho4","si4","lau4","leoi6","coi4","nang4","bei6","hon3","dou3"] },
            { chars: ["还","能","与","你","再","听","几","多","音","乐"], jp: ["waan4","nang4","jyu5","nei5","zoi3","ting1","gei2","do1","jam1","lok6"] },
            { chars: ["还","能","伴","着","你","再","跳","几","世","纪","的","舞"], jp: ["waan4","nang4","bun6","zoek6","nei5","zoi3","tiu3","gei2","sai3","gei2","dik1","mou5"] },
            { paragraphBreak: true },
            { chars: ["其","实","我","知","道"], jp: ["kei4","sat6","ngo5","zi1","dou6"] },
            { chars: ["迷","上","你"], jp: ["mai4","soeng6","nei5"] },
            { chars: ["一","分","一","秒","煎","熬"], jp: ["jat1","fan1","jat1","miu5","zin1","ngaau4"] },
            { chars: ["一","次","倾","慕"], jp: ["jat1","ci3","king1","mou6"] },
            { chars: ["只","愿","容","貌","让","我","数","得","到","苍","老"], jp: ["zi2","jyun6","jung4","maau6","joeng6","ngo5","sou3","dak1","dou3","cong1","lou5"] },
            { chars: ["一","秒","煎","熬"], jp: ["jat1","miu5","zin1","ngaau4"] },
            { chars: ["一","寸","倾","慕"], jp: ["jat1","cyun3","king1","mou6"] },
            { chars: ["数","着","何","时","望","到","彼","此","也","苍","老"], jp: ["sou3","zoek6","ho4","si4","mong6","dou3","bei2","ci2","jaa5","cong1","lou5"] }
        ]
    };
    if (typeof window !== 'undefined' && window.__songs) {
        window.__songs.push(song);
    }
})();
