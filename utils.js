/**
 * 用于全局的功能模块
 */

//存储文件函数
//inputFile为input[type="file"]的元素
//folder为存储路径
// utils.js
export const saveFileByself = async function (inputFile, folder) {
  const file = inputFile.files[0];
  if (!file || !file.name) {
    alert("请选择要上传的文件");
    return;
  }
  try {
    const fileData = new Uint8Array(await file.arrayBuffer());
    // 检查 window.electronAPI 是否存在
    if (!window.electronAPI || !window.electronAPI.saveFile) {
      throw new Error("electronAPI.saveFile 未定义");
    }
    const success = await window.electronAPI.saveFile(
      { name: file.name, data: fileData },
      folder
    );
    if (success) {
      // 保存成功后的操作
      console.log("文件保存成功");
    } else {
      throw new Error("文件保存失败");
    }
  } catch (error) {
    console.error("图片上传失败:", error);
    alert("图片上传失败，请稍后再试。");
  }
};
