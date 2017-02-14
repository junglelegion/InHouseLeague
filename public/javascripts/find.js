var timer = 0;
var interval = null;

function find(type) {
  var body = document.querySelector('body');
  var found = document.createElement("div");
  found.id = "main";
  found.innerHTML = `<div id="header">
    <h2>
      Your match is ready:
    </h2>
    <h1>` + type + `</h1>
  </div>
  <div id="accept" onClick="found();location.reload();">
    ACCEPT
  </div>
  <div id="decline" onClick="swap()">Decline match</div>
  <audio autoplay="true">
    <source src="sounds/found.mp3" type="audio/mpeg">
  </audio>`;
  body.appendChild(found);
}

function switch_nav(str) {
  var a = document.getElementsByClassName('under-nav');
  for (var x = 0; x < a.length; x++) {
    a[x].style = "display: none;";
  }
  document.getElementById('news').style = "margin-top: 29px;"
  if(str != "") {
    document.getElementById(str).style = "display: block;";
    document.getElementById('news').style = "margin-top: 2px;";
  }
}

function navigate() {
  var r = confirm("This will stop your queue! Are you sure you want to navigate away?")
  if(r==true) {
    window.location = "http://www.google.com";
  }
}

function loadpage(str) {
  document.getElementById('story').innerHTML = "";
  $.ajax({
      url: './phpHelpers/controller.php',
      data: {
        page: str
      },
      success: function(success) {
        document.getElementById('story').innerHTML = success.substring(0, success.length-1);
      }
  });
}

function startmm() {
  if(timer == 0) {
    document.getElementById('findamatch').innerHTML = '<div id="center-text">Finding a Match<br/><br/><div id="queueing">Time in queue:<div id="timer">0:00</div><a id="cancel" href="javascript:stopmm()">Cancel</div></div></div>';
    interval = setInterval(function() {
      timer++;
      if(timer%60 < 10) {
        document.getElementById('timer').innerHTML = (timer - timer%60)/60 + ":0" + (timer%60);
      }
      else {
        document.getElementById('timer').innerHTML = (timer - timer%60)/60 + ":" + (timer%60);
      }
      if(timer == 63) {
        find("All Pick");
        stopmm();
      }
    }, 1000);
  }
  else {
    alert("You are already finding a match!");
  }
}

function stopmm() {
  window.clearInterval(interval);
  document.getElementById('findamatch').innerHTML = '<div id="center-text">Find a Match<br/><button class="fambtn" id="ap" onclick="startmm()">All Pick</button><br/><button class="fambtn" id="cm" onclick="startmm()">Captains Mode</button></div>'
  timer = 0;
}

function found() {
  var winFeature =
        'location=no,toolbar=no,menubar=no,scrollbars=yes,resizable=yes';
        window.open('./rules/ingame.html','null',winFeature);
}

function refresh(what) {
  document.getElementById(what).innerHTML = '1233';
}
