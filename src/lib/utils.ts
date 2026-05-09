import { TinyColor } from '@ctrl/tinycolor';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: string[]) {
  return twMerge(clsx(inputs));
}

interface HSBAColor {
  hue: number;
  saturation: number;
  brightness: number;
  alpha?: number;
}

interface RGBAColor {
  red: number;
  green: number;
  blue: number;
  alpha?: number;
}

interface HSLAColor {
  hue: number;
  saturation: number;
  lightness: number;
  alpha?: number;
}

function isHSBAColor(val: unknown): val is HSBAColor {
  return typeof val === 'object' && val !== null && 'hue' in val && 'saturation' in val && 'brightness' in val;
}

function isRGBAColor(val: unknown): val is RGBAColor {
  return typeof val === 'object' && val !== null && 'red' in val && 'green' in val && 'blue' in val;
}

function isHSLAColor(val: unknown): val is HSLAColor {
  return typeof val === 'object' && val !== null && 'hue' in val && 'saturation' in val && 'lightness' in val;
}

function isValidAlpha(val: unknown): val is number {
  return typeof val === 'number' && !Number.isNaN(val) && val >= 0 && val <= 1;
}

export function colorToHex(val: HSBAColor | RGBAColor | HSLAColor | string, alpha: number) {
  if (isHSBAColor(val)) {
    return new TinyColor({
      h: val.hue,
      s: val.saturation,
      v: val.brightness,
      a: alpha || val.alpha,
    }).toHex8String();
  }

  if (isRGBAColor(val)) {
    return new TinyColor({
      r: val.red,
      g: val.green,
      b: val.blue,
      a: alpha || val.alpha,
    }).toHex8String();
  }

  if (isHSLAColor(val)) {
    return new TinyColor({
      h: val.hue,
      s: val.saturation,
      l: val.lightness,
      a: alpha || val.alpha,
    }).toHex8String();
  }
  if (isValidAlpha(alpha)) {
    return new TinyColor(val).setAlpha(alpha).toHex8String();
  }

  return new TinyColor(val).toHex8String();
}

const unicodeSegmenter = new Intl.Segmenter(undefined, {
  granularity: 'grapheme',
});

export function countEmojis(text: string): number {
  return [...unicodeSegmenter.segment(text)].filter(({ segment }) => /\p{Extended_Pictographic}/u.test(segment)).length;
}

export function semanticLength(text: string): number {
  return [...unicodeSegmenter.segment(text)].length;
}
