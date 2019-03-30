Component({
  properties: {
    show: Boolean,
    position: String
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