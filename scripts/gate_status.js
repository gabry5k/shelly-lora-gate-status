// Shelly LoRa Gate Status - Gate Status
// Shelly 1PM Gen4
// Firmware 2.0.0

// ==============================
// USER CONFIGURATION
// ==============================
const AES_KEY = '1eb3500132a12079cc7b0e8c973b19f20830eda6b46ed9c87542eeca99596978';

const LORA_ID = 100;
const VIRTUAL_COMPONENT = 'boolean:200';
const MESSAGE_PREFIX = 'GATE:';

const VC_NAME = 'Portão';
const VC_CLOSED_TITLE = 'Fechado';
const VC_OPEN_TITLE = 'Aberto';

const VC_CLOSED_ICON =
  'https://cdn.jsdelivr.net/gh/gabry5k/shelly-lora-gate-status@main/icons/gate_closed.svg';

const VC_OPEN_ICON =
  'https://cdn.jsdelivr.net/gh/gabry5k/shelly-lora-gate-status@main/icons/gate_open.svg';

const VC_PERSISTED = true;
const DEBUG = true;
const CHECKSUM_SIZE = 4;


// ==============================
// LOGGING
// ==============================
function log(message) {
  if (DEBUG) console.log('[GATE] ' + message);
}


// ==============================
// HEX HELPERS
// ==============================
function fromHex(hex) {
  const arr = new ArrayBuffer(hex.length / 2);

  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.substr(i, 2), 16);
  }

  return arr;
}


function toHex(buffer) {
  const bytes = new Uint8Array(buffer);
  let hex = '';

  for (let i = 0; i < bytes.length; i++) {
    let h = bytes[i].toString(16);

    if (h.length < 2) {
      h = '0' + h;
    }

    hex += h;
  }

  return hex;
}


function hex2a(hex) {
  let str = '';

  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }

  return str;
}


// ==============================
// CHECKSUM
// ==============================
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


function verifyMessage(message) {
  if (!message || message.length < CHECKSUM_SIZE) {
    return null;
  }

  const receivedChecksum =
    message.substring(0, CHECKSUM_SIZE);

  const payload =
    message.substring(CHECKSUM_SIZE);

  const calculatedChecksum =
    generateChecksum(payload);

  if (receivedChecksum !== calculatedChecksum) {
    console.log(
      '[LoRa] Checksum mismatch:',
      receivedChecksum,
      '!=',
      calculatedChecksum
    );

    return null;
  }

  return payload;
}


// ==============================
// AES DECRYPTION
// ==============================
function decryptMessage(buffer, keyHex) {
  const key = fromHex(keyHex);

  const decrypted =
    AES.decrypt(
      buffer,
      key,
      {
        mode: 'ECB'
      }
    );

  if (!decrypted || decrypted.byteLength === 0) {
    return null;
  }

  const hex = toHex(decrypted);

  const checksumMessage =
    hex2a(hex).trim();

  return verifyMessage(checksumMessage);
}


// ==============================
// VIRTUAL COMPONENT
// ==============================
const gateStatus =
  Virtual.getComponent(VIRTUAL_COMPONENT);

if (!gateStatus) {
  console.log(
    '[GATE] ERROR: Virtual Component not found: ' +
    VIRTUAL_COMPONENT
  );
} else {

  log(
    'Virtual Component found: ' +
    VIRTUAL_COMPONENT
  );

  gateStatus.setConfig({
    name: VC_NAME,
    persisted: VC_PERSISTED,

    meta: {
      ui: {
        view: 'label',

        titles: [
          VC_CLOSED_TITLE,
          VC_OPEN_TITLE
        ],

        icon: VC_CLOSED_ICON,

        buttonIcons: [
          VC_CLOSED_ICON,
          VC_OPEN_ICON
        ]
      }
    }
  });

  log(
    'Virtual Component configured: ' +
    VC_NAME
  );
}


// ==============================
// LORA RECEIVER
// ==============================
Shelly.addEventHandler(function (event) {

  if (
    typeof event !== 'object' ||
    event.name !== 'lora' ||
    !event.info ||
    !event.info.data
  ) {
    return;
  }


  // Optional LoRa ID filtering.
  // Some firmware/events may not provide the ID,
  // so only filter when it is actually available.
  if (
    event.info.id !== undefined &&
    event.info.id !== LORA_ID
  ) {
    return;
  }


  const encryptedMsg =
    atob(event.info.data);


  const decryptedMessage =
    decryptMessage(
      encryptedMsg,
      AES_KEY
    );


  if (decryptedMessage === null) {
    console.log(
      '[LoRa] Invalid or unreadable message'
    );

    return;
  }


  log(
    'Message received: ' +
    decryptedMessage
  );


  if (event.info.rssi !== undefined) {
    console.log(
      '[LoRa] RSSI:',
      event.info.rssi
    );
  }


  if (event.info.snr !== undefined) {
    console.log(
      '[LoRa] SNR:',
      event.info.snr
    );
  }


  // ============================
  // GATE OPEN
  // ============================
  if (
    decryptedMessage ===
    MESSAGE_PREFIX + 'OPEN'
  ) {

    log(
      'Updating Virtual Component -> OPEN'
    );

    if (gateStatus) {
      gateStatus.setValue(true);

      log(
        VIRTUAL_COMPONENT +
        ' = TRUE'
      );
    }

    return;
  }


  // ============================
  // GATE CLOSED
  // ============================
  if (
    decryptedMessage ===
    MESSAGE_PREFIX + 'CLOSED'
  ) {

    log(
      'Updating Virtual Component -> CLOSED'
    );

    if (gateStatus) {
      gateStatus.setValue(false);

      log(
        VIRTUAL_COMPONENT +
        ' = FALSE'
      );
    }

    return;
  }


  log(
    'Unknown message ignored: ' +
    decryptedMessage
  );
});


// ==============================
// STARTUP
// ==============================
console.log('================================');
console.log('GATE STATUS');
console.log('================================');
console.log(
  'Virtual Component: ' +
  VIRTUAL_COMPONENT
);
console.log(
  'LoRa ID: ' +
  LORA_ID
);
console.log('Status listener ready!');
console.log('================================');
