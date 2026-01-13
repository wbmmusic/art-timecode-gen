const NanoTimer = require('nanotimer');
import * as dgram from 'dgram';
import { Buffer } from 'buffer';

interface DelayMap {
    [key: number]: string;
}

interface ProcessMessage {
    cmd: string;
    address?: string;
    speed?: number;
    rate?: number;
    state?: string;
    time?: number[];
    startTime?: number[];
}

let sender: dgram.Socket = dgram.createSocket('udp4');

console.log('TOP OF CHILD');

// Timer Stuff
let frameTimer: any = new NanoTimer();
const delays: DelayMap = {
    24: '41666666n',
    25: '40000000n',
    29.97: '33366666n',
    30: '33333333n'
}

// Clock Variables
let hours: number = 0;
let mins: number = 0;
let secs: number = 0;
let frames: number = 0;
let framerate: number = 30;
let running: boolean = false;

// Output Variables
let consoleAddress: string = '';
let output: boolean = false;
let speed: number = 1;
let startTime: number[] = [0, 0, 0, 0];

// artTimecode Packet Constants
const opCodeHigh: number = 0x97;
const opCodeLow: number = 0;
const protVerLow: number = 14;
const protVerHigh: number = 0;
const id: Buffer = Buffer.from('Art-Net\0');
const opCode: Buffer = Buffer.from([opCodeLow, opCodeHigh]);
const protVer: Buffer = Buffer.from([protVerHigh, protVerLow]);
const filler: Buffer = Buffer.from([0, 0]);
const header: Buffer = Buffer.concat([id, opCode, protVer, filler]);

let outBuffer: Buffer = Buffer.alloc(19);

const makeTypeByte = () => {
    switch (framerate) {
        case 24:
            return 0

        case 25:
            return 1

        case 29.97:
            return 2

        case 30:
            return 3

        default:
            throw new Error('Invalid rate')
    }
}

const makeTimeBytes = (): Buffer => {
    return Buffer.from([frames, secs, mins, hours, makeTypeByte()]);
};

const addZero = (num: number): string => {
    if (num < 10) return '0' + num.toString();
    return num.toString();
};

const sendClockToFrontEnd = (): void => {
    const clock = { time: `${addZero(hours)}:${addZero(mins)}:${addZero(secs)}:${addZero(frames)}`, rate: framerate };
    process.send?.({ cmd: 'time', clock });
};

const checkValidTime = () => {
    // Increment Seconds
    if (frames >= framerate) {
        frames = 0
        secs++
    }

    // Increment Minutes
    if (secs > 59) {
        secs = 0
        mins++
    }

    if (framerate === 29.97) {
        if (secs === 0) {
            if (frames === 0 || frames === 1) {
                if (mins % 10 === 0) {
                    console.log('Devisible by ten');
                } else {
                    console.log('Dropped Frames');
                    frames = 2;
                }
            }
        }
    }

    // Increment hours
    if (mins > 59) {
        mins = 0
        hours++
        if (hours > 23) hours = 0
    }
}

const makeOutBuffer = () => {
    //console.log('Make Output Buffer');
    checkValidTime()
    outBuffer = Buffer.concat([header, makeTimeBytes()])
}

const sendMsg = async (): Promise<void> => {
    return new Promise<void>((resolve) => {
        sender.send(outBuffer, 6454, consoleAddress, () => resolve());
    });
};

const sendFrame = async() => {
    //console.log(outBuffer);
    if (output) await sendMsg()
    sendClockToFrontEnd()
    frames++
    makeOutBuffer()
}

const stopClock = () => {
    running = false
    frameTimer.clearInterval()
}

const startClock = () => {
    stopClock()
    running = true
    frameTimer.setInterval(sendFrame, '', delays[framerate], function() {
        //frameTimer.clearInterval();
    });
}

const setFrameRate = (rate: number): number => {
    framerate = rate
    if (running) startClock()
    sendClockToFrontEnd()
    return framerate
}

const handleTime = (time: number[]): void => {
    //console.log(time);
    hours = time[0]
    mins = time[1]
    secs = time[2]
    frames = time[3]

    // sendClockToFrontEnd happens b4 makeOutBuffer so user sees what they typed
    // DROP FRAME If in 29.97 they type 00:01:00:00 they will see that but outBuffer will be 00:01:00:02
    sendClockToFrontEnd()
    makeOutBuffer()
    console.log(hours, mins, secs, frames);
}

process.on('message', (msg: ProcessMessage) => {
    //console.log('Child got a message');
    switch (msg.cmd) {

        case 'consoleAddress':
            //console.log('Console Address In Child');
            if (output) {
                output = false;
                consoleAddress = '';
            } else {
                consoleAddress = msg.address || '';
                output = true;
            }

            process.send?.({ cmd: 'output', output });
            break;

        case 'speed':
            //console.log('Speed Change', msg.speed);
            speed = msg.speed || 1;
            process.send?.({ cmd: 'speed', speed });
            break;

        case 'rate':
            //console.log('Rate Change');
            process.send?.({ cmd: 'rate', rate: setFrameRate(msg.rate || 30) });
            break;

        case 'state':
            //console.log('state Command', msg.state);
            if (msg.state === 'run') {
                startClock();
            } else if (msg.state === 'stop') {
                stopClock();
                // Reset to start time
                hours = startTime[0];
                mins = startTime[1];
                secs = startTime[2];
                frames = startTime[3];
                sendClockToFrontEnd();
                makeOutBuffer();
            } else if (msg.state === 'pause') {
                stopClock();
            }
            process.send?.({ cmd: 'state', state: msg.state });
            break;

        case 'time':
            if (msg.time) handleTime(msg.time);
            break;

        case 'startTime':
            startTime = msg.startTime || [0, 0, 0, 0];
            break;

        default:
            console.log('ELSE');
            break;
    }
})

makeOutBuffer()