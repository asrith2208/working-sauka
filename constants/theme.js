
import { Platform } from 'react-native';

export const COLORS = {
  primary: "#40916c", // A rich, accessible green
  secondary: "#1b4332", // A darker green for contrast
  accent: "#b7e4c7", // A light, soft green for highlights and backgrounds

  white: "#FFFFFF",
  black: "#000000",
  gray: "#6A6A6A",
  lightGray: "#f0f4f7",
  lightGray2: "#e9ecef",
  
  danger: "#d00000", // For errors and destructive actions
  success: "#5cb85c", // For success messages
};

export const SIZES = {
  // global sizes
  base: 8,
  font: 14,
  radius: 12,
  padding: 24,

  // font sizes
  h1: 30,
  h2: 22,
  h3: 16,
  h4: 14,
  body1: 30,
  body2: 22,
  body3: 16,
  body4: 14,
};

export const FONTS = {
  h1: { fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto-Bold', fontSize: SIZES.h1, lineHeight: 36 },
  h2: { fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto-Bold', fontSize: SIZES.h2, lineHeight: 30 },
  h3: { fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto-Regular', fontSize: SIZES.h3, lineHeight: 22 },
  h4: { fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto-Regular', fontSize: SIZES.h4, lineHeight: 22 },
  body1: { fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto-Regular', fontSize: SIZES.body1, lineHeight: 36 },
  body2: { fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto-Regular', fontSize: SIZES.body2, lineHeight: 30 },
  body3: { fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto-Regular', fontSize: SIZES.body3, lineHeight: 22 },
  body4: { fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto-Regular', fontSize: SIZES.body4, lineHeight: 22 },
};

export const SHADOWS = {
    light: {
        shadowColor: COLORS.gray,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
    },
    medium: {
        shadowColor: COLORS.black,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
};

const appTheme = { COLORS, SIZES, FONTS, SHADOWS };

export default appTheme;
