<template>
  <div class="comment">
    <div class="commentbtn" @click="gotoCommentPage()">
      <img src="http://h5static.kuwo.cn/m/70875dd4/commentbtn.png">
    </div>
    <div class="content">
      <HotComment :commentConf="commentConf" :commentList="commentList"></HotComment>
      <NewComment :commentConf="commentConf" :newCommentList="newCommentList"></NewComment>
    </div>
    <ShowMore :newCommentList="newCommentList" @getMore="gotoCommentPage"></ShowMore>
  </div>
</template>

<script>
import kuwoJsApi from '../../common/kwAPI';
const { isKuwoApp, goCommentPage } = kuwoJsApi;
import HotComment from './components/hotCommentList';
import NewComment from './components/newestCommentList';
import ShowMore from './components/ShowMore';
export default {
  components: {
    HotComment,
    NewComment,
    ShowMore
  },
  props: {
    uid: {
      type: Number,
      default: 0
    },
    commentConf: {
      type: Object,
      default: function () {
        return {};
      }
    }
  },
  data () {
    return {
      commentList: [],
      newCommentList: []
    };
  },
  mounted () {
    this.getHotCommentData();
    this.getNewCommentData();
  },
  methods: {
    getHotCommentData () {
      const { sid, digest } = this.commentConf;
      this.$get({
        url: 'https://comment.kuwo.cn/com.s',
        params: {
          type: 'get_rec_comment',
          prod: 'web',
          f: 'web',      
          uid: this.uid,
          sid,
          digest,
          page: 1,
          rows: 10
        }
      }).then((res) => {
        const { result, rows } = res;
        if (result === 'ok') {
          if (rows && rows.length > 0) {
            this.commentList = this.commentList.concat(rows);
          }       
        }
      });
    },
    getNewCommentData () {    
      const { sid, digest } = this.commentConf;
      this.$get({
        url: 'https://comment.kuwo.cn/com.s',
        params: {
          type: 'get_comment',
          prod: 'web',
          f: 'web',
          sid,
          uid: this.uid,
          digest,
          page: 1,
          rows: 10
        }
      }).then((res) => {
        const { result, rows } = res;
        if (result === 'ok') {
          if (rows && rows.length > 0) {
            this.newCommentList = this.newCommentList.concat(rows);
          }
        }
      });
    },
    gotologin () {
      if (!isKuwoApp) {
        this.$bus.$emit('navigatetoApp');
        return;
      } else {
        this.$bus.$emit('gotologin');
        return;
      }  
    },
    gotoCommentPage () {
      if (!isKuwoApp) {
        this.$bus.$emit('navigatetoApp');
        return;
      }
      const { sid, digest, title } = this.commentConf;
      goCommentPage({
        source: digest,
        sourceid: sid,
        title: title
      });
    }
  }
};
</script>

<style lang="less" scoped>
.comment{
  position: relative;
  top: -6px;
  background-size: 100%;
  padding-top: 14px;
  .shadow{
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    z-index: 10000;
  }
  .commentbtn{
    position: absolute;
    top: 8px;
    right: 30px;
    width: 150px;
    z-index: 1000;
    img{
      width: 100%;
    }
  }
  .content{
    width: 100%;
  }
}
</style>
