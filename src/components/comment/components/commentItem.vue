<template>
 <div class="commentItem">
   <div class="userInfo">
     <div class="userphoto" @click="handleGoUserMainPage">
       <img :src="handleUserPhoto(comment.u_pic)" >
     </div>
     <div class="midDetail">
       <p class="userName">{{decodeURIComponent(comment.u_name)}}</p>
       <div class="time">{{formateTime(comment.time)}}</div>
     </div>
     <div class="likeInfo">
       <p class="likeNum" :class="{liked: comment.is_like == 'true',nolike: comment.is_like == 'false'}" @click="gotoCommentPage">{{comment.like_num}}</p>
     </div>
   </div>
   <div class="commentCon" :class="{'border-none': comment.reply}" @click="handleReply">{{comment.msg}}</div>
   <div class="commentReply" v-if="comment.reply"><span class="replyOwner">@{{decodeURIComponent(comment.reply.u_name)}}：</span>{{comment.reply.msg}}</div>
 </div>
</template>
<script>
import kuwoJsApi from '../../../common/kwAPI';
const { isKuwoApp, goCommentPage, goUserMainPage, goReplyPage } = kuwoJsApi;
export default {
  props: {
    commentConf: {
      type: Object,
      default: function () {
        return {};
      }
    },
    comment: {
      type: Object,
      default: function () {
        return {};
      }
    }
  },
  data () {
    return {
      defaultImg: 'http://image.kuwo.cn/mpage/html5/2016/cd/def150.png'
    };
  },
  methods: {
    gotoCommentPage () {
      if (!isKuwoApp) {
        this.$bus.$emit('navigateToApp');
        return;
      }
      const { sid, digest, title } = this.commentConf;
      goCommentPage({
        source: digest,
        sourceid: sid,
        title: title
      });
    },
    handleGoUserMainPage () {
      const data = {
        uid: this.comment.u_id,
        uname: this.comment.u_name
      };
      goUserMainPage(data);
    },
    handleReply () {
      if (!isKuwoApp) {
        this.$bus.$emit('navigateToApp');
        return;
      }
      this.gotoNativeReply();
    },
    gotoNativeReply () {
      const { uname } = this.$nativeInfo.clientInfo.rawData;
      const { sid, digest } = this.commentConf;
      const data = {
        source: digest,
        sourceid: sid,
        title: decodeURIComponent(this.comment.u_name),
        cid: this.comment.id,
        uname: uname,
        popup: '1'
      };
      goReplyPage(data);
    },
    formateTime (time) {
      if (time) {
        const time1 = time.substring(5);
        return time1.substring(0, 11);
      }
    },
    handleUserPhoto (pic) {
      if (!pic || pic.indexOf('thirdqq') > -1) {
        return this.defaultImg;
      }
      return pic;
    }
  }
};
</script>

<style lang="less" scoped>
.commentItem {
  padding: 0 30px 70px 30px;
  overflow: hidden;
  .userInfo {
    width: 100%;
    height: 80px;
    overflow: hidden;
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    justify-content: space-between;
    display: -webkit-flex;
    -webkit-justify-content: space-between;
    -webkit-flex-wrap: wrap;
    -webkit-flex-direction: row;
    .userphoto{
      width: 80px;
      height: 80px;
      margin-right: 23px;
      border-radius: 50%;
      overflow: hidden;
      img{
        width: 100%;
      }
    }
    .midDetail {
      flex: 1;
      width: 68%;
      height: 80px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      display: -webkit-flex;
      -webkit-justify-content: center;
      -webkit-flex-direction: column;
      .userName {
        color: #000;
        font-size: 28px;
        line-height: 40px;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }
      .time {
        color: #787878;
        font-size: 22px;
        padding-top: 14px;
      }
    }
    .likeInfo {
      display: flex;
      flex-direction: column;
      justify-content: center;
      display: -webkit-flex;
      -webkit-justify-content: center;
      -webkit-flex-direction: column;
      .likeNum {
        color: #ff6a2c;
        font-size: 22px;
        height: 32px;
        line-height: 38px;
        padding-right: 40px;
        background: url("//h5static.kuwo.cn/m/70875dd4/icon_praised.png") no-repeat right top;
        background-size: 30px 30px;
      }
      .likeNum.noLike {
        background: url("//h5static.kuwo.cn/m/70875dd4/icon_praise.png") no-repeat right top;
        background-size: 30px 30px;
      }
    }
  }
  .commentCon {
    font: 32px/50px "PingFangSC-Regular";
    padding: 20px 0 0 102px;
    overflow: hidden;
    color: #000;
    text-align: justify;
  }
  .commentReply {
    font: 28px/50px "PingFangSC-Regular";
    padding: 12px;
    color: #000;
    margin: 20px 0 0 102px;
    background: #E9E9E9;
    border-radius: 10px;
    .replyOwner {
      color: #000;
    }
  }
}

</style>