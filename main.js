const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
// 引入基于 Promise 的 fs 模块
const fsPromise = require("fs/promises");

const { exec } = require("child_process"); // 引入 child_process 模块，用于执行Python脚本

const {
  getUserInfo,
  insertUser,
  updateUserInfo,
  deleteUser,
} = require("./mysqld");

const {
  selectUserMsgAll,
  leaveMsg,
  replay,
  getReplies,
  getDynamics,
  publicDynamic,
} = require("./database/database");
const {
  insertAlbum,
  insertPhotoToAlbum,
  getAlbums,
  insertConcern,
  deleteConcern,
} = require("./database/database");
const {
  getConcern,
  getConcernAll,
  getDynamicByUserName,
  deleteAlbum,
  deletePhoto,
  likes,
  disLikes,
  isliked,
} = require("./database/database");
const { insertComments, getComments } = require("./database/database");
//用于判断用户是否登录了
let isLogin = false;
let mainWindow;
function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 550,
    webPreferences: {
      nodeIntegration: true, // 启用 Node.js 集成
      // contextIsolation: true, // 启用上下文隔离
      contextIsolation: false,
      preload: path.join(__dirname, "preload.js"),
      cache: false,
    },
    icon: path.join(__dirname, "public/src/img/logo4.png"), // 设置运行时窗口图标
    frame: false, // 取消默认标题栏
  });
  mainWindow.loadFile(url);
  return mainWindow;
}
ipcMain.on("login-success", () => {
  if (mainWindow && isLogin) {
    mainWindow.loadFile("index.html");
  }
});

app.whenReady().then(() => {
  // 首次启动时加载登录页面窗口
  createWindow("public/html/login.html");
});

ipcMain.on("minimize-window", (event) => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    focusedWindow.minimize();
  }
});

ipcMain.on("maximize-window", (event) => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    if (focusedWindow.isMaximized()) {
      focusedWindow.unmaximize();
    } else {
      focusedWindow.maximize();
    }
  }
});

ipcMain.on("close-window", (event) => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    focusedWindow.close();
  }
});

