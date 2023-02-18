import {
  app,
  Tray,
  nativeImage,
  BrowserWindow,
  nativeTheme,
  Menu,
} from "electron";
import * as path from "path";

let tray: Tray;
let mainWindow: BrowserWindow;
const defaultHeight = 800;
const defaultWidth = 400;

function createTray(): Tray {
  const tray = new Tray(
    nativeImage.createFromPath(path.join(__dirname, "images", "icon.png"))
  );

  tray.on("click", toggleMainWindow);

  return tray;
}

async function createMainWindow(tray: Tray): Promise<BrowserWindow> {
  const mainWindow = new BrowserWindow({
    frame: false,
    resizable: false,
    transparent: true,
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

  // visibleOnAllWorkspaces
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  mainWindow.on("blur", hideMainWindow);
  nativeTheme.on("updated", updateMainWindowTheme);

  const quit = () => {
    app.quit();
  };

  const menu = Menu.buildFromTemplate([
    { label: "Quit", accelerator: "Command+Q", click: quit },
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
  ]);

  tray.on("right-click", () => {
    tray.popUpContextMenu(menu);
  });

  return mainWindow;
}

function toggleMainWindow(): void {
  mainWindow.isVisible() ? hideMainWindow() : showMainWindow();
}

function showMainWindow(): void {
  const trayBounds = tray.getBounds();

  mainWindow.setBounds({
    x: trayBounds.x - (defaultWidth - trayBounds.width) / 2,
    y: trayBounds.y + trayBounds.height,
    width: defaultWidth,
    height: defaultHeight,
  });

  mainWindow.show();
  updateMainWindowTheme();
}

function hideMainWindow(): void {
  mainWindow.hide();
  app.dock.hide();
}

function updateMainWindowTheme(): void {
  const backgroundColor = nativeTheme.shouldUseDarkColors ? "#343541" : "#FFF";
  const textColor = nativeTheme.shouldUseDarkColors ? "#FFF" : "#000";

  mainWindow.webContents.insertCSS(`
    body {
      background-color: ${backgroundColor};
      color: ${textColor};
    }
  `);
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
