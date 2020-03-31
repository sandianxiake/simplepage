<template>
  <div class="hotwrap" v-show="commentList.length > 0">
    <div class="hotcommenttitle">
      <span class="line"></span>
      热门评论
    </div>
    <CommentItem v-for="(item, index) in commentList" :key="index" :comment="item" :commentConf="commentConf"></CommentItem>
  </div>
</template>

<script>
import CommentItem from './commentItem';
export default {
  components: {
    CommentItem
  },
  props: {
    commentConf: {
      type: Object,
      default: function () {
        return {};
      }
    },
    commentList: {
      type: Array,
      default: function () {
        return []
      }
    }
  },
  data () {
    return {};
  },
  methods: {}
};
</script>
<style lang="less" scoped>
.hotcommenttitle{
  height: 40px;
  line-height: 40px;
  font-size: 38px;
  font-weight: bold;
  color: #000;
  padding-left: 30px;
  margin-bottom: 38px;
  position: relative;
  .line{
    position: absolute;
    top: 0;
    left: 0;
    width: 10px;
    height: 40px;
    background:rgba(240,116,64,1);
  }
}
</style>