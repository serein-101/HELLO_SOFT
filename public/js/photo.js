// 获取上传视频按钮
const uploadVideoBtn = document.querySelector('#uploadVideo');
const convertedVideoBtn = document.getElementById('convertedVideo');

// 获取上传的文件
const inputFile = document.querySelector('.video-file');
const uploadVideoContainer = document.querySelector('.uploaded-video');

let baseDir; // 用于获取当前项目目录

// 监听文档加载完成事件
document.addEventListener('DOMContentLoaded', async () => {
    // 获取当前所在目录
    try {
        if (window.electronAPI) {
            baseDir = await window.electronAPI.getBaseDir();
        } else {
            console.error('window.electronAPI 未定义');
        }
    } catch (error) {
        console.error('获取 baseDir 失败：', error);
        return;
    }
});

// 视频显示函数
const displayVideo = (src, container) => {
    const video = document.createElement('video');
    video.src = src;
    video.style.maxHeight = '100%';
    video.style.maxWidth = '100%';
    video.onload = () => URL.revokeObjectURL(src);
    video.onerror = () => {
        console.error('视频加载失败');
        URL.revokeObjectURL(src);
    };
    if (container.firstChild && container.firstChild.tagName === 'VIDEO') {
        container.firstChild.src = video.src;
    } else {
        container.innerHTML = '';
        container.appendChild(video);
    }
};

// 视频上传
uploadVideoBtn.addEventListener('click', async () => {
    const file = inputFile.files[0];
    if (!file || !file.name) {
        alert('视频上传失败！');
        return;
    }
    try {
        const fileData = new Uint8Array(await file.arrayBuffer());
        if (window.electronAPI) {
            const savePath = `${baseDir}/AnimeGANv3-master/tools/input/${file.name}`;
            await window.electronAPI.saveFile({ path: savePath, name: file.name, data: fileData });
            const objectURL = URL.createObjectURL(file);
            displayVideo(objectURL, uploadVideoContainer);
        } else {
            console.error('window.electronAPI 未定义');
            alert('视频上传失败');
        }
    } catch (error) {
        console.error('视频上传失败：', error);
        alert('视频上传失败');
    }
});