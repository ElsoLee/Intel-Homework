var Xiami_api = {
    "search_keyword":"http://www.xiami.com/app/iphone/search/key/",
    "collect_keyword":"http://www.xiami.com/collect/search/",
    "get_collect_list":"http://www.xiami.com/song/playlist/type/3/id/"
}

$.extend({  
    z4x: function(s) {  
        var dom;  
        if (typeof(s) == "object") {  
            dom = s;  
        } else if (typeof(s) == "string") {  
            if (window.ActiveXObject) {  
                dom = new ActiveXObject("Microsoft.XmlDom");  
                dom.async = "false";  
                dom.loadXML(s);  
            } else {  
                dom = new DOMParser().parseFromString(s, "text/xml");  
            }  
        }  
        var _dig = function(ele) {  
            var oo = {};  
            var alen = (ele.attributes) ? ele.attributes.length: 0;  
            for (var i = 0; i < alen; i++) {  
                oo["$" + ele.attributes[i].name] = ele.attributes[i].value;  
            }  
  
            var elen = ele.childNodes.length;  
            if (elen == 0) return oo;  
  
            var tem;  
            for (var i = 0; i < elen; i++) {  
                tem = oo[ele.childNodes[i].nodeName];  
  
                if (typeof(tem) == "undefined") {  
  
                    if (ele.childNodes[i].childNodes.length == 0) {  
  
                        if (ele.childNodes[i].nodeName == "#text" || ele.childNodes[i].nodeName == "#cdata-section") {  
                            oo["$$"] = ele.childNodes[i].nodeValue;  
                        } else {  
                            oo[ele.childNodes[i].nodeName] = [_dig(ele.childNodes[i])];  
                        }  
  
                    } else {  
                        oo[ele.childNodes[i].nodeName] = [_dig(ele.childNodes[i])];  
                    }  
                } else {  
                    tem[tem.length] = _dig(ele.childNodes[i]);  
                    oo[ele.childNodes[i].nodeName] = tem;  
                }  
            }  
            return oo;  
        };  
  
        var oo = {};  
        oo[dom.documentElement.nodeName] = _dig(dom.documentElement);  
        return oo;  
    },  
    ref : function(o,sp)  
    {  
        sp = sp?sp:"\n";  
        var tem = [];  
        for(var i in o) tem[tem.length]=i+":"+o[i];  
        return tem.join(sp);  
    }  
});  

var Audio = {
    audio:null,
    init:function(id,callback,src){
        this.audio = document.getElementById(id);
        this.audio.src = src;
        this.audio.addEventListener('canplay', this.canplay,false);
        this.audio.addEventListener('ended',callback, false);
    },
    play:function(){
        this.audio.play();
    },
    pause:function(){
        this.audio.pause();
    },
    mute:function(){
        this.audio.volume = 0;
    },
    setVolume:function(num){   // num  between 0,1;
        this.audio.volume = num;
    },
    switchSrc:function(src){
        this.audio.src = src;
        this.play();
    },
    canPlay:function(){
        var currentTime = this.audio.currentTime.toFixed(0),
            fullTime    = this.audio.duration.toFixed(0);
        function formatsecond(second){
            var minute = (second/60).toFixed(0),
                second = (second%60).toFixed(0);
            if(minute < 10){minute = "0"+minute;}
            if(second < 10){second = "0"+second;}
            return minute+":"+second;
        }
        return {
            currentTime:currentTime,
            fullTime:fullTime,
            f_currentTime:formatsecond(currentTime),
            f_fullTime:formatsecond(fullTime)
        }
    }
}




