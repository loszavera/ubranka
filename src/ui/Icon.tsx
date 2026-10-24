import Svg, { Path } from 'react-native-svg';
import { colors } from './theme';

const paths = {
  hanger: 'M9 6a3 3 0 1 1 4 2.83V11l8 5a1.5 1.5 0 0 1-.8 2.8H3.8A1.5 1.5 0 0 1 3 16l9-5',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  close: 'M6 6l12 12M18 6 6 18',
  wardrobe: 'M4 3h16v18H4zM12 3v18M9 10v3m6-3v3',
  person: 'M8 6a4 4 0 1 0 8 0 4 4 0 0 0-8 0M4 22v-3a8 8 0 0 1 16 0v3',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  check: 'M5 12l4 4L20 5',
  plus: 'M12 5v14M5 12h14',
  spark: 'm12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8Z',
  tune: 'M4 7h16M4 17h16M8 4v6m8 4v6',
  top: 'm8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4a4 4 0 0 1-8 0Z',
  bottom: 'M6 2h12l2 20h-6l-2-13-2 13H4Z',
  layer: 'M8 2 3 6 2 20h5V9l2 13h6l2-13v11h5L21 6l-5-4-4 7Z',
  shoes: 'M3 10v9h18v-4l-8-2-5-7-2 4Z',
  globe: 'M2 12h20M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 0c-6 6-6 14 0 20 6-6 6-14 0-20Z',
  bag: 'M4 7h16l1 15H3L4 7Zm4 0V5a4 4 0 0 1 8 0v2',
};
export type IconName = keyof typeof paths;
export function Icon({ name, size = 22, color = colors.plum, filled = false, fillColor }: {
  name: IconName; size?: number; color?: string; filled?: boolean; fillColor?: string;
}) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
    <Path d={paths[name]} stroke={color} fill={fillColor ?? (filled ? color : 'none')} strokeWidth={1.65} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}
