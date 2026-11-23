import {Object3D} from "three";
import {MapViewer} from "./js/MapViewer";
import {Map as BlueMapMap} from "./js/map/Map";
import {MapControls} from "./js/controls/map/MapControls";
import {FreeFlightControls} from "./js/controls/freeflight/FreeFlightControls";

export * as Three from "three";

export * from "./js/controls/freeflight/FreeFlightControls";
export * from "./js/controls/freeflight/keyboard/KeyHeightControls";
export {KeyMoveControls as FreeFlightKeyMoveControls} from "./js/controls/freeflight/keyboard/KeyMoveControls";
export {MouseAngleControls as FreeFlightMouseAngleControls} from "./js/controls/freeflight/mouse/MouseAngleControls";
export {MouseRotateControls as FreeFlightMouseRotateControls} from "./js/controls/freeflight/mouse/MouseRotateControls";
export * from "./js/controls/freeflight/touch/TouchPanControls";

export * from "./js/controls/map/MapControls";
export * from "./js/controls/map/MapHeightControls";
export * from "./js/controls/map/keyboard/KeyAngleControls";
export {KeyMoveControls as MapKeyMoveControls} from "./js/controls/map/keyboard/KeyMoveControls";
export * from "./js/controls/map/keyboard/KeyRotateControls";
export * from "./js/controls/map/keyboard/KeyZoomControls";
export {MouseAngleControls as MapMouseAngleControls} from "./js/controls/map/mouse/MouseAngleControls";
export * from "./js/controls/map/mouse/MouseMoveControls";
export {MouseRotateControls as MapMouseRotateControls} from "./js/controls/map/mouse/MouseRotateControls";
export * from "./js/controls/map/mouse/MouseZoomControls";
export * from "./js/controls/map/touch/TouchAngleControls";
export * from "./js/controls/map/touch/TouchMoveControls";
export * from "./js/controls/map/touch/TouchRotateControls";
export * from "./js/controls/map/touch/TouchZoomControls";

export * from "./js/controls/ControlsManager";
export * from "./js/controls/KeyCombination";

export * from "./js/map/LowresTileLoader";
export * from "./js/map/Map";
export * from "./js/map/Tile";
export * from "./js/map/TileLoader";
export * from "./js/map/TileManager";
export * from "./js/map/TileMap";
export * from "./js/map/hires/HiresFragmentShader";
export * from "./js/map/hires/HiresVertexShader";
export * from "./js/map/lowres/LowresFragmentShader";
export * from "./js/map/lowres/LowresVertexShader";

export * from "./js/markers/ExtrudeMarker";
export * from "./js/markers/HtmlMarker";
export * from "./js/markers/LineMarker";
export * from "./js/markers/Marker";
export * from "./js/markers/MarkerFillFragmentShader";
export * from "./js/markers/MarkerFillVertexShader";
export * from "./js/markers/MarkerManager";
export * from "./js/markers/MarkerSet";
export * from "./js/markers/NormalMarkerManager";
export * from "./js/markers/ObjectMarker";
export * from "./js/markers/PlayerMarker";
export * from "./js/markers/PlayerMarkerManager";
export * from "./js/markers/PlayerMarkerSet";
export * from "./js/markers/PoiMarker";
export * from "./js/markers/ShapeMarker";

export * from "./js/skybox/SkyFragmentShader";
export * from "./js/skybox/SkyVertexShader";
export * from "./js/skybox/SkyboxScene";

export * from "./js/util/CSS2DRenderer";
export * from "./js/util/CombinedCamera";
export * from "./js/util/LineShader";
export * from "./js/util/RevalidatingFileLoader";
export * from "./js/util/RevalidatingTextureLoader";
export * from "./js/util/Stats";
export * from "./js/util/Utils";

export * from "./js/MapViewer";
export * from "./js/Utils";

// Mirrors BlueMap.js without modifying upstream src/js/.
if (!Object3D.prototype.onClick) {
    Object3D.prototype.onClick = function (event) {
        if (this.parent) {
            if (!Array.isArray(event.eventStack)) event.eventStack = [];
            event.eventStack.push(this);

            return this.parent.onClick(event);
        }

        return false;
    };
}

