import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

const theme = extendTheme({
  config,
  colors: {
    brand: {
      primary: '#00a4dc',
      secondary: '#7b5dfa',
      accent: '#00b4e4',
    },
    background: {
      primary: '#000000',
      secondary: '#141414',
      tertiary: '#1f1f1f',
    },
  },
  styles: {
    global: {
      body: {
        bg: 'background.primary',
        color: 'whiteAlpha.900',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: 'md',
        _hover: {
          transform: 'translateY(-1px)',
          boxShadow: 'lg',
        },
        _active: {
          transform: 'translateY(0)',
        },
      },
      variants: {
        solid: {
          bg: 'brand.primary',
          color: 'white',
          _hover: {
            bg: 'brand.accent',
          },
        },
        ghost: {
          _hover: {
            bg: 'whiteAlpha.100',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'background.secondary',
          borderRadius: 'lg',
          overflow: 'hidden',
          transition: 'all 0.2s',
          _hover: {
            transform: 'translateY(-2px)',
            boxShadow: 'xl',
          },
        },
      },
    },
    Sidebar: {
      baseStyle: {
        bg: 'background.secondary',
        borderRight: '1px',
        borderColor: 'whiteAlpha.100',
      },
    },
  },
  layerStyles: {
    card: {
      bg: 'background.secondary',
      borderRadius: 'lg',
      p: 4,
      boxShadow: 'lg',
    },
    gradientOverlay: {
      bgGradient: 'linear(to-t, background.primary, transparent)',
    },
  },
  textStyles: {
    h1: {
      fontSize: ['4xl', '5xl'],
      fontWeight: 'bold',
      lineHeight: '110%',
      letterSpacing: '-2%',
    },
    h2: {
      fontSize: ['3xl', '4xl'],
      fontWeight: 'semibold',
      lineHeight: '110%',
      letterSpacing: '-1%',
    },
  },
  fonts: {
    heading: '"Inter", sans-serif',
    body: '"Inter", sans-serif',
  },
  breakpoints: {
    sm: '30em',
    md: '48em',
    lg: '62em',
    xl: '80em',
    '2xl': '96em',
  },
})

export default theme