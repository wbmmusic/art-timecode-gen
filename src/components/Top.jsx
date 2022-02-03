import { Button, ButtonGroup } from "@mui/material";
import React, { useState } from "react";
import Clock from "./Clock";

export default function Top() {
  const [consoleAddress, setConsoleAddress] = useState("");
  const [frameRate, setFrameRate] = useState(30);
  const [speed, setSpeed] = useState(1);
  const [state, setState] = useState("stop");

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

  const handleStateChange = newState => {
    if (newState === state) return;
    window.electron.ipcRenderer
      .invoke("state", newState)
      .then(res => setState(res))
      .catch(err => console.log(err));
  };

  const handleSpeedChange = newSpeed => {
    if (newSpeed === speed) return;
    window.electron.ipcRenderer
      .invoke("speed", newSpeed)
      .then(res => setSpeed(res))
      .catch(err => console.log(err));
  };

  return (
    <div className="theBody">
      <Clock />
      <div>
        <div style={{ textAlign: "center", paddingBottom: "5px" }}>
          <ButtonGroup variant="contained" size="small">
            <Button
              color={state === "stop" ? "error" : "primary"}
              onClick={() => handleStateChange("stop")}
            >
              Stop
            </Button>
            <Button
              color={state === "run" ? "success" : "primary"}
              onClick={() => handleStateChange("run")}
            >
              Run
            </Button>
          </ButtonGroup>
        </div>
        <div style={{ borderTop: "1px solid black", padding: "5px" }}>
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
                color={speed === 0.5 ? "success" : "primary"}
                onClick={() => handleSpeedChange(0.5)}
              >
                .5x
              </Button>
              <Button
                color={speed === 1 ? "success" : "primary"}
                onClick={() => handleSpeedChange(1)}
              >
                1x
              </Button>
              <Button
                color={speed === 2 ? "success" : "primary"}
                onClick={() => handleSpeedChange(2)}
              >
                2x
              </Button>
            </ButtonGroup>
          </div>
        </div>
        <div
          style={{
            borderTop: "1px solid black",
            padding: "5px",
            textAlign: "center",
          }}
        >
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
              color={frameRate === 24 ? "success" : "primary"}
              onClick={() => handleChangeFrameRate(24)}
            >
              24
            </Button>
            <Button
              color={frameRate === 25 ? "success" : "primary"}
              onClick={() => handleChangeFrameRate(25)}
            >
              25
            </Button>
            <Button
              color={frameRate === 29.97 ? "success" : "primary"}
              onClick={() => handleChangeFrameRate(29.97)}
            >
              29.97
            </Button>
            <Button
              color={frameRate === 30 ? "success" : "primary"}
              onClick={() => handleChangeFrameRate(30)}
            >
              30
            </Button>
          </ButtonGroup>
        </div>
        <div
          style={{
            fontSize: "16px",
            fontWeight: "normal",
            padding: "10px",
            borderTop: "1px solid black",
          }}
        >
          Consoles artNet IP:
          <input
            style={{ width: "120px", marginLeft: "10px" }}
            value={consoleAddress}
            onChange={handleConsoleAddress}
          />
        </div>
        <div style={{ textAlign: "center" }}>
          <Button
            size="small"
            disabled={!ipIsValid(consoleAddress)}
            variant="contained"
            onClick={() => {
              window.electron.ipcRenderer
                .invoke("consoleAddress", consoleAddress)
                .then(res => console.log(res))
                .catch(err => console.error(err));
            }}
          >
            Output
          </Button>
        </div>
      </div>
    </div>
  );
}
