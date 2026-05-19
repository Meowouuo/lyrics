// 歌曲：悲歌之王

(function() {
    const song = {
        id: 369,
        title: "悲歌之王",
        titleJyutping: ["bei1","go1","zi1","wong4"],
        artist: "杨千嬅",
        artistJyutping: ["joeng4","cin1","waa6"],
        lyricist: "林若宁",
        lyricistJyutping: ["lam4","joek6","ning4"],
        composer: "林一峰",
        composerJyutping: ["lam4","jat1","fung1"],
        lyrics: [
            { chars: ["明","明","我","起","舞","像","羽","毛"], jp: ["ming4","ming4","ngo5","hei2","mou5","zoeng6","jyu5","mou4"] },
            { chars: ["任","我","轻","飘","飘","都","跌","倒"], jp: ["jam6","ngo5","hing1","piu1","piu1","dou1","dit3","dou2"] },
            { chars: ["难","令","我","羡","慕"], jp: ["naan4","ling6","ngo5","sin6","mou6"] },
            { chars: ["蝴","蝶","扑","不","到","晨","早"], jp: ["wu4","dip6","pok3","bat1","dou3","san4","zou2"] },
            { chars: ["翅","膀","迟","早","都","衰","老"], jp: ["ci3","bong2","ci4","zou2","dou1","seoi1","lou5"] },
            { paragraphBreak: true },
            { chars: ["为","何","要","斗","数"], jp: ["wai4","ho4","jiu3","dau3","sou3"] },
            { chars: ["问","我","前","途"], jp: ["man6","ngo5","cin4","tou4"] },
            { chars: ["愉","快","这","么","少","不","要","数"], jp: ["jyu4","faai3","ze5","maa1","siu2","bat1","jiu3","sou3"] },
            { chars: ["甜","蜜","有","限","度"], jp: ["tim4","mat6","jau5","haan6","dou6"] },
            { chars: ["期","望","那","可","过","份","高"], jp: ["kei4","mong6","naa5","ho2","gwo3","fan6","gou1"] },
            { chars: ["俯","瞰","风","光","也","恐","怖"], jp: ["fu2","ham3","fung1","gwong1","jaa5","hung2","bou3"] },
            { paragraphBreak: true },
            { chars: ["神","只","会","歧","视","我"], jp: ["san4","zi2","wui6","kei4","si6","ngo5"] },
            { chars: ["祷","告","假","装","听","不","到"], jp: ["tou2","gou3","gaa2","zong1","ting1","bat1","dou3"] },
            { chars: ["逼","迫","悲","观","的","少","女","穷","途","无","路"], jp: ["bik1","baak1","bei1","gun1","dik1","siu2","neoi5","kung4","tou4","mou4","lou6"] },
            { chars: ["唯","有","绝","望"], jp: ["wai4","jau5","zyut6","mong6"] },
            { chars: ["弹","尽","世","间","各","样","好"], jp: ["daan6","zeon6","sai3","gaan1","gok3","joeng6","hou2"] },
            { chars: ["坚","决","拒","绝","祈","祷"], jp: ["gin1","kyut3","keoi5","zyut6","kei4","tou2"] },
            { paragraphBreak: true },
            { chars: ["从","来","吃","不","到","味","美","葡","萄"], jp: ["cung4","loi4","hek3","bat1","dou3","mei6","mei5","pou4","tou4"] },
            { chars: ["问","我","怎","懂","得","讲","句","好"], jp: ["man6","ngo5","zam2","dung2","dak1","gong2","geoi3","hou2"] },
            { chars: ["凭","借","你","味","道"], jp: ["pang4","ze3","nei5","mei6","dou6"] },
            { chars: ["明","白","我","的","价","值","高"], jp: ["ming4","baak6","ngo5","dik1","gaai3","zik6","gou1"] },
            { chars: ["好","到","使","得","我","焦","躁"], jp: ["hou2","dou3","si2","dak1","ngo5","ziu1","cou3"] },
            { paragraphBreak: true },
            { chars: ["神","只","会","惩","罚","我"], jp: ["san4","zi2","wui6","cing4","fat6","ngo5"] },
            { chars: ["好","处","怎","高","攀","得","到"], jp: ["hou2","cyu5","zam2","gou1","paan1","dak1","dou3"] },
            { chars: ["逼","迫","悲","观","的","少","女","穷","途","无","路"], jp: ["bik1","baak1","bei1","gun1","dik1","siu2","neoi5","kung4","tou4","mou4","lou6"] },
            { chars: ["唯","有","绝","望"], jp: ["wai4","jau5","zyut6","mong6"] },
            { chars: ["弹","尽","世","间","各","样","好"], jp: ["daan6","zeon6","sai3","gaan1","gok3","joeng6","hou2"] },
            { chars: ["坚","决","拒","绝","祈","祷"], jp: ["gin1","kyut3","keoi5","zyut6","kei4","tou2"] },
            { paragraphBreak: true },
            { chars: ["从","来","我","只","配","独","处","地","牢"], jp: ["cung4","loi4","ngo5","zi2","pui3","duk6","cyu5","dei6","lou4"] },
            { chars: ["在","暗","灰","天","空","找","最","好"], jp: ["zoi6","am3","fui1","tin1","hung1","zaau2","zeoi3","hou2"] },
            { chars: ["留","住","你","味","道"], jp: ["lau4","zyu6","nei5","mei6","dou6"] },
            { chars: ["甜","蜜","带","不","进","泥","土"], jp: ["tim4","mat6","daai3","bat1","zeon3","nai4","tou2"] },
            { chars: ["饱","满","始","终","会","呕","吐"], jp: ["baau2","mun5","ci2","zung1","wui6","au2","tou3"] },
            { paragraphBreak: true },
            { chars: ["留","住","你","味","道"], jp: ["lau4","zyu6","nei5","mei6","dou6"] },
            { chars: ["甜","蜜","带","不","进","泥","土"], jp: ["tim4","mat6","daai3","bat1","zeon3","nai4","tou2"] },
            { chars: ["一","切","始","终","要","清","扫"], jp: ["jat1","cit3","ci2","zung1","jiu3","cing1","sou3"] }
        ]
    };
    if (typeof window !== 'undefined' && window.__songs) {
        window.__songs.push(song);
    }
})();