// 当所有窗口都被关闭时执行
app.on("window-all-closed", function () {
  // 如果不是 macOS 系统，则退出应用
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// 定义 sanitize 函数
function sanitize(input) {
  return input.replace(/[\\/*?:"<>|]/g, "");
}

// 处理文件保存事件
ipcMain.handle("save-file", async (event, file, folder) => {
  if (!file || typeof file !== "object" || Object.keys(file).length === 0) {
    console.error("接收到的文件对象无效:", file);
    return { err: "文件对象无效", code: 0 };
  }
  if (!folder) {
    console.error("接收到的文件夹参数无效:", folder);
    return { err: "文件夹参数无效", code: 0 };
  }
  if (!file.name) {
    console.error("接收到的文件对象缺少 name 属性:", file);
    return { err: "文件对象缺少 name 属性", code: 0 };
  }

  const saveDir = path.join(__dirname, folder);
  try {
    // 使用 promises 版本的 fs 来创建目录
    await fsPromise.mkdir(saveDir, { recursive: true });
    const filePath = path.join(saveDir, file.name);
    // 使用 promises 版本的 fs 来写入文件
    await fsPromise.writeFile(filePath, file.data);
    return { msg: "文件保存成功", code: 1, filePath };
  } catch (err) {
    console.error("文件保存失败:", err);
    return { err: `文件保存失败: ${err.message}`, code: 0 };
  }
});

// 处理获取 baseDir 事件
ipcMain.handle("get-base-dir", (event) => {
  return __dirname;
});

// 读取目录方法
function readDir(dirPath) {
  return new Promise((resolve, reject) => {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

ipcMain.handle("readDir", (event, dirPath) => {
  return readDir(dirPath);
});

ipcMain.handle("repair-focus", async () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return false;

  try {
    // 方法1: 通过webContents修复
    win.webContents.focus();

    // 方法2: 窗口级修复
    win.blur();
    win.focus();

    // 方法3: 系统级修复 (Windows)
    if (process.platform === "win32") {
      const { SetFocus } = require("win32-api").user32;
      const hwnd = win.getNativeWindowHandle();
      SetFocus(hwnd);
    }

    return true;
  } catch (error) {
    console.error("修复焦点失败:", error);
    return false;
  }
});

ipcMain.handle("force-focus-input", async () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    // 强制激活窗口
    win.setAlwaysOnTop(true);
    win.focus();
    win.setAlwaysOnTop(false);

    // 发送模拟按键事件
    win.webContents.sendInputEvent({
      type: "keyDown",
      keyCode: "Tab",
    });
    win.webContents.sendInputEvent({
      type: "keyUp",
      keyCode: "Tab",
    });

    return true;
  }
  return false;
});

// 处理数据库操作
ipcMain.handle("insert-user", async (event, user) => {
  try {
    const res = await insertUser(user);
    if (res.code == 1) {
      return { msg: "用户数据添加成功！", code: 1 };
    } else {
      return { err: "用户数据添加失败！", code: 0 };
    }
  } catch (error) {
    console.error("插入用户出错:", error);
    return false;
  }
});

//处理登录事件
ipcMain.handle("login", async (e, username, password) => {
  if (!username || !password) {
    return { err: "缺少必传的参数", code: 0 };
  }
  try {
    const res = await getUserInfo(username);
    if (!res) {
      return { err: "用户不存在！", status: 401, code: 0 };
    } else if (res.password === password) {
      isLogin = true;
      return { msg: "身份验证成功！", status: 200, code: 1 };
    } else {
      return { err: "密码错误！", status: 402, code: 0 };
    }
  } catch (error) {
    console.log(error);
  }
});
ipcMain.handle("getUserInfo", async (event, username) => {
  try {
    const user = await getUserInfo(username);
    // 返回用户的密码password信息
    if (user) {
      return user;
    } else {
      return null;
    }
  } catch (error) {
    console.error("插入用户出错:", error);
    return false;
  }
});

//更新用户信息模块
ipcMain.handle("updateUserInfo", async (event, user) => {
  try {
    await updateUserInfo(user);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
});

//删除指定用户模块
ipcMain.handle("deleteUser", async (event, username) => {
  try {
    await deleteUser(username);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
});

//处理用户留言模块
//查询某一用户的所有留言信息
ipcMain.handle("selectUserMsgAll", (evet, username) => {
  try {
    const msgs = selectUserMsgAll(username);
    if (msgs.length != 0) {
      return msgs;
    } else {
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
});

//新增留言
ipcMain.handle("leaveMsg", async (event, username, leaveFor, msgCon) => {
  console.log(username, leaveFor, msgCon);
  if (!username || !leaveFor || !msgCon) {
    return { err: "缺少必传的参数！", code: 0 };
  }
  try {
    const res = await leaveMsg(username, leaveFor, msgCon);
    if (res.code == 1) {
      return { msg: "留言成功！", code: 1 };
    } else {
      return { err: "留言失败！", code: 0 };
    }
  } catch (error) {
    console.log(error);
    return null;
  }
});
//评论事件
ipcMain.handle(
  "replay",
  async (event, username, replayFor, replayCon, msgId) => {
    try {
      const res = await replay(username, replayFor, replayCon, msgId);
      return res;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
);
//获取留言信息
ipcMain.handle("getReplies", async (event, msgId, username) => {
  try {
    const res = await getReplies(msgId, username);
    return res;
  } catch (error) {
    console.log(error);
    return null;
  }
});

//获取社区动态数据
ipcMain.handle("getDynamics", async (evet) => {
  try {
    const res = await getDynamics();
    if (res.code === 0) {
      return { err: "没有获取到动态数据！", code: 0 };
    } else {
      return { msg: "动态数据获取成功！", code: 1, data: res.data };
    }
    return res;
  } catch (err) {
    console.log(err);
    return err;
  }
});

//发布社区动态
ipcMain.handle("publicDynamic", async (e, username, dynamicCon) => {
  try {
    const result = await publicDynamic(username, dynamicCon);
    if (result.code == 1) {
      return { msg: "发布成功!", code: 1, result };
    } else {
      return { err: "发布失败！", code: 0, result };
    }
  } catch (err) {
    console.log(err);
  }
});

//获取指定用户名的动态数据
ipcMain.handle("getDynamicByUserName", async (e, username) => {
  if (!username) {
    return { err: "缺少必传的参数！", code: 0 };
  }
  try {
    const res = await getDynamicByUserName(username);
    if (res.code == 1) {
      return { msg: "动态信息获取成功", code: 1, data: res.data };
    } else {
      return { err: "动态信息获取失败", code: 0 };
    }
  } catch (err) {
    return { err };
  }
});

//新建相册
ipcMain.handle("insertAlbum", async (event, username, albumName, albumPath) => {
  if (!username || !albumName) {
    return { err: "缺少必传的参数", code: 0 };
  }
  try {
    const res = await insertAlbum(username, albumName, albumPath);
    if (res.code == 1) {
      return { msg: "相册创建成功！", code: 1, res };
    } else {
      return { msg: "相册常见失败！", code: 0, res };
    }
  } catch (err) {
    return err;
  }
});

//向相册中添加图片
ipcMain.handle(
  "insertPhotoToAlbum",
  async (event, username, albunName, photoName) => {
    if (!username || !albunName || !photoName) {
      return { err: "缺少必传的参数", code: 0 };
    }
    try {
      const res = await insertPhotoToAlbum(username, albunName, photoName);
      if (res.code == 1) {
        return { msg: "图片插入成功！", code: 1 };
      } else {
        return { err: "图片插入失败！", code: 0, res };
      }
    } catch (err) {
      return err;
    }
  }
);

/**
 * 获取相册
 * param: username(必传)，albumId(可选)(以object形式传递)
 */
ipcMain.handle("getAlbums", async (event, options) => {
  if (!options.username) {
    return { err: "username获取失败！", code: 0 };
  }
  try {
    const res = await getAlbums(options);
    if (res.code == 1) {
      return res;
    } else {
      return { err: "用户相册信息获取失败！", code: 0, res };
    }
  } catch (err) {
    return err;
  }
});

// 获取用户相册列表
ipcMain.handle("get-user-albums", async (e, username) => {
  const basePath = path.join(__dirname, "public", "src", "album", username);
  try {
    const dirs = await fs.readdir(basePath, { withFileTypes: true });
    return Promise.all(
      dirs
        .filter((d) => d.isDirectory())
        .map(async (d) => {
          const photos = await fs.readdir(path.join(basePath, d.name));
          return { name: d.name, count: photos.length };
        })
    );
  } catch {
    return [];
  }
});

// 创建相册
ipcMain.handle("create-album", async (e, { username, albumName }) => {
  if (!username || !albumName) {
    console.error("用户名或相册名不能为空");
    return;
  }
  const albumPath = path.join(
    __dirname,
    "public",
    "src",
    "album",
    username,
    sanitize(albumName)
  );
  try {
    await fsPromise.mkdir(albumPath, { recursive: true });
    return {
      msg: "相册创建成功:",
      code: 1,
      albumPath: "/public/src/album/" + username + "/" + albumName,
    };
  } catch (error) {
    return { err: "创建相册时出错:", error, code: 0 };
  }
});

// 删除相册
ipcMain.handle("delete-album", async (e, { username, albumName }) => {
  if (!username || !albumName) {
    console.error("用户名或相册名不能为空");
    return;
  }
  const albumPath = path.join(
    __dirname,
    "public",
    "src",
    "album",
    username,
    sanitize(albumName)
  );
  try {
    const res = await deleteAlbum(username, albumName);
    if (res.code == 1) {
      await fsPromise.rm(albumPath, { recursive: true });
      return { msg: "相册删除成功:", code: 1, albumPath };
    } else {
      return { err: "删除失败1", code: 0 };
    }
  } catch (error) {
    return { err: "删除相册时出错:", code: 0, error };
  }
});

// 获取某个目录下的所有图片文件
ipcMain.handle("getAlbumAllPhotos", async (e, albumPath) => {
  if (!albumPath) {
    return { err: "未获取到相册路径" };
  }
  try {
    const filePath = path.join(__dirname, albumPath);
    // 读取指定目录下的所有文件和文件夹
    const files = await fsPromise.readdir(filePath);
    // 过滤出所有图片文件
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif"];
    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });
    // 返回图片文件的完整路径列表
    const imagePaths = imageFiles.map((file) => path.join(albumPath, file));
    return { msg: "获取图片文件成功", code: 1, data: imagePaths };
  } catch (err) {
    console.log(err);
    return { err: "获取图片文件时出错", code: 0 };
  }
});
//删除指定的图片文件
//albunName(String): 相册名称, fileName(String),要删除的图片文件名
ipcMain.handle(
  "delete-photo",
  async (e, { username, albumName, photoName }) => {
    if (!username || !albumName || !photoName) {
      return { err: "缺少必传的参数!", code: 0 };
    }
    try {
      const filePath = path.join(
        __dirname,
        "public",
        "src",
        "album",
        username,
        albumName,
        photoName
      );
      const res = await deletePhoto(username, albumName, photoName);
      if (res.code == 1) {
        await fsPromise.rm(filePath, { recursive: true });
        return { msg: "删除成功！", code: 1 };
      } else {
        return { err: "删除失败！", code: 0, res };
      }
    } catch (err) {
      console.log(err);
    }
  }
);

// 定义 getFileInfo 函数
ipcMain.handle("get-file-info", async (event, Path) => {
  try {
    const filePath = path.join(__dirname, Path);
    const data = await fsPromise.readFile(filePath);
    const blob = new Blob([data], { type: "image/*" });
    const url = URL.createObjectURL(blob);
    const fileName = path.basename(filePath);
    return {
      url: url,
      name: fileName,
      path: filePath,
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error("文件不存在:", filePath);
    } else {
      console.error("转换文件路径为 URL 失败:", error);
    }
    return null;
  }
});

/**
 * 用户关注模块
 */
ipcMain.handle("insertConcern", async (e, username, concernId) => {
  if (!username || !concernId) {
    return { err: "缺少必传的参数！", code: 0 };
  }
  try {
    const res = await insertConcern(username, concernId);
    if (res.code == 1) {
      return { msg: "关注成功！", code: 1 };
    } else {
      return { err: "关注失败！", code: 0 };
    }
  } catch (err) {
    return { err };
  }
});
ipcMain.handle("deleteConcern", async (e, username, concernId) => {
  if (!username || !concernId) {
    return { err: "缺少必传的参数！", code: 0 };
  }
  try {
    const res = await deleteConcern(username, concernId);
    if (res.code == 1) {
      return { msg: "取消关注成功！", code: 1 };
    } else {
      return { err: "取消关注失败！", code: 0 };
    }
  } catch (err) {
    return { err };
  }
});
ipcMain.handle("getConcern", async (e, username, concernId) => {
  if (!username || !concernId) {
    return { err: "缺少必传的参数！", code: 0 };
  }
  try {
    const res = await getConcern(username, concernId);
    if (res.code == 1) {
      return { msg: "获取关注信息成功！", code: 1, data: res };
    } else {
      return { err: "获取关注信息失败", code: 0 };
    }
  } catch (err) {
    return { err, code: 0 };
  }
});

ipcMain.handle("getConcernAll", async (e, username) => {
  if (!username) {
    return { err: "缺少必传的参数！", code: 0 };
  }
  try {
    const res = await getConcernAll(username);
    if (res.code == 1) {
      return { msg: "获取关注信息成功！", code: 1, data: res };
    } else {
      return { err: "获取关注信息失败", code: 0 };
    }
  } catch (err) {
    return { err, code: 0 };
  }
});

//点赞事件
ipcMain.handle("insert-likes", async (e, username, like_id) => {
  if (!username || !like_id) {
    return { err: "缺少必传的参数！", code: 0 };
  }
  try {
    const res = await likes(username, like_id);
    if (res.code === 1) {
      return { msg: "点赞记录添加成功！", code: 1 };
    } else {
      return { err: "点赞记录添加失败！", code: 0 };
    }
  } catch (error) {
    console.log(error);
  }
});

ipcMain.handle("delete-likes", async (e, username, like_id) => {
  if (!username || !like_id) {
    return { err: "缺少必传的参数！", code: 0 };
  }
  try {
    const res = await disLikes(username, like_id);
    if (res.code === 1) {
      return { msg: "点赞记录删除成功！", code: 1 };
    } else {
      return { err: "点赞记录删除失败！", code: 0 };
    }
  } catch (error) {
    console.log(error);
  }
});

ipcMain.handle("isLiked", async (e, username, like_id) => {
  if (!username || !like_id) {
    return { err: "缺少必传的参数！", code: 0 };
  }
  try {
    const res = await isliked(username, like_id);
    if (res.code === 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
  }
});

ipcMain.handle(
  "insert-comments",
  async (e, username, commentId, commentCom) => {
    if (!username || !commentId || !commentCom) {
      return { err: "缺少必传的参数！", code: 0 };
    }
    try {
      const res = await insertComments(username, commentId, commentCom);
      if (res.code === 1) {
        return { msg: "评论成功！", code: 1 };
      } else {
        return { err: "评论失败！", code: 0 };
      }
    } catch (err) {
      console.log(err);
    }
  }
);

ipcMain.handle("getComments", async (e, commentId) => {
  if (!commentId) {
    return { err: "缺少必传的参数！", code: 0 };
  }
  try {
    const res = await getComments(commentId);
    if (res.code === 1) {
      return { msg: "评论数据获取成功！", code: 1, data: res.data };
    } else {
      return { err: "评论数据获取失败！", code: 0 };
    }
  } catch (err) {
    console.log(err);
  }
});
