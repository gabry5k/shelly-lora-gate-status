// Shelly LoRa Gate Status - Transmitter
// Shelly 1PM Gen4 + Virtual Boolean
// Firmware 2.0.0

// ==============================
// USER CONFIGURATION
// ==============================
const AES_KEY = 'YOUR_AES_KEY_HERE';

const LORA_ID = 100;
const VIRTUAL_COMPONENT = 'boolean:200';

const MESSAGE_PREFIX = 'GATE:';

const VC_NAME = 'Portão';
const VC_CLOSED_TITLE = 'Fechado';
const VC_OPEN_TITLE = 'Aberto';

const VC_ICON =
  'https://cdn.jsdelivr.net/gh/gabry5k/shelly-lora-gate-status@main/icons/gate_closed.svg';

const VC_CLOSED_ICON =
  'https://cdn.jsdelivr.net/gh/gabry5k/shelly-lora-gate-status@main/icons/gate_closed.svg';

const VC_OPEN_ICON =
  'https://cdn.jsdelivr.net/gh/gabry5k/shelly-lora-gate-status@main/icons/gate_open.svg';

const VC_PERSISTED = true;

const DEBUG = true;
const CHECKSUM_SIZE = 4;

// ==============================
// HELPERS
// ==============================

function log(message) {
  if (DEBUG) {
    console.log('[GATE] ' + message);
  }
}

function fromHex(hex) {
  const arr = new ArrayBuffer(hex.length / 2);

  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(
      hex.substr(i, 2),
      16
    );
  }

  return arr;
}

function decryptMessage(data, keyHex) {
  const key = fromHex(keyHex);

  return AES.decrypt(
    atob(data),
    key,
    {
      mode: 'ECB'
    }
  );
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

function validateMessage(message) {
  if (!message || message.length <= CHECKSUM_SIZE) {
    return null;
  }

  const receivedChecksum =
    message.substring(0, CHECKSUM_SIZE);

  const payload =
    message.substring(CHECKSUM_SIZE).trim();

  const calculatedChecksum =
    generateChecksum(payload);

  if (
    receivedChecksum.toLowerCase() !==
    calculatedChecksum.toLowerCase()
  ) {
    console.log(
      '[LoRa] Invalid checksum'
    );

    log(
      'Received: ' +
      receivedChecksum +
      ' / Calculated: ' +
      calculatedChecksum
    );

    return null;
  }

  return payload;
}

// ==============================
// VIRTUAL COMPONENT
// ==============================

const gateStatus =
  Virtual.getHandle(VIRTUAL_COMPONENT);

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
        icon: VC_ICON,
        buttonIcons: [
          VC_CLOSED_ICON,
          VC_OPEN_ICON
        ]
      }
    }
  });
}

// ==============================
// LORA RECEIVER
// ==============================

Shelly.addEventHandler(function (event) {
  if (!event || event.name !== 'lora') {
    return;
  }

  if (
    !event.data ||
    event.data.id !== LORA_ID
  ) {
    return;
  }

  if (!event.data.data) {
    return;
  }

  try {
    const decrypted =
      decryptMessage(
        event.data.data,
        AES_KEY
      );

    const message =
      validateMessage(decrypted);

    if (!message) {
      return;
    }

    log('Message received: ' + message);

    if (event.data.rssi !== undefined) {
      log('RSSI: ' + event.data.rssi);
    }

    if (event.data.snr !== undefined) {
      log('SNR: ' + event.data.snr);
    }

    if (
      message ===
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

    } else if (
      message ===
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
    }

  } catch (error) {
    console.log(
      '[LoRa] Error processing message:',
      error
    );
  }
});

// ==============================
// STARTUP
// ==============================

console.log('================================');
console.log('GATE SENSOR LORA TRANSMITTER');
console.log('================================');

console.log(
  'Virtual Component: ' +
  VIRTUAL_COMPONENT
);

console.log(
  'LoRa ID: ' +
  LORA_ID
);

console.log('Transmitter ready!');
console.log('================================');
