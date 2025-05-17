const uploadButton = document.getElementById("upload");
const exchangeButton = document.getElementById("exchange");
const inputPhotoFile = document.getElementById("photo-file");
const uploadImageContainer = document.getElementById("uploaded-image");
const convertedImageContainer = document.getElementById("converted-image");
const progressBar = document.getElementById("progress-bar");
const progressElement = document.getElementById("progress");
const processingElement = document.getElementById("processing");

const inputVideoFile = document.getElementById("video-file");
const uploadVideoContainer = document.getElementById("uploaded-video");
const uploadVideoBtn = document.getElementById("uploadVideo");
const convertedVideoBtn = document.getElementById("convertedVideo");
const convertedVideoContainer = document.getElementById("converted-video");

const fpsPicker = document.getElementById("selectFPS");

const ul = document.querySelector("ul");

let type = "hayao";

let uploadedVideoPath;

// const serverUrl = "http://47.104.222.92:3001"; // 服务器地址
// const socket = new WebSocket("ws://47.104.222.92:3001");

const serverUrl = "http://8.130.151.193:3001"; // 服务器地址
const socket = new WebSocket("ws://8.130.151.193:3001");

ul.addEventListener("click", (e) => {
  ul.querySelectorAll("input").forEach((item) => {
    item.checked = false;
  });
  e.target.checked = true;
  type = e.target.id;
});

fpsPicker.addEventListener("click", (e) => {
  if (e.target.tagName === "INPUT") {
    fpsPicker.querySelectorAll("input").forEach((item) => {
      item.checked = false;
    });
    e.target.checked = true;
  }
  if (e.target.tagName === "P") {
    fpsPicker.querySelectorAll("input").forEach((item) => {
      item.checked = false;
    });
    e.target.firstChild.checked = true;
  }
});

socket.onopen = (event) => {
  console.log("ws已连接");
};

socket.onmessage = (event) => {
  const data = event.data;
  // console.log(data);
  if (data.includes("PROGRESS:")) {
    const targetProgress = parseFloat(data.split(":")[1]) | 0;
    progressElement.style.width = `${targetProgress}%`;
    processingElement.innerHTML = `已完成：${targetProgress}%`;
  } else if (data.includes("处理视频帧")) {
    const targetProgress = parseFloat(data.split(":")[1]) | 0;
    progressElement.style.width = `${targetProgress}%`;
    processingElement.innerHTML = `已完成：${targetProgress}%`;
  }
};

// 通用的显示图片函数
const displayImage = (src, container) => {
  const img = document.createElement("img");
  img.src = src;
  img.style.maxWidth = "270px";
  img.style.maxHeight = "270px";
  img.onload = () => URL.revokeObjectURL(src);
  img.onerror = () => {
    console.error("图片加载失败");
    URL.revokeObjectURL(src);
  };

  if (container.firstChild && container.firstChild.tagName === "IMG") {
    container.firstChild.src = img.src;
  } else {
    container.innerHTML = "";
    container.appendChild(img);
  }
};

// 处理图片上传
uploadButton.addEventListener("click", async () => {
  const file = inputPhotoFile.files[0];
  if (!file) {
    alert("请选择图片文件");
    return;
  }
  try {
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch(`${serverUrl}/upload/image`, {
      method: "POST",
      body: formData,
    });
    if (response.ok) {
      const objectURL = URL.createObjectURL(file);
      displayImage(objectURL, uploadImageContainer);
    } else {
      console.error("图片上传失败:", await response.text());
      alert("图片上传失败");
    }
  } catch (error) {
    console.error("图片上传失败:", error);
    alert("图片上传失败");
  }
});

let imageUrl = "";
// 处理图片转换
exchangeButton.addEventListener("click", async () => {
  progressBar.style.display = "block";
  try {
    const response = await fetch(`${serverUrl}/process/image`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ type }),
    });
    if (response.ok) {
      const data = await response.json();
      imageUrl = data.url;

      displayImage(imageUrl, convertedImageContainer);
      if (convertedImageContainer.lastChild.tagName !== "BUTTON") {
        const downloadButton = document.createElement("button");
        downloadButton.textContent = "下载图片";
        downloadButton.addEventListener("click", () => {
          const a = document.createElement("a");
          a.href = imageUrl;
          a.download = "converted_image.jpg";
          a.click();
        });
        convertedImageContainer.appendChild(downloadButton);
      }
      processingElement.innerHTML = "";
    } else {
      console.error("图片转换失败:", await response.text());
      alert("图片转换失败");
    }
  } catch (error) {
    console.error("图片转换失败:", error);
    alert("图片转换失败");
  } finally {
    progressElement.style.width = 0;
    progressElement.innerHTML = "";
    progressBar.style.display = "none";
  }
});

