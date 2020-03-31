/**
 * 酷我webview与终端通讯api
 * 所有api支持promise
 * 特别注意：同时调用api会出错，请用promise保证顺序调用，可以使用yield或者async
 */
const VERSION = '1.0.2';
const HOST = 'kwip://kwplayerhd/';
const userAgent = navigator.userAgent;
let callbackIndex = 0;
const isIphone = userAgent.indexOf('iPhone') > -1;
const isAndroid =
  userAgent.indexOf('Android') > -1 || userAgent.indexOf('Linux') > -1;
const isKuwoApp = userAgent.indexOf('kuwopage') > -1;
// 通过scheme/action方式调用的api
const actionArr = [
  'control_get_deviceinfo',
  'get_query',
  'web_control_showMiniPlayer',
  'control_downloadselect',
  'pay_getuesrinfo',
  'control_share_webpage',
  'control_pauseplaymusic',
  'control_playnextitem',
  'control_getmediainfo',
  'goto_showroom',
  'pay_type',
  'change_skin'
];
// ios scheme调用iframe
let iframe = document.getElementById('jsbridge');
if (iframe === null) {
  iframe = document.createElement('iframe');
  iframe.id = 'jsbrideg';
  iframe.height = 0;
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
}
/**
 * 客户端通信方法封装
 * @param {object} data - 参数对象，具体参宿说明见各方法说明
 */
function callNative (data, isCallback = true) {
  const callbackName = `kuwoJsBridgeCallback${callbackIndex++}`;
  let jsonStr = '';
  return new Promise((resolve, reject) => {
    function callback () {
      return function (res) {
        // console.log(`${data.action} nativeCallback`, res);
        let result = res;
        if (typeof res === 'string') {
          result = JSON.parse(res);
        }
        data.callback && data.callback(result);
        return resolve(result);
      };
    }

    if (data.callbackNames) {
      if (isIphone) {
        window[data.callbackNames.ios] = callback();
        jsonStr = JSON.stringify(
          Object.assign({}, data, {
            callback: data.callbackNames.ios
          })
        );
      } else if (isAndroid) {
        window[data.callbackNames.android] = callback();
        jsonStr = JSON.stringify(
          Object.assign({}, data, {
            callback: data.callbackNames.android
          })
        );
      }
    } else {
      window[callbackName] = callback();
      jsonStr = JSON.stringify(
        Object.assign({}, data, {
          callback: callbackName
        })
      );
    }
    // console.log('callNative data: ', data);
    if (!isKuwoApp) {
      return resolve(null);
    }
    // 两种调用方式适配
    if (isIphone) {
      if (data.action && actionArr.indexOf(data.action) > -1) {
        iframe.src = HOST + data.action + '?param=' + encodeURIComponent(jsonStr);
        // console.log('scheme action 调用：', data.action);
        return;
      }
      // console.log('scheme param 调用：', jsonStr);
      iframe.src =
        HOST + 'kw_mobile_client?param=' + encodeURIComponent(jsonStr);
    } else if (isAndroid) {
      try {
        // console.log('scheme param 调用：', jsonStr);
        window.KuwoInterface && window.KuwoInterface.jsCallNative(jsonStr);
      } catch (e) {
        // console.log('安卓jsbridge调用出错', e);
      }
    }
    if (isCallback === false) {
      return resolve(null);
    }
  });
}

/**
 * api方法是否可用
 * @param {Object} data - 参数对象
 * @param {string} fun - 原生方法名
 * @return {number} res -  '1'表示实现，'0'表示未实现
 */
function canUse (data) {
  data = Object.assign({}, data, {
    action: 'can_use'
  });
  return callNative(data);
}

/**
 * 离线应用内或者应用间跳转
 * @param {Object} data -  action
 * @param {string} data.appid - 应用id
 * @param {string} data.url - 应用内url
 * @param {string} data.data - 传递给目标页面的数据
 * @param {Object} online - true: 走线上跳转，通过location.href跳转，不通过app跳转
 */
function navigateTo (data, online = false) {
  const scheme = `kwurl://main_web/open_router?param=${encodeURIComponent(
    JSON.stringify(data)
  )}`;
  // console.log('navigateTo scheme', scheme, data);
  if (isKuwoApp && online === false) {
    window.location.href = scheme;
    return;
  }
  const queryArr = [];
  for (const key in data.data) {
    queryArr.push(`${key}=${data.data[key]}`);
  }
  if (queryArr.length > 0) {
    const query = queryArr.join('&');
    data.url += data.url.indexOf('?') > -1 ? query : `?${query}`;
  }
  window.location.href = data.url;
}

/**
 * 关闭当前页面。可直接传入一个对象data参数，data 对象将会被即将露出的页面通过 resume 事件接收
 * @param {Object} data - 参数对象
 * @param {Object} data.animated - 是否带动画，1：动画，0：不带动画
 */
function popWindow (data) {
  data = Object.assign({}, data, {
    action: 'pop_window'
  });
  return callNative(data);
}

/**
 *
 * 一次回退多级页面。可直接传入一个字符串作为 OPTION.urlPattern 参数，或直接传入一个整数作为 OPTION.index 参数
 * @param {Object} data - 参数对象
 * @param {Object} data.index - 目标页面在会话页面栈中的索引；如果小于零，则将与当前页面的 index 相加；0：相当于popToRootWindow
 * @param {Object} data.animated - 是否带动画，1：动画，0：不带动画
 * @param {Object} data.data - 传递的 data 对象将会被即将露出的页面通过 resume 事件接收
 */
function popTo (data) {
  data = Object.assign({}, data, {
    action: 'pop_to'
  });
  return callNative(data);
}

/**
 *
 * 回退到根window。
 * @param {Object} data - 参数对象, 目标页面通过resume接收
 * @param {Object} data.animated - 是否带动画，1：动画，0：不带动画
 */
