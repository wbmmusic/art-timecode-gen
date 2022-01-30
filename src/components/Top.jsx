import React, { useEffect, useState } from "react";

export default function Top() {
  const [theTime, setTheTime] = useState("00:00:00:00");
  const [consoleAddress, setConsoleAddress] = useState("");

  useEffect(() => {
    window.electron.receive("time", time => setTheTime(time));

    return () => {
      window.electron.removeListener("time");
    };
  }, []);

  const handleConsoleAddress = e => {
    let newName = e.target.value;
    if (newName.length > 15) newName = newName.substring(0, 15);
    newName = newName.replaceAll(/[^0-9.]/g, "");
    let octets = newName.split(".");
    //console.log(octets)
    for (let i = 0; i < octets.length; i++) {
      if (parseInt(octets[i]) > 255) octets[i] = "255";
    }
    //console.log(octets)
    let out = "";

    switch (octets.length) {
      case 1:
        out = octets[0];
        break;

      case 2:
        out = octets[0] + "." + octets[1];
        break;

      case 3:
        out = octets[0] + "." + octets[1] + "." + octets[2];
        break;

      case 4:
        out = octets[0] + "." + octets[1] + "." + octets[2] + "." + octets[3];
        break;

      default:
        break;
    }

    setConsoleAddress(out);
  };

  const ipIsValid = address => {
    const octets = address.split(".");
    if (octets.length !== 4) return false;
    for (let i = 0; i < octets.length; i++) {
      if (octets[i].length === 0) return false;
      if (parseInt(octets[i]) > 255 || parseInt(octets[i]) < 0) return false;
    }
    return true;
  };

  return (
    <div
      style={{
        borderTop: "1px solid lightgrey",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",
        alignItems: "center",
        fontSize: "30px",
        fontWeight: "bold",
      }}
    >
      <div>{theTime} 30fps</div>
      <div style={{ fontSize: "16px", fontWeight: "normal" }}>
        Consoles artNet IP:
        <input
          style={{ width: "120px" }}
          value={consoleAddress}
          onChange={handleConsoleAddress}
        />
      </div>
      <div>
        <button
          disabled={!ipIsValid(consoleAddress)}
          onClick={() => {
            window.electron.ipcRenderer
              .invoke("consoleAddress", consoleAddress)
              .then(res => console.log(res))
              .catch(err => console.error(err));
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
