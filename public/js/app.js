$(document).ready(function () {
  $("input").val("");
  /* Game variables */
  var roundLetter = "";
  var roundData = [];
  var wordCount = 0;
  var playerId;

  function connectToSocketIo() {
    let server = window.location.protocol + "//" + window.location.host;
    window.socket = io.connect(server);

    window.socket.on("random-letter", function (data) {
      roundLetter = data.letter;
      $(".round-letter").text(roundLetter.toLowerCase());
    });

    window.socket.on("toast", function (data) {
      showToast(data.message);
    });

    window.socket.on("player-data", function (data) {
      $(".player-data").text(data.id + " " + data.emoji);
      playerId = data.id;
    });

    window.socket.on("start-game", function (data) {
      $(".board").show();
      $(".waiting-alert").hide();
      $(".results").hide();
    });

    window.socket.on("hide-game", function (data) {
      $(".board").hide();
      $(".waiting-alert").show();
    });

    window.socket.on("finish-all", function (data) {
      showToast("Someone finished the round!");
      $(".timer").show();
      startRoundTimer(data.timer, playerId, roundData);
    });

    window.socket.on("show-results", function (data) {
      $(".board").hide();
      createResultTable(data.results);
      $(".results").show();
    });
  }

  $(function () {
    connectToSocketIo();
  });

  window.socket = null;

  /* GAME RUNNING */
  $(".name-form, .color-form, .fruit-form").submit(function (e) {
    e.preventDefault();
    var word = $(this).find(".word").val().toLowerCase();
    var category = $(this).find(".category").text();
    if (typeof word !== undefined) {
      if (word.length > 0 && word.charAt(0) == roundLetter) {
        $(".word-list").append(`<li>[${category}]: ${word}</li>`);
        roundData.push({ category: category, word: word });
        $(this).find(".word").prop("disabled", true);
        $(this).find(".btn").attr("disabled", true);
        wordCount++;
      } else if (word.length == 0) {
        errorAlert("No word submited");
      } else if (word.charAt(0) != roundLetter) {
        errorAlert("That word doesn't start with the round letter");
        $(this).find(".word").val("");
      }
    }

    if (wordCount == 3) {
      $(".tutti-frutti-btn").show();
    }
  });

  $(".tutti-frutti-btn").click(function () {
    window.socket.emit("finished-round", { message: "Round is finished" });
  });
});

function showToast(msg) {
  $.toast({
    text: msg,
    position: "bottom-right",
  });
}

async function errorAlert(msg) {
  $(".word-error").text(msg);
  $(".word-error")
    .fadeTo(2000, 500)
    .slideUp(500, function () {
      $(".word-error").slideUp(500);
    });
}

function startRoundTimer(seconds, playerId, roundData) {
  $(".tutti-frutti-btn").attr("disabled", true);

  var start = seconds;

  countDownTimer = setInterval(async function () {
    await $(".timer").text(start);
    if (start <= 0) {
      window.socket.emit("calculate-score", {
        id: playerId,
        wordList: roundData,
      });
      await clearInterval(countDownTimer);
    }
    start--;
  }, 1000);
}

var bestScore = 0;
var bestId = "No one";
function createResultTable(data) {
  $("results tbody").remove();

  for (const content of data.results) {
    var playerId = content.id;
    var playerScores = content.scores;
    var totalScore = 0;
    var list = "<ul>";
    for (const score of playerScores) {
      var word = score.word;
      var category = score.category;
      var valid = score.valid;
      var points = score.points;
      totalScore += points;
      var validity;
      if (!valid) {
        validity = "Word is not valid";
      } else {
        validity = "Word is valid";
      }

      var displayText = `Category: [${category}] | Word: [${word}] | Validity: [${validity}] | Points for this word: [${points}]`;

      var listitem = `<li>${displayText}</li>`;
      list = list + listitem;
    }
    list = list + "</ul>";
    $(".results tbody").append(
      "<tr>" +
        "<td>" +
        playerId +
        "</td>" +
        "<td>" +
        list +
        "</td>" +
        "<td>" +
        totalScore +
        "</td>" +
        "</tr>"
    );

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestId = playerId;
    }
  }
  $(".winner-alert").text("");
  $(".winner-alert").text(
    `Winner for this round is Player ${bestId}, with ${bestScore} points!`
  );
}
