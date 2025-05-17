// user.js
import { renderUserInfo, renderOtherUser } from './utils.js';

// 获取 URL 参数
const urlParams = new URLSearchParams(window.location.search);
// 从 URL 参数中获取 username
const username = urlParams.get('username');
//因为electronAPI是挂载到父级的window上的，所以我们要获取父级的window
//获取父级window
const parentWindow = window.parent
window.addEventListener('DOMContentLoaded', async () => {
    if (!parentWindow.electronAPI) {
        console.error('electronAPI is not defined');
        return;
    }

    try {
        const user = await parentWindow.electronAPI.getUserInfo(username);
        //如果当前模块显示的用户信息和localstorage中的username不一致，
        //说明此时用户是在浏览别人主页，则此时用户拥有关注该用户的功能
        const localUserName = window.sessionStorage.getItem('username')
        if(localUserName == user.username){
            renderUserInfo(user);
        }else{
            const res = await parentWindow.electronAPI.getConcern(localUserName, username)
            if(res.data.data.length >= 1){
                //已关注
                renderOtherUser(user, 1)
            }else{
                //未关注
                renderOtherUser(user, 0)
            }
        }
        const addConcernBtn = document.querySelector('.addConcern')
        if(addConcernBtn){
            addConcernBtn.addEventListener('click', async (e) => {
                //在关注之前，判断该用户是否已经关注
                const isConcern = await parentWindow.electronAPI.getConcern(localUserName, username)
                if (isConcern.data.data.length >= 1) {
                    //说明已经关注此人
                    const res = await parent.window.electronAPI.deleteConcern(localUserName, username)
                    e.target.innerHTML = '关注'
                    return {msg: '取消关注成功！', code: 1, res}
                } else {
                    const res = await parent.window.electronAPI.insertConcern(localUserName, username)
                    if (res.code == 1) {
                        e.target.innerHTML = '取消关注'
                        return { msg: '关注成功！', code: 1 }
                    } else {
                        alert('关注失败！')
                        return { msg: '关注失败！', code: 0, res }
                    }
                }

            })
        }
    } catch (error) {
        console.error('Error getting user info:', error);
    }
});