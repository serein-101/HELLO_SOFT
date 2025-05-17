/**
 * 这里定义一些列对数据库的操作
 *
 */
const mysql = require("mysql2/promise");

//首先配置数据库连接模块

const con_sql_obj = {
  host: "121.40.59.61",
  user: "serein",
  password: "2825",
  database: "hello_alternate_dimension",
  multipleStatements: true,
};

//留言模块
//针对数据库中的messages表，主要是对messages表的增删改查

//查询指定用户的留言数据信息
async function selectUserMsgAll(username) {
  //传入的用户id，返回的是查询到的用户所有留言信息
  //连接数据库模块
  const connection = await mysql.createConnection(con_sql_obj);

  try {
    const selectAllMsg = `SELECT * FROM messages WHERE leaveFor = ?`;
    const [selectResult] = await connection.execute(selectAllMsg, [username]);
    // console.log(selectResult)
    return selectResult;
  } catch (error) {
    console.error(error);
    return null;
  } finally {
    await connection.end();
  }
}

// 用户向留言表中写留言模块
async function leaveMsg(username, leaveFor, msgCon) {
  //username是当前用户的id
  //leaveFor是留给谁的id
  if (!username || !leaveFor || !msgCon) {
    return { err: "缺少必传的参数！", code: 0 };
  }
  // 连接数据库模块
  const connection = await mysql.createConnection(con_sql_obj);

  try {
    // 先统计用户的留言数量
    const calcMsgNum = `SELECT COUNT(*) as count FROM messages WHERE leaveFor = ?`;
    const [rows] = await connection.execute(calcMsgNum, [username]);
    let msgNum = rows[0].count || 0;
    // const curUser = window.sessionStorage.getItem('username')
    //获取当前留言发布时间
    const time = new Date();
    const publicTime = time.getMonth() + 1 + "-" + time.getDate();
    // 生成留言 id
    const msgId = `${username}-${msgNum + 1}`;

    // 对应用户的留言表中新增留言数据
    const publicMsg =
      "INSERT INTO messages (msgId, username, msgCon, leaveFor, leaveTime) VALUES (?, ?, ?, ?, ?)";
    const [res] = await connection.execute(publicMsg, [
      msgId,
      username,
      msgCon,
      leaveFor,
      publicTime,
    ]);
    if (res.affectedRows <= 0) {
      return { err: "留言失败！", code: 0 };
    } else {
      return {
        msg: "留言成功！",
        code: 1,
      };
    }
  } catch (error) {
    console.error("留言插入出错:", error);
  } finally {
    await connection.end();
  }
}

//评论模块，该模块用主动发起评论或者回复评论
async function replay(username, replayFor, replayCon, msgId) {
  //默认传过来的数据不为空
  //默认username在数据库中是存在的
  //传递过来的username是当前用户的id
  //replayFor是回复谁
  //连接数据库
  const connection = await mysql.createConnection(con_sql_obj);
  try {
    // 先检查传入的参数是否为 undefined
    if (
      replayFor === undefined ||
      username === undefined ||
      replayCon === undefined ||
      msgId === undefined
    ) {
      throw new Error("传入的参数不能为 undefined");
    }
    // 先统计当前回复的数量
    const calcComNum = `SELECT COUNT(*) as count FROM replays WHERE username = ? AND replayFor = ?`;
    const [rows] = await connection.execute(calcComNum, [username, replayFor]);
    const commentNum = rows[0].count || 0;

    const insertComments =
      "INSERT INTO replays (replayId, username, replayCon, replayTime, replayFor, msgId) VALUES (?, ?, ?, ?, ?, ?)";
    // 获取当前评论时间
    let time = new Date();
    const replayTime = time.getMonth() + 1 + "-" + time.getDate();
    // 生成评论 id
    const replayId = username + "-" + msgId + "-" + (commentNum + 1);
    const [res] = await connection.execute(insertComments, [
      replayId,
      username,
      replayCon,
      replayTime,
      replayFor,
      msgId,
    ]);
    // console.log(res);
    return res;
  } catch (error) {
    console.log(error);
  } finally {
    await connection.end();
  }
}

/**
 * 查询单条留言的所有回复
 * @param {*} username是当前用户的id
 * @param {*} msgId是那一条留言信息
 * @returns Array
 */
async function getReplies(msgId, username) {
  const connection = await mysql.createConnection(con_sql_obj);
  try {
    const selectReplies = `SELECT * FROM replays WHERE username = ? AND msgId = ?`;
    const [replies] = await connection.execute(selectReplies, [
      username,
      msgId,
    ]);
    return replies;
  } catch (error) {
    console.error(error);
    return null;
  } finally {
    await connection.end();
  }
}
/**
 * 发布社区动态
 * @returns 发布的结果信息(promise对象)
 * param: dynamicCon, username
 */
