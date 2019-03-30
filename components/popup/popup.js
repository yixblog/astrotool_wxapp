Component({
  properties: {
    show: Boolean,
    position: {
      type: String,
      value: 'bottom'
    },
    mask: {
      type: Boolean,
      value: true
    },
    animation: {
      type: Boolean,
      value: true
    },
    disableScroll: {
      type: Boolean,
      value: true
    }
  },
  data: {
    className: '',
    show: false,
    position: 'bottom',
    mask: true,
    animation: true,
    disableScroll: true
  },
  methods: {
    onMaskTap: function onMaskTap() {
      this.triggerEvent('popupclose',{})
    }
  }
});