// 处理视频显示部分
const displayVideo = (src, container) => {
  const video = document.createElement("video");
  video.src = src;
  video.style.maxHeight = "300px";
  video.style.maxWidth = "300px";
  video.controls = true;
  video.muted = true; // 必须静音才能自动播放
  video.setAttribute("playsinline", ""); // iOS兼容
  video.crossOrigin = "anonymous"; // 处理跨域

  let retryCount = 0;
  const MAX_RETRIES = 5;
  let isPreviewCreated = false;
  let fallbackTimeout;

  // 清除容器原有内容，显示加载状态
  container.innerHTML = "<p>加载视频中...</p>";

  // 加载成功处理函数
  const onLoaded = () => {
    if (isPreviewCreated) return;

    // 检查视频尺寸是否有效
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn("无效的视频尺寸，尝试重试...");
      scheduleRetry();
      return;
    }

    createPreview();
  };

  // 错误处理函数
  const onError = () => {
    console.error("视频加载错误:", video.error);
    container.innerHTML = `<p>视频加载错误: ${getVideoError(video)}</p>`;
    clearTimeout(fallbackTimeout);
  };

  // 创建视频预览
  const createPreview = () => {
    if (isPreviewCreated) return;
    isPreviewCreated = true;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");

      // 尝试在0.1秒处捕获帧
      video.currentTime = Math.min(0.1, video.duration || 0.1);

      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);

        // 绘制视频帧到canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 创建预览图像
        const img = document.createElement("img");
        img.src = canvas.toDataURL("image/jpeg");
        img.style.maxWidth = "100%";
        // img.style.maxHeight = "300px";
        img.style.cursor = "pointer";
        img.alt = "视频预览 - 点击播放";

        container.innerHTML = "";
        container.appendChild(img);

        // 点击预览图播放视频
        img.addEventListener("click", () => {
          container.innerHTML = "";
          container.appendChild(video);
          video.play().catch((e) => console.error("播放失败:", e));
        });
      };

      video.addEventListener("seeked", onSeeked);
    } catch (error) {
      console.error("创建预览失败:", error);
      // 如果预览创建失败，直接显示视频元素
      container.innerHTML = "";
      container.appendChild(video);
    }
  };

  // 重试机制
  const scheduleRetry = () => {
    if (isPreviewCreated || retryCount >= MAX_RETRIES) {
      if (!isPreviewCreated) {
        console.warn("无法创建预览，直接显示视频");
        container.innerHTML = "";
        container.appendChild(video);
      }
      return;
    }

    retryCount++;
    console.log(`正在重试 (${retryCount}/${MAX_RETRIES})...`);

    setTimeout(() => {
      if (!isPreviewCreated) {
        onLoaded();
      }
    }, retryCount * 500);
  };

  // 设置事件监听器
  video.addEventListener("loadedmetadata", onLoaded);
  video.addEventListener("loadeddata", onLoaded);
  video.addEventListener("canplay", onLoaded);
  video.addEventListener("error", onError);

  // 设置超时回退
  fallbackTimeout = setTimeout(() => {
    if (!isPreviewCreated) {
      console.warn("视频加载超时，直接显示视频");
      container.innerHTML = "";
      container.appendChild(video);
    }
  }, 10000);

  // 开始加载视频
  video.load();
};

// 获取视频错误信息
function getVideoError(video) {
  if (!video.error) return "未知错误";

  switch (video.error.code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return "加载被中止";
    case MediaError.MEDIA_ERR_NETWORK:
      return "网络错误";
    case MediaError.MEDIA_ERR_DECODE:
      return "解码错误";
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return "格式不支持";
    default:
      return `错误代码: ${video.error.code}`;
  }
}

// 视频上传
uploadVideoBtn.addEventListener("click", async () => {
  const file = inputVideoFile.files[0];
  if (!file) {
    alert("请选择视频文件");
    return;
  }
  try {
    uploadVideoContainer.innerHTML = "视频正在上传中...";
    const formData = new FormData();
    formData.append("video", file);
    const response = await fetch(`${serverUrl}/upload/video`, {
      method: "POST",
      body: formData,
    });
    if (response.ok) {
      const objectURL = URL.createObjectURL(file);
      displayVideo(objectURL, uploadVideoContainer);
    } else {
      console.error("视频上传失败:", await response.text());
      alert("视频上传失败");
    }
  } catch (error) {
    console.error("视频上传失败:", error);
    alert("视频上传失败");
  }
});

// 处理视频转换
convertedVideoBtn.addEventListener("click", async () => {
  progressBar.style.display = "block";
  try {
    // 获取用户选择的帧率
    const fpsCheckboxes = document.querySelector('input[name="fps"]:checked');
    let fps = fpsCheckboxes.value;
    const response = await fetch(`${serverUrl}/process/video`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ type, fps }),
    });
    if (response.ok) {
      // 获取视频Blob对象
      const videoBlob = await response.blob();
      const videoObjectURL = URL.createObjectURL(videoBlob);

      // 显示视频预览
      displayVideo(videoObjectURL, convertedVideoContainer);

      // 添加下载按钮
      const downloadButton = document.createElement("button");
      downloadButton.textContent = "下载视频";
      downloadButton.className = "download-btn"; // 添加样式类
      downloadButton.addEventListener("click", () => {
        const a = document.createElement("a");
        a.href = videoObjectURL;
        a.download = "converted_video.mp4";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // 释放对象URL内存
        setTimeout(() => {
          URL.revokeObjectURL(videoObjectURL);
        }, 100);
      });

      // 先清除容器再添加新内容
      convertedVideoContainer.innerHTML = "";
      convertedVideoContainer.appendChild(downloadButton);
    } else {
      console.error("视频转换失败:", await response.text());
      alert("视频转换失败");
    }
  } catch (error) {
    console.error("视频转换失败:", error);
    alert("视频转换失败");
  } finally {
    progressElement.style.width = 0;
    progressElement.innerHTML = "";
    progressBar.style.display = "none";
  }
});

// 将 ArrayBuffer 转换为 DataURL
function arrayBufferToDataUrl(arrayBuffer, contentType) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `data:${contentType};base64,${base64}`;
}
