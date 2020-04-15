$(document).ready(function () {
  function showToast(msg) {
    console.log("MSG: ", msg);
    $.toast({
      text: msg,
      position: "bottom-right",
    });
  }

  window.socket = null;
  function connectToSocketIo() {
    let server = window.location.protocol + "//" + window.location.host;
    window.socket = io.connect(server);

    window.socket.on("toast", function (data) {
      showToast(data.message);
    });

    window.socket.on("start-game", function (data) {
      $(".board").show();
    });

    window.socket.on("hide-game", function (data) {
      $(".board").hide();
    });
  }

  function messageToServer(msg) {
    window.socket.emit("message-to-server", { message: msg });
  }

  $(function () {
    connectToSocketIo();
  });

  $(".word-form").submit(function (e) {
    e.preventDefault();
    var word = $(".word").val();
    console.log(word);
    if (word.length > 0 && typeof word !== undefined) {
      $(".word-list").append(`<li>${word}</li>`);
    }
  });
});
