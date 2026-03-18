function setOutput(id, text) {
  var el = document.getElementById(id);
  if (el) {
    el.textContent = text;
  }
}

function decodeBase64() {
  var input = document.getElementById('decoder-input');
  if (!input) return;
  try {
    var decoded = atob(input.value.trim());
    setOutput('decoder-output', 'Decoded: ' + decoded + ' (bonus fragment: OT{)');
  } catch (e) {
    setOutput('decoder-output', 'Invalid Base64');
  }
}

function decodeBinary() {
  var input = document.getElementById('decoder-input');
  if (!input) return;
  try {
    var bytes = input.value.trim().split(/\s+/);
    var out = '';
    for (var i = 0; i < bytes.length; i++) {
      out += String.fromCharCode(parseInt(bytes[i], 2));
    }
    setOutput('decoder-output', 'Decoded: ' + out);
  } catch (e) {
    setOutput('decoder-output', 'Invalid binary');
  }
}

function decodeCaesar() {
  var textEl = document.getElementById('caesar-input');
  var shiftEl = document.getElementById('caesar-shift');
  if (!textEl || !shiftEl) return;
  var text = textEl.value;
  var shift = parseInt(shiftEl.value, 10) || 0;
  var result = '';
  for (var i = 0; i < text.length; i++) {
    var c = text.charCodeAt(i);
    if (c >= 65 && c <= 90) {
      result += String.fromCharCode(((c - 65 - shift + 26) % 26) + 65);
    } else if (c >= 97 && c <= 122) {
      result += String.fromCharCode(((c - 97 - shift + 26) % 26) + 97);
    } else {
      result += text[i];
    }
  }
  setOutput('caesar-output', result);
}

function decodeVigenere() {
  var textEl = document.getElementById('vigenere-input');
  var keyEl = document.getElementById('vigenere-key');
  if (!textEl || !keyEl) return;
  var text = textEl.value.toUpperCase();
  var key = keyEl.value.toUpperCase().replace(/[^A-Z]/g, '');
  if (!key) {
    setOutput('vigenere-output', 'Enter a key.');
    return;
  }
  var result = '';
  var ki = 0;
  for (var i = 0; i < text.length; i++) {
    var c = text.charCodeAt(i);
    if (c >= 65 && c <= 90) {
      var k = key.charCodeAt(ki % key.length) - 65;
      result += String.fromCharCode(((c - 65 - k + 26) % 26) + 65);
      ki++;
    } else {
      result += text[i];
    }
  }
  setOutput('vigenere-output', result.toLowerCase());
}
