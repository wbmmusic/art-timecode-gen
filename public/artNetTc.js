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

let hours = 0;
let mins = 0
let secs = 0;
let frames = 0
let framerate = 30

let running = false
let output = false
let speed = 1

const delays = {
    24: '41666666n',
    25: '40000000n',
    29.97: '33333333n',
    30: '33333333n'
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

    // Increment Frames
    frames++

    // Increment Seconds
    if (frames >= framerate) {
        frames = 0
        secs++
    }

    // Increment Minutes
    if (secs > 59) {
        secs = 0
        mins++

        ////////////////////////////////////  This isnt handled right.. well almost... what if we start at 0:0:0:0 or 10:0:0:0..
        // what if 00:00:10:01 is passed
        if (framerate === 29.97) {
            if (mins % 10 === 0) {
                console.log('Devisible by ten');
            } else {
                console.log('Dropped Frames');
                frames = 2;
            }
        }
    }


    // Increment hours
    if (mins > 59) {
        mins = 0
        hours++
        if (hours > 23) hours = 0
    }


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
    const clock = { time: `${addZero(hours)}:${addZero(mins)}:${addZero(secs)}:${addZero(frames)}`, rate: framerate }
    process.send({ cmd: 'time', clock })
    return framerate
}

const handleTime = (time) => {
    //console.log(time);
    hours = time[0]
    mins = time[1]
    secs = time[2]
    frames = time[3]

    const clock = { time: `${addZero(hours)}:${addZero(mins)}:${addZero(secs)}:${addZero(frames)}`, rate: framerate }
    process.send({ cmd: 'time', clock })
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
                startTimer()
            } else if (msg.state === 'stop') {
                stopTimer()
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