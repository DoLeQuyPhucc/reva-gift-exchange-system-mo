/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";
const white = "#fff";
const black = "#000";
const dark = "#626262";
const blue = "#1F41BB";
const gray = "#ECECEC";

const orange50 = "#fff7ed";
const orange100 = "#ffedd5";
const orange200 = "#fed7aa";
const orange300 = "#fdba74";
const orange500 = "#f97316";
const orange600 = "#ea580c";
const orange700 = "#c2410c";
const lightGreen = "#1ABC9C";
const pink = "#FF69B4";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

export default {
  darkText: dark,
  text: black,
  background: white,
  onPrimary: white,
  active: blue,
  borderWithOpacity: "#1f41bb",
  lightPrimary: "#f5f5f5",
  gray: gray,
  orange50: orange50,
  orange100: orange100,
  orange200: orange200,
  orange500: orange500,
  orange600: orange600,
  orange300: orange300,
  orange700: orange700,
  lightGreen: lightGreen,
  pink: pink,
};