async function publicDynamic(username, dynamicCon) {
  const connection = await mysql.createConnection(con_sql_obj);
  try {
    if (!username || !dynamicCon) {
      return { err: "传递的username或者dynamic为空", code: 0 };
    } else {
      const sqlInsert =
        "insert into dynamics (dynamicId, username, dynamicCon, pubTime) value(?,?,?,?)";
      //获取当前发布时间
      const time = new Date();
      const dynamicId = time.getTime();
      const publicTime =
        time.getFullYear() + "-" + (time.getMonth() + 1) + "-" + time.getDate();
      const [res] = await connection.execute(sqlInsert, [
        dynamicId,
        username,
        dynamicCon,
        publicTime,
      ]);
      return { msg: "动态发布成功！", code: 1, info: res };
    }
  } catch (err) {
    return { msg: "动态发布失败！", code: 0, err };
  } finally {
    await connection.end();
  }
}
//获取社区动态的数据信息
async function getDynamics() {
  const connection = await mysql.createConnection(con_sql_obj);
  try {
    connection.connect();
    const sqlSelect = "select * from dynamics";
    const dynamics = await connection.execute(sqlSelect);
    if (dynamics[0].length == 0) {
      return { err: "当前还没有动态数据！", code: 0 };
    } else {
      return { msg: "动态数据获取成功！", code: 1, data: dynamics[0] };
    }
  } catch (err) {
    console.log(err);
  } finally {
    await connection.end();
  }
}

//获取指定用户的动态数据信息
async function getDynamicByUserName(username) {
  if (!username) {
    return { err: "缺少必传的参数！", code: 0 };
  }
  const connection = await mysql.createConnection(con_sql_obj);
  try {
    const sqlSelect = "select * from dynamics where username=?";
    const [res] = await connection.execute(sqlSelect, [username]);
    if (res.length > 0) {
      return { msg: "动态信息获取成功！", code: 1, data: res };
    } else {
      return { err: "动态信息获取失败！", code: 0 };
    }
  } catch (err) {
    console.log(err);
    return { err };
  } finally {
    await connection.end();
  }
}

/**
 * 添加照片到相册
 * param: username，albumName，photoName(全部必传)
 * return 添加结果
 */

async function insertPhotoToAlbum(username, albumName, photoName) {
  if (!username || !albumName || !photoName) {
    return { err: "缺少必传的参数信息！", code: 0 };
  }
  const connection = await mysql.createConnection(con_sql_obj);
  try {
    const sqlInsert =
      "insert into photo(id, username, albumName, photoName) value(?,?,?,?)";
    //生成图片id
    const id = new Date().getTime();
    const [res] = await connection.execute(sqlInsert, [
      id,
      username,
      albumName,
      photoName,
    ]);
    if (res.affectedRows > 0) {
      //插入成功！
      return { msg: "图片插入成功！", code: 1, res };
    } else {
      return { err: "图片插入失败！", code: 0, res };
    }
  } catch (err) {
    return { err, code: 0 };
  } finally {
    await connection.end();
  }
}

/**
 * 删除某一条图片记录
 * param: username(String) albunName(String), photoName(String)
 */
async function deletePhoto(username, albumName, photoName) {
  if (!username || !albumName || !photoName) {
    return { err: "缺少必传的参数！", code: 0 };
  }
  const connection = await mysql.createConnection(con_sql_obj);
  try {
    const sqlDel =
      "delete from photo where username = ? and albumName = ? and photoName = ?";
    const res = await connection.execute(sqlDel, [
      username,
      albumName,
      photoName,
    ]);
    if (res[0].affectedRows > 0) {
      return { msg: "删除记录成功！", code: 1 };
    } else {
      return { err: "删除记录失败！", code: 0 };
    }
  } catch (err) {
    console.log(err);
    return { error: err };
  } finally {
    connection.end();
  }
}

/**
 * 获取相册信息
 * param: username（必传）, albumId(可选)
 * return albums or  photos
 */
