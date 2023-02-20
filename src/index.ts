import {app, BrowserWindow, Menu, nativeImage, nativeTheme, Tray,} from "electron";
import * as path from "path";
import * as settings from "electron-settings";

const DEFAULT_HEIGHT = 800;
const DEFAULT_WIDTH = 400;

let tray: Tray;
let mainWindow: BrowserWindow;

function createTray() {
    const tray = new Tray(
        nativeImage.createFromPath(path.join(__dirname, "images", "icon.png"))
    );
    tray.on("click", toggleMainWindow);
    tray.on("right-click", showContextMenu);
    return tray;
}

function createMainWindow(tray: Tray) {
    const mainWindow = new BrowserWindow({
        frame: false,
        resizable: true,
        transparent: false,
        show: false,
        movable: false,
        minimizable: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        maximizable: false,
        webPreferences: {
            webviewTag: true,
            nodeIntegration: true,
        },
    });

    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    mainWindow.on("blur", hideMainWindow);
    mainWindow.on("resize", handleWindowResize);
    nativeTheme.on("updated", updateMainWindowTheme);

    const menu = createContextMenu();
    tray.on("right-click", () => {
        tray.popUpContextMenu(menu);
    });

    return mainWindow;
}

function createContextMenu() {
    return Menu.buildFromTemplate([
        {
            label: "Quit",
            accelerator: "Command+Q",
            click: () => app.quit(),
        },
        {
            label: "Reload",
            accelerator: "Command+R",
            click: () => mainWindow.reload(),
        },
        {
            label: "Toggle Full Screen",
            accelerator: "Ctrl+Command+F",
            click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()),
        },
        {
            label: "Reset Screen Size",
            accelerator: "Ctrl+Command+R",
            click: () => resetMainWindowSize(),
        },
    ]);
}

async function resetMainWindowSize() {
    const trayBounds = tray.getBounds();
    const x = Math.round(
        trayBounds.x + trayBounds.width / 2 - DEFAULT_WIDTH / 2
    );
    const y = Math.round(trayBounds.y + trayBounds.height);
    mainWindow.setBounds({
        x,
        y,
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
    });
    await settings.set("width", DEFAULT_WIDTH);
    await settings.set("height", DEFAULT_HEIGHT);
}

function handleWindowResize() {
    const { width, height } = mainWindow.getBounds();

    const trayBounds = tray.getBounds();
    const x = Math.round(trayBounds.x + trayBounds.width / 2 - width / 2);
    const y = Math.round(trayBounds.y + trayBounds.height);

    mainWindow.setBounds({
        x,
        y,
        width,
        height,
    })

    settings.set("width", width);
    settings.set("height", height);
}

function toggleMainWindow() {
    mainWindow.isVisible() ? hideMainWindow() : showMainWindow();
}

async function showMainWindow() {
    const trayBounds = tray.getBounds();
    const width = (await settings.get("width") as number) || DEFAULT_WIDTH;
    const height = (await settings.get("height") as number) || DEFAULT_HEIGHT;
    const x = Math.round(trayBounds.x + trayBounds.width / 2 - width / 2);
    const y = Math.round(trayBounds.y + trayBounds.height);
    mainWindow.setBounds({
        x,
        y,
        width,
        height,
    });

    mainWindow.show();
    mainWindow.focus();
}

function hideMainWindow(): void {
  mainWindow.hide();
  app.dock.hide();
}

function updateMainWindowTheme() {
    const backgroundColor = nativeTheme.shouldUseDarkColors ? "#343541" : "#FFF";
    const textColor = nativeTheme.shouldUseDarkColors ? "#FFF" : "#000";
    mainWindow.webContents.insertCSS(`body { background-color: ${backgroundColor}; color: ${textColor}; }`);
}

function showContextMenu() {
    tray.popUpContextMenu(createContextMenu());
}

app.on("ready", async () => {
    tray = createTray();
    mainWindow = await createMainWindow(tray);
    mainWindow.loadFile(path.join(__dirname, "../src/index.html"));
    mainWindow.focus();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
