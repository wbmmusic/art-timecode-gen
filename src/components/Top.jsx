import { Button, ButtonGroup } from "@mui/material";
import React, { useEffect, useState } from "react";

export default function Top() {
  const [theTime, setTheTime] = useState("00:00:00:00");
  const [consoleAddress, setConsoleAddress] = useState("");
  const [frameRate, setFrameRate] = useState(30);
  const [speed, setSpeed] = useState(1);
  const [state, setState] = useState("run");

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

  const handleChangeFrameRate = rate => {
    if (rate === frameRate) return;
    window.electron.ipcRenderer
      .invoke("frameRate", rate)
      .then(res => setFrameRate(res))
      .catch(err => console.log(err));
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
      <div>
        {theTime.time} {theTime.rate}fps
      </div>
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
          Output
        </button>
        <div>
          <ButtonGroup size="small" variant="contained">
            <Button
              color={state === "stop" ? "secondary" : "primary"}
              onClick={() => setState("stop")}
            >
              Stop
            </Button>
            <Button
              color={state === "run" ? "secondary" : "primary"}
              onClick={() => setState("run")}
            >
              Run
            </Button>
          </ButtonGroup>
        </div>
        <div style={{ border: "1px solid black", padding: "10px" }}>
          <div
            style={{
              textAlign: "center",
              fontSize: "16px",
              fontWeight: "normal",
            }}
          >
            Speed
          </div>
          <div style={{ textAlign: "center" }}>
            <ButtonGroup variant="contained" size="small">
              <Button
                color={speed === 0.5 ? "secondary" : "primary"}
                onClick={() => setSpeed(0.5)}
              >
                .5x
              </Button>
              <Button
                color={speed === 1 ? "secondary" : "primary"}
                onClick={() => setSpeed(1)}
              >
                1x
              </Button>
              <Button
                color={speed === 2 ? "secondary" : "primary"}
                onClick={() => setSpeed(2)}
              >
                2x
              </Button>
            </ButtonGroup>
          </div>
        </div>

        <div style={{ border: "1px solid black", padding: "10px" }}>
          <div
            style={{
              textAlign: "center",
              fontSize: "16px",
              fontWeight: "normal",
            }}
          >
            Frame Rate
          </div>
          <ButtonGroup variant="contained" size="small">
            <Button
              color={frameRate === 24 ? "secondary" : "primary"}
              onClick={() => handleChangeFrameRate(24)}
            >
              24
            </Button>
            <Button
              color={frameRate === 25 ? "secondary" : "primary"}
              onClick={() => handleChangeFrameRate(25)}
            >
              25
            </Button>
            <Button
              color={frameRate === 29.97 ? "secondary" : "primary"}
              onClick={() => handleChangeFrameRate(29.97)}
            >
              29.97
            </Button>
            <Button
              color={frameRate === 30 ? "secondary" : "primary"}
              onClick={() => handleChangeFrameRate(30)}
            >
              30
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </div>
  );
}
