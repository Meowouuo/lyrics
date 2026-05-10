// 歌曲：海阔天空

(function() {
    const song =     {
        id: 3,
        title: "海阔天空",
        titleJyutping: ["hoi2","fut3","tin1","hung1"],
        artist: "Beyond",
        artistJyutping: ["b","i","j","o","n","d"],
        lyricist: "黄家驹",
        lyricistJyutping: ["wong4","gaa1","keoi1"],
        composer: "黄家驹",
        composerJyutping: ["wong4","gaa1","keoi1"],
        lyrics: [
            { chars: ["今","天","我","寒","夜","里","看","雪","飘","过"], jp: ["gam1","tin1","ngo5","hon4","je6","leoi5","hon3","syut3","piu1","gwo3"] },
            { chars: ["怀","着","冷","却","了","的","心","窝","漂","远","方"], jp: ["waai4","zoek6","laang5","koek3","liu5","dik1","sam1","wo1","piu1","jyun5","fong1"] },
            { chars: ["风","雨","里","追","赶"," ","雾","里","分","不","清","影","踪"], jp: ["fung1","jyu5","leoi5","zeoi1","gon2","","mou6","leoi5","fan1","bat1","cing1","jing2","zung1"] },
            { chars: ["天","空","海","阔"," ","你","与","我","可","会","变"," ","（","谁","没","在","变","？","）"], jp: ["tin1","hung1","hoi2","fut3","","nei5","jyu5","ngo5","ho2","wui5","bin3","","","seoi4","mut6","zoi6","bin3","",""] },
            { paragraphBreak: true },
            { chars: ["多","少","次","迎","着","冷","眼","与","嘲","笑"], jp: ["do1","siu2","ci3","jing4","zoek6","laang5","ngaan5","jyu5","zaau1","siu3"] },
            { chars: ["从","没","有","放","弃","过","心","中","的","理","想"], jp: ["cung4","mut6","jau5","fong3","hei3","gwo3","sam1","zung1","dik1","lei5","soeng2"] },
            { chars: ["一","刹","那","恍","惚"," ","若","有","所","失","的","感","觉"], jp: ["jat1","saat3","naa5","fong2","fat1","","joek6","jau5","so2","sat1","dik1","gam2","gok3"] },
            { chars: ["不","知","不","觉","已","变","淡","心","里","爱"," ","（","谁","明","白","我","？","）"], jp: ["bat1","zi1","bat1","gok3","ji5","bin3","daam6","sam1","leoi5","oi3","","","seoi4","ming4","baak6","ngo5","",""] },
            { paragraphBreak: true },
            { chars: ["原","谅","我","这","一","生","不","羁","放","纵"," ","爱","自","由"], jp: ["jyun4","loeng6","ngo5","ze5","jat1","saang1","bat1","gei1","fong3","zung3","","oi3","zi6","jau4"] },
            { chars: ["也","会","怕","有","一","天","会","跌","倒"," ","oh","，","no"], jp: ["jaa5","wui5","paa3","jau5","jat1","tin1","wui5","dit3","dou2","","oh","","no"] },
            { chars: ["背","弃","了","理","想"," ","谁","人","都","可","以"], jp: ["bui3","hei3","liu5","lei5","soeng2","","seoi4","jan4","dou1","ho2","ji5"] },
            { chars: ["哪","会","怕","有","一","天","只","你","共","我"], jp: ["naa5","wui5","paa3","jau5","jat1","tin1","zi2","nei5","gung6","ngo5"] },
            { paragraphBreak: true },
            { chars: ["今","天","我","寒","夜","里","看","雪","飘","过"], jp: ["gam1","tin1","ngo5","hon4","je6","leoi5","hon3","syut3","piu1","gwo3"] },
            { chars: ["怀","着","冷","却","了","的","心","窝","漂","远","方"], jp: ["waai4","zoek6","laang5","koek3","liu5","dik1","sam1","wo1","piu1","jyun5","fong1"] },
            { chars: ["风","雨","里","追","赶"," ","雾","里","分","不","清","影","踪"], jp: ["fung1","jyu5","leoi5","zeoi1","gon2","","mou6","leoi5","fan1","bat1","cing1","jing2","zung1"] },
            { chars: ["天","空","海","阔"," ","你","与","我","可","会","变"," ","（","谁","没","在","变","？","）"], jp: ["tin1","hung1","hoi2","fut3","","nei5","jyu5","ngo5","ho2","wui5","bin3","","","seoi4","mut6","zoi6","bin3","",""] },
            { paragraphBreak: true },
            { chars: ["原","谅","我","这","一","生","不","覊","放","纵","爱","自","由"], jp: ["jyun4","loeng6","ngo5","ze5","jat1","saang1","bat1","gei1","fong3","zung3","oi3","zi6","jau4"] },
            { chars: ["也","会","怕","有","一","天","会","跌","倒"," ","oh","，","no"], jp: ["jaa5","wui5","paa3","jau5","jat1","tin1","wui5","dit3","dou2","","oh","","no"] },
            { chars: ["背","弃","了","理","想"," ","谁","人","都","可","以"], jp: ["bui3","hei3","liu5","lei5","soeng2","","seoi4","jan4","dou1","ho2","ji5"] },
            { chars: ["哪","会","怕","有","一","天","只","你","共","我"," ","oh","，","yeah"], jp: ["naa5","wui5","paa3","jau5","jat1","tin1","zi2","nei5","gung6","ngo5","","oh","","yeah"] },
            { paragraphBreak: true },
            { chars: ["仍","然","自","由","自","我"," ","永","远","高","唱","我","歌"], jp: ["jing4","jin4","zi6","jau4","zi6","ngo5","","wing5","jyun5","gou1","coeng3","ngo5","go1"] },
            { chars: ["走","遍","千","里"], jp: ["zau2","pin3","cin1","lei5"] },
            { paragraphBreak: true },
            { chars: ["原","谅","我","这","一","生","不","羁","放","纵"," ","爱","自","由"], jp: ["jyun4","loeng6","ngo5","ze5","jat1","saang1","bat1","gei1","fong3","zung3","","oi3","zi6","jau4"] },
            { chars: ["也","会","怕","有","一","天","会","跌","倒"," ","oh","，","no"], jp: ["jaa5","wui5","paa3","jau5","jat1","tin1","wui5","dit3","dou2","","oh","","no"] },
            { chars: ["背","弃","了","理","想"," ","谁","人","都","可","以"], jp: ["bui3","hei3","liu5","lei5","soeng2","","seoi4","jan4","dou1","ho2","ji5"] },
            { chars: ["哪","会","怕","有","一","天","只","你","共","我"," ","oh","，","yeah"], jp: ["naa5","wui5","paa3","jau5","jat1","tin1","zi2","nei5","gung6","ngo5","","oh","","yeah"] },
            { paragraphBreak: true },
            { chars: ["（","原","谅","我","这","一","生","不","羁","放","纵"," ","爱","自","由","）"," ","oh","，","yeah"], jp: ["","jyun4","loeng6","ngo5","ze5","jat1","saang1","bat1","gei1","fong3","zung3","","oi3","zi6","jau4","","","oh","","yeah"] },
            { chars: ["（","也","会","怕","有","一","天","会","跌","倒","）"," ","oh-oh-oh"], jp: ["","jaa5","wui5","paa3","jau5","jat1","tin1","wui5","dit3","dou2","","","oh-oh-oh"] },
            { chars: ["（","背","弃","了","理","想"," ","谁","人","都","可","以","）"," ","whoa-oh"], jp: ["","bui3","hei3","liu5","lei5","soeng2","","seoi4","jan4","dou1","ho2","ji5","","","whoa-oh"] },
            { chars: ["（","哪","会","怕","有","一","天","只","你","共","我","）"], jp: ["","naa5","wui5","paa3","jau5","jat1","tin1","zi2","nei5","gung6","ngo5",""] }
        ]
;
    if (typeof window !== 'undefined' && window.__songs) {
        window.__songs.push(song);
    }
})();
