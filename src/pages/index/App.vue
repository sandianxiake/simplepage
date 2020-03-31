<template>
  <div class='warp'>
    <img class="logo" src="../../assets/img/logo.png" alt="" srcset="">
    <h1>前端移动页面</h1>
  </div>
</template>

<script>
export default {
  created () {
    // console.log('Run APP');
  },
  methods: {
    
  }
}
</script>

<style lang="less" scoped>
.warp {
  background: #FFF;
  text-align: center;
  height: 100%;
  box-sizing: border-box ;
  .logo {
    width: 100%;
    animation: slide-slow 1s;
  }
  h1 {
    margin-top: 140px;
    font-size: 60px;
  }
  @keyframes slide-slow {
    0% {
      transform: rotateY(0deg);
    }
    50% {
      transform: rotateY(180deg);
    }
    100% {
      transform: rotateY(0deg);
    }
  }
}
</style>

