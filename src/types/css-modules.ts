// src/types/css-modules.d.ts

// 为所有 .module.css 文件提供类型声明
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// 为所有 .css 文件提供类型声明（用于 side-effect 导入）
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module 'country-flag-icons/react/3x2' {
  import * as React from 'react';
  export const US: React.FC<React.SVGProps<SVGSVGElement>>;
  export const JP: React.FC<React.SVGProps<SVGSVGElement>>;
  export const CN: React.FC<React.SVGProps<SVGSVGElement>>;
}
