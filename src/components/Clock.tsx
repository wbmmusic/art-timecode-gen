import React, { useEffect, useState } from "react";

interface ClockProps {
  state: string;
}

interface TimeState {
  time: string;
  rate: number;
}

type TimeType = "hr" | "min" | "sec" | "frm";

export default function Clock({ state }: ClockProps) {
  const [theTime, setTheTime] = useState<TimeState>({
    time: "00:00:00:00",
    rate: 30,
  });
  let timeArray = theTime.time.split(":");

  const handleInput = ({ type, value }: { type: TimeType; value: string }) => {
    let val: string | number = value;

    if (isNaN(Number(val)) || val === "") val = "0";

    // Only Numbers
    val = val.replace(/[^0-9]/g, "");

    // Convert to actual number
    val = parseInt(val);

    let currentTimeArray = [...timeArray];

    switch (type) {
      case "hr":
        if (val > 23) val = 23;
        currentTimeArray[0] = String(val);
        break;

      case "min":
        if (val > 59) val = 59;
        currentTimeArray[1] = String(val);
        break;

      case "sec":
        if (val > 59) val = 59;
        currentTimeArray[2] = String(val);
        break;

      case "frm":
        const maxFrame = Math.ceil(theTime.rate) - 1;
        if (val > maxFrame) val = maxFrame;
        currentTimeArray[3] = String(val);
        break;

      default:
        break;
    }

    const numArray = currentTimeArray.map(val => parseInt(val));

    //console.log(`${type} changed to ${numArray}`);
    window.electron.send("time", numArray);
  };

  useEffect(() => {
    window.electron.receive("time", (time: TimeState) => setTheTime(time));
    return () => window.electron.removeListener("time");
  }, []);

  return (
    <form
      id="clockForm"
      className="clockBody"
      onSubmit={e => e.preventDefault()}
      style={
        {
          WebkitUserSelect: state === "stop" ? "auto" : "none",
        } as React.CSSProperties
      }
    >
      <input
        id="hr"
        type="text"
        maxLength={3}
        disabled={state !== "stop"}
        className="digitStyle"
        value={timeArray[0]}
        onChange={e => handleInput({ type: "hr", value: e.target.value })}
      />
      <div>:</div>
      <input
        id="min"
        maxLength={3}
        disabled={state !== "stop"}
        className="digitStyle"
        value={timeArray[1]}
        onChange={e => handleInput({ type: "min", value: e.target.value })}
      />
      <div>:</div>
      <input
        id="sec"
        maxLength={3}
        disabled={state !== "stop"}
        className="digitStyle"
        value={timeArray[2]}
        onChange={e => handleInput({ type: "sec", value: e.target.value })}
      />
      <div>{theTime.rate !== 29.97 ? ":" : ";"}</div>
      <input
        id="frm"
        maxLength={3}
        disabled={state !== "stop"}
        className="digitStyle"
        value={timeArray[3]}
        onChange={e => handleInput({ type: "frm", value: e.target.value })}
      />
      <button hidden id="submit" type="submit">
        submit
      </button>
    </form>
  );
}
