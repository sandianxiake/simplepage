<template>
  <div class="morewrap" @click="getMore" v-show="newCommentList.length > 0">
    <p>
      <span>点击展示更多</span>
      <i class="loadmore"></i>
    </p>
  </div>
</template>

<script>
  export default {
    props: {
      newCommentList: {
        type: Array,
        default: function () {
          return []
        }
      }
    },
    methods: {
      getMore () {
        this.$emit('getMore');
      }
    }
  };
</script>
<style lang="less" scoped>
  .morewrap{
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    display: -webkit-flex;
    -webkit-justify-content: center;
    -webkit-align-items: flex-start;
    padding-bottom: 30px;
    p {
      display: flex;
      justify-content: center;
      align-items: center;
      display: -webkit-flex;
      -webkit-justify-content: center;
      -webkit-align-items: center;
      font-size:24px;
      font-weight:400;
      color: #000;
      .loadmore{
        display: inline-block;
        width: 17px;
        height: 10px;
        margin-left: 11px;
        background: url('//h5static.kuwo.cn/m/70875dd4/icon_loadmore.png') no-repeat;
        background-size: 100% 100%;
      }
    }
  }
</style>




