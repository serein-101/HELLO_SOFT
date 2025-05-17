/**
 * 该脚本主要是针对用户信息的数据库操作
 */

// mysqld.js
const mysql = require("mysql2/promise");
const con_sql_obj = {
  host: "121.40.59.61",
  user: "serein",
  password: "2825",
  database: "hello_alternate_dimension",
  multipleStatements: true,
};
async function selectUser() {
  const connection = await mysql.createConnection(con_sql_obj);

  try {
    const selectAll = "SELECT * FROM user";
    const [selectResult] = await connection.execute(selectAll);
  } catch (error) {
    console.error("数据库操作出错: ", error);
  } finally {
    await connection.end();
  }
}

async function getUserInfo(username) {
  // 查询指定用户的信息
  const connection = await mysql.createConnection(con_sql_obj);

  try {
    const selectAll = "SELECT * FROM user WHERE username = ?";
    const [selectResult] = await connection.execute(selectAll, [username]);

    if (selectResult.length > 0) {
      const userInfo = selectResult[0];
      return userInfo;
    } else {
      console.log("未找到指定用户");
      return null;
    }
  } catch (error) {
    console.error("数据库操作出错: ", error);
    return null;
  } finally {
    await connection.end();
  }
}

async function insertUser(user) {
  //把用户插入到数据库的user表中
  //主要是用户注册时用到
  //传入 user JS对象，然后保存到hello_alternate_dimension的user表中
  const connection = await mysql.createConnection(con_sql_obj);

  try {
    const insertuser =
      "insert into user (nickname, username, password, avatar, birthday, introduce, signature, region) values(?, ?, ?,?,?,?,?,?)";
    const values = [
      user.nickname,
      user.username,
      user.password,
      user.avatar,
      user.birthday,
      user.introduce,
      user.signature,
      user.region,
    ];
    const [insertResult] = await connection.execute(insertuser, values);
    if (insertResult.affectedRows > 0) {
      return { msg: "数据添加成功！", code: 1 };
    } else if (insertResult.sqlState == 23000) {
      return { err: "数据添加失败！", code: 0, info: "用户名以存在" };
    }
  } catch (error) {
    console.error("数据库操作出错: ", error);
  } finally {
    await connection.end();
  }
}

async function updateUserInfo(user) {
  // 此函数用于将更新后的用户信息保存到数据库的 user 表中
  // 传入的是更新后的 user 信息
  const connection = await mysql.createConnection(con_sql_obj);
  try {
    // 编写 SQL 更新语句，通过 username 来更新用户信息
    const updateUser =
      "UPDATE `user` SET avatar = ?, nickname = ?, gender = ?, birthday = ?, introduce = ?, signature = ?, region = ? WHERE username = ?";
    // 检查并处理可能为 undefined 的属性
    const avatar = user.avatar !== undefined ? user.avatar : null;
    const nickname = user.nickname !== undefined ? user.nickname : null;
    const gender = user.gender !== undefined ? user.gender : null;
    const birthday = user.birthday !== undefined ? user.birthday : null;
    const introduce = user.introduce !== undefined ? user.introduce : null;
    const signature = user.signature !== undefined ? user.signature : null;
    const region = user.region !== undefined ? user.region : null;
    const username = user.username !== undefined ? user.username : null;

    const values = [
      avatar,
      nickname,
      gender,
      birthday,
      introduce,
      signature,
      region,
      username,
    ];

    const [updateResult] = await connection.execute(updateUser, values);
  } catch (error) {
    console.error("用户信息更新失败！", error);
  } finally {
    await connection.end();
  }
}
async function deleteUser(username) {
  //删除指定用户
  const connection = await mysql.createConnection(con_sql_obj);
  try {
    // 查询数据库中是否存在指定用户
    const deleteuser = `DELETE FROM user WHERE username = ?`;
    const [userIsExist] = await connection.execute(deleteuser, [username]);
  } catch (error) {
    console.error("用户信息删除失败！", error);
  } finally {
    await connection.end();
  }
}

module.exports = {
  selectUser,
  insertUser,
  updateUserInfo,
  deleteUser,
  getUserInfo,
};
