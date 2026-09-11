# Shelly LoRa Gate Status 🚪📡

Monitor the state of a gate using a Shelly BLU Door/Window sensor and transmit its status over LoRa between compatible Shelly Gen3/Gen4 devices.

The receiver exposes the gate state through a Shelly Virtual Boolean, providing a simple way to use the gate status in the Shelly ecosystem and other automation workflows.

---

## Overview

This project uses two compatible Shelly devices equipped with the **LoRa Add-on**:

1. A **sensor-side Shelly** receives the state of a Shelly BLU Door/Window sensor and transmits it over LoRa.
2. A **receiver-side Shelly** receives the LoRa message, decrypts and validates it, and updates a Virtual Boolean.

The project is **not tied to a specific Shelly model**.

Any compatible **Shelly Gen3 or Gen4 device supporting the LoRa Add-on and Shelly Scripting** can potentially be used, provided it supports the APIs required by the scripts.

### Devices used during development and testing

The reference implementation was developed and tested using:

- Shelly 1 Gen4 — sensor side
- Shelly 1PM Gen4 — receiver side
- Shelly BLU Door/Window — gate sensor

These models are examples, not mandatory hardware requirements.

---

# Architecture

```text
┌─────────────────────────┐
│ Shelly BLU              │
│ Door/Window Sensor      │
│                         │
│ Gate state              │
│ OPEN / CLOSED           │
└────────────┬────────────┘
             │
             │ Bluetooth
             ▼
┌─────────────────────────┐
│ Shelly Gen3 / Gen4      │
│ + LoRa Add-on           │
│                         │
│ gate_sensor.js          │
│                         │
│ Sensor → LoRa           │
└────────────┬────────────┘
             │
             │ LoRa
             │
             ▼
┌─────────────────────────┐
│ Shelly Gen3 / Gen4      │
│ + LoRa Add-on           │
│                         │
│ gate_status.js          │
│                         │
│ LoRa → Virtual          │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Virtual Boolean         │
│                         │
│ TRUE  → Open            │
│ FALSE → Closed          │
└─────────────────────────┘
```

## Features
- Shelly BLU Door/Window sensor support
- LoRa communication between Shelly devices
- Compatible with supported Shelly Gen3 and Gen4 devices
- AES encryption
- XOR checksum validation
- Immediate state transmission
- Virtual Boolean status
- Persistent Virtual Component state
- Custom open/closed icons
- No external server required
- No MQTT broker required
- Suitable as a base for future automation features

## Requirements
Hardware
Required
- 1 × Shelly BLU Door/Window sensor
- 2 × compatible Shelly Gen3 or Gen4 devices
- 1 × LoRa Add-on for each Shelly used for LoRa communication
- 
The sensor-side Shelly must be capable of receiving the BLU sensor status.
Both Shelly devices must support the LoRa functionality used by the scripts.

```text
Example hardware
The following hardware was used for development and testing:
Role	                Device
Gate sensor	            Shelly BLU Door/Window
Sensor-side device	    Shelly 1 Gen4
Receiver	            Shelly 1PM Gen4
LoRa	                LoRa Add-on on both Shellys
```

Other compatible Shelly Gen3/Gen4 models may also be used.

## Software
- Shelly firmware with support for the required scripting and LoRa APIs
- Shelly Scripting enabled
- LoRa Add-on configured on both devices
- A Shelly Virtual Boolean on the receiver
The reference implementation was tested on:
Firmware: 2.0.0

## Project Structure
```text
shelly-lora-gate-status/
│
├── README.md
│
├── icons/
│   ├── gate_closed.svg
│   └── gate_open.svg
│
└── scripts/
    ├── gate_sensor.js
    └── gate_status.js
```

## How It Works
The BLU Door/Window sensor reports the gate state to the sensor-side Shelly.
When the state changes, the sensor-side script immediately generates one of the following messages:

GATE:OPEN

GATE:CLOSED

The message is then:
1. Combined with an XOR checksum.
2. Encrypted using AES-ECB.
3. Encoded for transmission.
4. Sent using LoRa.
   
The receiver:
1. Receives the LoRa packet.
2. Decrypts the message.
3. Validates the checksum.
4. Identifies the gate state.
5. Updates the Virtual Boolean.

## Message Flow
```text
BLU sensor state
       │
       ▼
OPEN / CLOSED
       │
       ▼
GATE:OPEN
GATE:CLOSED
       │
       ▼
XOR checksum
       │
       ▼
AES-ECB encryption
       │
       ▼
LoRa transmission
       │
       ▼
AES-ECB decryption
       │
       ▼
Checksum validation
       │
       ▼
Virtual Boolean
```

