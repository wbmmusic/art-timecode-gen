# Art Timecode Gen

React + Electron desktop application for generating ArtNet timecode signals used in professional lighting and video systems for synchronization in live events and broadcast production. This professional tool provides precise timecode generation for lighting consoles and media servers.

## Key Features

- **ArtNet Protocol**: Generates ArtNet timecode packets (OpCode 0x9700) for industry-standard lighting control synchronization
- **Multiple Frame Rates**: Supports 24, 25, 29.97, and 30 fps with proper drop-frame handling for 29.97 broadcast standard
- **Precision Timing**: Uses NanoTimer for microsecond-accurate frame timing and synchronization critical for professional applications
- **Network Output**: UDP broadcast to configurable IP addresses on port 6454 (ArtNet standard protocol)
- **Real-time Clock**: Visual timecode display with hours:minutes:seconds:frames format for operator reference
- **Professional Interface**: Material-UI with lighting industry-standard controls and visual indicators
- **Cross-Platform**: macOS and Windows builds with code signing and notarization for professional deployment
- **Auto-Update**: Electron auto-updater for maintaining current versions in production environments
- **Live Control**: Start/stop controls and real-time timecode adjustment for live event operation

## Architecture

Electron application with React frontend and Node.js backend designed for precise timecode generation and network transmission in professional production environments.

## Professional Usage

Used in live events, broadcast production, and theatrical productions to generate ArtNet timecode signals for synchronizing lighting consoles, media servers, and other professional equipment requiring frame-accurate timing.

## Dependencies

- React
- Electron
- Material-UI
- nanotimer
- electron-updater