var Xiami_player = {
    playing:false,
    playlist:null,
    currentNum:0,
    MaxListNum:0,
    //填入歌曲列表
    fullList:function(typeClass,data){
        var str = "";
        $.each(data,function(i,item){
            str += "<li list-id='"+i+"'>"+item.singers+" - "+item.name+"</li>";
        })
        $('#playlist').removeClass();
        $('#playlist').addClass(typeClass).html(str);
    },
    //搜索
    searchSong:function(type,keyword){
        switch (type) {
            //搜索 歌曲
            case "0":
                console.log("歌曲")
                $.get(Xiami_api.search_keyword+keyword,function(data){
                        Xiami_player.playlist = data.songs;
                        Xiami_player.MaxListNum = data.songs.length;
                        Xiami_player.fullList("music",data.songs);
                },"json");
            break;
            //搜索 精选集
            case "1":
                $.get(Xiami_api.collect_keyword,{"key":keyword},function(data){
                    var data  = /<body[\s\S]*?body>/.exec(data),
                        $list = $(data.toString()).find(".block_list ul li");
                        collects_list = [];
                    for(var i=0;i<$list.length;i++){
                        var $li        = $list.eq(i),
                            collect    = {},
                            name       = $li.find("h3 a").attr("title"),
                            collect_id = $li.find("h3 a").attr("href").split("/"),
                            date       = $li.find(".collect_info").text(),
                            times      = $li.find(".p").attr("title");

                        collect_id = collect_id[collect_id.length - 1];

                        collect.singers    = name;
                        collect.list_id = collect_id;
                        collect.name    = "------"+times;

                        collects_list.push(collect);
                    }
                    Xiami_player.playlist = collects_list;
                    Xiami_player.fullList("collect",collects_list);
                });
            break;
        }
    },
    // 播放歌曲
    playSong:function(num){
        Xiami_player.currentNum = num;
        var song_info = Xiami_player.playlist[num],
            $cover    = $(".cover"),
            $tag      = $(".tag");
        $cover.html("<img src='"+song_info.album_logo+"'/>");
        $tag.find('.name').html(song_info.name);
        $tag.find('.artist').html(song_info.singers);
        $tag.find('.album').html(song_info.category);
        Audio.switchSrc(song_info.location);
        Xiami_player.playing = true;
    },
    // 点击歌曲列表
    clickListHandle:function(){
        var type = $(this).parent("ul").attr("class");
        switch (type){
            case "music":
                $(this).addClass("playing").siblings().removeClass("playing");
                Xiami_player.playSong($(this).attr("list-id"));
            break;
            case "collect":
                var list_id    = $(this).attr("list-id"),
                    collect_id = Xiami_player.playlist[list_id].list_id;
                $.get(Xiami_api.get_collect_list+collect_id,Xiami_player.collectSonglist,"xml");
            break
        }
    },
    // 获取精选集歌曲列表
    collectSonglist:function(data){
        data = $.z4x(data);
        data = data.playlist.trackList[0].track;
        var obj_list = [];
        for(var i in data){
            var collects_list = {};
            collects_list.name = data[i].title[0].$$;
            collects_list.location = decode(data[i].location[0].$$.toString());
            collects_list.singers = data[i].artist[0].$$;
            collects_list.album_logo = data[i].pic[0].$$;
            collects_list.category = data[i].album_name[0].$$;
            obj_list.push(collects_list);
        }
        Xiami_player.playlist = obj_list;
        Xiami_player.MaxListNum =obj_list.length;
        Xiami_player.fullList("music",Xiami_player.playlist);
    },
    // 搜索框事件处理
    searchTxtHandle:function(e){
        var txt  = $.trim($("#search").val()),
            type = $("#type").find("option:selected").val();
        if(e.keyCode == 13){
            Xiami_player.searchSong(type,txt);
        }
    },
    nextSong:function(){
        var num = 0;
        if(parseInt(Xiami_player.currentNum) < parseInt(Xiami_player.MaxListNum)){
            num = parseInt(Xiami_player.currentNum)+1;
        }else{
            num = 0;
        }
        $("#playlist").find("li").eq(num).addClass("playing").siblings().removeClass("playing");
        Xiami_player.playSong(num);
    },
    toggleSong:function(){
        if(Xiami_player.playing){
            $(this).addClass("pause");
            Audio.pause();
            Xiami_player.playing = false;
        }else{
            $(this).removeClass("pause");
            Audio.play();
            Xiami_player.playing = true;
        }
    },
    countTime:function(){
        var width = $(".progress").width();

        var timer = setInterval(function(){
            var currentTime = Audio.canPlay().currentTime,
                fullTime    = Audio.canPlay().fullTime,
                 p          = currentTime*width/fullTime;

            $(".progress .timer").html(Audio.canPlay().f_currentTime);
            $('.progress .slider').slider("value", p+"px");
            $(".progress .pace").width(p+"px");

        },1000);
    },
    init:function(){
        Xiami_player.searchSong('1',"老歌");
        $("#playlist").delegate("li","click",Xiami_player.clickListHandle);
        $("#search").bind("keyup",Xiami_player.searchTxtHandle);
        $(".control .playback").bind("click",Xiami_player.toggleSong);
        Xiami_player.countTime();
    }
}


$('.progress .slider').slider({
    step:0.1,
    value:"0",
    slide:function(e,ui){
        $(".progress .pace").width(ui.value+"%");
    }
});
$(".volume .pace").width("50%");
$('.volume .slider').slider({
    step: 0.1,
    value: "0.5", 
    slide: function(event, ui){
        Audio.setVolume(ui.value/100);
        $(".volume .pace").width(ui.value+"%");
    }
});

Audio.init("p",Xiami_player.nextSong);
Xiami_player.init();

