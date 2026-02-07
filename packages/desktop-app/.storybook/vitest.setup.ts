import { setProjectAnnotations } from '@storybook/react-vite';
import { beforeAll } from 'vitest';
import * as previewAnnotations from './preview';

const project = setProjectAnnotations([previewAnnotations]);

beforeAll(project.beforeAll);
