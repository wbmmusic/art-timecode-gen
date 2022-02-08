var NanoTimer = require('nanotimer');
const dgram = require('dgram');
const { Buffer } = require('buffer');
let sender = dgram.createSocket('udp4');

console.log('TOP OF CHILD');

// Timer Stuff
var frameTimer = new NanoTimer();
const delays = {
    24: '41666666n',
    25: '40000000n',
    29.97: '33366666n',
    30: '33333333n'
}

// Clock Variables
let hours = 0;
let mins = 0
let secs = 0;
let frames = 0
let framerate = 30
let running = false

// Output Variables
let consoleAddress = ''
let output = false
let speed = 1

// artTimecode Packet Constants
const opCodeHigh = 0x97
const opCodeLow = 0
const protVerLow = 14
const protVerHigh = 0
const id = new Buffer.from('Art-Net\0')
const opCode = new Buffer.from([opCodeLow, opCodeHigh])
const protVer = new Buffer.from([protVerHigh, protVerLow])
const filler = new Buffer.from([0, 0])
const header = Buffer.concat([id, opCode, protVer, filler])

let outBuffer = Buffer.alloc(19)

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

const makeTimeBytes = () => {
    return new Buffer.from([frames, secs, mins, hours, makeTypeByte()])
}

const addZero = (num) => {
    if (num < 10) return '0' + num
    return num
}

const sendClockToFrontEnd = () => {
    const clock = { time: `${addZero(hours)}:${addZero(mins)}:${addZero(secs)}:${addZero(frames)}`, rate: framerate }
    process.send({ cmd: 'time', clock })
}

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

const sendMsg = async() => {
    return new Promise(async(resolve, reject) => {
        sender.send(outBuffer, 6454, consoleAddress, () => resolve())
    })
}

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

const setFrameRate = (rate) => {
    framerate = rate
    if (running) startClock()
    sendClockToFrontEnd()
    return framerate
}

const handleTime = (time) => {
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

process.on('message', (msg) => {
    //console.log('Child got a message');
    switch (msg.cmd) {

        case 'consoleAddress':
            //console.log('Console Address In Child');
            if (output) {
                output = false
                consoleAddress = ''
            } else {
                consoleAddress = msg.address
                output = true
            }

            process.send({ cmd: 'output', output })
            break;

        case 'speed':
            //console.log('Speed Change', msg.speed);
            speed = msg.speed
            process.send({ cmd: 'speed', speed })
            break;

        case 'rate':
            //console.log('Rate Change');
            process.send({ cmd: 'rate', rate: setFrameRate(msg.rate) })
            break;

        case 'state':
            //console.log('state Command', msg.state);
            if (msg.state === 'run') {
                startClock()
            } else if (msg.state === 'stop') {
                stopClock()
            }
            process.send({ cmd: 'state', state: msg.state })
            break;

        case 'time':
            handleTime(msg.time)
            break;

        default:
            console.log('ELSE');
            break;
    }
})

makeOutBuffer()