## Configuration
**1. Create the Virtual Boolean**
```text
On the receiver Shelly, create a new Virtual Component:
Type: Boolean
Component: boolean:200
Name: Portão

The project uses the following state mapping:
TRUE  = Gate Open
FALSE = Gate Closed

The script automatically configures the Virtual Component with:
TRUE  → Aberto
FALSE → Fechado

and custom icons for each state.
The component ID does not have to be boolean:200. If a different ID is used, update the VIRTUAL_COMPONENT value in gate_status.js.
```

**2. Configure the Sensor-Side Shelly**
```text
Install:
scripts/gate_sensor.js
on the Shelly connected to the BLU Door/Window sensor.
Configure the following values:
const AES_KEY = 'YOUR_AES_KEY_HERE';

const LORA_ID = 100;
const BLU_SENSOR_ID = 202;
```
**BLU Sensor ID**
```text
The reference configuration uses: 202

If your BLU sensor has a different component ID, change:
const BLU_SENSOR_ID = 202;
to match your device.
```
## 3. Configure the Receiver Shelly
```text
Install:
scripts/gate_status.js
on the receiver Shelly.
Configure:
const AES_KEY = 'YOUR_KEY_HERE';

const LORA_ID = 100;
const VIRTUAL_COMPONENT = 'boolean:200';
The LORA_ID must match the ID used by the sensor-side script.
The VIRTUAL_COMPONENT must match the Virtual Boolean created on the receiver.
```

## AES Encryption
```text
The project uses:
AES
Mode: ECB
The same AES key must be configured on both Shelly devices.
Example:
const AES_KEY = 'YOUR_AES_KEY_HERE';
Important Security Notice
Never publish your real AES key.
The GitHub repository intentionally contains placeholder values.
The real key should only be configured directly on the Shelly devices.
Do not publish the real key in:
- GitHub
- README files
- screenshots
- videos
- public documentation
- support requests
If a real key is accidentally committed to a public repository, replace/rotate it before continuing to use the project.
```

## LoRa Configuration
```text
The example configuration uses:
LoRa ID: 100
Both scripts use the same ID:
const LORA_ID = 100;
The LoRa Add-ons must be configured correctly on both Shelly devices before running the scripts.
The actual LoRa radio configuration should follow the requirements of the Shelly firmware and LoRa Add-on being used.
```

## Script 1 — Gate Sensor
```text
File:
scripts/gate_sensor.js
Runs on the Shelly connected to the BLU Door/Window sensor.
Its responsibilities are:
BLU Sensor
     ↓
Detect state
     ↓
Generate message
     ↓
Checksum
     ↓
AES encryption
     ↓
LoRa transmission
The script sends immediately whenever the BLU sensor reports a state change.
```

## Script 2 — Gate Status
```text
File:
scripts/gate_status.js
Runs on the receiving Shelly.
Its responsibilities are:
LoRa reception
     ↓
AES decryption
     ↓
Checksum validation
     ↓
Message validation
     ↓
Virtual Boolean update
The receiver also reports LoRa signal information when available:
RSSI
SNR
```

## Gate State Mapping
```text
Gate state  LoRa message  Virtual Boolean	Display
Open        GATE:OPEN     true            Aberto
Closed	    GATE:CLOSED	  false	          Fechado
```

## Testing
```text
After installing and configuring both scripts:
1. Start the receiver
The receiver should display something similar to:
================================
GATE STATUS
================================
Virtual Component: boolean:200
LoRa ID: 100
Status listener ready!
================================
2. Open the gate
The sensor-side Shelly should report:
[GATE] BLU SENSOR -> OPEN
[GATE] Sending: GATE:OPEN
[GATE] LoRa message sent successfully
The receiver should report:
[GATE] Message received: GATE:OPEN
[LoRa] RSSI: -25
[LoRa] SNR: 7
[GATE] Updating Virtual Component -> OPEN
[GATE] boolean:200 = TRUE
The Virtual Boolean should display:
Aberto
3. Close the gate
The sensor-side Shelly should report:
[GATE] BLU SENSOR -> CLOSED
[GATE] Sending: GATE:CLOSED
[GATE] LoRa message sent successfully
The receiver should report:
[GATE] Message received: GATE:CLOSED
[LoRa] RSSI: -26
[LoRa] SNR: 7
[GATE] Updating Virtual Component -> CLOSED
[GATE] boolean:200 = FALSE
The Virtual Boolean should display:
Fechado
```

