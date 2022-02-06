import { Button, ButtonGroup } from "@mui/material";
import React, { useEffect, useState } from "react";
import Clock from "./Clock";
import MinimizeIcon from "@mui/icons-material/Minimize";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

export default function Top() {
  const [consoleAddress, setConsoleAddress] = useState("");
  const [frameRate, setFrameRate] = useState(30);
  const [speed, setSpeed] = useState(1);
  const [state, setState] = useState("stop");
  const [output, setOutput] = useState(false);

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

  const RunStop = () => (
    <div id="startStop">
      <div
        className="destDisplay"
        style={{ color: output ? "limegreen" : "red" }}
      >
        {consoleAddress}
      </div>
      <div
        style={{ cursor: "pointer" }}
        onClick={() => handleStateChange("stop")}
      >
        <StopIcon
          style={{ color: state === "stop" ? "red" : "", fontSize: "40px" }}
        />
      </div>
      <div
        style={{ cursor: "pointer" }}
        onClick={() => handleStateChange("run")}
      >
        <PlayArrowIcon
          style={{ color: state === "run" ? "#00F800" : "", fontSize: "40px" }}
        />
      </div>
    </div>
  );

  const Speed = () => (
    <div
      style={{
        borderTop: "2px solid darkgrey",
        padding: "5px",
        display: "none",
      }}
    >
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
        <ButtonGroup disabled variant="contained" size="small">
          <Button
            color={speed === 0.5 ? "warning" : "primary"}
            onClick={() => handleSpeedChange(0.5)}
          >
            .5x
          </Button>
          <Button
            color={speed === 1 ? "warning" : "primary"}
            onClick={() => handleSpeedChange(1)}
          >
            1x
          </Button>
          <Button
            color={speed === 2 ? "warning" : "primary"}
            onClick={() => handleSpeedChange(2)}
          >
            2x
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );

  const FrameRate = () => (
    <div
      style={{
        borderTop: "2px solid darkgrey",
        padding: "5px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          textAlign: "center",
          fontSize: "12px",
          fontWeight: "normal",
          color: "ActiveBorder",
        }}
      >
        Frame Rate
      </div>
      <ButtonGroup variant="contained" size="small">
        <Button
          color={frameRate === 24 ? "warning" : "primary"}
          onClick={() => handleChangeFrameRate(24)}
        >
          24
        </Button>
        <Button
          color={frameRate === 25 ? "warning" : "primary"}
          onClick={() => handleChangeFrameRate(25)}
        >
          25
        </Button>
        <Button
          color={frameRate === 29.97 ? "warning" : "primary"}
          onClick={() => handleChangeFrameRate(29.97)}
        >
          29.97
        </Button>
        <Button
          color={frameRate === 30 ? "warning" : "primary"}
          onClick={() => handleChangeFrameRate(30)}
        >
          30
        </Button>
      </ButtonGroup>
    </div>
  );

  useEffect(() => {
    const bod = document.getElementById("theBody");

    const hndleResize = e => {
      /*console.log(e[0].contentRect.height);*/
      window.electron.send("contentHeight", e[0].contentRect.height);
    };
    const observer = new ResizeObserver(hndleResize).observe(bod);

    return () => {
      //observer.unobserve();
    };
  }, []);

  return (
    <div id="theBody">
      <div className="topBar">
        <div className="topBarDrag">
          artTimecode Gen v{window.electron.ver()}
        </div>
        <div className="buttonsHover">
          <MoreHorizIcon style={{ fontSize: "inherit" }} />
        </div>
      </div>
      <div className="topRightButtons">
        <div className="closeBtn" onClick={() => window.electron.send("close")}>
          <CloseIcon style={{ fontSize: "12px" }} />
        </div>
        <div className="minBtn" onClick={() => window.electron.send("min")}>
          <MinimizeIcon style={{ fontSize: "12px" }} />
        </div>
      </div>
      <input
        maxLength={1}
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: "-10",
        }}
      />
      <Clock state={state} />
      <RunStop />
      <div id="expand" />
      <div
        id="drawer"
        onMouseOver={() => {
          let exp = document.getElementById("expand");
          exp.style.opacity = 0;
          exp.style.transitionDelay = "0s";
        }}
        onMouseOut={() => {
          let exp = document.getElementById("expand");
          exp.style.opacity = 1;
          exp.style.transitionDelay = "0.45s";
        }}
      >
        <Speed />
        <FrameRate />
        <div>
          <div
            style={{
              fontWeight: "normal",
              padding: "10px",
              borderTop: "2px solid darkgrey",
              fontSize: "16px",
            }}
          >
            <div
              style={{
                display: "inline-block",
                color: "white",
                fontSize: "12px",
              }}
            >
              Destination IP:
            </div>
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
                  .then(res => setOutput(res))
                  .catch(err => console.error(err));
              }}
            >
              {output ? "Mute" : "Output"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
