import Comment from './comment';
import Lottery from './lottery';

const components = {
  Comment,
  Lottery
};

const view = {
  ...components
};

const install = function(Vue, opts = {}) {
  if (install.installed) return;
  Object.keys(view).forEach(key => {
    Vue.component(key, view[key]);
  });
};

if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue);
}

const kwview = {
  install,
  ...components
};

export default kwview;