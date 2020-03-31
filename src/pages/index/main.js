import "../../common/base.less";
import "../../config";
import App from "./App.vue";
import kwview from '../../components';
Vue.use(kwview);
new Vue(App).$mount('#root');
