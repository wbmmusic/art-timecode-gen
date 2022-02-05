import React, { useEffect, useState } from "react";

export default function Clock() {
  const [theTime, setTheTime] = useState({ time: "00:00:00:00", rate: 30 });
  let timeArray = theTime.time.split(":");

  useEffect(() => {
    window.electron.receive("time", time => setTheTime(time));
    return () => window.electron.removeListener("time");
  }, []);

  return (
    <div className="clockBody">
      <div className="digitStyle">{timeArray[0]}</div>
      <div>:</div>
      <div className="digitStyle">{timeArray[1]}</div>
      <div>:</div>
      <div className="digitStyle">{timeArray[2]}</div>
      <div>{theTime.rate !== 29.97 ? ":" : ";"}</div>
      <div className="digitStyle">{timeArray[3]}</div>
      <div className="frameRateDiv">{`${theTime.rate}`}</div>
    </div>
  );
}