function popToRootWindow (data) {
  data = Object.assign({}, data, {
    action: 'pop_to_root_window'
  });
  return callNative(data);
}

/**
 *
 * 浏览器中打开页面。
 * @param {Object} data - 参数对象
 * @param {Object} data.url - url地址
 */
function openInBrowser (data) {
  data = Object.assign({}, data, {
    action: 'open_in_browser'
  });
  return callNative(data);
}

/**
 *
 * 获取设备信息
 * @param {Object} data -  参数对象
 * @param {string} [data.pagetype = def]
 */
function getClientInfo (data) {
  data = Object.assign(
    {},
    {
      pagetype: 'def'
    },
    data,
    {
      action: 'control_get_deviceinfo',
      'notify_play_state': true,
      callbackNames: {
        ios: 'feedback_deviceinfo',
        android: 'feedback_ardeviceinfo'
      }
    }
  );
  if (!isKuwoApp) {
    return new Promise((resolve, reject) => {
      resolve(JSON.parse('{"batch_pay":1,"uid":"247206180","supportSuper":2,"subscribe":1,"isarearadio":1,"hitlist":1,"break":"0","usersid":"774670938","uname":"仁元","jumpSetAualityView":1,"isShowMiniPlayer":true,"bSupportWebFloatBottom":true,"isSandBox":"0","supportConfmgr":1,"src":"kwplayer_ip_8.6.6.0_TJ.ipa","changeSkin":"V2","type":"wechat","devtype":"iPhone9,2","iscomment":1,"supportHideMiniController":1,"locationid":"1","alpha":0,"fromId":"kwplayer_ip_8.6.6.0_TJ.ipa","temporary_uid":"-1","temporary_sid":"-1","statusBarHeight":20,"gender":"n","isStarTheme":false,"netstatus":"2","iscommentios":1,"devid":"2b45fa34870a4436ad0309b6cb7841f9","ver":"kwplayer_ip_8.6.6.0","entry":"","userid":"395264017"}'));
    });
  }
  return callNative(data);
}

/**
 *
 * 获取用户信息
 * @param {Object} data -  参数对象
 */
function getUserInfo (data) {
  data = Object.assign({}, data, {
    action: 'pay_getuesrinfo'
  });
  if (!isKuwoApp && process.env.NODE_ENV === 'development') {
    return JSON.parse('{"username":"仁元","sid":"774670938","nikename":"仁元","pic":"http://wx.qlogo.cn/mmopen/ajNVdqHZLLAnvicdDLxcIkBWdO2v1RrslBD8SPBSOxSABFiaY62ibQwibwlCZOTsP8Qib3w0xGGXNYo6WabF0Y7DWkg/0","uid":"395264017","platform":"ios"}');
  }
  return callNative(data);
}

/**
 *
 * 获取页面初始化相关时间点
 * @param {Object} data -  参数对象
 * @param {Object} result -  返回参数对象
 * @param {number} result.schemeStart - scheme开始解析时间
 * @param {number} result.pageStart - url开始载入时间
 * @param {number} result.pageFinished - 页面载入完成时间
 */
function getPageInitTime (data) {
  data = Object.assign({}, data, {
    action: 'control_get_page_init_time'
  });
  return callNative(data);
}

/*
 * ios mta 上报计算事件
 * @param {Object} data -  参数对象
 * @param {Object} data.event_id -  事件id
 * @param {Object} data.kvs -  上报参数对象
 */
function eventStats (data) {
  data = Object.assign({}, data, {
    action: 'mta_trace_custom_event'
  });
  return callNative(data);
}

/**
 *
 * 警告框
 * @param {Object} data - 参数对象
 * @param {string} data.title - 标题
 * @param {string} data.msg - 内容
 * @param {Array} data.btnTitles - 按钮文案数组，传一个值就好
 */
function alert (data) {
  data = Object.assign({}, data, {
    action: 'alert'
  });
  return callNative(data);
}

/**
 *
 * 确认框
 * @param {Object} data - 参数对象
 * @param {string} data.title - 标题
 * @param {string} data.msg - 内容
 * @param {Array} data.btnTitles - 按钮文案数组
 * @param {number} result - 返回点击按钮index
 */
function confirm (data) {
  data = Object.assign({}, data, {
    action: 'confirm'
  });
  return callNative(data);
}

/**
 *
 * 显示弱提示，可选择多少秒之后消失。
 * @param {Object} data - 参数对象
 * @param {string} data.msg - 内容
 * @param {string} data.bottom - 距离底部的距离，屏幕像素
 * @param {number} data.duration - 显示时长，单位为 ms，app默认值3000ms
 */
function toast (data) {
  data = Object.assign({}, data, {
    action: 'toast'
  });
  return callNative(data);
}

function bindWebEvent (data) {
  if (isIphone) {
    data = Object.assign({}, data, { action: 'bind_web_event' });
    return callNative(data);
  }
}
/**
 *
 * 设置标题
 * @param {Object} data - 参数对象
 * @param {string} data.title - 标题
 * @param {string} data.subTitle - 标题
 */
function setTitle (data) {
  data = Object.assign({}, data, {
    action: 'set_title'
  });
  if (isAndroid) {
    // 安卓参数为name
    data = Object.assign({}, data, {
      name: data.title
    });
  }
  return callNative(data);
}

/**
 *
 * 设置标题颜色
 * @param {Object} data - 参数对象
 * @param {string} data.titleColor - 颜色
 * @param {string} data.subTitleColor - 颜色
 */
function setTitleColor (data) {
  data = Object.assign({}, data, {
    action: 'set_title_color'
  });
  return callNative(data);
}

