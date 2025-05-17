const Form = document.querySelector("form");
const avatarPreview = document.querySelector(".avatar img");

const avatarEle = document.querySelector("#avatar");
const nicknameEle = document.querySelector("#nickname");
const genderEle = document.querySelector('input[type="radio"]:checked');
const birthdayEle = document.querySelector("#birthday");
const introduceEle = document.querySelector("#introduce");
const signatureELe = document.querySelector("#signature");
const regionEle = document.querySelector("#region");
// 获取父级 window
const parentWindow = window.parent;
const username = window.sessionStorage.getItem("username");
let baseDir;
// 监听文档加载完成事件
document.addEventListener("DOMContentLoaded", async () => {
  // 获取当前所在目录
  try {
    if (parentWindow.electronAPI) {
      baseDir = await parentWindow.electronAPI.getBaseDir();
      baseDir = baseDir.replace(/\\/g, "/");

      const user = await parentWindow.electronAPI.getUserInfo(username);
      avatarPreview.src = user.avatar;
      nicknameEle.value = user.nickname;
      birthdayEle.value = user.birthday;
      introduceEle.value = user.introduce;
      signatureELe.value = user.signature;
      regionEle.value = user.region;
    } else {
      console.error("window.electronAPI 未定义");
    }
  } catch (error) {
    console.error("获取 baseDir 失败：", error);
    return;
  }
});
// 验证输入信息是否为空
function validateInput(input) {
  return input.trim() !== "";
}

// 更新用户信息
function updateUserInfo(user, formData) {
  for (const key in formData) {
    if (validateInput(formData[key])) {
      user[key] = formData[key];
    }
  }
  return user;
}

Form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // 获取修改的内容
  const formData = {
    avatar: avatarEle.value,
    nickname: nicknameEle.value,
    gender: genderEle.value,
    birthday: birthdayEle.value,
    introduce: introduceEle.value,
    signature: signatureELe.value,
    region: regionEle.value,
  };
  if (formData.avatar) {
    //如果用户上传了新头像，则将头像保存到项目指定文件夹下，同时把新的头像路径给avatar
    const file = avatarEle.files[0];
    if (!file || !file.name) {
      return alert("头像上传失败！！！");
    }
    //保存头像
    try {
      const fileData = new Uint8Array(await file.arrayBuffer());
      if (parentWindow.electronAPI) {
        const savePath = `${baseDir}/public/src/img/${file.name}`;
        await window.parent.electronAPI.saveFile(
          { path: file.path, name: file.name, data: fileData },
          "public/src/img"
        );
        const avatarUrl = `../src/img/${file.name}`;
        formData.avatar = avatarUrl;
      }
    } catch (err) {
      alert(err);
    }
  }
  if (!parentWindow.electronAPI) {
    console.error("electronAPI is not defined");
    return;
  }

  try {
    const user = await parentWindow.electronAPI.getUserInfo(username);

    const updatedUser = updateUserInfo(user, formData);

    await parentWindow.electronAPI.updateUserInfo(updatedUser);
    const page = parentWindow.document.querySelector("iframe");
    page.src = "public/html/user.html?username=" + username;
  } catch (error) {
    console.error("更新用户信息出错:", error);
    const errorMessage = document.createElement("p");
    errorMessage.textContent = "更新用户信息出错，请稍后再试。";
    errorMessage.style.color = "red";
    Form.appendChild(errorMessage);
  }
});

// 监听头像文件选择变化
avatarEle.addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      avatarPreview.src = e.target.result;
      //   avatarPreview.style.display = "block";
    };
    reader.readAsDataURL(file);
  }
});
