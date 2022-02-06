import React, { useEffect, useState } from "react";

export default function Clock({ state }) {
  const [theTime, setTheTime] = useState({ time: "00:00:00:00", rate: 30 });
  let timeArray = theTime.time.split(":");

  const handleInput = ({ type, value }) => {
    let val = value;

    if (isNaN(val) || val === "") val = "0";

    // Only Numbers
    val = val.replace(/[^0-9]/g, "");

    // Convert to actual number
    val = parseInt(val);

    let currentTimeArray = [...timeArray];

    switch (type) {
      case "hr":
        if (val > 23) val = 23;
        currentTimeArray[0] = val;
        break;

      case "min":
        if (val > 59) val = 59;
        currentTimeArray[1] = val;
        break;

      case "sec":
        if (val > 59) val = 59;
        currentTimeArray[2] = val;
        break;

      case "frm":
        const maxFrame = Math.ceil(theTime.rate) - 1;
        if (val > maxFrame) val = maxFrame;
        currentTimeArray[3] = val;
        break;

      default:
        break;
    }

    currentTimeArray.forEach((val, i) => (currentTimeArray[i] = parseInt(val)));

    //console.log(`${type} changed to ${currentTimeArray}`);
    window.electron.send("time", currentTimeArray);
  };

  useEffect(() => {
    window.electron.receive("time", time => setTheTime(time));
    return () => window.electron.removeListener("time");
  }, []);

  return (
    <form
      id="clockForm"
      className="clockBody"
      onSubmit={e => e.preventDefault()}
      style={{ WebkitUserSelect: state === "stop" ? "" : "none" }}
    >
      <input
        id="hr"
        type="text"
        maxLength={3}
        disabled={state === "stop" ? false : true}
        className="digitStyle"
        value={timeArray[0]}
        onChange={e => handleInput({ type: "hr", value: e.target.value })}
      />
      <div>:</div>
      <input
        id="min"
        maxLength={3}
        disabled={state === "stop" ? false : true}
        className="digitStyle"
        value={timeArray[1]}
        onChange={e => handleInput({ type: "min", value: e.target.value })}
      />
      <div>:</div>
      <input
        id="sec"
        maxLength={3}
        disabled={state === "stop" ? false : true}
        className="digitStyle"
        value={timeArray[2]}
        onChange={e => handleInput({ type: "sec", value: e.target.value })}
      />
      <div>{theTime.rate !== 29.97 ? ":" : ";"}</div>
      <input
        id="frm"
        maxLength={3}
        disabled={state === "stop" ? false : true}
        className="digitStyle"
        value={timeArray[3]}
        onChange={e => handleInput({ type: "frm", value: e.target.value })}
      />
      <div className="frameRateDiv">{`${theTime.rate}`}</div>
      <button hidden id="submit" type="submit">
        submit
      </button>
    </form>
  );
}