/**
 *
 * 设置右上角按钮
 * @param {Object} data - 参数对象
 * @param {string} data.showRefresh - 是否是刷新按钮 1是 0不是
 * @param {string} data.showShare - 是否是分享按钮 1是 0不是
 * @param {string} data.url - 分享链接
 * @param {string} data.weibo - 微博文案
 * @param {string} data.qqspace - QQ空间文案
 * @param {string} data.qqspaceTitle - QQ空间标题
 * @param {string} data.qqfriend - QQ好友文案
 * @param {string} data.qqfriendTitle - QQ好友标题
 * @param {string} data.wxmsg - 微信标题
 * @param {string} data.wxdes - 微信描述
 * @param {string} data.imgurl - 分享小图
 * @param {string} data.imageurl - 分享小图
 * @param {string} data.needconfirm - 默认0
 * 
 */
function setRightButton (data) {
  data = Object.assign({}, data, { action: 'set_title_right_button' });
  return callNative(data);
} 

/**
 *
 * 登录
 * 注意事项：已登录用户调用不会有任何反应，通过getUserInfo判断是否已登录（sid是否存在）
 * @param {Object} data -  参数对象
 * @param {string} dat.pop_up_title - 登录框标题
 * @param {string} dat.reference - refer标识
 * result 示例：{'result':'success','uid':'205780289','uname':'你好','pic':''}
 */
function login (data) {
  data = Object.assign({}, data, {
    action: 'goto_login_page',
    callbackNames: {
      ios: 'back_goto_login_page',
      android: 'back_goto_login_page'
    }
  });
  return callNative(data);
}

/**
 * 支付
 * @param {Object} data - ios和安卓（微信和支付宝）全都有区别
 * ios字段说明
 * @param {string} data.type - 支付类型：微信、支付宝、苹果支付
 * @param {string} data.customId - 后端支付接口返回的id
 * @param {string} data.receiptUrl - 后端支付接口返回的收据url
 * @param {string} data.callBackUrl - 客户端支付成功回跳url
 * @param {string} data.pId - 价格对应的支付字符串
 * @param {string} data.cash - 价格
 * @param {string} data.kwb - 价格，对应酷我充值币的价格
 * @param {string} data.service - 服务名，统计用
 * 安卓支付宝字段说明
 * @param {string} data.payType - 支付类型：微信、支付宝、苹果支付
 * @param {string} data.pay_aliclient_msginfo - 支付请求url
 * @param {string} data.callback_url - 支付成功回跳url
 * @param {string} data.extra - 日志上报字段
 * 安卓微信字段说明
 * @param {string} data.payType - 支付类型：微信、支付宝、苹果支付
 * @param {string} data.pay_wxclient_msginfo - 支付请求url
 * @param {string} data.callback_url - 支付成功回跳url
 * @param {string} data.extra - 日志上报字段
 */
function pay (data) {
  data = Object.assign({}, data, {
    action: 'pay_type'
  });
  if (isAndroid) {
    if (data.type === 102) {
      data.action = 'pay_start_aliclient';
    } else if (data.type === 123 || data.type === 100 || data.type === 99 || data.type === 98) {
      data.action = 'pay_start_wxclient';
    }
  }
  return callNative(data);
}
/**
 *
 * 获取页面跳转参数对象
 * @param {Object} data -  参数对象
 */
function getQueryData (data) {
  data = Object.assign({}, data, {
    action: 'get_query'
  });
  if (isKuwoApp) {
    return callNative(data);
  }
  const queryObj = {};
  let search = window.location.search;
  search && (search = search.substring(1));
  search.split('&').forEach(item => {
    const itemArr = item.split('=');
    queryObj[itemArr[0]] = itemArr[1];
  });
  return new Promise((resolve, reject) => {
    resolve(queryObj);
  });
}
/**
 *
 * 播放歌曲，列表或者单曲
 * @param {Object} data - 参数对象
 * @param {bool} data.isplayall - 是否
 * @param {string} data.listtitle - 歌单名称
 * @param {number} data.index - 播放第几首
 * @param {number} data.libpath - 上报日志路径
 * @param {array} data.musiclist - 歌曲列表
 * @param {string} data.musiclist.musicrid - 歌曲id
 * @param {string} data.musiclist.name - 歌曲名称
 * @param {string} data.musiclist.artist - 歌手名字
 * @param {string} data.musiclist.album - 歌曲封面
 * @param {string} data.musiclist.formats - 歌曲支持的格式
 * @param {string} data.musiclist.pay -
 * @param {string} data.musiclist.audio_id -
 * @param {string} data.musiclist.online - 是否在线
 * @param {string} data.musiclist.psrc - 上报参数
 * @param {string} data.musiclist.kmark -
 * @param {bool} data.musiclist.hasmv - 是否有mv
 * @param {string} data.musiclist.fsongname -
 * @param {string} data.musiclist.aartist -
 * @param {string} data.musiclist.isdownload - 是否下载
 * @param {string} data.musiclist.nationid - 国家id
 */
function play (data) {
  data = Object.assign({}, data, { action: 'control_all_play_song_index' });
  return callNative(data);
}

/**
 * 切换播歌（播放），参数同播放歌曲
 * **/
function playSongStatus (data) {
  data = Object.assign({}, data, { action: 'control_play_song_status' });
  return callNative(data);
}

/**
 * 切换播歌（暂停），参数同播放歌曲
 * **/
function stopSongStatus (data) {
  data = Object.assign({}, data, { action: 'control_stop_song_status' });
  return callNative(data);
}