/**
 * Mounts a headless BlueMap renderer inside a DOM container over BlueMap tiles.
 *
 * @param {HTMLElement} container
 * @param {{
 *   mapId: string,
 *   mapDataRoot: string,
 *   liveDataRoot?: string,
 *   clientDecompression?: boolean,
 *   view?: "perspective" | "flat" | "free",
 *   position?: { x?: number, y?: number, z?: number },
 *   distance?: number,
 *   angle?: number,
 *   rotation?: number,
 *   minDistance?: number,
 *   maxDistance?: number,
 *   hiresViewDistance?: number,
 *   lowresViewDistance?: number,
 *   loadBlocker?: () => Promise<void>
 * }} options
 */
export async function mountHeadlessMap(container, options) {
    if (!container) throw new Error("A container element is required.");
    if (!options || !options.mapId) throw new Error("options.mapId is required.");
    if (!options.mapDataRoot) throw new Error("options.mapDataRoot is required.");

    const mapDataRoot = options.mapDataRoot.replace(/\/+$/, "");
    const liveDataRoot = (options.liveDataRoot ?? mapDataRoot).replace(/\/+$/, "");
    const loadBlocker = options.loadBlocker ?? (() => Promise.resolve());

    const viewer = new MapViewer(container, container);
    const mapControls = new MapControls(viewer.renderer.domElement, container);
    const freeFlightControls = new FreeFlightControls(viewer.renderer.domElement);

    if (typeof options.minDistance === "number") mapControls.minDistance = options.minDistance;
    if (typeof options.maxDistance === "number") mapControls.maxDistance = options.maxDistance;
    if (typeof options.hiresViewDistance === "number") viewer.data.loadedHiresViewDistance = options.hiresViewDistance;
    if (typeof options.lowresViewDistance === "number") viewer.data.loadedLowresViewDistance = options.lowresViewDistance;

    const map = new BlueMapMap(
        options.mapId,
        mapDataRoot,
        liveDataRoot,
        loadBlocker,
        viewer.events,
        Boolean(options.clientDecompression)
    );

    const resizeObserver = typeof ResizeObserver === "function"
        ? new ResizeObserver(() => viewer.handleContainerResize())
        : null;
    if (resizeObserver) resizeObserver.observe(container);

    const setView = (mode) => {
        const cm = viewer.controlsManager;
        if (mode === "flat") {
            cm.ortho = 1;
            cm.angle = 0;
            cm.rotation = 0;
            cm.tilt = 0;
            cm.distance = Math.max(5, cm.distance);
            mapControls.reset();
            cm.controls = mapControls;
        } else if (mode === "free") {
            cm.ortho = 0;
            cm.distance = 0;
            cm.angle = Math.PI / 2;
            cm.tilt = 0;
            cm.controls = freeFlightControls;
        } else {
            cm.ortho = 0;
            cm.tilt = 0;
            cm.distance = Math.max(5, cm.distance);
            mapControls.reset();
            cm.controls = mapControls;
        }
        viewer.updateLoadedMapArea();
        viewer.redraw();
    };

    try {
        await viewer.switchMap(map);
    } catch (error) {
        if (resizeObserver) resizeObserver.disconnect();
        window.removeEventListener("resize", viewer.handleContainerResize);
        viewer.renderer.dispose();
        throw error;
    }

    const cm = viewer.controlsManager;
    const startX = options.position?.x ?? map.data.startPos.x ?? 0;
    const startY = options.position?.y ?? 0;
    const startZ = options.position?.z ?? map.data.startPos.z ?? 0;
    cm.position.set(startX, startY, startZ);
    cm.distance = options.distance ?? 1500;
    cm.angle = options.angle ?? 0;
    cm.rotation = options.rotation ?? 0;
    cm.tilt = 0;

    setView(options.view ?? "perspective");

    return {
        viewer,
        map,
        controls: mapControls,
        freeFlightControls,
        setView
    };
}
