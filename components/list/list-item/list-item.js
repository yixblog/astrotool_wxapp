// components/list/list-item/list-item.js
Component({
  externalClasses:['className'],
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    align: false,
    disabled: false,
    multipleLine: false,
    wrap: false
  },
  created() {
    this.dataset = {};

    for (var key in this.data) {
      if (/data-/gi.test(key)) {
        this.dataset[key.replace(/data-/gi, '')] = this.data[key];
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onItemTap: function onItemTap(ev) {
      let _this$props = this.data,
        disabled = _this$props.disabled;

      if (!disabled) {
        this.triggerEvent('itemtap',this.dataset)
      }
    }
  }
})