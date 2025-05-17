/**
 * 相册模块
 */

//导入自定义相册组件
import { CustomAlbum } from "../components/my-album.js";
//注册自定义相册组件
customElements.define("el-album", CustomAlbum);

const nav = document.querySelector("nav");
const mainContent = document.getElementById("mainContent");
const figure = document.querySelector("figure");
const figureClose = figure.querySelector(".close");
const form = figure.querySelector("form");
const inp = form.querySelector("input");
const section = document.querySelector("section");
const parentWindow = parent.window;

//获取url中的username
const url = new URL(window.location.href);
const params = new URLSearchParams(url.search);
const username = params.get("username");
parentWindow.electronAPI.getUserInfo(username).then((user) => {
  if (username === window.sessionStorage.getItem("username")) {
    nav.innerHTML = `
      <img src="${user.avatar}" alt="">
      <div>
          <h1>${user.nickname}的相册</h1> 
          <p></p>
          <button id="createAlbumBtn">新建</button>
          <button id="deleteAlbumBtn">编辑</button>
          <button id="recycleBinBtn">回收站</button>
      </div>
  `;
  } else {
    nav.innerHTML = `
      <img src="${user.avatar}" alt="">
      <div>
          <h1>${user.nickname}的相册</h1> 
          <p></p>
      </div>
  `;
  }
  section.querySelector("span").innerHTML = `
          <a href="#" data-target="albums">相册<sup>${user.albums}</sup></a>
          <a href="#" data-target="images">图片<sup>${user.photos}</sup></a>
          <a href="#" data-target="comments">评论<sup>25</sup></a>
  `;
  const createAlbumBtn = document.getElementById("createAlbumBtn");
  const deleteAlbumBtn = document.getElementById("deleteAlbumBtn");
  if (createAlbumBtn) {
    createAlbumBtn.addEventListener("click", () => {
      figure.style.display = "block";
    });
  }
  if (deleteAlbumBtn) {
    deleteAlbumBtn.addEventListener("click", deleteAlbum);
  }
});

loadAlbums();

//加载当前登录用户的所有相册数据
function loadAlbums() {
  mainContent.innerHTML = "";
  // const username = window.sessionStorage.getItem('username')
  parentWindow.electronAPI.getAlbums({ username }).then((res) => {
    if (res.code == 0) {
      //说明该用户还没有自己的相册信息
      mainContent.innerHTML = `
        <!-- <img src="../src/img/千反田.jpg" alt="">
            <p>空空如也</p> -->
      `;
    } else {
      //有自己的相册信息，加载对应的相册信息
      res.res.forEach((item) => {
        const elAlbum = document.createElement("el-album");
        elAlbum.setAttribute("src", item.albumPath);
        elAlbum.dataset.albumId = item.albumId;
        elAlbum.title = item.albumName;

        // 在自定义组件外部包裹容器
        const albumContainer = document.createElement("div");
        albumContainer.style.position = "relative";

        // 添加复选框到容器而不是组件内部
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.style.position = "absolute";
        checkbox.style.top = "10px";
        checkbox.style.left = "10px";
        checkbox.style.zIndex = "10";
        checkbox.style.display = "none";
        checkbox.classList.add("album-checkbox");
        checkbox.dataset.albumName = item.albumName;

        albumContainer.appendChild(checkbox);
        albumContainer.appendChild(elAlbum);
        mainContent.appendChild(albumContainer);
      });
    }
  });
}

figureClose.addEventListener("click", () => {
  figure.style.display = "none";
});
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  //获取用户输入的内容
  const albumName = inp.value;
  if (!albumName) {
    return alert("请输入相册名");
  }
  //创建一个文件目录
  const username = window.sessionStorage.getItem("username");
  const res = await parentWindow.electronAPI.createAlbum({
    username,
    albumName,
  });
  if (res.code == 1) {
    //数据库中存储对应的相册对应关系信息
    const result = await parentWindow.electronAPI.insertAlbum(
      username,
      albumName,
      res.albumPath
    );
    if (result.code == 1) {
      //重新渲染页面
      loadAlbums();
      //清空表单内容
      // $(form).find('input[text]').val('')
      return alert("相册创建成功！");
    } else {
      return alert("相册创建失败！");
    }
  } else {
    return alert("相册创建失败！");
  }
});

//删除相册功能
async function deleteAlbum(e) {
  //获取当前页面下的所有el-album标签
  if (deleteAlbumBtn.innerHTML == "编辑") {
    deleteAlbumBtn.innerHTML = "删除";
    const checkboxs = [...document.querySelectorAll(".album-checkbox")];
    checkboxs.forEach((item) => {
      item.style.display = "block";
    });
  } else {
    const deleteAlbumNames = [];
    const checkboxs = [...document.querySelectorAll(".album-checkbox")];
    checkboxs.forEach((item) => {
      if (item.checked) {
        deleteAlbumNames.push(item.dataset.albumName);
      }
    });
    if (deleteAlbumNames.length == 0) {
      return alert("请选择要删除的相册！");
    }
    if (!confirm("您确定要删除所选相册吗？")) return;
    //获取当前登录的用户名
    const username = window.sessionStorage.getItem("username");
    const requests = deleteAlbumNames.map(async (item) => {
      //发送删除相册请求
      return new Promise((resolve, reject) => {
        try {
          const res = parentWindow.electronAPI.deleteAlbum({
            username,
            albumName: item,
          });
          resolve({
            res,
          });
        } catch (err) {
          console.log(err);
        }
      });
    });
    Promise.all(requests).then(() => {
      //重新获取所有的checkbox
      document.querySelectorAll(".album-checkbox").forEach((item) => {
        item.style.display = "none";
      });
      deleteAlbumBtn.innerHTML = "编辑";
      loadAlbums();
    });
  }
}
