// components/list/list-item/list-item.js
Component({
  externalClasses:['className'],
  /**
   * 组件的属性列表
   */
  properties: {
    align: Boolean,
    disabled: Boolean,
    multipleLine: Boolean,
    wrap: Boolean,
    arrow: Boolean,
    itemid: String
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

  /**
   * 组件的方法列表
   */
  methods: {
    onItemTap: function onItemTap(ev) {
      let _this$props = this.data,
        disabled = _this$props.disabled;

      if (!disabled) {
        this.triggerEvent('itemtap',{itemid: this.data.itemid})
      }
    }
  }
})