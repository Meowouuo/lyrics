// 歌曲：樱花树下

(function() {
    const song = {
        id: 210,
        title: "樱花树下",
        titleJyutping: ["jing1","faa1","syu6","haa6"],
        artist: "张敬轩",
        artistJyutping: ["zoeng1","ging3","hin1"],
        lyricist: "林若宁",
        lyricistJyutping: ["lam4","joek6","ning4"],
        composer: "伍卓贤",
        composerJyutping: ["ng5","coek3","jin4"],
        lyrics: [
            { chars: ["树","荫","有","一","只","蝉","跌","落","你","身","边"], jp: ["syu6","jam1","jau5","jat1","zi2","sim4","dit3","lok6","nei5","san1","bin1"] },
            { chars: ["惊","慌","到","失","足","向","前","然","后","扑","入","我","一","双","肩"], jp: ["ging1","fong1","dou3","sat1","zuk1","hoeng3","cin4","jin4","hau6","pok3","jap6","ngo5","jat1","soeng1","gin1"] },
            { chars: ["令","你","腼","腆","一","脸","像","樱","花","万","千"], jp: ["ling6","nei5","min5","tin2","jat1","lim5","zoeng6","jing1","faa1","maan6","cin1"] },
            { chars: ["怀","念","美","好","高","中","两","年","期","望","你","的","青","春","不","变"], jp: ["waai4","nim6","mei5","hou2","gou1","zung1","loeng5","nin4","kei4","mong6","nei5","dik1","cing1","ceon1","bat1","bin3"] },
            { chars: ["去","到","今","天"], jp: ["heoi3","dou3","gam1","tin1"] },
            { paragraphBreak: true },
            { chars: ["还","记","得","樱","花","正","开","还","未","懂","跟","你","示","爱"], jp: ["waan4","gei3","dak1","jing1","faa1","zing3","hoi1","waan4","mei6","dung2","gan1","nei5","si6","ngoi3"] },
            { chars: ["初","春","来","时","彼","此","约","定","过","继","续","期","待"], jp: ["co1","ceon1","loi4","si4","bei2","ci2","joek3","ding6","gwo3","gai3","zuk6","kei4","doi6"] },
            { chars: ["人","置","身","这","大","时","代","投","入","几","番","竞","技","赛"], jp: ["jan4","zi3","san1","ze5","daai6","si4","doi6","tau4","jap6","gei2","faan1","ging6","gei6","coi3"] },
            { chars: ["曾","分","开","曾","相","爱","等","待","花","蕊","又","跌","下","来"], jp: ["zang1","fan1","hoi1","zang1","soeng1","ngoi3","dang2","doi6","faa1","jeoi5","jau6","dit3","haa6","loi4"] },
            { chars: ["才","洞","悉","这","是","恋","爱"], jp: ["coi4","dung6","sik1","ze5","si6","lyun2","ngoi3"] },
            { paragraphBreak: true },
            { chars: ["未","有","过","的","爱","情","但","有","种","温","馨"], jp: ["mei6","jau5","gwo3","dik1","ngoi3","cing4","daan6","jau5","zung2","wan1","hing1"] },
            { chars: ["归","家","那","单","车","小","径","沿","路","细","听","你","的","歌","声"], jp: ["gwai1","gaa1","naa5","daan1","ce1","siu2","ging3","jyun4","lou6","sai3","ting1","nei5","dik1","go1","sing1"] },
            { chars: ["没","法","再","三","倾","听","你","的","感","动","暱","称"], jp: ["mut6","faat3","zoi3","saam1","king1","ting1","nei5","dik1","gam2","dung6","nik1","cing1"] },
            { chars: ["维","系","错","的","一","番","友","情","无","奈","已","经","不","可","纠","正"], jp: ["wai4","hai6","co3","dik1","jat1","faan1","jau5","cing4","mou4","noi6","ji5","ging1","bat1","ho2","gau2","zing3"] },
            { chars: ["太","过","坚","贞"], jp: ["taai3","gwo3","gin1","zing1"] },
            { paragraphBreak: true },
            { chars: ["还","记","得","樱","花","正","开","还","未","懂","跟","你","示","爱"], jp: ["waan4","gei3","dak1","jing1","faa1","zing3","hoi1","waan4","mei6","dung2","gan1","nei5","si6","ngoi3"] },
            { chars: ["初","春","来","时","彼","此","闭","著","眼","渴","望","未","来"], jp: ["co1","ceon1","loi4","si4","bei2","ci2","bai3","zyu3","ngaan5","hot3","mong6","mei6","loi4"] },
            { chars: ["人","置","身","这","大","时","代","投","入","几","番","竞","技","赛"], jp: ["jan4","zi3","san1","ze5","daai6","si4","doi6","tau4","jap6","gei2","faan1","ging6","gei6","coi3"] },
            { chars: ["曾","分","开","曾","相","爱","等","待","跟","你","未","爱","的","爱"], jp: ["zang1","fan1","hoi1","zang1","soeng1","ngoi3","dang2","doi6","gan1","nei5","mei6","ngoi3","dik1","ngoi3"] },
            { chars: ["你","说","悲","不","悲","哀"], jp: ["nei5","syut3","bei1","bat1","bei1","oi1"] },
            { paragraphBreak: true },
            { chars: ["秒","速","之","间","变","改","小","小","世","界"], jp: ["miu5","cuk1","zi1","gaan1","bin3","goi2","siu2","siu2","sai3","gaai3"] },
            { chars: ["眷","恋","也","许","走","不","过","拆","卸","的","街"], jp: ["gyun3","lyun2","jaa5","heoi2","zau2","bat1","gwo3","caak3","se3","dik1","gaai1"] },
            { chars: ["少","女","亦","随","年","渐","长","走","得","多","么","快"], jp: ["siu2","neoi5","jik6","ceoi4","nin4","zim6","coeng4","zau2","dak1","do1","maa1","faai3"] },
            { paragraphBreak: true },
            { chars: ["如","有","天","樱","花","再","开","期","望","可","跟","你","示","爱"], jp: ["jyu4","jau5","tin1","jing1","faa1","zoi3","hoi1","kei4","mong6","ho2","gan1","nei5","si6","ngoi3"] },
            { chars: ["当","天","园","林","今","天","已","换","上","满","地","青","苔"], jp: ["dong1","tin1","jyun4","lam4","gam1","tin1","ji5","wun6","soeng6","mun5","dei6","cing1","toi4"] },
            { chars: ["如","有","天","置","地","门","外","乘","电","车","跨","过","大","海"], jp: ["jyu4","jau5","tin1","zi3","dei6","mun4","ngoi6","sing4","din6","ce1","kwaa3","gwo3","daai6","hoi2"] },
            { chars: ["匆","匆","跟","你","相","望","一","眼","没","理","睬"], jp: ["cung1","cung1","gan1","nei5","soeng1","mong6","jat1","ngaan5","mut6","lei5","coi2"] },
            { chars: ["明","日","花","昨","日","已","开"], jp: ["ming4","jat6","faa1","zok6","jat6","ji5","hoi1"] }
        ]
    };
    if (typeof window !== 'undefined' && window.__songs) {
        window.__songs.push(song);
    }
})();
