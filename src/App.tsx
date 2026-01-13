import Top from "./components/Top";
import Updates from "./Updates";
import { useState } from "react";

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  return (
    <div
      onMouseLeave={() => {
        if (drawerOpen) {
          closeDrawer();
        }
      }}
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div>
        <Top drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />
        <Updates />
      </div>
      <div
        style={{ height: "100%" }}
        onMouseEnter={() => window.electron.send("setClickThrough", true)}
        onMouseLeave={() => window.electron.send("setClickThrough", false)}
      />
    </div>
  );
}

export default App;
