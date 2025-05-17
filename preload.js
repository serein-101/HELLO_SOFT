const { contextBridge, ipcRenderer } = require("electron");
const path = require("path");
// 引入 fs 模块
const fs = require("fs");
const { insertPhotoToAlbum } = require("./database/database");
// 直接将 electronAPI 挂载到 window 对象上
window.electronAPI = {
  repairFocus: () => ipcRenderer.invoke("repair-focus"),
  forceFocusInput: () => ipcRenderer.invoke("force-focus-input"),
  saveFile: (file, folder) => ipcRenderer.invoke("save-file", file, folder),
  pathJoin: (...args) => path.join(...args),
  getBaseDir: () => ipcRenderer.invoke("get-base-dir"),
  executePythonScript: (command) =>
    ipcRenderer.invoke("execute-python-script", command),
  on: (channel, callback) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },
  accessSync: (path, mode) => fs.accessSync(path, mode),
  fsConstants: fs.constants,
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  login: (username, password) =>
    ipcRenderer.invoke("login", username, password),
  insertUser: (user) => ipcRenderer.invoke("insert-user", user),
  getUserInfo: (username) => ipcRenderer.invoke("getUserInfo", username),
  updateUserInfo: (user) => ipcRenderer.invoke("updateUserInfo", user),
  deleteUser: (username) => ipcRenderer.invoke("deleteUser", username),

  //处理留言模块
  selectUserMsgAll: (username) =>
    ipcRenderer.invoke("selectUserMsgAll", username),
  leaveMsg: (username, leaveFor, msgCon) =>
    ipcRenderer.invoke("leaveMsg", username, leaveFor, msgCon),
  replay: (username, replayFor, replayCon, msgId) =>
    ipcRenderer.invoke("replay", username, replayFor, replayCon, msgId),
  getReplies: (msgId, username) =>
    ipcRenderer.invoke("getReplies", msgId, username),

  //处理社区动态模块
  getDynamics: () => ipcRenderer.invoke("getDynamics"),
  publicDynamic: (username, dynamicCon) =>
    ipcRenderer.invoke("publicDynamic", username, dynamicCon),

  //相册模块(针对数据库模块)
  insertAlbum: (username, albumName, albumPath) =>
    ipcRenderer.invoke("insertAlbum", username, albumName, albumPath),
  insertPhotoToAlbum: (username, albumName, photoName) =>
    ipcRenderer.invoke("insertPhotoToAlbum", username, albumName, photoName),
  getAlbums: (options = {}) => ipcRenderer.invoke("getAlbums", options),

  //针对文件存储模块
  getAlbumsByUserName: (username) =>
    ipcRenderer.invoke("get-user-albums", username),
  createAlbum: ({ username, albumName }) =>
    ipcRenderer.invoke("create-album", { username, albumName }),
  deleteAlbum: ({ username, albumName }) =>
    ipcRenderer.invoke("delete-album", { username, albumName }),
  deletePhoto: ({ username, albumName, photoName }) =>
    ipcRenderer.invoke("delete-photo", { username, albumName, photoName }),

  //获取某个文件下的所有图片文件
  getAlbumAllPhotos: (albumPath) =>
    ipcRenderer.invoke("getAlbumAllPhotos", albumPath),
  getFileInfo: (filePath) => ipcRenderer.invoke("get-file-info", filePath),
  //关注模块
  insertConcern: (username, concernId) =>
    ipcRenderer.invoke("insertConcern", username, concernId),
  deleteConcern: (username, concernId) =>
    ipcRenderer.invoke("deleteConcern", username, concernId),
  getConcern: (username, concernId) =>
    ipcRenderer.invoke("getConcern", username, concernId),
  getConcernAll: (username) => ipcRenderer.invoke("getConcernAll", username),
  getDynamicByUserName: (username) =>
    ipcRenderer.invoke("getDynamicByUserName", username),
  likes: (username, like_id) =>
    ipcRenderer.invoke("insert-likes", username, like_id),
  disLikes: (username, like_id) =>
    ipcRenderer.invoke("delete-likes", username, like_id),
  isLiked: (username, like_id) =>
    ipcRenderer.invoke("isLiked", username, like_id),

  //评论模块
  insertComments: (username, commentId, commentCon) =>
    ipcRenderer.invoke("insert-comments", username, commentId, commentCon),
  getComments: (commentId) => ipcRenderer.invoke("getComments", commentId),
};
