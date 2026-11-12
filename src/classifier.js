import path from 'node:path';
import { CATEGORIES, DEFAULT_CATEGORY, MONTHS } from './constants/categories.js';

const extensionMap = new Map();
for (const [category, extensions] of Object.entries(CATEGORIES)) {
    for (const ext of extensions) {
        extensionMap.set(ext, category);
    }
    }


    export function classifyByType(filname) {
        const ext = path.extname(filname).toLowerCase();
        return extensionMap.get(ext) ?? DEFAULT_CATEGORY;

    }

    export function classifyByDate(date) {
        const year = String(date.getFullYear());
        const monthIndex = date.getMonth();
        const month = `${String(monthIndex + 1).padStart(2, '0')}-${MONTHS[monthIndex]}`;
        return path.join(year, month);
    }