/**
 *
 * 下载歌曲，列表或者单曲
 * @param {Object} data - 参数对象
 * @param {bool} data.isplayall - 是否全屏
 * @param {string} data.listtitle - 歌单名称
 * @param {number} data.index - 播放第几首
 * @param {number} data.libpath - 上报日志路径
 * @param {array} data.musiclist - 歌曲列表
 * @param {string} data.musiclist.musicrid - 歌曲id
 * @param {string} data.musiclist.name - 歌曲名称
 * @param {string} data.musiclist.artist - 歌手名字
 * @param {string} data.musiclist.album - 歌曲封面
 * @param {string} data.musiclist.formats - 歌曲支持的格式
 * @param {string} data.musiclist.pay -
 * @param {string} data.musiclist.audio_id -
 * @param {string} data.musiclist.online - 是否在线
 * @param {string} data.musiclist.psrc - 上报参数
 * @param {string} data.musiclist.kmark -
 * @param {bool} data.musiclist.hasmv - 是否有mv
 * @param {string} data.musiclist.fsongname -
 * @param {string} data.musiclist.aartist -
 * @param {string} data.musiclist.isdownload - 是否下载
 * @param {string} data.musiclist.nationid - 国家id
 */
function download (data) {
  data = Object.assign({}, data, { action: 'control_downloadselect' });
  return callNative(data);
}
/**
 * by renyuan.zhang
 * 歌曲列表操作
 * @param {Object} data - 参数对象
 * @param {bool} data.isplayall - 是否
 * @param {string} data.listtitle - 歌单名称
 * @param {number} data.index - 播放第几首
 * @param {number} data.libpath - 上报日志路径
 * @param {array} data.musiclist - 歌曲列表
 * @param {string} data.musiclist.musicrid - 歌曲id
 * @param {string} data.musiclist.name - 歌曲名称
 * @param {string} data.musiclist.artist - 歌手名字
 * @param {string} data.musiclist.album - 歌曲封面
 * @param {string} data.musiclist.formats - 歌曲支持的格式
 * @param {string} data.musiclist.pay -
 * @param {string} data.musiclist.audio_id -
 * @param {string} data.musiclist.online - 是否在线
 * @param {string} data.musiclist.psrc - 上报参数
 * @param {string} data.musiclist.kmark -
 * @param {bool} data.musiclist.hasmv - 是否有mv
 * @param {string} data.musiclist.fsongname -
 * @param {string} data.musiclist.aartist -
 * @param {string} data.musiclist.isdownload - 是否下载
 * @param {string} data.musiclist.nationid - 国家id
 */
function plOperation (data) {
  data = Object.assign({}, data, { action: 'control_batch_operation_song' });
  return callNative(data);
}

/**
 * by renyuan.zhang
 * 歌曲列表操作
 * @param {Object} data - 参数对象
 * @param {string} data.listtitle - 歌单名称
 * @param {array} data.musiclist - 歌曲列表
 * @param {string} data.musiclist.musicrid - 歌曲id
 * @param {string} data.musiclist.name - 歌曲名称
 * @param {string} data.musiclist.artist - 歌手名字
 * @param {string} data.musiclist.album - 歌曲封面
 * @param {string} data.musiclist.formats - 歌曲支持的格式
 * @param {string} data.musiclist.pay -
 * @param {string} data.musiclist.audio_id -
 * @param {string} data.musiclist.online - 是否在线
 * @param {string} data.musiclist.psrc - 上报参数
 * @param {string} data.musiclist.kmark -
 * @param {bool} data.musiclist.hasmv - 是否有mv
 * @param {string} data.musiclist.fsongname -
 * @param {string} data.musiclist.aartist -
 * @param {string} data.musiclist.isdownload - 是否下载
 * @param {string} data.musiclist.nationid - 国家id
 */
function songMoreOperation (data) {
  data = Object.assign({}, data, { action: 'control_song_more_operation' });
  return callNative(data);
}

/**
 *
 * 网络请求
 * @param {Object} data -  参数对象
 * @param {string} data.method - 有效值：OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
 * @param {string} data.url -  接口url
 * @param {string} data.retrytimes - 失败后重试次数
 * @param {number} data.timeout - 超时时间
 * @param {string} data.responseType - default: 'json', 其他可选值：'text'，'arraybuffer', 'blob', 'document', 'json', 'text', 'stream'这些是否支持找增光讨论
 * @param {Object} [data.header] -  请求头
 * @param {Object} data.data -  请求参数
 * @returns {Object} result - 返回参数对象
 * @returns {bool} result.success - 状态码：true：成功，false： 失败
 * @returns {string} result.msg - 错误消息
 * @returns {number} result.statusCode - 网络状态码
 * @returns {Object} result.data - 返回数据对象
 *
 */
function httpRequest (data) {
  data = Object.assign({}, data, {
    action: 'http_request'
  });
  return callNative(data);
}

/**
 *
 * 写入本地缓存，整个app公用一个缓存区，应用内缓存key都加上appid，比如：0000002.musicList
 * @param {Object} data -  参数对象
 * @param {string} data.key -  键
 * @param {string} data.data -  值
 */
function setStorage (data) {
  if (isAndroid) {
    data = Object.assign({}, data, {
      action: 'write_string'
    });
    return callNative(data);
  }
  return new Promise((resolve, reject) => {
    const callbackName = `kuwoJsBridgeCallback${callbackIndex++}`;
    window[callbackName] = res => {
      let result = res;
      if (typeof res === 'string') {
        result = JSON.parse(res);
      }
      resolve(result);
    };
    const params = Object.assign({}, data, {
      callback: callbackName
    });
    // console.log('setStorage: ', data);
    window.webkit &&
      window.webkit.messageHandlers.write_string.postMessage(params);
  });
}

/**
 *
 * 读取本地缓存
 * @param {Object} data -  参数对象
 * @param {Object} data.key -  键
 */
function getStorage (data) {
  if (isAndroid) {
    data = Object.assign({}, data, {
      action: 'read_string'
    });
    return callNative(data);
  }
  return new Promise((resolve, reject) => {
    const callbackName = `kuwoJsBridgeCallback${callbackIndex++}`;
    window[callbackName] = res => {
      // console.log('ios getStorage: ', res);
      try {
        res = JSON.parse(res);
      } catch (e) {
        // console.log('storage data is not json string');
      }
      resolve(res);
    };
    const params = Object.assign({}, data, {
      callback: callbackName
    });
    window.webkit &&
      window.webkit.messageHandlers.read_string.postMessage(params);
  });
}