async function getAlbums(options) {
  if (!options.username) {
    return { err: "用户名获取失败！", code: 0 };
  }
  const connection = await mysql.createConnection(con_sql_obj);
  try {
    if (!options.albumId) {
      //获取该用户的所有相册信息
      const sqlAlbums = "select * from albums where username=?";
      const [res] = await connection.execute(sqlAlbums, [options.username]);
      if (res.length == 0) {
        return { err: "未找到指定用户的相册信息！", code: 0 };
      } else {
        return { msg: "用户相册信息获取成功！", code: 1, res };
      }
    } else {
      //获取该用户指定albumId的相册信息
      const sqlAlbums = "select * from albums where username=? and albumId=?";
      const [res] = await connection.execute(sqlAlbums, [
        options.username,
        options.albumId,
      ]);
      if (res.length == 0) {
        return { err: "未找到指定用户的相册信息！", code: 0 };
      } else {
        return { msg: "用户相册信息获取成功！", code: 1, res };
      }
    }
  } catch (err) {
    return { err, code: 0 };
  } finally {
    connection.end();
  }
}

/**
 * 创建一条相册记录
 * param: username(必传), albumName(必传), albumPath(必传)
 * return 相册的创建结果
 */

async function insertAlbum(username, albumName, albumPath) {
  if (!username || !albumName) {
    return { err: "缺少必传的参数信息！", code: 0 };
  }
  const connection = await mysql.createConnection(con_sql_obj);
  try {
    const sqlInsert =
      "insert into albums (albumId, username, photoNums, albumName, albumPath) value(?,?,?,?,?)";
    //生成图片id
    const albumId = new Date().getTime();
    const [res] = await connection.execute(sqlInsert, [
      albumId,
      username,
      0,
      albumName,
      albumPath,
    ]);
    if (res.affectedRows > 0) {
      //插入成功！
      return { msg: "相册创建成功！", code: 1, res };
    } else {
      return { err: "相册创建失败！", code: 0, res };
    }
  } catch (err) {
    return { err, code: 0 };
  } finally {
    await connection.end();
  }
}

/**
 * 删除一条相册记录
 * param: username(必传)，albumName(必传)
 * return: 本次操作的结果
 */
async function deleteAlbum(username, albumName) {
  if (!username || !albumName) {
    return { err: "缺少必传的参数！", code: 0 };
  }
  const connection = await mysql.createConnection(con_sql_obj);
  try {
    const sqlDel = "delete from albums where username = ? and albumName = ?";
    const [res] = await connection.execute(sqlDel, [username, albumName]);
    if (res.affectedRows > 0) {
      //说明删除成功
      return { msg: "删除成功！", code: 1 };
    } else {
      return { err: "删除失败！", code: 0 };
    }
  } catch (err) {
    console.log(err);
  } finally {
    await connection.end();
  }
}

/**
 * 关注功能模块
 *
 */
//关注某人
async function insertConcern(username, concernId) {
  if (!username || !concernId) {
    return { err: "缺少必传的参数！", code: 0 };
  }
  const connection = await mysql.createConnection(con_sql_obj);
  try {
    //首先得确保用户存在
    const sqlSelect = "select * from user where username=?";
    const user1 = await connection.execute(sqlSelect, [username]);
    const user2 = await connection.execute(sqlSelect, [concernId]);
    if (user1.length == 0 || user2.length == 0) {
      return { err: "用户信息不存在！", code: 0 };
    }
    const sqlInsert = "insert into concern (username, careId) value(?,?)";
    const res = await connection.execute(sqlInsert, [username, concernId]);
    return { res, code: 1 };
  } catch (err) {
    console.log(err);
  } finally {
    await connection.end();
  }
}
//取消关注
async function deleteConcern(username, concernId) {
  if (!username || !concernId) {
    return { err: "缺少必传的参数！", code: 0 };
  }
  const connection = await mysql.createConnection(con_sql_obj);
  try {
    const sqlDel = "delete from concern where username = ? and careId = ?";
    const res = await connection.execute(sqlDel, [username, concernId]);
    return { res, code: 1 };
  } catch (err) {
    console.log(err);
  } finally {
    await connection.end();
  }
}
//查询某条关注数据
async function getConcern(username, concernId) {
  if (!username || !concernId) {
    return { err: "缺少必传的参数！", code: 0 };
  }
  const connection = await mysql.createConnection(con_sql_obj);
  try {
    const sqlSelect = "select * from concern where username = ? and careId = ?";
    const [res] = await connection.execute(sqlSelect, [username, concernId]);
    return { data: res, code: 1 };
  } catch (err) {
    console.log(err);
  } finally {
    await connection.end();
  }
}

//查询某个用户关注了那些人
async function getConcernAll(username) {
  if (!username) {
    return { err: "缺少必传的参数！", code: 0 };
  }
  const connection = await mysql.createConnection(con_sql_obj);
  try {
    const sqlSelect = "select * from concern where username = ?";
    const [res] = await connection.execute(sqlSelect, [username]);
    return { data: res, code: 1 };
  } catch (err) {
    console.log(err);
  } finally {
    await connection.end();
  }
}

