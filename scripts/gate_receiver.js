```javascript
// Shelly LoRa Gate Status - Receiver
// Shelly EM Gen4 + BLU Door/Window
// Firmware 2.0.0

// ==============================
// USER CONFIGURATION
// ==============================
const AES_KEY = 'YOUR_AES_KEY_HERE';
const LORA_ID = 100;
const BLU_SENSOR_ID = 202;
const MESSAGE_PREFIX = 'GATE:';
const DEBUG = true;
const CHECKSUM_SIZE = 4;

function log(message) {
  if (DEBUG) console.log('[GATE] ' + message);
}

function generateChecksum(msg) {
  let checksum = 0;

  for (let i = 0; i < msg.length; i++) {
    checksum ^= msg.charCodeAt(i);
  }

  let hex = checksum.toString(16);

  while (hex.length < CHECKSUM_SIZE) {
    hex = '0' + hex;
  }

  return hex.slice(-CHECKSUM_SIZE);
}

function encryptMessage(msg, keyHex) {
  function fromHex(hex) {
    const arr = new ArrayBuffer(hex.length / 2);

    for (let i = 0; i < hex.length; i += 2) {
      arr[i / 2] = parseInt(hex.substr(i, 2), 16);
    }

    return arr;
  }

  function padRight(text, blockSize) {
    const padding = (blockSize - text.length % blockSize) % blockSize;

    for (let i = 0; i < padding; i++) {
      text += ' ';
    }

    return text;
  }

  const key = fromHex(keyHex);
  const formattedMsg = padRight(msg.trim(), 16);

  return AES.encrypt(formattedMsg, key, {
    mode: 'ECB'
  });
}

function sendMessage(message) {
  const checksumMessage = generateChecksum(message) + message;
  const encryptedMessage = encryptMessage(
    checksumMessage,
    AES_KEY
  );

  log('Sending: ' + message);

  Shelly.call(
    'Lora.SendBytes',
    {
      id: LORA_ID,
      data: btoa(encryptedMessage)
    },
    function (_, err_code, err_msg) {
      if (err_code !== 0) {
        console.log(
          '[LoRa] Error:',
          err_code,
          err_msg
        );
      } else {
        log('LoRa message sent successfully');
      }
    }
  );
}

Shelly.addStatusHandler(function (status) {
  if (
    status.component !==
    'bthomesensor:' + BLU_SENSOR_ID
  ) {
    return;
  }

  if (
    !status.delta ||
    typeof status.delta.value === 'undefined'
  ) {
    return;
  }

  const isOpen = status.delta.value === true;

  log(
    'BLU SENSOR -> ' +
    (isOpen ? 'OPEN' : 'CLOSED')
  );

  sendMessage(
    MESSAGE_PREFIX +
    (isOpen ? 'OPEN' : 'CLOSED')
  );
});

console.log('================================');
console.log('GATE SENSOR LORA RECEIVER');
console.log('================================');
console.log(
  'BLU Sensor ID: ' + BLU_SENSOR_ID
);
console.log(
  'LoRa ID: ' + LORA_ID
);
console.log('Receiver ready!');
```