/**
 *
 * 删除本地缓存
 * @param {Object} data -  参数对象
 * @param {Object} data.key -  键
 */
function removeStorage (data) {
  if (isAndroid) {
    data = Object.assign({}, data, {
      action: 'delet_string'
    });
    return callNative(data);
  }
  return new Promise((resolve, reject) => {
    const callbackName = `kuwoJsBridgeCallback${callbackIndex++}`;
    window[callbackName] = res => {
      resolve(res);
    };
    const params = Object.assign({}, data, {
      callback: callbackName
    });
    // console.log('removeStorage data:', data);
    window.webkit &&
      window.webkit.messageHandlers.delete_string.postMessage(params);
  });
}

/**
 *
 * 设置右上角按钮样式
 * @param {Object} data - 参数对象
 * @param {String} data.title 按钮的文字
 * @param {String} data.titleColor 按钮的文字颜色，16进制颜色值
 * @param {String} data.titleHighlightColor 按下状态的按钮的文字颜色
 * @param {String} data.image 按钮的图片（base64字符串）,可以通过require(path)引入图片，webpack会转换为base64
 * @param {String} data.highlightImage 按下状态的图片（base64Encoding过的字符串）
 * @param {String} data.backgroundColor 背景颜色
 * @param {String} data.backgroundImage 背景图片（base64Encoding过的字符串）
 * @param {String} data.highlightBackgroundImage 按下状态背景图片（base64Encoding过的字符串）
 * @param {String} data.size 按钮的大小，格式：“{宽，高}”
 * @param {String} data.iconSize 图片的大小，格式：“{宽，高}”
 * @param {String} data.btns 按下按钮展开的按钮列表
 * @param {Object} result 返回数据对象
 * @param {String} result.index 点击按钮index
 */

function setOptionMenu (data) {
  const btns = data.btns;
  data = Object.assign({}, data, { action: 'set_right_button' });
  if (isAndroid) {
    return callNative(data);
  }
  if (isIphone) {
    delete data.btns;
    if (!data.btns) {
      return callNative(data);
    }
    window.setTimeout(() => {
      for (let i = 0; i < btns.length; i++) {
        (function (index) {
          setTimeout(function () {
            const info = {
              action: 'add_nav_menu_item',
              title: btns[index].title,
              image: btns[index].image
            };
            return callNative(info);
          }, 200 * index);
        })(i);
      }
    }, 200);
  }
}

/**
 *
 * 盒内H5页面跳转
 * @param {Object} data - 参数对象
 * @param {String} data.url - 目标页链接
 * @param {String} data.title - 目标页标题
 * @param {String} data.pagetype - 默认'dev'
 */
function openUrlInApp (data) {
  data = Object.assign({}, data, {
    action: 'control_inapp_url'
  });
  return callNative(data);
}

/**
 *
 * 跳转到秀场页面
 * @param {Object} data - 参数对象
 * @param {String} data.channel - 默认为空
 * @param {String} data.roomType - 房间类型，默认为2
 * @param {String} data.roomId - 秀场房间号
 */

function goShowRoom (data) {
  data = Object.assign({}, data, { action: 'goto_showroom' });
  return callNative(data);
}

/**
 *
 * 滚动选择列表、日期选择
 * @param {Object} data - 参数对象
 * @param {String} data.type - 类型0：滚动双列，1:日期
 * @param {Array} data.btns - 选项
 * @param {Object} result - 回调函数数据对象
 * @param {string} result.index - 选择的第一列索引
 * @param {string} result.subIndex - 选择的第二列索引
 */
function selectList (data) {
  data = Object.assign({}, data, { action: 'show_select_list' });
  return callNative(data);
}

/**
 *
 * 单选列表
 * @param {Object} data - 参数对象
 * @param {String} data.title - 标题
 * @param {String} data.msg - 说明
 * @param {String} data.btns - 选项
 */
function actionSheet (data) {
  data = Object.assign({}, data, { action: 'show_action_sheet' });
  return callNative(data);
}

/**
 *
 * 禁止左滑
 *
 * **/
function closeSlideExit (data) {
  data = Object.assign({}, data, { action: 'close_slide_exit' });
  return callNative(data);
}

/**
 *
 * 显示loadingbar
 * @param {Object} data - 参数对象
 * @param {String} data.msg - 文案
 */
function showLoading (data) {
  data = Object.assign({}, data, { action: 'show_loading' });
  if (isAndroid) {
    data = Object.assign({}, data, { action: 'start_load_dialog' });
  }
  return callNative(data);
}

/**
 *
 * 隐藏loadingbar
 * @param {Object} data - 参数对象，默认值空
 */
function hideLoading (data) {
  data = Object.assign({}, data, { action: 'hide_loading' });
  if (isAndroid) {
    data = Object.assign({}, data, { action: 'cancel_load_dialog' });
  }
  return callNative(data);
}

/**
 *
 * 起调APP歌单列表
 * @param {Object} data - 参数对象
 * @param {string} data.pid - 歌单id
 * @param {string} data.name - 歌单名称
 * @param {string} data.psrc - 上报来源
 */
function goPlayList (data) {
  data = Object.assign({}, data, { action: 'goto_playlist_page' });
  return callNative(data);
}

/**
 *
 * 起调APP专辑界面
 * @param {Object} data - 参数对象
 * @param {string} data.albumid - 专辑id
 * @param {string} data.image_url - 专辑封面
 * @param {string} data.name - 专辑名称
 */
function goAlbumPage (data) {
  data = Object.assign({}, data, { action: 'goto_album_page' });
  return callNative(data);
}

