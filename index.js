// Syntax scheme
const backgroundColor   = '#293340';
const foregroundColor   = '#CDD2E9';
const cursorColor       = '#2C85F7';
const borderColor       = '#FFFFFF';
const colors            = {
      black             : backgroundColor,
      red               : '#E17E85',
      green             : '#61BA86',
      yellow            : '#FFEC8E',
      blue              : '#4CB2FF',
      magenta           : '#BE86E3',
      cyan              : '#2DCED0',
      white             : foregroundColor,
      lightBlack        : '#546386',
      lightRed          : '#E17E85',
      lightGreen        : '#61BA86',
      lightYellow       : '#FFB68E',
      lightBlue         : '#4CB2FF',
      lightMagenta      : '#BE86E3',
      lightCyan         : '#2DCED0',
      lightWhite        : foregroundColor
};
const {remote} = require('electron');
const isElevated = require('is-elevated');
const {createAnimator} = require('./lib/animator');
const {getBorderColors} = require('./lib/colorhelpers');

let unloadAnimator = null;

// Config
exports.decorateConfig = config => {
    return Object.assign({}, config, {
        foregroundColor,
        backgroundColor: config.backgroundColor || backgroundColor,
        borderColor,
        colors,
        cursorColor: config.cursorColor || cursorColor,
        cursorShape: config.cursorShape || 'BEAM',
        fontSize: config.fontSize || 12,
        fontFamily: config.fontFamily || '"Fira Code"',
        termCSS: `
            ${config.termCSS || ''}
            ::selection {
                background: #9198A2 !important;
            }
            x-screen x-row {
                font-variant-ligatures: initial;
            }
            span {
                font-weight: normal !important;
            }
        `,
        css: `
            ${config.css || ''}
            ::selection {
                background: #9198A2 !important;
            }
        `
    });
};


module.exports.onRendererWindow = async window => {
  const browserWindow = remote.getCurrentWindow();
  const htmlElement = window.document.documentElement;

  browserWindow.on('blur', () => htmlElement.classList.add('blurred'));
  browserWindow.on('focus', () => htmlElement.classList.remove('blurred'));

  if (!browserWindow.isFocused()) {
    htmlElement.classList.add('blurred');
  }

  if (await isElevated()) {
    htmlElement.classList.add('elevated');
  }

  const config = window.config.getConfig();

  if (config.hyperBorder && config.hyperBorder.animate) {
    unloadAnimator = createAnimator(window, browserWindow);
  }
};

module.exports.onUnload = async () => {
  if (unloadAnimator) {
    unloadAnimator();
  }
};

module.exports.reduceUI = (state, {type, config}) => {
  const defaultColors = ['#fc1da7', '#fba506'];
  switch (type) {
    case 'CONFIG_LOAD':
    case 'CONFIG_RELOAD':
      return state.set('hyperBorder', Object.assign({
        animate: false,
        backgroundColor: config.backgroundColor,
        borderWidth: '4px',
        borderRadiusInner: '4px',
        borderRadiusOuter: '0',
        borderColors: defaultColors,
        adminBorderColors: (config.hyperBorder && config.hyperBorder.borderColors) || defaultColors,
        blurredAdminColors: (config.hyperBorder && (config.hyperBorder.blurredColors || config.hyperBorder.adminBorderColors)) || defaultColors,
        blurredColors: (config.hyperBorder && config.hyperBorder.borderColors) || defaultColors,
        borderAngle: '180deg'
      }, config.hyperBorder));
    default:
      return state;
  }
};

module.exports.mapHyperState = ({ui: {hyperBorder}}, map) => Object.assign({}, map, {
  hyperBorder: Object.assign({}, hyperBorder)
});

module.exports.decorateHyper = (Hyper, {React}) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.initializeAnimator();
    }

    initializeAnimator() {
      // TODO init Animator here
    }

    render() {
      return React.createElement('div', {
        id: 'hyperborder'
      }, [
        React.createElement(Hyper, this.props),
        React.createElement('style', {}, `
        #hyperborder {
          --border-width: ${this.props.hyperBorder.borderWidth};
          --border-radius-inner: ${this.props.hyperBorder.borderRadiusInner};
          --border-radius-outer: ${this.props.hyperBorder.borderRadiusOuter};
          ${this.props.hyperBorder.animate ? '' : '--border-angle: ' + this.props.hyperBorder.borderAngle + ';'}
          --background-color: ${this.props.hyperBorder.backgroundColor || '#000'};
          --border-colors: ${getBorderColors(this.props.hyperBorder.borderColors).join(',')};
          --admin-colors: ${getBorderColors(this.props.hyperBorder.adminBorderColors).join(',')};
          --blurred-colors: ${getBorderColors(this.props.hyperBorder.blurredColors).join(',')};
          --blurred-admin-colors: ${getBorderColors(this.props.hyperBorder.blurredAdminColors).join(',')};
          background: linear-gradient(var(--border-angle), var(--border-colors));
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          position: fixed;
          border-radius: var(--border-radius-outer);
        }
        #hyperborder .hyper_main {
          background-color: var(--background-color);
          top: var(--border-width);
          bottom: var(--border-width);
          left: var(--border-width);
          right: var(--border-width);
          border-radius: var(--border-radius-inner);
        }
        #hyperborder .hyper_main .header_header {
          top: var(--border-width);
          left: var(--border-width);
          right: var(--border-width);
        }
        #hyperborder .hyper_main .header_windowHeader {
          top: var(--border-width);
          left: var(--border-width);
          right: var(--border-width);
          width: calc(100% - var(--border-width) - var(--border-width));
        }
        #hyperborder .hyper_main .header_hamburgerMenuLeft {
          top: var(--border-width);
          left: var(--border-width);
        }
        html.elevated #hyperborder {
          background: linear-gradient(var(--border-angle), var(--admin-colors));
        }
        html.blurred #hyperborder {
          background: linear-gradient(var(--border-angle), var(--blurred-colors));
        }
        html.blurred.elevated #hyperborder {
          background: linear-gradient(var(--border-angle), var(--blurred-admin-colors));
        }
        `)
      ]);
    }
  };
};
