import wx from 'weixin-sdk-js';
import jsonp from './jsonp';

async function wxChatShare (param) {
  const link = param.link;
  const finalUrl = `${link.split('?')[0]}${link.split('?')[1]?`?${encodeURIComponent(link.split('?')[1])}` : ''}`;
  const url = `//appi.kuwo.cn/api/h5app/v1/configuration/signature?url=${finalUrl}`;
  jsonp(url, {}).then((res)=>{
    if (res.code == 0) {
      wx.config({
        debug: false,
        appId: res.data.appId,
        timestamp: res.data.timestamp, // 必填，生成签名的时间戳
        nonceStr: res.data.nonceStr, // 必填，生成签名的随机串
        signature: res.data.signature, // 必填，签名
        jsApiList: [
         'updateAppMessageShareData', 'updateTimelineShareData', 'onMenuShareTimeline', 'onMenuShareAppMessage'
        ]
      });
      wx.ready(function () {
        //分享到朋友圈  
        wx.updateTimelineShareData({ 
         title: param.title, // 分享标题
         link: param.link, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
         imgUrl: param.imgUrl, // 分享图标
         success: function () {
         }
        })
     
        wx.onMenuShareTimeline({
         title: param.title, // 分享标题
         link: param.link, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
         imgUrl: param.imgUrl, // 分享图标
         success: function () {
         },
        })
     
        //分享给朋友
        wx.updateAppMessageShareData({ 
         title: param.title, // 分享标题
         desc: param.desc, // 分享描述
         link: param.link, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
         imgUrl: param.imgUrl, // 分享图标
         success: function () {
         }
        })

        wx.onMenuShareAppMessage({
         title: param.title, // 分享标题
         desc: param.desc, // 分享描述
         link: param.link, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
         imgUrl: param.imgUrl, // 分享图标
         type: 'link', // 分享类型,music、video或link，不填默认为link
         dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
         success: function () {
         }
        });
      });
      wx.error(function (res) {});
    }
  });
}

export default {
  wxChatShare
}