/**
 * 点赞功能
 */
async function likes(username, like_id) {
  if (!username || !like_id) {
    return { err: "缺少必传的参数！", code: 0 };
  }
  const connection = await mysql.createConnection(con_sql_obj);
  try {
    const sqlInsert =
      "insert into likes (id, username, like_id) values(?, ?, ?)";
    //生成插入id
    const id = new Date().getTime();
    const res = await connection.execute(sqlInsert, [id, username, like_id]);
    if (res[0].affectedRows > 0) {
      return { msg: "数据添加成功！", code: 1 };
    } else {
      return { err: "数据添加失败！", code: 0 };
    }
  } catch (error) {
    console.log(error);
  } finally {
    await connection.end();
  }
}
//取消点赞
async function disLikes(username, like_id) {
  if (!username || !like_id) {
    return { err: "缺少必传的参数！", code: 0 };
  }
  const connection = await mysql.createConnection(con_sql_obj);
  try {
    const sqlDel = "delete from likes where username = ? and like_id = ?";
    const res = await connection.execute(sqlDel, [username, like_id]);
    if (res[0].affectedRows > 0) {
      return { msg: "数据删除成功！", code: 1 };
    } else {
      return { err: "数据删除失败！", code: 0 };
    }
  } catch (error) {
    console.log(error);
  } finally {
    await connection.end();
  }
}

//查询是否存在某一条点赞记录
async function isliked(username, like_id) {
  if (!username || !like_id) {
    return { err: "缺少必传的参数！", code: 0 };
  }
  const connection = await mysql.createConnection(con_sql_obj);
  try {
    const sqlSelect = "select * from likes where username = ? and like_id = ?";
    const [res] = await connection.execute(sqlSelect, [username, like_id]);
    if (res.length > 0) {
      return { msg: "存在满足条件的数据记录！", code: 1 };
    } else {
      return { err: "不存在满足条件的数据记录！", code: 0 };
    }
  } catch (error) {
    console.log(error);
  } finally {
    await connection.end();
  }
}

/**
 * 评论功能
 */
async function insertComments(username, commentId, commentCon) {
  if (!username || !commentId || !commentCon) {
    return { err: "缺少必传的参数！", code: 0 };
  }
  const connection = await mysql.createConnection(con_sql_obj);
  try {
    const sqlInsert =
      "insert into comments (id, username, commentId, commentCon, commentTime) values(?,?,?,?,?)";
    //生成id
    const time = new Date();
    const id = time.getTime();
    const commentTime =
      time.getFullYear() +
      "-" +
      (time.getMonth() + 1).toString().padStart(2, "0") +
      "-" +
      time.getDate().toString().padStart(2, "0");
    const res = await connection.execute(sqlInsert, [
      id,
      username,
      commentId,
      commentCon,
      commentTime,
    ]);
    if (res[0].affectedRows > 0) {
      return { msg: "记录添加成功！", code: 1 };
    } else {
      return { err: "记录添加失败！", code: 0 };
    }
  } catch (err) {
    console.log(err);
  } finally {
    await connection.end();
  }
}

//获取指定commentId的所有评论数据
async function getComments(commentId) {
  if (!commentId) {
    return { err: "缺少必传的参数！", code: 0 };
  }
  const connection = await mysql.createConnection(con_sql_obj);
  try {
    const sqlSelect = "select * from comments where commentId=?";
    const [res] = await connection.execute(sqlSelect, [commentId]);
    if (res.length > 0) {
      return { msg: "评论数据获取成功！", code: 1, data: res };
    } else {
      return { err: "评论数据获取失败！", code: 0 };
    }
  } catch (err) {
    console.log(err);
  } finally {
    await connection.end();
  }
}

module.exports = {
  selectUserMsgAll,
  leaveMsg,
  replay,
  getReplies,
  getDynamics,
  publicDynamic,
  getDynamicByUserName,
  insertPhotoToAlbum,
  getAlbums,
  insertAlbum,
  insertConcern,
  deleteConcern,
  getConcern,
  getConcernAll,
  deleteAlbum,
  deletePhoto,
  likes,
  disLikes,
  isliked,
  insertComments,
  getComments,
};

// ,(async ()=>{
//     try{
//         const res = await disLikes('admin', '1743922048856')
//         console.log(res)
//     }catch(err){
//         console.log(err)
//     }
// })()