/**
 *
 * 起调APP专区界面
 * @param {Object} data - 参数对象
 * @param {string} data.persistentId - 专区id
 * @param {string} data.title - 专辑名称
 * @param {string} data.digest - 专区id，有固定配置，找客户端要
 */
function goAreaPage (data) {
  data = Object.assign({}, data, { action: 'sys_goto_zhuanqu' });
  return callNative(data);
}

/**
 *
 * 起调APP电台界面
 * @param {Object} data - 参数对象
 * @param {string} data.dtid - 电台id
 * @param {string} data.dtname - 电台名称
 * @param {string} data.dtpic - 电台封面
 * @param {number} data.showPlayScence - 是否全屏显示
 * @param {string} data.closeCurPage - 是否关闭当前页面
 */
function goRadioPage (data) {
  data = Object.assign({}, data, { action: 'control_playdt' });
  return callNative(data);
}

/**
 *
 * 起调APP评论界面
 * @param {Object} data - 参数对象
 * @param {string} data.source - 资源
 * @param {string} data.sourceid - 资源id
 * @param {string} data.title - 评论title
 * @param {string} data.popup - 是否弹出键盘，1：弹出，0：不弹出， 默认值是0
 */
function goCommentPage (data) {
  data = Object.assign({}, data, { action: 'goto_client_comment' });
  return callNative(data);
}

/**
 *
 * 起调APP回复评论界面
 * @param {Object} data - 参数对象
 * @param {string} data.source - 资源
 * @param {string} data.sourceid - 资源id
 * @param {string} data.title - 评论title
 * @param {string} data.cid - 被回复的评论id
 * @param {string} data.uname - 发表回复的用户
 */
function goReplyPage (data) {
  data = Object.assign({}, data, { action: 'reply_comment' });
  return callNative(data);
}

/**
 *
 * 起调app用户主页
 * @param {Object} data - 参数对象
 * @param {string} data.cid - 用户id
 * @param {string} data.uname - 用户名
 */
function goUserMainPage (data) {
  data = Object.assign({}, data, { action: 'goto_user_main_page' });
  return callNative(data);
}

/**
 *
 * 起调皮肤页
 * @param {string} data.channel - ios专用 默认为1
 */
function goSkinPage (data) {
  if (isAndroid) {
    data = Object.assign({}, data, { action: 'goto_skin_page' });
  } else {
    data = Object.assign({}, data, { action: 'change_skin' });
  }
  return callNative(data);
}

/**
 *
 * 起调头像页
 */
function goAvatarPage (data) {
  if (isAndroid) {
    data = Object.assign({}, data, { action: 'goto_avatar_page' });
    return callNative(data);
    // window.location.href = 'https://vip1.kuwo.cn/vip/added/webView/pendantH5/avatar.html'; 不用验证登录
  } else {
    window.location.href = 'https://vip1.kuwo.cn/vip/added/webView/pendantH5/avatar.html';
  } 
}

/**
 *
 * 底部mini player暂停状态控制
 * @param {Object} data - 参数对象
 * @param {string} data.pause - '0': 播放，'1'：暂停，默认'0'
 * @param {string} data.uname - 用户名
 */
function controlMiniPlayerPause (data) {
  data = Object.assign({}, data, { action: 'control_pauseplaymusic' });
  return callNative(data);
}

/**
 *
 * 播放下一首歌曲
 * @param {Object} data - 参数对象
 */
function playNextSong (data) {
  data = Object.assign({}, data, { action: 'control_playnextitem' });
  return callNative(data);
}

/**
 *
 * 播放MV
 * @param {Object} data - 参数对象
 * @param {number} data.libpath - 上报日志路径
 * @param {array} data.musiclist - 歌曲列表
 * @param {string} data.musiclist.musicrid - mv id
 * @param {string} data.musiclist.name - 歌曲名称
 * @param {string} data.musiclist.artist - 歌手名字
 * @param {string} data.musiclist.formats - mv支持的格式
 * @param {string} data.musiclist.mvid - mv id
 * @param {string} data.musiclist.mvname - 歌曲名称
 * @param {string} data.musiclist.name - 歌手名字
 * @param {string} data.musiclist.mvquality - mv质量，具体值不清楚
 */
function playMV (data) {
  data = Object.assign({}, data, { action: 'control_playmv' });
  return callNative(data);
}

/**
 *
 * 播放feed流Video
 * @param {Object} data - 参数对象
 * @param {number} data.id - 视频id
 * @param {array} data.autoScrollToComment - 1/0 是否滚动到评论
 */
function playFeedVideo (data) {
  data = Object.assign({}, data, { action: 'control_playvideo', source: 74 });
  return callNative(data);
}

/**
 * 导入歌单IOS
 * **/
function importSheet (data) {
  return new Promise((resolve, reject) => {
    const callbackName = `kuwoJsBridgeCallback${callbackIndex++}`;
    window[callbackName] = res => {
      let result = res;
      if (typeof res === 'string') {
        result = JSON.parse(res);
      }
      resolve(result);
    };
    const params = Object.assign({}, data, {
      callback: callbackName
    });
    window.webkit &&
      window.webkit.messageHandlers.import_sheet.postMessage(params);
  });
}

/**
 *
 * 获取页面psrc来源
 * @param {Object} data - 参数对象
 */
function getPsrc (data) {
  data = Object.assign({}, data, { action: 'get_psrc' });
  return callNative(data);
}


/**
 *
 * 起调统一分享入口
 * @param {Object} data - 参数对象
 * @param {string} data.weibo - 微博文案
 * @param {string} data.qqspace - qq空间文案
 * @param {string} data.qqspaceTitle - qq空间标题
 * @param {string} data.qqfriend - qq好友文案
 * @param {string} data.qqfriendTitle - qq好友标题
 * @param {string} data.wxmsg - 微信文案
 * @param {string} data.wxdes - 微信描述
 * @param {string} data.url - 分享地址
 * @param {string} data.imgurl - 分享小图
 * @param {string} data.imageurl - 分享小图
 * @param {string} data.needconfirm - 默认0
 * @param {string} data.type - 分享类型，默认为网页，图片是'picture'
 * @param {string} data.imgbase64 - 图片base64地址: 安卓不带头部信息 'data:image/png;base64,'
 * 
 */
