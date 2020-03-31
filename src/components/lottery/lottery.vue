<template>
  <div class="container">
    <div class="wheel-main">
      <div class="wheel-pointer-box">
        <div class="wheel-pointer" @click="rotateHandle()" :style="{'background': 'url('+ (lotteryStyleObj.wheelPointer ? lotteryStyleObj.wheelPointer : '') +') no-repeat center top','background-size':'100%',transform:rotateAnglePointer,transition:rotateTransitionPointer}"></div>
      </div>
      <div class="wheel-bg" :style="{'background': 'url('+ (lotteryStyleObj.wheelBg ? lotteryStyleObj.wheelBg : '') +') no-repeat center top','background-size':'100% 100%',transform:rotateAngle,transition:rotateTransition}"></div>
    </div>
    <div class="content">
      抽奖次数：<span class="special">{{ rewardChance }}</span> 次
    </div>
  </div>
</template>
<script>
import kwApi from '../../common/kwAPI';
const { isKuwoApp, toast } = kwApi;
export default {
  props: {
    domain: {
      type: String,
      default: '//test-wapi.kuwo.cn'
    },
    activityId: {
      type: Number,
      default: 0
    },
    rewardChance: {
      type: Number,
      default: 0
    },
    lotteryType: {
      type: Number,
      default: 0 //转盘类型：0是6个奖品 1是8个奖品
     },
    userInfo: {
      type: Object,
      default: () => {
        return {}
      }
    },
    lotteryStyleObj: {
      type: Object,
      default: () => {
        return {}
      }
    },
    appuid: {
      type: Number,
      default: 0
    }
  },
  data () {
    return {
      startRotatingDegree: 0, // 初始旋转角度
      rotateAngle: 0, // 将要旋转的角度
      startRotatingDegreePointer: 0, // 指针初始旋转角度
      rotateAnglePointer: 0, // 指针将要旋转的度数
      rotateTransition: 'transform 6s ease-in-out', // 初始化选中的过度属性控制
      rotateTransitionPointer: 'transform 12s ease-in-out', // 初始化指针过度属性控制
      isTransform: false, // 是否旋转中
      index: 5,
      chance: 0,
      giftType: 0,
      luckyNum: 8,
      toastText: ''
    };
  },
  methods: {
    rotateHandle () {
      if (!isKuwoApp) {
        this.$emit('navigatetoApp');
        return;
      }
      const { uid } = this.userInfo;
      if (!uid || Number(uid) === 0) {
        this.$emit('gotologin');
        return;
      }
      if (this.rewardChance === 0) {
        toast({
          msg: '抽奖次数不够啦！'
        });
        return;
      }
      if (this.isTransform) {
        return;
      }
      this.getLotteryResult();
    },
    // 请求抽奖结果
    getLotteryResult () {
      const { uid, sid } = this.userInfo;
      this.$get({
        url: this.domain + `/api/activity/loterrymodule/lottery/${this.activityId}`,
        params: {
          loginUid: uid,
          sid,
          t: Math.random()
        }
      }).then(res => {
        if (res.code === 200) {
          const result = res.data;
          this.luckyNum = Number(result.luckyNum);
          // 1-节目签名周边 2-限量版五四源力包 3-我的时代青年限量图册 4-中国青年报定制版水晶报 5-酷我K3耳机 6-酷我S7音响 7-酷我月卡音乐包 8-谢谢参与
          this.index = this.luckyNum;
          this.giftType = result.giftType;
          this.chance = result.getRewardChance;
          this.rotating();
        } else {
          toast({
            msg: '提交失败'
          })
          return;
        }
      });
    },
    rotating () {
      const uA = navigator.userAgent;
      if (uA.indexOf('OS 8') > -1) {
        toast({
          msg: '抽奖中'
        });
      };
      const duringTime = 5;
      const resultIndex = this.index; // 最终要旋转到哪一块
      let resultAngle = [];
      if (this.lotteryType == 0) { //6个奖品
        resultAngle = [30, 330, 270, 210, 150, 90, 30];
      } else { // 8个奖品
        resultAngle = [22.5, 337.5, 292.5, 247.5, 202.5, 157.5, 112.5, 67.5, 22.5];
      }
      const randCircle = 6;
      this.isTransform = true;
      const rotateAngle = this.startRotatingDegree + randCircle * 360 + resultAngle[resultIndex] - (this.startRotatingDegree % 360);
      this.startRotatingDegree = rotateAngle;
      this.rotateAngle = 'rotate(' + rotateAngle + 'deg)';
      setTimeout(()=> {
        this.isTransform = false;
        this.gameOver();
      }, duringTime * 1000 + 1500);
    },
    gameOver () {
      this.$bus.$emit('showPrizeRes', this.luckyNum, this.giftType, this.chance);
    }
  }
};
</script>
<style lang="less" scoped>
.container {
  width: 100%;
  position: relative;
  overflow: hidden;
  .wheel-main {
    display: flex;
    align-items: center;
    justify-content: center;
    display: -webkit-flex;
    -webkit-align-items: center;
    -webkit-justify-content: center;
    position: relative;
    padding-bottom: 24px;
    .wheel-pointer-box {
      position: absolute;
      top: 50%;
      left: 50%;
      z-index: 3;
      transform: translate(-50%, -62%);
      -webkit-transform: translate(-50%, -62%);
      width: 203px;
      height: 234px;
      .wheel-pointer {
        width: 203px;
        height: 234px;;
        transform-origin: center 60%;
        -webkit-transform-origin: center 60%;
      }
    }
    .wheel-bg {
      width: 655px;
      height: 655px;  
      color: #fff;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-content: center;
      transition: transform 3s ease;
      display: -webkit-flex;
      -webkit-align-content: center;
      -webkit-justify-content: center;
      -webkit-flex-direction: column;
      -webkit-transition: transform 3s ease;
    }
  }
  .content {
    width: 100%;
    text-align: center;
    font-size: 30px;
    font-weight: bold;
    color: #000;
    margin-top: 30px;
    .special{
      color: #ff6a2c;
      font-size: 60px;
      font-family: "HKHBT"
    }
  }
}
</style>

