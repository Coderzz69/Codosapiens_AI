function analyzeImage() {
  var img = document.querySelector('img.stego');
  var out = document.getElementById('stego-output');
  if (!out) return;

  if (!img || !img.complete || img.naturalWidth === 0) {
    fetch('/level/5/analyze-image')
      .then(function (r) { return r.json(); })
      .then(function (data) { out.textContent = data.decoded; })
      .catch(function () { out.textContent = 'Image not available.'; });
    return;
  }

  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  ctx.drawImage(img, 0, 0);

  var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  var chars = [];
  for (var i = 0, pixelIndex = 0; i < data.length; i += 4, pixelIndex++) {
    if (pixelIndex % 7 === 0) {
      var value = data[i] ^ 42;
      if (value === 0) break;
      chars.push(String.fromCharCode(value));
    }
  }
  out.textContent = chars.join('');
}

function checkLogic() {
  var ans = document.getElementById('logic-answer');
  var rule = document.getElementById('logic-rule');
  var out = document.getElementById('logic-output');
  if (!ans || !rule || !out) return;

  var a = ans.value.trim().toLowerCase();
  var r = rule.value.trim();
  if (a.indexOf('impossible') !== -1 && r === 'Rule 3+4') {
    out.textContent = 'LOCK2:logic';
  } else {
    out.textContent = 'Not quite.';
  }
}