function share (data) {
  data = Object.assign({}, data, { action: 'control_share_webpage' });
  if (isIphone) {
    data = Object.assign({}, data, {
      action: 'control_share_webpage'
    });
  }
  return callNative(data);
}

/**
 *
 * 分享微信好友、朋友圈、QQ好友、QQ空间、新浪微博
 * @param {Object} data - 参数对象
 * @param {string} data.pic - 分享图片
 * @param {string} data.title - 分享标题
 * @param {string} data.text - 分享文案
 * @param {string} data.url - 分享出去的地址
 */
function shareWeixinhy (data) {
  data = Object.assign({}, data, { action: 'fs_weixinhy' });
  return callNative(data);
}

function shareWeixin (data) {
  data = Object.assign({}, data, { action: 'fs_weixin' });
  return callNative(data);
}

function shareQQhy (data) {
  data = Object.assign({}, data, { action: 'fs_qqhy' });
  return callNative(data);
}

function shareQzone (data) {
  data = Object.assign({}, data, { action: 'fs_qzone' });
  return callNative(data);
}

function shareSinaWeibo (data) {
  data = Object.assign({}, data, { action: 'fs_sina' });
  return callNative(data);
}

function showMiniPlayer (data) {
  data = Object.assign({}, data, { action: 'web_control_showMiniPlayer' });
  return callNative(data);
}

function hideMiniPlayer (data) {
  data = Object.assign({}, data, { action: 'web_control_showMiniPlayer' });
  return callNative(data);
}

/**
 *
 * 隐藏右上角按钮
 */
function hideOptionMenu () {
  const data = Object.assign({}, { action: 'hide_option_menu' });
  return callNative(data);
}

/**
 *
 * 是否启用下拉刷新，且指定相关参数，不需要callback
 * @param {Object} data - 参数对象
 * @param {Object} data.enable - 1：启用，0：停用，默认0
 * @param {Object} data.normalTitle -  文案
 * @param {Object} data.normalTitleSize - 文案字体大小
 * @param {Object} data.refreshTitle - 刷新文案
 * @param {Object} data.refreshTitleSize - 刷新文案字体大小
 * @param {Object} data.iconStyle - 刷新菊花的样式：0，1，2
 */
function enablePullDownRefresh (data) {
  data = Object.assign({}, data, { action: 'enable_pull_down_refresh' });
  return callNative(data);
}

/**
 *
 * 停止当次下拉刷新
 * @param {Object} data - 参数对象
 */
function stopPullDownRefresh (data) {
  data = Object.assign({}, data, { action: 'end_pull_down_refresh' });
  return callNative(data);
}

/**
 *
 * 是否启用上拉加载更多，且指定相关参数，不需要callback
 * @param {Object} data - 参数对象
 * @param {Object} data.enable - 1：启用，0：停用，默认0
 * @param {Object} data.normalTitle -  文案
 * @param {Object} data.normalTitleSize - 文案字体大小
 * @param {Object} data.refreshTitle - 刷新文案
 * @param {Object} data.refreshTitleSize - 刷新文案字体大小
 * @param {Object} data.iconStyle - 刷新菊花的样式
 */
function enablePullUpGetMore (data) {
  data = Object.assign({}, data, { action: 'enable_pull_up_get_more' });
  return callNative(data);
}

/**
 *
 * 停止当次上拉加载更多
 * @param {Object} data - 参数对象
 * @callback data.callback
 */
function stopPullUpGetMore (data) {
  data = Object.assign({}, data, { action: 'end_pull_up_get_more' });
  return callNative(data);
}

/**
 *
 * 获取当前播放歌曲媒体信息
 * @param {Object} data - 参数对象
 */
function getMediaInfo (data) {
  data = Object.assign({}, data, { action: 'control_getmediainfo' });
  return callNative(data);
}

/**
 *
 * 设置titleBar为透明
 * @param {Object} data - 参数对象
 * @param {Object} data.transparent - 1:透明、0：不透明，默认值：0
 */
function setTransparentTitleBar (data) {
  data = Object.assign({}, data, { action: 'set_transparent_title_bar' });
  return callNative(data);
}

/**
 *
 * 从本地相册选择图片或使用相机拍照
 * @param {Object} data - 参数对象
 * @param {Object} data.allowEditing - 是否允许修改，1：修改，0：不可修改
 * @param {Object} data.shouldFilterMovie - 是否过滤视频，1：过滤，0：不过滤
 * @param {string} data.width - 图片宽度
 * @param {Object} data.height - 图片高度
 * @callback data.callback
 * @param {Array} data.success - 1：成功，0：失败
 * @param {Array} data.data - 图片base64数据
 */
function chooseImage (data) {
  data = Object.assign({}, data, { action: 'select_photo' });
  return callNative(data);
}

/**
 *
 * saveImageToPhotosAlbum
 * @param {Object} data - 参数对象
 * @param {Array} data.url - 图片url地址
 * @callback data.callback
 * @param {Array} data.success - 1：成功，0：失败
 */
function saveImageToPhotosAlbum (data) {
  data = Object.assign({}, data, { action: 'save_image_to_photos_album' });
  return callNative(data);
}

/**
 *
 * 拷贝文本到剪贴板
 * @param {Object} data - 参数对象
 * @param {String} data.text - 需要拷贝的文本
 * @callback data.callback
 * @param {String} data.success - 1：成功，0：失败
 */
function copyToClipboard (data) {
  data = Object.assign({}, data, { action: 'copy_to_clipboard' });
  return callNative(data);
}

