import { Input, InputSizes, InputTheme, InputVariants } from './input';

export const Textarea: InputTheme = {
  ...Input,
  baseStyle: {
    ...Input.baseStyle,
    lineHeight: 'short',
    minHeight: '80px',
    paddingY: '8px',
  },
};

export const TextareaVariants = InputVariants;
export const TextareaSizes = InputSizes;