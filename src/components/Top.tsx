import { Button, ButtonGroup } from "@mui/material";
import React, { useState, useEffect, useRef } from "react";
import Clock from "./Clock";
import MinimizeIcon from "@mui/icons-material/Minimize";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import PauseIcon from "@mui/icons-material/Pause";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import artnetLogo from "/artnetlogo.png";

type State = "stop" | "run" | "pause";

interface AppConfig {
  consoleAddress: string;
  frameRate: number;
  speed: number;
  output: boolean;
  startTime: number[];
}

interface TopProps {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

export default function Top({ drawerOpen, setDrawerOpen }: TopProps) {
  const [consoleAddress, setConsoleAddress] = useState<string>("");
  const [frameRate, setFrameRate] = useState<number>(30);
  const [speed, setSpeed] = useState<number>(1);
  const [state, setState] = useState<State>("stop");
  const [output, setOutput] = useState<boolean>(false);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);
  const expandRef = useRef<HTMLDivElement>(null);
  // startTime is used in config handler
  const [, setStartTime] = useState<number[]>([0, 0, 0, 0]);

  useEffect(() => {
    const handleConfig = (config: AppConfig) => {
      setConsoleAddress(config.consoleAddress);
      setFrameRate(config.frameRate);
      setSpeed(config.speed);
      setOutput(config.output);
      setStartTime(config.startTime);
    };

    window.electron.receive("config", handleConfig);
    return () => window.electron.removeListener("config");
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    
    const handleWindowMouseLeave = () => {
      setDrawerOpen(false);
      if (expandRef.current) {
        expandRef.current.style.opacity = "1";
        expandRef.current.style.transitionDelay = "0.45s";
      }
      if (closeTimeout) {
        clearTimeout(closeTimeout);
      }
      const timeout = setTimeout(() => {
        setCloseTimeout(null);
      }, 450);
      setCloseTimeout(timeout);
    };

    document.addEventListener('mouseleave', handleWindowMouseLeave);
    return () => document.removeEventListener('mouseleave', handleWindowMouseLeave);
  }, [drawerOpen, closeTimeout]);

  const handleConsoleAddress = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newName = e.target.value;
    if (newName.length > 15) newName = newName.substring(0, 15);
    newName = newName.replace(/[^0-9.]/g, "");
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

  const ipIsValid = (address: string): boolean => {
    const octets = address.split(".");
    if (octets.length !== 4) return false;
    for (let i = 0; i < octets.length; i++) {
      if (octets[i].length === 0) return false;
      if (parseInt(octets[i]) > 255 || parseInt(octets[i]) < 0) return false;
    }
    return true;
  };

  const handleChangeFrameRate = (rate: number) => {
    if (rate === frameRate) return;
    window.electron
      .invoke("frameRate", rate)
      .then((res: number) => setFrameRate(res))
      .catch((err: Error) => console.log(err));
  };

  const handleStateChange = (newState: State) => {
    if (newState === state) return;
    window.electron
      .invoke("state", newState)
      .then((res: State) => setState(res))
      .catch((err: Error) => console.log(err));
  };

  const handleSpeedChange = (newSpeed: number) => {
    if (newSpeed === speed) return;
    window.electron
      .invoke("speed", newSpeed)
      .then((res: number) => setSpeed(res))
      .catch((err: Error) => console.log(err));
  };

  const RunStop = () => (
    <div id="startStop">
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
        onClick={() => handleStateChange("pause")}
      >
        <PauseIcon
          style={{ color: state === "pause" ? "yellow" : "", fontSize: "40px" }}
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

  const InfoBar = () => (
    <div className="infoBar">
      <div
        className="destDisplay"
        style={{ color: output ? "limegreen" : "red" }}
      >
        {consoleAddress}
      </div>
      <div style={{ width: "100%" }} />
      <div className="frDisplay">{frameRate}</div>
    </div>
  );

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
      <InfoBar />
      <RunStop />
      <div
        style={{
          display: "inline-block",
          height: "50px",
          position: "absolute",
          right: "4px",
          top: "81px",
        }}
      >
        <img style={{ maxHeight: "100%" }} src={artnetLogo} alt="artNet Logo" />
      </div>
      <div
        style={{
          display: "inline-block",
          height: "50px",
          position: "absolute",
          left: "5px",
          top: "118px",
          fontSize: "14px",
          color: "grey",
          fontWeight: "normal",
        }}
      >
        WBM Tek
      </div>
      <div
        id="expand"
        ref={expandRef}
        onMouseOver={() => {
          if (!drawerOpen) {
            setDrawerOpen(true);
          }
        }}
        onMouseLeave={() => {
          if (drawerOpen) {
            setDrawerOpen(false);
            if (expandRef.current) {
              expandRef.current.style.opacity = "1";
              expandRef.current.style.transitionDelay = "0.45s";
            }
            const timeout = setTimeout(() => {
              setCloseTimeout(null);
            }, 450);
            setCloseTimeout(timeout);
          }
        }}
      />
      <div
        id="drawer"
        onMouseOver={() => {
          // Cancel any pending close timeout
          if (closeTimeout) {
            clearTimeout(closeTimeout);
            setCloseTimeout(null);
          }
          if (expandRef.current) {
            expandRef.current.style.opacity = "0";
            expandRef.current.style.transitionDelay = "0s";
          }
          if (!drawerOpen) {
            setDrawerOpen(true);
          }
        }}
        onMouseLeave={() => {
          setDrawerOpen(false);
          if (expandRef.current) {
            expandRef.current.style.opacity = "1";
            expandRef.current.style.transitionDelay = "0.45s";
          }
          const timeout = setTimeout(() => {
            setCloseTimeout(null);
          }, 450);
          setCloseTimeout(timeout);
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
              style={{
                width: "120px",
                marginLeft: "10px",
                outline: "none",
                border: "1px solid #ccc",
              }}
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
                window.electron
                  .invoke("consoleAddress", consoleAddress)
                  .then((res: boolean) => setOutput(res))
                  .catch((err: Error) => console.error(err));
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