/**
 *
 * title点击事件监听
 * @callback data.callback
 */
function onTitleClick (data) {
  document.addEventListener('titleClick', function (e) {
    data.callback(e.data);
  });
}

/**
 *
 * subTitle点击事件监听
 * @callback data.callback
 */
function onSubTitleClick (data) {
  document.addEventListener('subTitleClick', function (e) {
    data.callback(e.data);
  });
}

/**
 *
 * 页面不可见时，被压入后台或者锁屏
 * @callback data.callback
 */
function onPause (data) {
  document.addEventListener('pause', function (e) {
    data.callback(e.data);
  });
}

/**
 *
 * 当一个页面重新可见时，会触发此事件，包括下列两种情况：
 * 从后台被唤起和锁屏界面恢复。
 * 通过 popWindow/popTo 从下个页面回退。
 * @callback data.callback
 * @e {Object} e - 事件对象
 * @param {Object} e.data - 透传popWindow/popTo data到当前页面
 */
function onResume (data) {
  document.addEventListener('resume', function (e) {
    data.callback(e.data);
  });
}

/**
 *
 * 下拉刷新事件监听
 * @callback data.callback
 */
function onPullDownRefresh (data) {
  document.addEventListener('pullDownRefresh', function (e) {
    data.callback(e.data);
  });
}

/**
 *
 * 上拉加载更多事件监听
 * @callback data.callback
 */
function onPullUpGetMore (data) {
  document.addEventListener('pullUpGetMore', function (e) {
    data.callback(e.data);
  });
}

/**
 *
 * 网络变化事件监听
 * @callback data.callback
 * @param {Object} data - 回调函数参数
 * @param {string} data.type - 网络类型：'2g'、'3g'、'4g'、'wifi'、'none'
 */
function onNetworkChange (data) {
  document.addEventListener('networkChange', function (e) {
    data.callback(e.data);
  });
}

/**
 *
 * 底部播放bar播放、暂停状态事件监听
 * @callback data.callback
 * @param {Object} data - 回调函数参数
 * @param {string} data.pause - 是否暂停，1:暂停、0：播放
 */
function onMiniPlayerStatusChange (data) {
  document.addEventListener('miniPlayerStatusChange', function (e) {
    data.callback(e.data);
  });
}

/**
 *
 * 分享成功后的事件监听
 * @callback data.callback
 * @param {Object} data - 回调函数参数
 */
function onShareSuccess (data) {
  document.addEventListener('shareSuccess', function (e) {
    data.callback(e.data);
  });
}

const kuwoApi = {
  version: VERSION,
  isKuwoApp: isKuwoApp,
  isIphone: isIphone,
  isAndroid: isAndroid,
  canUse: canUse,
  login: login,
  pay: pay,
  getClientInfo: getClientInfo,
  getUserInfo: getUserInfo,
  getPageInitTime: getPageInitTime,
  eventStats: eventStats,
  navigateTo: navigateTo,
  getQueryData: getQueryData,
  httpRequest: httpRequest,
  setStorage: setStorage,
  setTitle: setTitle,
  setTitleColor: setTitleColor,
  setRightButton: setRightButton,
  getStorage: getStorage,
  removeStorage: removeStorage,
  setOptionMenu: setOptionMenu,
  selectList: selectList,
  actionSheet: actionSheet,
  closeSlideExit: closeSlideExit,
  showLoading: showLoading,
  hideLoading: hideLoading,
  popWindow: popWindow,
  popTo: popTo,
  popToRootWindow: popToRootWindow,
  openInBrowser: openInBrowser,
  alert: alert,
  confirm: confirm,
  toast: toast,
  play: play,
  playSongStatus: playSongStatus,
  stopSongStatus: stopSongStatus,
  plOperation,
  songMoreOperation,
  playMV: playMV,
  playFeedVideo: playFeedVideo,
  goPlayList: goPlayList,
  goAlbumPage: goAlbumPage,
  goAreaPage: goAreaPage,
  goRadioPage: goRadioPage,
  goReplyPage: goReplyPage,
  goUserMainPage: goUserMainPage,
  goSkinPage: goSkinPage,
  goAvatarPage: goAvatarPage,
  importSheet: importSheet,
  getPsrc: getPsrc,
  share: share,
  shareWeixinhy: shareWeixinhy,
  shareWeixin: shareWeixin,
  shareQQhy: shareQQhy,
  shareQzone: shareQzone,
  shareSinaWeibo: shareSinaWeibo,
  showMiniPlayer: showMiniPlayer,
  hideMiniPlayer: hideMiniPlayer,
  goCommentPage: goCommentPage,
  controlMiniPlayerPause: controlMiniPlayerPause,
  playNextSong: playNextSong,
  getMediaInfo: getMediaInfo,
  enablePullDownRefresh: enablePullDownRefresh,
  stopPullDownRefresh: stopPullDownRefresh,
  enablePullUpGetMore: enablePullUpGetMore,
  stopPullUpGetMore: stopPullUpGetMore,
  hideOptionMenu: hideOptionMenu,
  setTransparentTitleBar: setTransparentTitleBar,
  chooseImage: chooseImage,
  saveImageToPhotosAlbum: saveImageToPhotosAlbum,
  copyToClipboard: copyToClipboard,
  openUrlInApp: openUrlInApp,
  goShowRoom: goShowRoom,
  download: download,
  bindWebEvent: bindWebEvent,
  onTitleClick: onTitleClick,
  onSubTitleClick: onSubTitleClick,
  onPause: onPause,
  onResume: onResume,
  onPullDownRefresh: onPullDownRefresh,
  onPullUpGetMore: onPullUpGetMore,
  onNetworkChange: onNetworkChange,
  onMiniPlayerStatusChange: onMiniPlayerStatusChange,
  onShareSuccess: onShareSuccess
};
export default kuwoApi;
