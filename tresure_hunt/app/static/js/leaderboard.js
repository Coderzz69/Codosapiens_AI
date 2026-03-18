(function () {
  var container = document.getElementById('leaderboard');
  if (!container || !window.LEADERBOARD_API) return;

  function render(rows) {
    var html = '<table class="table"><tr><th>Rank</th><th>Team</th><th>Score</th><th>Levels</th><th>Last Solve</th></tr>';
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      html += '<tr>';
      html += '<td>' + (i + 1) + '</td>';
      html += '<td><span class="color-dot" style="background:' + r.color + '"></span>' + r.name + '</td>';
      html += '<td>' + r.score + '</td>';
      html += '<td>' + r.levels_solved + '</td>';
      html += '<td>' + (r.last_solve || '-') + '</td>';
      html += '</tr>';
    }
    html += '</table>';
    container.innerHTML = html;
  }

  function refresh() {
    fetch(window.LEADERBOARD_API)
      .then(function (r) { return r.json(); })
      .then(render)
      .catch(function () {});
  }

  refresh();
  setInterval(refresh, 10000);
})();
