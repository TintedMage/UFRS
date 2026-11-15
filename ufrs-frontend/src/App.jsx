import { useEffect } from "react";
import { Panel, Group, Separator, usePanelRef } from "react-resizable-panels";
import TopLegendBar from "./components/TopLegendBar";
import HarmonizedGlobe from "./components/HarmonizedGlobe";
import LeftSidebar from "./components/LeftSidebar";
import RightPopup from "./components/RightPopup";
import OverpassTimeline from "./components/OverpassTimeline";
import { useAppStore } from "./stores/useAppStore";

function DragHandle({ hidden = false }) {
  return (
    <Separator
      className={`group relative flex w-2 shrink-0 items-center justify-center bg-[#181818] hover:bg-[#252526] active:bg-amber-500/20 transition-colors cursor-col-resize outline-none ${
        hidden ? "hidden" : ""
      }`}
    >
      <div className="flex flex-col gap-[3px]">
        <span className="h-[2.5px] w-[2.5px] rounded-full bg-zinc-500 group-hover:bg-amber-400" />
        <span className="h-[2.5px] w-[2.5px] rounded-full bg-zinc-500 group-hover:bg-amber-400" />
        <span className="h-[2.5px] w-[2.5px] rounded-full bg-zinc-500 group-hover:bg-amber-400" />
      </div>
    </Separator>
  );
}

export default function App() {
  const leftPanelRef = usePanelRef();

  const isLeftCollapsed = useAppStore((state) => state.isLeftCollapsed);
  const setLeftCollapsed = useAppStore((state) => state.setLeftCollapsed);

  // Synchronize panelRef with store actions
  const toggleLeftSidebar = () => {
    const panel = leftPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed() || isLeftCollapsed) {
      panel.expand();
      if (panel.isCollapsed()) {
        panel.resize("18%");
      }
      setLeftCollapsed(false);
    } else {
      panel.collapse();
      setLeftCollapsed(true);
    }
  };

  // Restore collapsed state on mount if persisted
  useEffect(() => {
    if (
      isLeftCollapsed &&
      leftPanelRef.current &&
      !leftPanelRef.current.isCollapsed()
    ) {
      leftPanelRef.current.collapse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col bg-[#181818] text-[#e5e5e5] overflow-hidden">
      {/* FULL-SCREEN ROOT TOP BAR */}
      <TopLegendBar onToggleLeftSidebar={toggleLeftSidebar} />

      {/* MAIN COMPACT WORKSPACE */}
      <div className="flex min-h-0 flex-1 overflow-hidden p-1 pb-0.5">
        <Group orientation="horizontal" className="h-full w-full">
          {/* LEFT SIDEBAR */}
          <Panel
            panelRef={leftPanelRef}
            collapsible
            collapsedSize="0%"
            defaultSize="18%"
            minSize="12%"
            maxSize="32%"
            onResize={(size) => {
              setLeftCollapsed(size.asPercentage <= 0.5);
            }}
          >
            <div
              className={`h-full overflow-hidden rounded-xl border border-[#2f2f2f] ${
                isLeftCollapsed ? "hidden" : ""
              }`}
            >
              <LeftSidebar />
            </div>
          </Panel>

          <DragHandle hidden={isLeftCollapsed} />

          {/* CENTER HARMONIZED 3D GLOBE WITH FLOATING TELEMETRY POPUP */}
          <Panel defaultSize="82%" minSize="68%">
            <div className="relative h-full w-full overflow-hidden rounded-xl border border-[#2f2f2f] bg-[#181818]">
              <HarmonizedGlobe />
              <RightPopup />
            </div>
          </Panel>
        </Group>
      </div>

      {/* FIXED FULL-WIDTH BOTTOM TIMELINE */}
      <OverpassTimeline />
    </div>
  );
}
