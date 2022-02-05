import React, { useEffect, useState } from "react";

export default function Clock({ state }) {
  const [theTime, setTheTime] = useState({ time: "00:00:00:00", rate: 30 });
  let timeArray = theTime.time.split(":");

  useEffect(() => {
    window.electron.receive("time", time => setTheTime(time));
    return () => window.electron.removeListener("time");
  }, []);

  return (
    <div className="clockBody">
      <input
        tabIndex={-1}
        maxLength={2}
        disabled={state === "stop" ? false : true}
        className="digitStyle"
        value={timeArray[0]}
      />
      <div>:</div>
      <input
        maxLength={2}
        disabled={state === "stop" ? false : true}
        className="digitStyle"
        value={timeArray[1]}
      />
      <div>:</div>
      <input
        maxLength={2}
        disabled={state === "stop" ? false : true}
        className="digitStyle"
        value={timeArray[2]}
      />
      <div>{theTime.rate !== 29.97 ? ":" : ";"}</div>
      <input
        maxLength={2}
        disabled={state === "stop" ? false : true}
        className="digitStyle"
        value={timeArray[3]}
      />
      <div className="frameRateDiv">{`${theTime.rate}`}</div>
    </div>
  );
}
