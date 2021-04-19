(async () => {
  /*
   **
   ** constants
   **
   */
  const ONGEKI_NET = "https://ongeki-net.com/ongeki-mobile/";
  const ONGEKI_HOST = "ongeki-net.com";
  const ONGEKI_COURSE = ONGEKI_NET + "courseDetail/";

  const ONGEKI_HOME = ONGEKI_NET + "home/";
  const ONGEKI_HOME_DATA = ONGEKI_HOME + "playerDataDetail/";
  const ONGEKI_RATING_MUSIC = ONGEKI_HOME + "ratingTargetMusic/";

  const ONGEKI_RECORD = ONGEKI_NET + "record/";
  const ONGEKI_RECORD_PLAYLOG = ONGEKI_NET + "playlog/";
  const ONGEKI_RECORD_PLAYLOG_DETAIL = ONGEKI_RECORD + "playlogDetail/";
  const ONGEKI_RECORD_MUSIC = ONGEKI_RECORD + "musicGenre/";
  const ONGEKI_MUSIC_DETAIL = ONGEKI_RECORD + "musicDetail/";

  const CHINATSU_API =
    "https://asia-northeast1-chinatsu-dev.cloudfunctions.net/";
  const UPDATE_USER_INFO = CHINATSU_API + "updateUserInfo";
  const UPDATE_HISTORY = CHINATSU_API + "updateHistory";
  const UPDATE_MUSIC_DATA = CHINATSU_API + "updateMusicData";
  const UPDATE_RATING_DATA = CHINATSU_API + "updateRatingData";

  const SAME_TITLE_MUSIC = ["Hand in Hand", "Singularity"];

  const getKey = () => {
    return document.getElementsByTagName("chinatsu-token")[0].textContent;
  };
  const secretKey = getKey();

  /*
   **
   ** base methods
   **
   */

  const _ajax = (url, type, payload) => {
    // getMusicScore.js
    return new Promise((resolve, reject) => {
      $.ajax({
        type: type,
        url: url,
        data: payload,
      })
        .done(function (data, textStatus, jqXHR) {
          resolve(data);
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
          reject("Error occured in ajax connection." + jqXHR.responseText);
        });
    }).catch((e) => {
      console.log(e);
    });
  };

  var _post = function (url, payload) {
    return new Promise((resolve, reject) => {
      $.ajax({
        type: "POST",
        url: url,
        data: payload,
        contentType: "application/json; charset=utf-8",
      })
        .done(function (data, textStatus, jqXHR) {
          resolve(data);
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
          reject("Error occured in ajax connection." + jqXHR.responseText);
        });
    }).catch((e) => {
      console.log(e);
    });
  };

  const sleep = (msec) => new Promise((resolve) => setTimeout(resolve, msec));

  /*
   **
   ** preparing
   **
   */

  const checkEnvironment = () => {
    if (window.location.hostname != ONGEKI_HOST) {
      throw new Error("ONGEKI-NETで実行してください。");
    }
  };

  const insertMessage = (msg) => {
    $(".dialog-content").append(msg);
    $(".dialog-content").append("<br>");
  };

  const showDialog = () => {
    const dialogBackgroundStyle = `
      width: 100%; 
      height:100%; 
      position: fixed; 
      top: 0; 
      z-index: 1000;
      background: rgba(0,0,0,0.8);
    `;

    const dialogAreaStyle = `
      min-width: 350px;
      background-color: #fff;
      width:50%;
      height:50%;
      top: 50%;
      left: 50%;
      -webkit-transform: translate(-50%,-50%);
      transform: translate(-50%,-50%);
      position: fixed;
    `;

    const dialogTitleStyle = `
      font-size: 2em;
      margin: 30px;
    `;

    const dialogContentStyle = `
      margin: 10px 30px;
      height: 80%;
      overflow: scroll;
    `;

    let dialog = $("<div>")
      .addClass("dialog")
      .attr("style", dialogBackgroundStyle);
    let dialogArea = $("<div>").attr("style", dialogAreaStyle);
    let dialogTitle = $("<div>")
      .addClass("dialog-title")
      .attr("style", dialogTitleStyle);
    let dialogContent = $("<div>")
      .addClass("dialog-content")
      .attr("style", dialogContentStyle);

    dialog.append(dialogArea);
    dialogArea.append(dialogTitle);
    dialogArea.append(dialogContent);

    $("body").append(dialog);

    dialog.show();

    $(".dialog-title").text("Getting player info");
    $(".dialog-content").text("プレーヤーデーターの更新を開始します...");
    $(".dialog-content").append("<br>");
  };

  const getUserCourse = async () => {
    res = await _ajax(ONGEKI_COURSE).catch((err) => {
      console.log(err);
    });

    doc = $.parseHTML(res);

    isStandard =
      $(doc).find(".back_course_standard").find("span").text() === "利用中"
        ? true
        : false;
    isPremium =
      $(doc).find(".back_course_premium").find("span").text() === "利用中"
        ? true
        : false;

    if (isPremium) {
      insertMessage("ご利用中のコース：オンゲキプレミアムコース...");
      return 2;
    }

    if (isStandard) {
      insertMessage("ご利用中のコース：スタンダードコース...");
      return 1;
    }

    insertMessage("ご利用中のコース：無料コース...");
    return 0;
  };

  /*
   **
   ** fetch data
   **
   */

  const getMusicDetailDiff = async (diff) => {
    let musicDetailDiff = [];

    res = await _ajax(ONGEKI_RECORD_MUSIC + "search/", "GET", {
      genre: 99,
      diff: diff,
    }).catch((err) => {
      console.log(err);
    });

    doc = $.parseHTML(res);

    musicBox = $(doc).find(".container3").find("div");

    let genre = "";
    musicBox.each((_, item) => {
      if ($(item).hasClass("p_5 f_20")) {
        genre = $(item).text();
      } else if ($(item).hasClass("basic_btn")) {
        tmp = {
          //diff: diff,
          music_name: $(item).find(".music_label").text().trim(),
          //level: Number($(item).find(".score_level").text()),
          over_damage: $($(item).find(".score_value")[0]).text(),
          battle_score: Number(
            $($(item).find(".score_value")[1]).text().replace(/,/g, "")
          ),
          technical_score: Number(
            $($(item).find(".score_value")[2]).text().replace(/,/g, "")
          ),
          is_full_bell:
            $(item).find("[src*='music_icon_fb.png']").length > 0
              ? true
              : false,
          is_full_combo:
            $(item).find("[src*='music_icon_fc.png']").length > 0
              ? true
              : false,
          is_all_break:
            $(item).find("[src*='music_icon_ab.png']").length > 0
              ? true
              : false,
        };
        if (SAME_TITLE_MUSIC.includes(tmp.music_name)) {
          tmp.genre = genre;
        }
        musicDetailDiff.push(tmp);
      }
    });

    payload = {
      key: secretKey,
      diff: String(diff),
      score: musicDetailDiff,
    };

    await _post(UPDATE_MUSIC_DATA, JSON.stringify(payload))
      .then((_) => {
        insertMessage("送信しました.");
      })
      .catch((err) => {
        console.log(err);
      });

    return musicDetailDiff;
  };

  const getMusicDetail = async () => {
    const basicDiff = 0;
    const advancedDiff = 1;
    const expertDiff = 2;
    const masterDiff = 3;
    const lunaticDiff = 10;

    insertMessage("楽曲スコア(Basic)を取得中...");
    await getMusicDetailDiff(basicDiff);

    insertMessage("楽曲スコア(Advanced)を取得中...");
    await getMusicDetailDiff(advancedDiff);

    insertMessage("楽曲スコア(Expert)を取得中...");
    await getMusicDetailDiff(expertDiff);

    insertMessage("楽曲スコア(Master)を取得中...");
    await getMusicDetailDiff(masterDiff);

    insertMessage("楽曲スコア(Lunatic)を取得中...");
    await getMusicDetailDiff(lunaticDiff);
  };

  const getUserData = async () => {
    res = await _ajax(ONGEKI_HOME_DATA).catch((err) => {
      console.log(err);
    });

    doc = $.parseHTML(res);

    const userData = {
      user_name: $(doc).find(".name_block").find("span").text(),
      level: $(doc).find(".lv_block").find("span").text(),
      reincarnation_num: $(doc)
        .find(".reincarnation_block")
        .find("span")
        .text(),
      play_count: Number(
        $(doc).find(".user_data_detail_block").find("td").eq(5).text()
      ),
      jewel_count: Number(
        $(doc)
          .find(".user_data_detail_block")
          .find("td")
          .eq(2)
          .text()
          .split("（")[0]
          .replace(/,/g, "")
      ),
      total_jewel_count: Number(
        $(doc)
          .find(".user_data_detail_block")
          .find("td")
          .eq(2)
          .text()
          .split("（")[1]
          .replace(/累計 /g, "")
          .replace(/）/g, "")
          .replace(/,/g, "")
      ),
      player_rating: Number(
        $(doc)
          .find(".rating_block")
          .find(".rating_field")
          .find("[class^='rating_']")
          .eq(0)
          .text()
      ),
      highest_rating: $(doc)
        .find(".rating_block")
        .find(".rating_field")
        .find(".f_11")
        .text()
        .replace(/（MAX /g, "")
        .replace(/）/g, ""),
      battle_point: Number(
        $(doc).find(".battle_rank_block").find("div").text().replace(/,/g, "")
      ),
      trophy: $(doc).find(".trophy_block").find("span").text(),
      comment: $(doc)
        .find(".comment_block")
        .parent()
        .text()
        .replace(/	/g, "")
        .replace("\n", "")
        .replace("\n", ""),
    };

    const payload = {
      key: secretKey,
      info: userData,
    };

    await _post(UPDATE_USER_INFO, JSON.stringify(payload))
      .then((_) => {
        insertMessage("送信しました.");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const getSingleMusicData = async (item) => {
    let scoreDataItem = {};

    if ($(item).hasClass("basic_score_back")) {
      scoreDataItem.diff = 0;
    } else if ($(item).hasClass("advanced_score_back")) {
      scoreDataItem.diff = 1;
    } else if ($(item).hasClass("expert_score_back")) {
      scoreDataItem.diff = 2;
    } else if ($(item).hasClass("master_score_back")) {
      scoreDataItem.diff = 3;
    } else if ($(item).hasClass("lunatic_score_back")) {
      scoreDataItem.diff = 10;
    } else {
      return;
    }

    scoreDataItem.music_name = $(item).find(".music_label").text();
    scoreDataItem.score = Number(
      $(item).find(".score_value").text().replace(/,/g, "")
    );

    if (SAME_TITLE_MUSIC.includes(scoreDataItem.music_name)) {
      const idx = $(item).find("[name=idx]").prop("value");
      await sleep(500);
      let res = await _ajax(
        ONGEKI_MUSIC_DETAIL + "?idx=" + encodeURIComponent(idx)
      );
      let doc = $.parseHTML(res);
      scoreDataItem.genre = $(doc)
        .find("div.t_r.f_12.main_color")
        .text()
        .trim();
      const artist = $(doc).find("div.m_5.f_13.break").text().trim();
      scoreDataItem.artist = artist.substring(0, artist.indexOf("\n"));
    }

    return scoreDataItem;
  };

  const getUserPlaylogDetail = async (idx) => {
    res = await _ajax(ONGEKI_RECORD_PLAYLOG_DETAIL, "GET", { idx: idx }).catch(
      (err) => {
        console.log(err);
      }
    );

    doc = $.parseHTML(res);

    let playlogDetail = {
      music_name: $($(doc).find(".container3").find("div").find("div")[0])
        .text()
        .replace(/(^\s*)|(\s*$)/g, "")
        .trim(),
      diff:
        $($(doc).find(".container3").find(".m_10")[0]).find(
          "[src*='diff_basic.png']"
        ).length > 0
          ? 0
          : $($(doc).find(".container3").find(".m_10")[0]).find(
              "[src*='diff_advanced.png']"
            ).length > 0
          ? 1
          : $($(doc).find(".container3").find(".m_10")[0]).find(
              "[src*='diff_expert.png']"
            ).length > 0
          ? 2
          : $($(doc).find(".container3").find(".m_10")[0]).find(
              "[src*='diff_master.png']"
            ).length > 0
          ? 3
          : $($(doc).find(".container3").find(".m_10")[0]).find(
              "[src*='diff_lunatic.png']"
            ).length > 0
          ? 10
          : 99,
      play_date: $(
        $(doc).find(".container3").find("div").find("span")[0]
      ).text(),

      battle_score: Number(
        $($(doc).find(".playlog_score_block").find("tr")[0])
          .find("div")
          .eq(1)
          .text()
          .replace(/,/g, "")
      ),
      over_damage: $($(doc).find(".playlog_score_block").find("tr")[1])
        .find("div")
        .eq(1)
        .text(),
      technical_score: Number(
        $($(doc).find(".playlog_score_block").find("tr")[2])
          .find("div")
          .eq(1)
          .text()
          .replace(/,/g, "")
      ),

      boss_chara: $(doc)
        .find(".vs_block")
        .text()
        .replace(/\s/g, "")
        .split("Lv.")[0],
      boss_level: Number(
        $(doc).find(".vs_block").text().replace(/\s/g, "").split("Lv.")[1]
      ),

      is_full_bell:
        $(doc).find(".clearfix").find("[src*='score_detail_fb.png']").length > 0
          ? true
          : false,
      is_full_combo:
        $(doc).find(".clearfix").find("[src*='score_detail_fc.png']").length > 0
          ? true
          : false,
      is_all_break:
        $(doc).find(".clearfix").find("[src*='score_detail_ab.png']").length > 0
          ? true
          : false,

      is_battle_new_record:
        $($(doc).find(".playlog_score_block").find("tr")[0]).find(
          ".battle_score_block_new"
        ).length > 0
          ? true
          : false,
      is_over_damage_new_record:
        $($(doc).find(".playlog_score_block").find("tr")[1]).find(
          ".battle_score_block_new"
        ).length > 0
          ? true
          : false,
      is_technical_new_record:
        $($(doc).find(".playlog_score_block").find("tr")[2]).find(
          ".technical_score_block_new"
        ).length > 0
          ? true
          : false,

      judge_critical_break: Number(
        $(doc).find(".score_critical_break").find("td").text().replace(/,/g, "")
      ),
      judge_break: Number(
        $(doc).find(".score_break").find("td").text().replace(/,/g, "")
      ),
      judge_hit: Number(
        $(doc).find(".score_hit").find("td").text().replace(/,/g, "")
      ),
      judge_miss: Number(
        $(doc).find(".score_miss").find("td").text().replace(/,/g, "")
      ),

      bell_count: Number(
        $(doc).find(".score_bell").find("td").text().split("/")[0]
      ),
      total_bell_count: Number(
        $(doc).find(".score_bell").find("td").text().split("/")[1]
      ),
      damage_count: Number($(doc).find(".score_damage").find("td").text()),
      max_combo: Number(
        $($(doc).find(".score_detail_table").find("tr")[0])
          .find("td")
          .text()
          .replace(/,/g, "")
      ),

      rate_tap: $($($(doc).find(".score_detail_table")[1]).find("tr")[0])
        .find("td")
        .text(),
      rate_hold: $($($(doc).find(".score_detail_table")[1]).find("tr")[1])
        .find("td")
        .text(),
      rate_flick: $($($(doc).find(".score_detail_table")[1]).find("tr")[2])
        .find("td")
        .text(),
      rate_side_tap: $($($(doc).find(".score_detail_table")[1]).find("tr")[3])
        .find("td")
        .text(),
      rate_side_hold: $($($(doc).find(".score_detail_table")[1]).find("tr")[4])
        .find("td")
        .text(),

      place_name: $(doc).find("#placeName").find("span").text(),
    };

    if (SAME_TITLE_MUSIC.includes(playlogDetail.music_name)) {
      const idx = $(doc).find("[name=idx]").prop("value");
      await sleep(500);
      let res = await _ajax(
        ONGEKI_MUSIC_DETAIL + "?idx=" + encodeURIComponent(idx)
      );
      let detaildoc = $.parseHTML(res);
      playlogDetail.genre = $(detaildoc)
        .find("div.t_r.f_12.main_color")
        .text()
        .trim();
      const artist = $(detaildoc).find("div.m_5.f_13.break").text().trim();
      playlogDetail.artist = artist.substring(0, artist.indexOf("\n"));
    }

    insertMessage(Number(idx) + ". " + playlogDetail.music_name);

    return playlogDetail;
  };

  const getUserPlaylog = async () => {
    insertMessage("プレイ履歴を取得中...");
    const logCount = 50;

    let playlog = [];

    for (i in [...Array(logCount)]) {
      let playlogDetail = await getUserPlaylogDetail(i);
      playlog.push(playlogDetail);
      await sleep(500);
    }

    let payload = {
      key: secretKey,
      playlog,
    };

    await _post(UPDATE_HISTORY, JSON.stringify(payload))
      .then((_) => {
        insertMessage("送信しました.");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const getUserRating = async () => {
    insertMessage("レーティング情報を取得中...");

    let res = await _ajax(ONGEKI_RATING_MUSIC).catch((err) => {
      console.log(err);
    });

    let doc = $.parseHTML(res);

    const newSongs = [];
    const bestSongs = [];
    const recentSongs = [];
    const candidateSongs = [];

    let allDivs = $(doc).find("div").toArray();

    let cas = "";
    for (const item of allDivs) {
      if ($(item).hasClass("f_13 l_h_12 break")) {
        let val = $(item).text().trim();
        if (val.includes("現バージョンで追加された楽曲の内")) {
          cas = "new";
        } else if (val.includes("以前のバージョンで追加された楽曲の内")) {
          cas = "best";
        } else if (val.includes("最近遊んだ楽曲の内")) {
          cas = "recent";
        } else if (val.includes("対象（新曲）（ベスト）に入っていない曲の内")) {
          cas = "candidate";
        }
      }

      const scoreDataItem = await getSingleMusicData(item);
      if (!scoreDataItem) {
        continue;
      }

      switch (cas) {
        case "new":
          newSongs.push(scoreDataItem);
          break;
        case "best":
          bestSongs.push(scoreDataItem);
          break;
        case "recent":
          recentSongs.push(scoreDataItem);
          break;
        case "candidate":
          candidateSongs.push(scoreDataItem);
          break;
      }
    }

    const payload = {
      key: secretKey,
      new: newSongs,
      best: bestSongs,
      recent: recentSongs,
      candidate: candidateSongs,
    };

    await _post(UPDATE_RATING_DATA, JSON.stringify(payload))
      .then((_) => {
        insertMessage("送信しました.");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  /*
   **
   ** Main
   **
   */

  checkEnvironment();
  showDialog();
  const course = await getUserCourse();
  switch (course) {
    case 0:
      insertMessage("ご利用中のコースにはスコアの登録ができません.");
    case 1:
      insertMessage("ご利用中のコースにはレーティング情報の登録ができません.");
      await getUserData();
      await getMusicDetail();
      await getUserPlaylog();
    case 2:
      await getUserData();
      await getMusicDetail();
      await getUserPlaylog();
      await getUserRating();
  }
  insertMessage("スコアの登録が完了しました.");
  insertMessage(
    `<a href="https://chinatsu-dev.web.app/" style="color: #039be5;">「Chinatsu.」に移動</a>`
  );
})();
