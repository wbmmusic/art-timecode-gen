var NanoTimer = require('nanotimer');
const dgram = require('dgram');
const { Buffer } = require('buffer');

let sender = dgram.createSocket('udp4');
var timerA = new NanoTimer();

const opCodeHigh = 0x97
const opCodeLow = 0
const protVerLow = 14
const protVerHigh = 0
let consoleAddress = ''

console.log('TOP OF CHILD');

const id = new Buffer.from('Art-Net\0')
const opCode = new Buffer.from([opCodeLow, opCodeHigh])
const protVer = new Buffer.from([protVerHigh, protVerLow])
const filler = new Buffer.from([0, 0])

const header = Buffer.concat([id, opCode, protVer, filler])

let count = 0;

let hours = 23;
let mins = 9
let secs = 56;
let frames = 0
let framerate = 30

let running = false
let output = false
let speed = 1

const delays = {
    24: '41666u',
    25: '40m',
    29.97: '33333u',
    30: '33333u'
}

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

const makeClock = () => {

    if (frames >= framerate) {
        frames = 0
        secs++
    }

    if (secs > 59) {
        secs = 0
        mins++

        ////////////////////////////////////  This isnt handled right.. well almost... what if we start at 0:0:0:0 or 10:0:0:0..
        if (framerate === 29.97) {
            if (mins % 10 === 0) {
                console.log('Devisible by ten');
            } else {
                console.log('Dropped Frames');
                frames = 2;
            }
        }

    }



    if (mins > 59) {
        mins = 0
        hours++
    }

    if (hours > 23) hours = 0

    frames++

    const time = { time: `${addZero(hours)}:${addZero(mins)}:${addZero(secs)}:${addZero(frames)}`, rate: framerate }
    if (consoleAddress !== '' && output) sender.send(Buffer.concat([header, makeTimeBytes()]), 6454, consoleAddress)
    return time
}

const nextFrame = (dummy) => {
    const clock = makeClock(count)
    process.send({ cmd: 'time', clock })
    count++
}

const stopTimer = () => {
    running = false
    timerA.clearInterval()
}

const startTimer = () => {
    stopTimer()
    running = true
    timerA.setInterval(nextFrame, '', delays[framerate], function() {
        //timerA.clearInterval();
    });
}

const setFrameRate = (rate) => {
    framerate = rate
    if (running) startTimer()
    return framerate
}

process.on('message', (msg) => {
    console.log('Child got a message');
    switch (msg.cmd) {

        case 'consoleAddress':
            console.log('Console Address In Child');
            consoleAddress = msg.address
            break;

        case 'speed':
            console.log('Speed Change', msg.speed);
            speed = msg.speed
            process.send({ cmd: 'speed', speed })
            break;

        case 'rate':
            console.log('Rate Change');
            process.send({ cmd: 'rate', rate: setFrameRate(msg.rate) })
            break;

        case 'state':
            console.log('state Command', msg.state);
            if (msg.state === 'run') {
                startTimer()
            } else if (msg.state === 'stop') {
                stopTimer()
            }
            process.send({ cmd: 'state', state: msg.state })
            break;

        default:
            console.log('ELSE');
            break;
    }
})