## Troubleshooting
```text
The BLU sensor is not detected
Check:
- The BLU sensor is correctly associated with the sensor-side Shelly.
- The BLU_SENSOR_ID matches the actual component ID.
- Bluetooth/BTHome functionality is enabled.
- The sensor is reporting state changes.
The sensor-side Shelly detects the gate but cannot transmit
Check:
- LoRa Add-on installation
- LoRa configuration
- LORA_ID
- Shelly firmware
- Script configuration
The expected successful transmission message is:
[GATE] LoRa message sent successfully
The receiver does not receive anything
Check:
- LoRa Add-on installation on both devices
- LoRa configuration
- Matching LORA_ID
- LoRa range
- Antenna/environment
- Firmware compatibility
If packets are being received, the receiver should normally report RSSI/SNR values.
The receiver receives packets but cannot decrypt them
The most common things to check are:
- AES key is identical on both devices.
- AES key contains only hexadecimal characters.
- No spaces or extra characters were added.
- The key was copied correctly.
- Both devices are running compatible firmware.
Do not publish the real AES key when asking for support.
Checksum mismatch
A checksum mismatch indicates that the decrypted message did not match the expected checksum.
Check:
- AES key
- AES configuration
- LoRa packet integrity
- Script versions
- Firmware compatibility
Virtual Component does not change
Check:
const VIRTUAL_COMPONENT = 'boolean:200';
Make sure the Virtual Boolean exists on the receiver.
If a different component ID was created, update the script accordingly.
```

## Current Scope — V1.0
```text
V1.0 intentionally focuses on one simple task:
Transmit the gate state over LoRa and expose it as a Virtual Boolean.

Included
- BLU Door/Window gate detection
- Immediate state transmission
- LoRa communication
- AES encryption
- XOR checksum
- LoRa reception
- Message validation
- Virtual Boolean update
- Persistent Virtual Component state
- Custom gate icons
- RSSI/SNR logging
Not included
- Debounce
- Delayed confirmation
- Notifications
- LoRa acknowledgements
- Bidirectional communication
- Remote gate control
- Battery monitoring
- Communication failure alerts
- Home Assistant-specific functionality
```

## Immediate Transmission
```text
V1.0 intentionally does not use a debounce or confirmation delay.
When the BLU sensor reports a state change:
OPEN
  ↓
GATE:OPEN
  ↓
LoRa
or:
CLOSED
  ↓
GATE:CLOSED
  ↓
LoRa
The message is transmitted immediately.
This behaviour is intentional in V1.0.
```

## Future Improvements
```text
Possible future versions may add:
- Optional debounce
- Configurable state confirmation delay
- LoRa acknowledgements
- Communication health monitoring
- Last-seen timestamp
- RSSI/SNR monitoring
- Battery status
- Communication timeout detection
- Bidirectional LoRa communication
- Remote gate control
- Additional Virtual Components
- Notifications
- Home Assistant integration
Future functionality should preferably be implemented as separate features so that the stable V1.0 communication layer remains unaffected.
```

## Security Considerations
```text
This project uses a shared AES key between the sensor-side and receiver Shellys.
The key should be considered sensitive information.
Never commit the real key to GitHub.
The repository only contains placeholders such as:
const AES_KEY = 'YOUR_AES_KEY_HERE';
Configure the actual key locally on each Shelly.
```

## Compatibility
```text
This project is designed around the Shelly scripting and LoRa functionality available on compatible Shelly Gen3 and Gen4 devices.
It is not intended to be limited to the specific devices used during development.
Tested reference hardware
Sensor side:
Shelly 1 Gen4

Receiver:
Shelly 1PM Gen4

Sensor:
Shelly BLU Door/Window

Firmware:
2.0.0
Other compatible Shelly Gen3/Gen4 devices with the required LoRa Add-on and scripting capabilities may be used.
Always test compatibility with the firmware and hardware combination before deploying the project.
```

## Project Status
```text
V1.0 — Tested and working
The reference implementation has been tested with:
BLU sensor
     ↓
Shelly Gen4
     ↓
LoRa
     ↓
Shelly Gen4
     ↓
Virtual Boolean
Both OPEN and CLOSED states have been successfully transmitted and reflected on the receiver.
```

## License
```text
This project is provided as-is for personal and educational use.
Use it at your own risk and verify compatibility with your Shelly hardware and firmware before deployment.
```
